"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoticeSchema = exports.createNoticeSchema = void 0;
const zod_1 = require("zod");
exports.createNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Notice title is required"),
    body: zod_1.z.string().min(5, "Notice body content is required"),
    targetAudience: zod_1.z.enum(["all", "students", "teachers", "parents", "batch_specific"]).default("all"),
    targetBatchName: zod_1.z.string().optional(),
    priority: zod_1.z.enum(["high", "medium", "normal"]).default("normal"),
    sendWhatsApp: zod_1.z.boolean().default(true),
    sendInApp: zod_1.z.boolean().default(true),
    attachmentName: zod_1.z.string().optional(),
});
exports.updateNoticeSchema = exports.createNoticeSchema.partial();
