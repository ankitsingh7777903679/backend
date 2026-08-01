import { Timetable } from "../../models/timetable/timetable.model";
import { AppError } from "../../utils/AppError";
import { CreateTimetableSlotInput } from "../../validations/timetable/timetable.validation";

export const timetableService = {
  getAll: async (instituteId: string, query: { day?: string; batch?: string }) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };

    if (query.day && query.day !== "all") {
      filter.dayOfWeek = query.day;
    }

    if (query.batch && query.batch !== "all") {
      filter.batchName = { $regex: query.batch, $options: "i" };
    }

    const slots = await Timetable.find(filter).sort({ startTime: 1 });
    return slots;
  },

  getById: async (id: string, instituteId: string) => {
    const slot = await Timetable.findOne({ _id: id, instituteId });
    if (!slot) throw new AppError("Class slot not found", 404);
    return slot;
  },

  create: async (data: CreateTimetableSlotInput, instituteId: string) => {
    const slot = await Timetable.create({
      ...data,
      instituteId,
    });
    return slot;
  },

  update: async (id: string, data: Partial<CreateTimetableSlotInput>, instituteId: string) => {
    const slot = await Timetable.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!slot) throw new AppError("Class slot not found", 404);
    return slot;
  },

  delete: async (id: string, instituteId: string) => {
    const slot = await Timetable.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!slot) throw new AppError("Class slot not found", 404);
    return slot;
  },
};
