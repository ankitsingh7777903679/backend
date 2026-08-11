import { z } from "zod";

export const registerInstituteSchema = z.object({
  instituteName: z.string().min(2, "Institute name must be at least 2 characters"),
  ownerName:     z.string().min(2, "Owner name must be at least 2 characters"),
  phone:         z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit Indian mobile number required"),
  email:         z.string().email("Valid email address required"),
  password:      z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  emailOrPhone:  z.string().min(1, "Email or phone number is required"),
  password:      z.string().min(1, "Password is required"),
  instituteCode: z.string().optional().or(z.literal("")),
  role:          z.enum(["owner", "admin", "teacher", "accountant", "student", "parent", "super_admin"]).optional(),
});

export const requestOtpSchema = z.object({
  email: z.string().email(),
  instituteCode: z.string().min(1),
  role: z.enum(["admin", "teacher", "student"]),
});

export const verifyOtpSchema = requestOtpSchema.extend({
  otpCode: z.string().regex(/^\d{6}$/),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email address required"),
});

export const resetPasswordSchema = z.object({
  token:       z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type RegisterInstituteInput = z.infer<typeof registerInstituteSchema>;
export type LoginInput             = z.infer<typeof loginSchema>;
