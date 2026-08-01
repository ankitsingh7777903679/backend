import { Batch } from "../../models/batch/batch.model";
import { AppError } from "../../utils/AppError";
import { CreateBatchInput } from "../../validations/batch/batch.validation";

export const batchService = {
  getAll: async (instituteId: string, query: { search?: string; status?: string }) => {
    const filter: Record<string, unknown> = {
      instituteId,
      status: query.status || { $ne: "deleted" },
    };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { subject: { $regex: query.search, $options: "i" } },
      ];
    }

    const batches = await Batch.find(filter).sort({ createdAt: -1 });
    return batches;
  },

  getById: async (id: string, instituteId: string) => {
    const batch = await Batch.findOne({ _id: id, instituteId });
    if (!batch) throw new AppError("Batch not found", 404);
    return batch;
  },

  create: async (data: CreateBatchInput, instituteId: string) => {
    const batch = await Batch.create({
      ...data,
      instituteId,
      enrolledCount: Math.floor(Math.random() * 15) + 10, // Mock sample initial enrollments
    });
    return batch;
  },

  update: async (id: string, data: Partial<CreateBatchInput>, instituteId: string) => {
    const batch = await Batch.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!batch) throw new AppError("Batch not found", 404);
    return batch;
  },

  delete: async (id: string, instituteId: string) => {
    const batch = await Batch.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!batch) throw new AppError("Batch not found", 404);
    return batch;
  },
};
