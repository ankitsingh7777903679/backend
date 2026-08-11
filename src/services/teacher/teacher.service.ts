import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { Teacher } from "../../models/teacher/teacher.model";
import { User } from "../../models/user/user.model";
import { AppError } from "../../utils/AppError";
import { CreateTeacherInput } from "../../validations/teacher/teacher.validation";
import { portalAccessService } from "../portalAccess/portalAccess.service";

export const teacherService = {
  getAll: async (instituteId: string, query: { search?: string; type?: string }) => {
    const filter: Record<string, unknown> = {
      instituteId,
      status: { $ne: "deleted" },
    };

    if (query.type && query.type !== "all") {
      filter.employmentType = query.type;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { subjects: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } },
      ];
    }

    const teachers = await Teacher.find(filter).sort({ createdAt: -1 });
    return teachers;
  },

  getById: async (id: string, instituteId: string) => {
    const teacher = await Teacher.findOne({ _id: id, instituteId });
    if (!teacher) throw new AppError("Teacher record not found", 404);
    return teacher;
  },

  create: async (data: CreateTeacherInput & { permissions?: string[]; assignedBatchIds?: string[]; portalAccess?: "disabled" | "invited" | "active" }, instituteId: string, actorId: string) => {
    const existing = await Teacher.findOne({ phone: data.phone, instituteId, status: { $ne: "deleted" } });
    if (existing) {
      throw new AppError("A teacher with this mobile number already exists", 409);
    }

    const defaultPermissions = [
      "manage_students",
      "mark_attendance",
      "manage_classes",
      "manage_homework",
      "manage_materials",
      "manage_tests",
      "view_student_reports",
    ];

    const { portalAccessEnabled, portalAccess, password: _ignoredPassword, ...teacherData } = data;
    const permissionsToSet = data.permissions && data.permissions.length > 0 ? data.permissions : defaultPermissions;
    const accessStatus = portalAccess || (portalAccessEnabled !== false ? "active" : "disabled");

    let userId: Types.ObjectId | undefined;
    if (accessStatus === "active") {
      const emailVal = data.email?.trim().toLowerCase() || `${data.phone}@teacher.local`;
      const passwordHash = await bcrypt.hash("Teacher@123", 10);

      const existingUser = await User.findOne({ instituteId, $or: [{ email: emailVal }, { phone: data.phone }], status: { $ne: "deleted" } });
      if (existingUser) {
        existingUser.status = "active";
        existingUser.role = "teacher";
        existingUser.permissions = permissionsToSet;
        await existingUser.save();
        userId = existingUser._id as Types.ObjectId;
      } else {
        const newUser = await User.create({
          instituteId,
          role: "teacher",
          name: data.name,
          email: emailVal,
          phone: data.phone,
          passwordHash,
          permissions: permissionsToSet,
          status: "active",
        });
        userId = newUser._id as Types.ObjectId;
      }
    }

    const teacher = await Teacher.create({
      ...teacherData,
      email: data.email?.trim().toLowerCase() || undefined,
      instituteId,
      userId,
      permissions: permissionsToSet,
      portalAccess: accessStatus,
    });

    return Teacher.findById(teacher._id);
  },

  update: async (id: string, data: Partial<CreateTeacherInput & { permissions?: string[]; assignedBatchIds?: string[]; portalAccess?: "disabled" | "invited" | "active" }>, instituteId: string) => {
    const teacherDoc = await Teacher.findOne({ _id: id, instituteId });
    if (!teacherDoc) throw new AppError("Teacher not found", 404);

    const targetAccess = data.portalAccess !== undefined
      ? data.portalAccess
      : (data.portalAccessEnabled !== undefined ? (data.portalAccessEnabled ? "active" : "disabled") : teacherDoc.portalAccess);

    let userId = teacherDoc.userId;

    if (targetAccess === "active") {
      const emailVal = (data.email || teacherDoc.email || "").trim().toLowerCase() || `${data.phone || teacherDoc.phone}@teacher.local`;
      const phoneVal = data.phone || teacherDoc.phone;
      const nameVal = data.name || teacherDoc.name;
      const permsVal = data.permissions || teacherDoc.permissions;

      if (userId) {
        await User.updateOne({ _id: userId, instituteId }, { $set: { status: "active", role: "teacher", email: emailVal, phone: phoneVal, name: nameVal, permissions: permsVal } });
      } else {
        const passwordHash = await bcrypt.hash("Teacher@123", 10);
        const existingUser = await User.findOne({ instituteId, $or: [{ email: emailVal }, { phone: phoneVal }], status: { $ne: "deleted" } });
        if (existingUser) {
          existingUser.status = "active";
          existingUser.role = "teacher";
          existingUser.permissions = permsVal;
          await existingUser.save();
          userId = existingUser._id as Types.ObjectId;
        } else {
          const newUser = await User.create({
            instituteId,
            role: "teacher",
            name: nameVal,
            email: emailVal,
            phone: phoneVal,
            passwordHash,
            permissions: permsVal,
            status: "active",
          });
          userId = newUser._id as Types.ObjectId;
        }
      }
    } else if (targetAccess === "disabled") {
      if (userId) {
        await User.updateOne({ _id: userId, instituteId }, { $set: { status: "inactive" } });
      }
    }

    const updatedTeacher = await Teacher.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { ...data, portalAccess: targetAccess, userId } },
      { new: true, runValidators: true }
    );

    return updatedTeacher;
  },

  delete: async (id: string, instituteId: string) => {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!teacher) throw new AppError("Teacher not found", 404);
    if (teacher.userId) {
      await User.findOneAndUpdate({ _id: teacher.userId, instituteId }, { $set: { status: "deleted" } });
    }
    return teacher;
  },
};
