import { z } from "zod";

export const updateSettingSchema = z.object({
  academicYear:           z.string().optional(),
  language:               z.string().optional(),
  timezone:               z.string().optional(),
  whatsappEnabled:        z.boolean().optional(),
  emailEnabled:           z.boolean().optional(),
  smsEnabled:             z.boolean().optional(),
  attendanceReminderTime: z.string().optional(),
  feeReminderDaysBefore:  z.number().optional(),
  upiId:                  z.string().optional(),
  payeeName:              z.string().optional(),
  upiNote:                z.string().optional(),
  lateFeePerDay:          z.number().optional(),
  dueDayOfMonth:          z.number().optional(),
  graceDays:              z.number().optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
