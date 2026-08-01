"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noticeService = void 0;
const notice_model_1 = require("../../models/notice/notice.model");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
const mongoose_1 = require("mongoose");
exports.noticeService = {
    getAll: async (instituteId, query) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (query.audience && query.audience !== "all") {
            filter.targetAudience = query.audience;
        }
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: "i" } },
                { body: { $regex: query.search, $options: "i" } },
            ];
        }
        const notices = await notice_model_1.Notice.find(filter).sort({ createdAt: -1 });
        return notices;
    },
    getById: async (id, instituteId) => {
        const notice = await notice_model_1.Notice.findOne({ _id: id, instituteId });
        if (!notice)
            throw new AppError_1.AppError("Notice record not found", 404);
        return notice;
    },
    create: async (data, instituteId, userId, userName) => {
        const notice = await notice_model_1.Notice.create({
            ...data,
            instituteId,
            publishedByName: userName || "Institute Admin",
            publishedByUserId: userId ? new mongoose_1.Types.ObjectId(userId) : undefined,
        });
        if (data.sendWhatsApp) {
            logger_1.logger.info(`[WhatsApp Cloud API Mock] Broadcasted notice "${data.title}" to target ${data.targetAudience}`);
        }
        return notice;
    },
    update: async (id, data, instituteId) => {
        const notice = await notice_model_1.Notice.findOneAndUpdate({ _id: id, instituteId }, { $set: data }, { new: true, runValidators: true });
        if (!notice)
            throw new AppError_1.AppError("Notice not found", 404);
        return notice;
    },
    resendWhatsAppBroadcast: async (id, instituteId) => {
        const notice = await notice_model_1.Notice.findOne({ _id: id, instituteId });
        if (!notice)
            throw new AppError_1.AppError("Notice not found", 404);
        logger_1.logger.info(`[WhatsApp Cloud API Mock] Re-broadcasted notice "${notice.title}" to target ${notice.targetAudience}`);
        return notice;
    },
    delete: async (id, instituteId) => {
        const notice = await notice_model_1.Notice.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!notice)
            throw new AppError_1.AppError("Notice not found", 404);
        return notice;
    },
};
