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
const teacher_model_1 = require("../../models/teacher/teacher.model");
const otp_model_1 = require("../../models/otp/otp.model");
const email_service_1 = require("../email/email.service");
const AppError_1 = require("../../utils/AppError");
const generateInstituteCode_1 = require("../../utils/generateInstituteCode");
const rolesForLogin = (role) => role === "admin" ? ["owner", "admin", "accountant"] : [role];
const getProfileForUser = async (user) => {
    if (user.role === "teacher") {
        const profile = await teacher_model_1.Teacher.findOne({ userId: user._id, instituteId: user.instituteId, status: "active", portalAccess: "active" });
        return profile ? { profileType: "teacher", profile } : null;
    }
    if (user.role === "student") {
        const profile = await student_model_1.Student.findOne({ userId: user._id, instituteId: user.instituteId, status: "active", portalAccess: "active" });
        return profile ? { profileType: "student", profile } : null;
    }
    return null;
};
exports.authService = {
    generateTokens: (user) => {
        const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!jwtAccessSecret || !jwtRefreshSecret) {
            throw new AppError_1.AppError("JWT secrets are not configured in environment.", 500);
        }
        const jwtAccessExpires = process.env.JWT_ACCESS_EXPIRES || "7d";
        const jwtRefreshExpires = process.env.JWT_REFRESH_EXPIRES || "30d";
        const payload = {
            userId: user._id ? user._id.toString() : "",
            instituteId: user.instituteId ? user.instituteId.toString() : "",
            role: user.role,
            permissions: user.permissions || [],
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
        // Generate unique 8-character Institute Code (e.g. TP849201)
        const code = await (0, generateInstituteCode_1.generateInstituteCode)();
        // 1. Create Institute
        const institute = await institute_model_1.Institute.create({
            code,
            name: data.instituteName,
            ownerName: data.ownerName,
            phone: data.phone,
            email: data.email,
        });
        // 2. Hash Password & Create Owner User
        let user;
        try {
            const passwordHash = await bcrypt_1.default.hash(data.password, 12);
            user = await user_model_1.User.create({
                instituteId: institute._id,
                role: "owner",
                name: data.ownerName,
                email: data.email,
                phone: data.phone,
                passwordHash,
            });
        }
        catch (err) {
            await institute_model_1.Institute.findByIdAndDelete(institute._id);
            throw err;
        }
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
                instituteCode: institute.code,
                linkedId: user.linkedId,
            },
            tokens,
        };
    },
    legacyLogin: async (data) => {
        const searchVal = data.emailOrPhone ? data.emailOrPhone.trim() : "";
        if (!searchVal) {
            throw new AppError_1.AppError("Email or phone number is required", 400);
        }
        const isEmail = searchVal.includes("@");
        const cleanSearch = searchVal.toLowerCase();
        const cleanPhone = searchVal.replace(/\D/g, "");
        const isStudentLogin = data.role === "student";
        // 0. Verify Institute Code if provided (8-character Code verification)
        let targetInstituteId = null;
        if (data.instituteCode && data.instituteCode.trim()) {
            const codeClean = data.instituteCode.trim().toUpperCase();
            const targetInst = await institute_model_1.Institute.findOne({ code: codeClean, status: { $ne: "deleted" } });
            if (!targetInst) {
                throw new AppError_1.AppError(`Invalid Institute Code "${codeClean}". Please check your 8-character Code.`, 404);
            }
            targetInstituteId = targetInst._id.toString();
        }
        const escaped = searchVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const emailRegex = new RegExp(`^${escaped}$`, "i");
        // Build flexible search OR array
        const searchOr = [
            { email: emailRegex },
            { email: cleanSearch },
        ];
        if (cleanPhone && cleanPhone.length >= 7) {
            searchOr.push({ phone: searchVal });
            searchOr.push({ phone: cleanPhone });
            // Match phone ending with last 10 digits
            if (cleanPhone.length >= 10) {
                const last10 = cleanPhone.slice(-10);
                searchOr.push({ phone: new RegExp(`${last10}$`) });
            }
        }
        const query = {
            $or: searchOr,
            status: { $ne: "deleted" },
        };
        if (targetInstituteId) {
            query.instituteId = targetInstituteId;
        }
        if (isStudentLogin) {
            query.role = "student";
        }
        // 1. Fetch ALL matching candidate User accounts
        let candidateUsers = await user_model_1.User.find(query);
        let authenticatedUser = null;
        // Test password against each candidate user account
        if (data.password && candidateUsers.length > 0) {
            for (const cand of candidateUsers) {
                if (cand.status === "inactive")
                    continue;
                const isMatch = await bcrypt_1.default.compare(data.password, cand.passwordHash);
                if (isMatch) {
                    authenticatedUser = cand;
                    break;
                }
            }
        }
        // 2. Fallback for Teacher account: If no user matched password yet, check Teacher collection
        if (!authenticatedUser && !isStudentLogin) {
            const teacher = await teacher_model_1.Teacher.findOne({
                $or: [
                    { email: emailRegex },
                    { email: cleanSearch },
                    ...(cleanPhone ? [{ phone: searchVal }, { phone: cleanPhone }] : []),
                ],
                status: { $ne: "deleted" },
            });
            if (teacher) {
                let teacherUser = null;
                if (teacher.userId) {
                    teacherUser = await user_model_1.User.findOne({ _id: teacher.userId, status: { $ne: "deleted" } });
                }
                if (teacherUser && data.password) {
                    const isMatch = await bcrypt_1.default.compare(data.password, teacherUser.passwordHash);
                    if (isMatch) {
                        authenticatedUser = teacherUser;
                    }
                }
                // If teacher user doc doesn't exist, create it with input password or default
                if (!authenticatedUser && !teacherUser) {
                    const passToSet = data.password || `Tp${teacher.phone.slice(-4)}@${new Date().getFullYear()}`;
                    const passwordHash = await bcrypt_1.default.hash(passToSet, 10);
                    const newUser = await user_model_1.User.create({
                        instituteId: teacher.instituteId,
                        role: "teacher",
                        name: teacher.name,
                        email: teacher.email || (isEmail ? cleanSearch : `${teacher.phone}@teacher.local`),
                        phone: teacher.phone,
                        passwordHash,
                        linkedId: teacher._id,
                    });
                    teacher.userId = newUser._id;
                    await teacher.save();
                    authenticatedUser = newUser;
                }
            }
        }
        // 3. Fallback for Student account: If no user matched password yet, check Student collection
        if (!authenticatedUser && (isStudentLogin || !isEmail)) {
            const student = await student_model_1.Student.findOne({
                $or: [
                    { phone: searchVal },
                    { parentPhone: searchVal },
                    { email: emailRegex },
                    { email: cleanSearch },
                    { admissionNo: searchVal },
                    ...(cleanPhone ? [{ phone: cleanPhone }, { parentPhone: cleanPhone }] : []),
                ],
                status: { $ne: "deleted" },
            });
            if (student) {
                let studentUser = null;
                if (student.userId) {
                    studentUser = await user_model_1.User.findOne({ _id: student.userId, status: { $ne: "deleted" } });
                }
                if (studentUser && data.password) {
                    const isMatch = await bcrypt_1.default.compare(data.password, studentUser.passwordHash);
                    if (isMatch) {
                        authenticatedUser = studentUser;
                    }
                }
                if (!authenticatedUser && !studentUser) {
                    const passToSet = data.password || "Student@123";
                    const passwordHash = await bcrypt_1.default.hash(passToSet, 10);
                    const newUser = await user_model_1.User.create({
                        instituteId: student.instituteId,
                        role: "student",
                        name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
                        email: student.email || `${student.admissionNo.toLowerCase()}@coaching.local`,
                        phone: student.phone,
                        passwordHash,
                        linkedId: student._id,
                    });
                    student.userId = newUser._id;
                    await student.save();
                    authenticatedUser = newUser;
                }
            }
        }
        if (!authenticatedUser) {
            throw new AppError_1.AppError("Invalid email/phone or password", 401);
        }
        if (authenticatedUser.status === "inactive") {
            throw new AppError_1.AppError("Your account has been deactivated. Contact admin.", 403);
        }
        // Ensure linkedId is populated on student/teacher user doc
        if (authenticatedUser.role === "student" && !authenticatedUser.linkedId) {
            const studentDoc = await student_model_1.Student.findOne({
                instituteId: authenticatedUser.instituteId,
                $or: [{ phone: authenticatedUser.phone }, { email: authenticatedUser.email }, { name: authenticatedUser.name }],
                status: { $ne: "deleted" },
            });
            if (studentDoc) {
                authenticatedUser.linkedId = studentDoc._id;
                authenticatedUser.name = studentDoc.name;
                await authenticatedUser.save();
            }
        }
        else if (authenticatedUser.role === "teacher") {
            const teacherDoc = await teacher_model_1.Teacher.findOne({
                instituteId: authenticatedUser.instituteId,
                $or: [{ _id: authenticatedUser.linkedId }, { phone: authenticatedUser.phone }, { email: authenticatedUser.email }],
                status: { $ne: "deleted" },
            });
            if (teacherDoc) {
                if (!authenticatedUser.linkedId)
                    authenticatedUser.linkedId = teacherDoc._id;
                authenticatedUser.permissions = teacherDoc.permissions || [
                    "manage_students",
                    "mark_attendance",
                    "manage_classes",
                    "manage_homework",
                    "manage_materials",
                    "manage_tests",
                    "view_student_reports",
                ];
                await authenticatedUser.save();
            }
        }
        const tokens = exports.authService.generateTokens(authenticatedUser);
        authenticatedUser.refreshToken = tokens.refreshToken;
        authenticatedUser.lastLogin = new Date();
        await authenticatedUser.save();
        let instituteName = "";
        let instituteCode = "";
        if (authenticatedUser.instituteId) {
            const inst = await institute_model_1.Institute.findById(authenticatedUser.instituteId);
            if (inst) {
                instituteName = inst.name;
                instituteCode = inst.code;
            }
        }
        return {
            user: {
                id: authenticatedUser._id,
                name: authenticatedUser.name,
                email: authenticatedUser.email,
                role: authenticatedUser.role,
                instituteId: authenticatedUser.instituteId,
                instituteName,
                instituteCode,
                linkedId: authenticatedUser.linkedId,
            },
            tokens,
        };
    },
    login: async (data) => {
        const role = data.role;
        if (!role || !["admin", "teacher", "student"].includes(role)) {
            throw new AppError_1.AppError("Select Admin, Teacher, or Student before signing in", 400);
        }
        if (!data.instituteCode?.trim())
            throw new AppError_1.AppError("Institute code is required", 400);
        const institute = await institute_model_1.Institute.findOne({ code: data.instituteCode.trim().toUpperCase(), status: { $ne: "deleted" } });
        if (!institute)
            throw new AppError_1.AppError("Invalid institute code", 404);
        const search = data.emailOrPhone.trim();
        const normalizedPhone = search.replace(/\D/g, "");
        const emailRegex = new RegExp(`^${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        const candidates = await user_model_1.User.find({
            instituteId: institute._id,
            role: { $in: rolesForLogin(role) },
            status: "active",
            $or: [
                { email: emailRegex },
                ...(normalizedPhone ? [{ phone: normalizedPhone }, { phone: search }] : []),
            ],
        });
        let authenticatedUser = null;
        for (const candidate of candidates) {
            if (await bcrypt_1.default.compare(data.password, candidate.passwordHash)) {
                authenticatedUser = candidate;
                break;
            }
        }
        if (!authenticatedUser)
            throw new AppError_1.AppError("Invalid institute code, role, or credentials", 401);
        const profileInfo = await getProfileForUser(authenticatedUser);
        if ((role === "teacher" || role === "student") && !profileInfo) {
            throw new AppError_1.AppError("Portal access is not active for this profile. Contact your institute administrator.", 403);
        }
        const tokens = exports.authService.generateTokens(authenticatedUser);
        authenticatedUser.refreshToken = tokens.refreshToken;
        authenticatedUser.lastLogin = new Date();
        await authenticatedUser.save();
        return {
            user: {
                id: authenticatedUser._id,
                name: profileInfo?.profile.name || authenticatedUser.name,
                email: profileInfo?.profile.email || authenticatedUser.email,
                role: authenticatedUser.role,
                instituteId: authenticatedUser.instituteId,
                instituteName: institute.name,
                instituteCode: institute.code,
                profileType: profileInfo?.profileType,
                profileId: profileInfo?.profile._id,
                teachingType: profileInfo?.profileType === "teacher" ? profileInfo.profile.teachingType : undefined,
                portalAccess: profileInfo?.profile.portalAccess,
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
    legacySendOtp: async (email) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes("@")) {
            throw new AppError_1.AppError("A valid email address is required to receive OTP", 400);
        }
        // Search in User collection first (covers Teacher, Owner, Admin, Accountant, Student)
        let user = await user_model_1.User.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
        let teacher = null;
        let student = null;
        if (!user) {
            teacher = await teacher_model_1.Teacher.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
        }
        if (!user && !teacher) {
            student = await student_model_1.Student.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
        }
        if (!user && !teacher && !student) {
            throw new AppError_1.AppError("No account registered with this email address.", 404);
        }
        const recipientName = user ? user.name : (teacher ? teacher.name : (student?.name || "User"));
        // Generate 6-digit OTP code
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL
        // Remove existing OTPs for this email and save new one
        await otp_model_1.Otp.deleteMany({ email: cleanEmail });
        await otp_model_1.Otp.create({ email: cleanEmail, otpCode, expiresAt });
        // Dispatch email via EmailService
        await email_service_1.emailService.sendOtpEmail(cleanEmail, otpCode, recipientName);
        return { message: `6-digit OTP code sent successfully to ${cleanEmail}` };
    },
    legacyVerifyOtp: async (email, otpCode) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = otpCode.trim();
        if (!cleanEmail || !cleanCode) {
            throw new AppError_1.AppError("Email address and OTP code are required", 400);
        }
        // Verify OTP in DB
        const otpRecord = await otp_model_1.Otp.findOne({ email: cleanEmail, otpCode: cleanCode });
        if (!otpRecord) {
            throw new AppError_1.AppError("Invalid or expired OTP code. Please request a new code.", 400);
        }
        // Remove OTP after verification
        await otp_model_1.Otp.deleteOne({ _id: otpRecord._id });
        // Find User matching email
        let user = await user_model_1.User.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
        // Auto-provision Teacher user account if teacher record exists without user account
        if (!user) {
            const teacher = await teacher_model_1.Teacher.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
            if (teacher) {
                if (teacher.userId) {
                    user = await user_model_1.User.findOne({ _id: teacher.userId, status: { $ne: "deleted" } });
                }
                if (!user) {
                    const pass = `Tp${teacher.phone.slice(-4)}@${new Date().getFullYear()}`;
                    const defaultPassword = await bcrypt_1.default.hash(pass, 10);
                    user = await user_model_1.User.create({
                        instituteId: teacher.instituteId,
                        role: "teacher",
                        name: teacher.name,
                        email: teacher.email || cleanEmail,
                        phone: teacher.phone,
                        passwordHash: defaultPassword,
                        linkedId: teacher._id,
                    });
                    teacher.userId = user._id;
                    await teacher.save();
                }
            }
        }
        // Auto-provision Student user account if student record exists without user account
        if (!user) {
            const student = await student_model_1.Student.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
            if (student) {
                if (student.userId) {
                    user = await user_model_1.User.findOne({ _id: student.userId, status: { $ne: "deleted" } });
                }
                if (!user) {
                    const defaultPassword = await bcrypt_1.default.hash("Student@123", 10);
                    user = await user_model_1.User.create({
                        instituteId: student.instituteId,
                        role: "student",
                        name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
                        email: student.email || cleanEmail,
                        phone: student.phone,
                        passwordHash: defaultPassword,
                        linkedId: student._id,
                    });
                    student.userId = user._id;
                    await student.save();
                }
            }
        }
        if (!user) {
            throw new AppError_1.AppError("Account setup incomplete. Please contact institute admin.", 404);
        }
        if (user.status === "inactive") {
            throw new AppError_1.AppError("Your account has been deactivated. Contact admin.", 403);
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
    sendOtp: async (data) => {
        const institute = await institute_model_1.Institute.findOne({ code: data.instituteCode.trim().toUpperCase(), status: { $ne: "deleted" } });
        if (!institute)
            throw new AppError_1.AppError("Invalid institute code", 404);
        const user = await user_model_1.User.findOne({
            instituteId: institute._id,
            role: { $in: rolesForLogin(data.role) },
            email: data.email.trim().toLowerCase(),
            status: "active",
        });
        if (!user)
            throw new AppError_1.AppError("No active account matches this institute, role, and email", 404);
        const profileInfo = await getProfileForUser(user);
        if ((data.role === "teacher" || data.role === "student") && !profileInfo)
            throw new AppError_1.AppError("Portal access is not active for this profile", 403);
        const existingOtp = await otp_model_1.Otp.findOne({ instituteId: institute._id, userId: user._id, role: user.role });
        if (existingOtp && Date.now() - existingOtp.createdAt.getTime() < 60_000) {
            throw new AppError_1.AppError("Please wait one minute before requesting another OTP", 429);
        }
        await otp_model_1.Otp.deleteMany({ instituteId: institute._id, userId: user._id, role: user.role });
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        await otp_model_1.Otp.create({ email: user.email, instituteId: institute._id, userId: user._id, role: user.role, otpCode, attempts: 0, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
        await email_service_1.emailService.sendOtpEmail(user.email, otpCode, profileInfo?.profile.name || user.name);
        return { message: "OTP sent to the active portal email" };
    },
    verifyOtp: async (data) => {
        const institute = await institute_model_1.Institute.findOne({ code: data.instituteCode.trim().toUpperCase(), status: { $ne: "deleted" } });
        if (!institute)
            throw new AppError_1.AppError("Invalid institute code", 404);
        const user = await user_model_1.User.findOne({ instituteId: institute._id, role: { $in: rolesForLogin(data.role) }, email: data.email.trim().toLowerCase(), status: "active" });
        if (!user)
            throw new AppError_1.AppError("No active account matches this institute, role, and email", 404);
        const otp = await otp_model_1.Otp.findOne({ instituteId: institute._id, userId: user._id, role: user.role });
        if (!otp || otp.expiresAt <= new Date() || otp.attempts >= 5)
            throw new AppError_1.AppError("Invalid or expired OTP code", 400);
        if (otp.otpCode !== data.otpCode) {
            otp.attempts += 1;
            await otp.save();
            throw new AppError_1.AppError("Invalid or expired OTP code", 400);
        }
        await otp_model_1.Otp.deleteMany({ instituteId: institute._id, userId: user._id, role: user.role });
        const profileInfo = await getProfileForUser(user);
        if ((data.role === "teacher" || data.role === "student") && !profileInfo)
            throw new AppError_1.AppError("Portal access is not active for this profile", 403);
        const tokens = exports.authService.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();
        return { user: { id: user._id, name: profileInfo?.profile.name || user.name, email: profileInfo?.profile.email || user.email, role: user.role, instituteId: user.instituteId, instituteName: institute.name, instituteCode: institute.code, profileType: profileInfo?.profileType, profileId: profileInfo?.profile._id, teachingType: profileInfo?.profileType === "teacher" ? profileInfo.profile.teachingType : undefined, portalAccess: profileInfo?.profile.portalAccess }, tokens };
    },
};
