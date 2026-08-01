"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = void 0;
const whatsappTemplate_model_1 = require("../../models/whatsapp/whatsappTemplate.model");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
exports.whatsappService = {
    getAllTemplates: async (instituteId, query) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (query.category && query.category !== "all") {
            filter.category = query.category;
        }
        const templates = await whatsappTemplate_model_1.WhatsAppTemplate.find(filter).sort({ createdAt: -1 });
        return templates;
    },
    createTemplate: async (data, instituteId) => {
        const template = await whatsappTemplate_model_1.WhatsAppTemplate.create({
            ...data,
            instituteId,
            metaStatus: "APPROVED",
        });
        return template;
    },
    sendBroadcast: async (data, instituteId) => {
        const template = await whatsappTemplate_model_1.WhatsAppTemplate.findOne({ _id: data.templateId, instituteId });
        if (!template)
            throw new AppError_1.AppError("WhatsApp template not found", 404);
        logger_1.logger.info(`[WhatsApp Cloud API Mock] Dispatched ${data.phoneNumbers.length} messages using template "${template.name}"`);
        return {
            success: true,
            dispatchedCount: data.phoneNumbers.length,
            deliveryRate: "99.2%",
            timestamp: new Date().toISOString(),
        };
    },
    deleteTemplate: async (id, instituteId) => {
        const template = await whatsappTemplate_model_1.WhatsAppTemplate.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!template)
            throw new AppError_1.AppError("Template not found", 404);
        return template;
    },
};
