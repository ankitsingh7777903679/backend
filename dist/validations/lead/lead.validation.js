"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadSchema = exports.createLeadSchema = void 0;
const zod_1 = require("zod");
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Lead name must be at least 2 characters"),
    phone: zod_1.z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
    email: zod_1.z.string().email("Valid email address required").optional().or(zod_1.z.literal("")),
    parentName: zod_1.z.string().optional(),
    parentPhone: zod_1.z.string().optional(),
    courseInterested: zod_1.z.string().min(1, "Interested course is required"),
    leadSource: zod_1.z.enum(["walk_in", "google_ads", "facebook_ads", "whatsapp", "website", "referral"]).default("walk_in"),
    pipelineStage: zod_1.z.enum(["new", "contacted", "demo_scheduled", "follow_up", "converted", "lost"]).default("new"),
    followUpDate: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateLeadSchema = exports.createLeadSchema.partial();
