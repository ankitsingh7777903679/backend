import { Teacher } from "../../models/teacher/teacher.model";
import { User } from "../../models/user/user.model";
import { Institute } from "../../models/institute/institute.model";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError";
import { CreateTeacherInput } from "../../validations/teacher/teacher.validation";
import { emailService } from "../email/email.service";

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

  create: async (data: CreateTeacherInput & { password?: string; permissions?: string[]; assignedBatchIds?: string[] }, instituteId: string) => {
    const existing = await Teacher.findOne({ phone: data.phone, instituteId, status: { $ne: "deleted" } });
    if (existing) {
      throw new AppError("A teacher with this mobile number already exists", 409);
    }

    const teacherEmail = data.email?.trim().toLowerCase() || null;
    const finalPassword = data.password && data.password.trim().length >= 6
      ? data.password.trim()
      : `Tp${data.phone.slice(-4)}@${new Date().getFullYear()}`;

    const passwordHash = await bcrypt.hash(finalPassword, 10);
    const defaultPermissions = [
      "manage_students",
      "mark_attendance",
      "manage_classes",
      "manage_homework",
      "manage_materials",
      "manage_tests",
      "view_student_reports",
    ];

    const permissionsToSet = data.permissions && data.permissions.length > 0 ? data.permissions : defaultPermissions;

    const user = await User.create({
      instituteId,
      role: "teacher",
      name: data.name,
      email: teacherEmail || `${data.phone}@teacher.local`,
      phone: data.phone,
      passwordHash,
      permissions: permissionsToSet,
    });

    const teacher = await Teacher.create({
      ...data,
      email: teacherEmail,
      instituteId,
      userId: user._id,
      permissions: permissionsToSet,
    });

    user.linkedId = teacher._id as unknown as import("mongoose").Types.ObjectId;
    await user.save();

    // Send Welcome Email with Login Credentials if email provided
    if (teacherEmail) {
      Institute.findById(instituteId).then((inst) => {
        emailService.sendWelcomeCredentialsEmail(
          teacherEmail,
          data.name,
          teacherEmail,
          finalPassword,
          "teacher",
          inst?.code
        ).catch(() => {
          console.log(`[TeacherService] Credentials console fallback | Email: ${teacherEmail} | Password: ${finalPassword} | Code: ${inst?.code}`);
        });
      }).catch(() => {});
    } else {
      console.log(`[TeacherService] No email provided | Phone: ${data.phone} | Password: ${finalPassword}`);
    }

    return teacher;
  },

  update: async (id: string, data: Partial<CreateTeacherInput & { password?: string; permissions?: string[]; assignedBatchIds?: string[] }>, instituteId: string) => {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!teacher) throw new AppError("Teacher not found", 404);

    // Sync updates to linked User account (or create if missing)
    if (teacher.userId) {
      const userUpdate: Record<string, unknown> = {};
      if (data.name) userUpdate.name = data.name;
      if (data.phone) userUpdate.phone = data.phone;
      if (data.email) userUpdate.email = data.email.trim().toLowerCase();
      if (data.permissions) userUpdate.permissions = data.permissions;
      if (data.password && data.password.trim().length >= 6) {
        userUpdate.passwordHash = await bcrypt.hash(data.password.trim(), 10);
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.updateOne({ _id: teacher.userId }, { $set: userUpdate });
      }
    } else {
      // Auto-create missing User account for existing teacher
      const teacherEmail = teacher.email?.trim().toLowerCase() || `${teacher.phone}@teacher.local`;
      const pass = data.password && data.password.trim().length >= 6
        ? data.password.trim()
        : `Tp${teacher.phone.slice(-4)}@${new Date().getFullYear()}`;
      const passwordHash = await bcrypt.hash(pass, 10);

      const user = await User.create({
        instituteId,
        role: "teacher",
        name: teacher.name,
        email: teacherEmail,
        phone: teacher.phone,
        passwordHash,
        linkedId: teacher._id,
      });

      teacher.userId = user._id as unknown as import("mongoose").Types.ObjectId;
      await teacher.save();
    }

    return teacher;
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
