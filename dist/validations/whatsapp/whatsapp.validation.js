"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBroadcastSchema = exports.createTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Template name is required"),
    category: zod_1.z.enum(["attendance", "fee", "exam", "announcement"]).default("attendance"),
    templateId: zod_1.z.string().min(1, "Template ID / Code required"),
    bodyText: zod_1.z.string().min(5, "Template body text required"),
    variables: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.sendBroadcastSchema = zod_1.z.object({
    templateId: zod_1.z.string().min(1, "Template ID required"),
    phoneNumbers: zod_1.z.array(zod_1.z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required")).min(1, "At least 1 phone number required"),
    params: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
