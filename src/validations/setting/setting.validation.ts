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
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
