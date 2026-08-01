import { WhatsAppTemplate } from "../../models/whatsapp/whatsappTemplate.model";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { CreateTemplateInput, SendBroadcastInput } from "../../validations/whatsapp/whatsapp.validation";

export const whatsappService = {
  getAllTemplates: async (instituteId: string, query: { category?: string }) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };
    if (query.category && query.category !== "all") {
      filter.category = query.category;
    }
    const templates = await WhatsAppTemplate.find(filter).sort({ createdAt: -1 });
    return templates;
  },

  createTemplate: async (data: CreateTemplateInput, instituteId: string) => {
    const template = await WhatsAppTemplate.create({
      ...data,
      instituteId,
      metaStatus: "APPROVED",
    });
    return template;
  },

  sendBroadcast: async (data: SendBroadcastInput, instituteId: string) => {
    const template = await WhatsAppTemplate.findOne({ _id: data.templateId, instituteId });
    if (!template) throw new AppError("WhatsApp template not found", 404);

    logger.info(`[WhatsApp Cloud API Mock] Dispatched ${data.phoneNumbers.length} messages using template "${template.name}"`);

    return {
      success: true,
      dispatchedCount: data.phoneNumbers.length,
      deliveryRate: "99.2%",
      timestamp: new Date().toISOString(),
    };
  },

  deleteTemplate: async (id: string, instituteId: string) => {
    const template = await WhatsAppTemplate.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!template) throw new AppError("Template not found", 404);
    return template;
  },
};
