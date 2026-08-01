import { Teacher } from "../../models/teacher/teacher.model";
import { User } from "../../models/user/user.model";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError";
import { CreateTeacherInput } from "../../validations/teacher/teacher.validation";

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

  create: async (data: CreateTeacherInput, instituteId: string) => {
    const existing = await Teacher.findOne({ phone: data.phone, instituteId, status: { $ne: "deleted" } });
    if (existing) {
      throw new AppError("A teacher with this mobile number already exists", 409);
    }

    // Auto-create login User credentials for Teacher
    const defaultPassword = "Teacher@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      instituteId,
      role: "teacher",
      name: data.name,
      email: data.email || `${data.phone}@teacher.local`,
      phone: data.phone,
      passwordHash,
    });

    const teacher = await Teacher.create({
      ...data,
      instituteId,
      userId: user._id,
    });

    user.linkedId = teacher._id as unknown as import("mongoose").Types.ObjectId;
    await user.save();

    return teacher;
  },

  update: async (id: string, data: Partial<CreateTeacherInput>, instituteId: string) => {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!teacher) throw new AppError("Teacher not found", 404);
    return teacher;
  },

  delete: async (id: string, instituteId: string) => {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!teacher) throw new AppError("Teacher not found", 404);
    return teacher;
  },
};
