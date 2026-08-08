import mongoose from "mongoose";
import { Class, IClass } from "../../models/class/class.model";
import { Student } from "../../models/student/student.model";
import { Teacher } from "../../models/teacher/teacher.model";
import { AppError } from "../../utils/AppError";
import { CreateClassInput, UpdateClassInput, ShiftStudentsInput } from "../../validations/class/class.validation";

export const classService = {
  create: async (data: CreateClassInput, instituteId: string): Promise<IClass> => {
    const existing = await Class.findOne({ instituteId, name: data.name, status: { $ne: "deleted" } });
    if (existing) {
      throw new AppError("Class with this name already exists in your institute", 400);
    }
    const newClass = await Class.create({
      ...data,
      instituteId,
      status: "active",
    });
    return newClass;
  },

  getAll: async (instituteId: string, reqUser?: import("../../types/express").JWTPayload) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };

    if (reqUser && reqUser.role === "teacher") {
      const teacherDoc = await Teacher.findOne({
        instituteId,
        $or: [{ userId: reqUser.userId }, { _id: reqUser.userId }],
        status: { $ne: "deleted" },
      });
      const assignedBatchIds = teacherDoc?.assignedBatchIds || [];
      filter._id = { $in: assignedBatchIds };
    }

    const classes = await Class.find(filter).sort({ createdAt: -1 });

    // Calculate real student counts for each class
    const classesWithCounts = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await Student.countDocuments({
          instituteId,
          $or: [
            { batchId: c._id },
            { batchName: c.name },
            { className: c.name },
          ],
          status: { $ne: "deleted" },
        });
        return {
          id: c._id.toString(),
          _id: c._id.toString(),
          name: c.name,
          timing: c.timing || "05:00 PM – 07:00 PM",
          shift: c.shift || "evening",
          days: c.days || "Mon – Sat (Daily)",
          studentCount,
          status: c.status,
          createdAt: c.createdAt,
        };
      })
    );

    return classesWithCounts;
  },

  getById: async (id: string, instituteId: string) => {
    let cls: IClass | null = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      cls = await Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
    }
    if (!cls) {
      cls = await Class.findOne({ name: id, instituteId, status: { $ne: "deleted" } });
    }
    if (!cls) throw new AppError("Class not found", 404);
    return cls;
  },

  update: async (id: string, data: UpdateClassInput, instituteId: string) => {
    let cls: IClass | null = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      cls = await Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
    }
    if (!cls) {
      cls = await Class.findOne({ name: id, instituteId, status: { $ne: "deleted" } });
    }
    if (!cls) throw new AppError("Class not found", 404);

    if (data.name && data.name !== cls.name) {
      const duplicate = await Class.findOne({
        instituteId,
        name: data.name,
        _id: { $ne: cls._id },
        status: { $ne: "deleted" },
      });
      if (duplicate) throw new AppError("Another class with this name already exists", 400);
    }

    Object.assign(cls, data);
    await cls.save();
    return cls;
  },

  delete: async (id: string, instituteId: string) => {
    let cls: IClass | null = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      cls = await Class.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
    }
    if (!cls) {
      cls = await Class.findOne({ name: id, instituteId, status: { $ne: "deleted" } });
    }
    if (!cls) throw new AppError("Class not found", 404);

    cls.status = "deleted";
    await cls.save();
    return true;
  },

  shiftStudents: async (data: ShiftStudentsInput, instituteId: string) => {
    const { sourceClassId, targetClassId, studentIds } = data;

    let sourceClass: IClass | null = null;
    let targetClass: IClass | null = null;

    if (mongoose.Types.ObjectId.isValid(sourceClassId)) {
      sourceClass = await Class.findOne({ _id: sourceClassId, instituteId, status: { $ne: "deleted" } });
    }
    if (!sourceClass) {
      sourceClass = await Class.findOne({ name: sourceClassId, instituteId, status: { $ne: "deleted" } });
    }

    if (mongoose.Types.ObjectId.isValid(targetClassId)) {
      targetClass = await Class.findOne({ _id: targetClassId, instituteId, status: { $ne: "deleted" } });
    }
    if (!targetClass) {
      targetClass = await Class.findOne({ name: targetClassId, instituteId, status: { $ne: "deleted" } });
    }

    if (!sourceClass || !targetClass) {
      throw new AppError("Source or target class not found", 404);
    }

    if (!studentIds || studentIds.length === 0) {
      throw new AppError("No students selected to shift", 400);
    }

    const validStudentObjectIds = (studentIds || []).filter((sid) => mongoose.Types.ObjectId.isValid(sid));

    // Move selected students to target class — update both batchId AND batchName/className
    const updateResult = await Student.updateMany(
      {
        $or: [
          { _id: { $in: validStudentObjectIds } },
          { id: { $in: studentIds } },
        ],
        instituteId,
      },
      {
        $set: {
          batchId: targetClass._id,
          batchName: targetClass.name,
          className: targetClass.name,
        },
      }
    );

    return {
      shiftedCount: updateResult.modifiedCount,
      sourceClass: sourceClass.name,
      targetClass: targetClass.name,
    };
  },
};
