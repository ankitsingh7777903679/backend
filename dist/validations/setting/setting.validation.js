"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingSchema = void 0;
const zod_1 = require("zod");
exports.updateSettingSchema = zod_1.z.object({
    academicYear: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    timezone: zod_1.z.string().optional(),
    whatsappEnabled: zod_1.z.boolean().optional(),
    emailEnabled: zod_1.z.boolean().optional(),
    smsEnabled: zod_1.z.boolean().optional(),
    attendanceReminderTime: zod_1.z.string().optional(),
    feeReminderDaysBefore: zod_1.z.number().optional(),
    upiId: zod_1.z.string().optional(),
    payeeName: zod_1.z.string().optional(),
    upiNote: zod_1.z.string().optional(),
    lateFeePerDay: zod_1.z.number().optional(),
    dueDayOfMonth: zod_1.z.number().optional(),
    graceDays: zod_1.z.number().optional(),
});
