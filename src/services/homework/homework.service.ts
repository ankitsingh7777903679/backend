import { Homework } from "../../models/homework/homework.model";
import { HomeworkSubmission } from "../../models/homeworkSubmission/homeworkSubmission.model";
import { AppError } from "../../utils/AppError";
import { CreateHomeworkInput } from "../../validations/homework/homework.validation";
import { Types } from "mongoose";

export const homeworkService = {
  getAll: async (instituteId: string, query: { search?: string; status?: string }) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };

    if (query.status && query.status !== "all") {
      filter.homeworkStatus = query.status;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { batchName: { $regex: query.search, $options: "i" } },
        { subject: { $regex: query.search, $options: "i" } },
      ];
    }

    const homeworks = await Homework.find(filter).sort({ createdAt: -1 }).lean();

    // Dynamically calculate real active submissions for each homework
    const homeworksWithRealCounts = await Promise.all(
      homeworks.map(async (hw) => {
        const realSubmissionCount = await HomeworkSubmission.countDocuments({
          homeworkId: hw._id,
          status: "active",
        });
        return {
          ...hw,
          totalSubmissions: realSubmissionCount,
        };
      })
    );

    return homeworksWithRealCounts;
  },

  getById: async (id: string, instituteId: string) => {
    const homework = await Homework.findOne({ _id: id, instituteId }).lean();
    if (!homework) throw new AppError("Homework record not found", 404);
    const realSubmissionCount = await HomeworkSubmission.countDocuments({
      homeworkId: homework._id,
      status: "active",
    });
    return { ...homework, totalSubmissions: realSubmissionCount };
  },

  create: async (data: CreateHomeworkInput & { attachments?: any[] }, instituteId: string, userId?: string) => {
    const homework = await Homework.create({
      ...data,
      instituteId,
      dueDate: new Date(data.dueDate),
      totalSubmissions: 0,
      totalEnrolled: 0,
      createdByUserId: userId ? new Types.ObjectId(userId) : undefined,
    });
    return homework;
  },

  update: async (id: string, data: Partial<CreateHomeworkInput>, instituteId: string) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }
    const homework = await Homework.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!homework) throw new AppError("Homework not found", 404);
    return homework;
  },

  delete: async (id: string, instituteId: string) => {
    const homework = await Homework.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!homework) throw new AppError("Homework not found", 404);
    return homework;
  },
};
