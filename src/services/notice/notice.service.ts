import { Notice } from "../../models/notice/notice.model";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { CreateNoticeInput } from "../../validations/notice/notice.validation";
import { Types } from "mongoose";

export const noticeService = {
  getAll: async (instituteId: string, query: { search?: string; audience?: string }) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };

    if (query.audience && query.audience !== "all") {
      filter.targetAudience = query.audience;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { body: { $regex: query.search, $options: "i" } },
      ];
    }

    const notices = await Notice.find(filter).sort({ createdAt: -1 });
    return notices;
  },

  getById: async (id: string, instituteId: string) => {
    const notice = await Notice.findOne({ _id: id, instituteId });
    if (!notice) throw new AppError("Notice record not found", 404);
    return notice;
  },

  create: async (data: CreateNoticeInput, instituteId: string, userId?: string, userName?: string) => {
    const notice = await Notice.create({
      ...data,
      instituteId,
      publishedByName: userName || "Institute Admin",
      publishedByUserId: userId ? new Types.ObjectId(userId) : undefined,
    });

    if (data.sendWhatsApp) {
      logger.info(`[WhatsApp Cloud API Mock] Broadcasted notice "${data.title}" to target ${data.targetAudience}`);
    }

    return notice;
  },

  update: async (id: string, data: Partial<CreateNoticeInput>, instituteId: string) => {
    const notice = await Notice.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!notice) throw new AppError("Notice not found", 404);
    return notice;
  },

  resendWhatsAppBroadcast: async (id: string, instituteId: string) => {
    const notice = await Notice.findOne({ _id: id, instituteId });
    if (!notice) throw new AppError("Notice not found", 404);

    logger.info(`[WhatsApp Cloud API Mock] Re-broadcasted notice "${notice.title}" to target ${notice.targetAudience}`);
    return notice;
  },

  delete: async (id: string, instituteId: string) => {
    const notice = await Notice.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!notice) throw new AppError("Notice not found", 404);
    return notice;
  },
};
