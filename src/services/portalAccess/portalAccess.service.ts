import bcrypt from "bcrypt";
import crypto from "crypto";
import { Types } from "mongoose";
import { PortalInvitation, PortalProfileType } from "../../models/portalInvitation/portalInvitation.model";
import { Student } from "../../models/student/student.model";
import { Teacher } from "../../models/teacher/teacher.model";
import { User } from "../../models/user/user.model";
import { AppError } from "../../utils/AppError";
import { emailService } from "../email/email.service";

// Teacher and Student have different Mongoose generic signatures; the service
// only uses their shared portal fields, so this boundary intentionally erases
// model-specific generics.
const profileModel = (type: PortalProfileType): any => type === "teacher" ? Teacher : Student;

const profileName = (profile: any) => profile.name || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User";

export const portalAccessService = {
  createInvitation: async (profileType: PortalProfileType, profileId: string, instituteId: string, createdByUserId: string) => {
    if (!Types.ObjectId.isValid(profileId)) throw new AppError("Invalid profile ID", 400);
    const Model = profileModel(profileType);
    const profile = await Model.findOne({ _id: profileId, instituteId, status: { $ne: "deleted" } });
    if (!profile) throw new AppError("Profile not found", 404);
    if (!profile.email) throw new AppError("A valid profile email is required before portal access can be enabled", 400);

    await PortalInvitation.updateMany(
      { instituteId, profileType, profileId, status: "pending" },
      { $set: { status: "revoked", revokedAt: new Date() } }
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    const invitation = await PortalInvitation.create({
      instituteId,
      profileType,
      profileId,
      email: profile.email,
      role: profileType,
      tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
      status: "pending",
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      sentAt: new Date(),
      createdByUserId,
    });

    profile.portalAccess = "invited";
    await profile.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    await emailService.sendPortalInvitationEmail(profile.email, profileName(profile), `${frontendUrl}/activate-account?token=${rawToken}`, profileType);
    return invitation;
  },

  acceptInvitation: async (token: string, password: string) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const invitation = await PortalInvitation.findOne({ tokenHash }).select("+tokenHash");
    if (!invitation || invitation.status !== "pending") throw new AppError("This invitation is invalid or has already been used", 400);
    if (invitation.expiresAt <= new Date()) {
      invitation.status = "expired";
      await invitation.save();
      throw new AppError("This invitation has expired. Ask your institute to resend it.", 400);
    }

    const Model = profileModel(invitation.profileType);
    const profile = await Model.findOne({ _id: invitation.profileId, instituteId: invitation.instituteId, status: { $ne: "deleted" } });
    if (!profile) throw new AppError("The invited profile is no longer active", 404);
    if (!profile.email || profile.email.toLowerCase() !== invitation.email.toLowerCase()) throw new AppError("Profile email has changed. Request a new invitation.", 400);

    const passwordHash = await bcrypt.hash(password, 12);
    let user = profile.userId ? await User.findOne({ _id: profile.userId, instituteId: invitation.instituteId }) : null;
    if (user) {
      user.passwordHash = passwordHash;
      user.status = "active";
      user.refreshToken = undefined;
      user.name = profileName(profile);
      user.email = profile.email;
      user.phone = profile.phone;
      await user.save();
    } else {
      const emailConflict = await User.findOne({ instituteId: invitation.instituteId, email: invitation.email, status: { $ne: "deleted" } });
      if (emailConflict) throw new AppError("This email is already used by another portal account in the institute", 409);
      user = await User.create({
        instituteId: invitation.instituteId,
        role: invitation.role,
        name: profileName(profile),
        email: invitation.email,
        phone: profile.phone,
        passwordHash,
        status: "active",
      });
      profile.userId = user._id;
    }

    profile.portalAccess = "active";
    await profile.save();
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();
    return { user, profileType: invitation.profileType, profileId: profile._id };
  },

  revokeInvitation: async (invitationId: string, instituteId: string) => {
    const invitation = await PortalInvitation.findOneAndUpdate(
      { _id: invitationId, instituteId, status: "pending" },
      { $set: { status: "revoked", revokedAt: new Date() } },
      { new: true }
    );
    if (!invitation) throw new AppError("Pending invitation not found", 404);
    const Model = profileModel(invitation.profileType);
    await Model.updateOne({ _id: invitation.profileId, instituteId, portalAccess: "invited" }, { $set: { portalAccess: "disabled" } });
    return invitation;
  },

  setPortalAccess: async (profileType: PortalProfileType, profileId: string, enabled: boolean, instituteId: string, actorId: string) => {
    const Model = profileModel(profileType);
    const profile = await Model.findOne({ _id: profileId, instituteId, status: { $ne: "deleted" } });
    if (!profile) throw new AppError("Profile not found", 404);
    if (enabled) {
      return portalAccessService.createInvitation(profileType, profileId, instituteId, actorId);
    }
    profile.portalAccess = "disabled";
    await profile.save();
    if (profile.userId) await User.updateOne({ _id: profile.userId, instituteId }, { $set: { status: "inactive" }, $unset: { refreshToken: 1 } });
    await PortalInvitation.updateMany({ instituteId, profileType, profileId, status: "pending" }, { $set: { status: "revoked", revokedAt: new Date() } });
    return profile;
  },

  listPending: async (instituteId: string) => {
    return PortalInvitation.find({ instituteId, status: "pending" }).sort({ createdAt: -1 });
  },

  getMigrationReport: async (instituteId: string) => {
    const [teachers, students] = await Promise.all([
      Teacher.find({ instituteId, status: { $ne: "deleted" } }).select("name email userId portalAccess"),
      Student.find({ instituteId, status: { $ne: "deleted" } }).select("name email userId portalAccess"),
    ]);
    const linkedUserIds = [...teachers, ...students].flatMap((profile) => profile.userId ? [profile.userId] : []);
    const users = linkedUserIds.length ? await User.find({ _id: { $in: linkedUserIds }, instituteId }).select("_id role status") : [];
    const userById = new Map(users.map((user) => [user._id.toString(), user]));
    const issues = [
      ...teachers.map((profile) => ({ profileType: "teacher" as const, profile, expectedRole: "teacher" })),
      ...students.map((profile) => ({ profileType: "student" as const, profile, expectedRole: "student" })),
    ].flatMap(({ profileType, profile, expectedRole }) => {
      if (!profile.userId) return profile.portalAccess === "active" ? [{ profileType, profileId: profile._id, name: profile.name, issue: "active_profile_without_user" }] : [];
      const user = userById.get(profile.userId.toString());
      if (!user) return [{ profileType, profileId: profile._id, name: profile.name, issue: "missing_or_cross_institute_user" }];
      if (user.role !== expectedRole) return [{ profileType, profileId: profile._id, name: profile.name, issue: "role_mismatch" }];
      return [];
    });
    return {
      summary: { teachers: teachers.length, students: students.length, linkedAccounts: linkedUserIds.length, issues: issues.length },
      issues,
    };
  },
};
