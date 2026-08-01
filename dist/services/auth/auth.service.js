"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../models/user/user.model");
const institute_model_1 = require("../../models/institute/institute.model");
const student_model_1 = require("../../models/student/student.model");
const AppError_1 = require("../../utils/AppError");
exports.authService = {
    generateTokens: (user) => {
        const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "access_secret";
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "refresh_secret";
        const jwtAccessExpires = process.env.JWT_ACCESS_EXPIRES || "7d";
        const jwtRefreshExpires = process.env.JWT_REFRESH_EXPIRES || "30d";
        const payload = {
            userId: user._id ? user._id.toString() : "",
            instituteId: user.instituteId ? user.instituteId.toString() : "",
            role: user.role,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accessToken = jsonwebtoken_1.default.sign(payload, jwtAccessSecret, { expiresIn: jwtAccessExpires });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const refreshToken = jsonwebtoken_1.default.sign(payload, jwtRefreshSecret, { expiresIn: jwtRefreshExpires });
        return { accessToken, refreshToken };
    },
    registerInstitute: async (data) => {
        const existingUser = await user_model_1.User.findOne({ email: data.email.toLowerCase() });
        if (existingUser) {
            throw new AppError_1.AppError("An account with this email already exists", 409);
        }
        // 1. Create Institute
        const institute = await institute_model_1.Institute.create({
            name: data.instituteName,
            ownerName: data.ownerName,
            phone: data.phone,
            email: data.email,
        });
        // 2. Hash Password & Create Owner User
        const passwordHash = await bcrypt_1.default.hash(data.password, 12);
        const user = await user_model_1.User.create({
            instituteId: institute._id,
            role: "owner",
            name: data.ownerName,
            email: data.email,
            phone: data.phone,
            passwordHash,
        });
        const tokens = exports.authService.generateTokens(user);
        // Save refresh token
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();
        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                instituteId: institute._id,
                instituteName: institute.name,
                linkedId: user.linkedId,
            },
            tokens,
        };
    },
    login: async (data) => {
        const searchVal = data.emailOrPhone ? data.emailOrPhone.trim() : "";
        if (!searchVal) {
            throw new AppError_1.AppError("Email or phone number is required", 400);
        }
        const isEmail = searchVal.includes("@");
        const cleanSearch = searchVal.toLowerCase();
        const isStudentLogin = data.role === "student";
        const query = {
            $or: isEmail ? [{ email: cleanSearch }] : [{ phone: searchVal }, { email: cleanSearch }],
            status: { $ne: "deleted" },
        };
        if (isStudentLogin) {
            query.role = "student";
        }
        // 1. Search in User collection matching specific role
        let user = await user_model_1.User.findOne(query);
        // 2. Fallback for Student login: If student User record not found, search Student collection
        if (!user && (isStudentLogin || !isEmail)) {
            const student = await student_model_1.Student.findOne({
                $or: [
                    { phone: searchVal },
                    { parentPhone: searchVal },
                    { email: cleanSearch },
                    { admissionNo: searchVal },
                ],
                status: { $ne: "deleted" },
            });
            if (student) {
                // Check if user account already linked to this student
                if (student.userId) {
                    user = await user_model_1.User.findOne({ _id: student.userId, status: { $ne: "deleted" } });
                }
                if (!user) {
                    const defaultPassword = data.password || "Student@123";
                    const passwordHash = await bcrypt_1.default.hash(defaultPassword, 10);
                    user = await user_model_1.User.create({
                        instituteId: student.instituteId,
                        role: "student",
                        name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
                        email: student.email || `${student.admissionNo.toLowerCase()}@coaching.local`,
                        phone: student.phone,
                        passwordHash,
                        linkedId: student._id,
                    });
                    student.userId = user._id;
                    await student.save();
                }
            }
        }
        if (!user) {
            throw new AppError_1.AppError("Invalid email/phone or password", 401);
        }
        if (user.status === "inactive") {
            throw new AppError_1.AppError("Your account has been deactivated. Contact admin.", 403);
        }
        // Ensure linkedId is populated on student user doc
        if (user.role === "student" && !user.linkedId) {
            const studentDoc = await student_model_1.Student.findOne({
                instituteId: user.instituteId,
                $or: [{ phone: user.phone }, { email: user.email }, { name: user.name }],
                status: { $ne: "deleted" },
            });
            if (studentDoc) {
                user.linkedId = studentDoc._id;
                user.name = studentDoc.name;
                await user.save();
            }
        }
        // 3. Password Verification
        const isMatch = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new AppError_1.AppError("Invalid email/phone or password", 401);
        }
        const tokens = exports.authService.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();
        let instituteName = "";
        if (user.instituteId) {
            const inst = await institute_model_1.Institute.findById(user.instituteId);
            if (inst)
                instituteName = inst.name;
        }
        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                instituteId: user.instituteId,
                instituteName,
                linkedId: user.linkedId,
            },
            tokens,
        };
    },
    refreshAccessToken: async (refreshToken) => {
        try {
            const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "refresh_secret";
            const decoded = jsonwebtoken_1.default.verify(refreshToken, jwtRefreshSecret);
            const user = await user_model_1.User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                throw new AppError_1.AppError("Invalid refresh token", 401);
            }
            const tokens = exports.authService.generateTokens(user);
            user.refreshToken = tokens.refreshToken;
            await user.save();
            return tokens;
        }
        catch {
            throw new AppError_1.AppError("Invalid or expired refresh token", 401);
        }
    },
    logout: async (userId) => {
        await user_model_1.User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    },
};
