"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerInstituteSchema = void 0;
const zod_1 = require("zod");
exports.registerInstituteSchema = zod_1.z.object({
    instituteName: zod_1.z.string().min(2, "Institute name must be at least 2 characters"),
    ownerName: zod_1.z.string().min(2, "Owner name must be at least 2 characters"),
    phone: zod_1.z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit Indian mobile number required"),
    email: zod_1.z.string().email("Valid email address required"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.loginSchema = zod_1.z.object({
    emailOrPhone: zod_1.z.string().min(1, "Email or phone number is required"),
    password: zod_1.z.string().min(1, "Password is required"),
    role: zod_1.z.enum(["owner", "admin", "teacher", "accountant", "student", "parent", "super_admin"]).optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Valid email address required"),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters"),
});
