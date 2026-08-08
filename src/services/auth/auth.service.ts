import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../../models/user/user.model";
import { Institute } from "../../models/institute/institute.model";
import { Student } from "../../models/student/student.model";
import { Teacher } from "../../models/teacher/teacher.model";
import { Otp } from "../../models/otp/otp.model";
import { emailService } from "../email/email.service";
import { AppError } from "../../utils/AppError";
import { RegisterInstituteInput, LoginInput } from "../../validations/auth/auth.validation";
import { generateInstituteCode } from "../../utils/generateInstituteCode";

export const authService = {

  generateTokens: (user: IUser) => {
    const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtAccessSecret || !jwtRefreshSecret) {
      throw new AppError("JWT secrets are not configured in environment.", 500);
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
    const accessToken = jwt.sign(payload, jwtAccessSecret, { expiresIn: jwtAccessExpires as any });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: jwtRefreshExpires as any });

    return { accessToken, refreshToken };
  },

  registerInstitute: async (data: RegisterInstituteInput) => {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    // Generate unique 8-character Institute Code (e.g. TP849201)
    const code = await generateInstituteCode();

    // 1. Create Institute
    const institute = await Institute.create({
      code,
      name: data.instituteName,
      ownerName: data.ownerName,
      phone: data.phone,
      email: data.email,
    });

    // 2. Hash Password & Create Owner User
    let user;
    try {
      const passwordHash = await bcrypt.hash(data.password, 12);
      user = await User.create({
        instituteId: institute._id,
        role: "owner",
        name: data.ownerName,
        email: data.email,
        phone: data.phone,
        passwordHash,
      });
    } catch (err) {
      await Institute.findByIdAndDelete(institute._id);
      throw err;
    }

    const tokens = authService.generateTokens(user);

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

  login: async (data: LoginInput) => {
    const searchVal = data.emailOrPhone ? data.emailOrPhone.trim() : "";
    if (!searchVal) {
      throw new AppError("Email or phone number is required", 400);
    }

    const isEmail = searchVal.includes("@");
    const cleanSearch = searchVal.toLowerCase();
    const cleanPhone = searchVal.replace(/\D/g, "");
    const isStudentLogin = data.role === "student";

    // 0. Verify Institute Code if provided (8-character Code verification)
    let targetInstituteId: string | null = null;
    if (data.instituteCode && data.instituteCode.trim()) {
      const codeClean = data.instituteCode.trim().toUpperCase();
      const targetInst = await Institute.findOne({ code: codeClean, status: { $ne: "deleted" } });
      if (!targetInst) {
        throw new AppError(`Invalid Institute Code "${codeClean}". Please check your 8-character Code.`, 404);
      }
      targetInstituteId = targetInst._id.toString();
    }

    const escaped = searchVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const emailRegex = new RegExp(`^${escaped}$`, "i");

    // Build flexible search OR array
    const searchOr: Record<string, unknown>[] = [
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

    const query: Record<string, unknown> = {
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
    let candidateUsers = await User.find(query);
    let authenticatedUser: IUser | null = null;

    // Test password against each candidate user account
    if (data.password && candidateUsers.length > 0) {
      for (const cand of candidateUsers) {
        if (cand.status === "inactive") continue;
        const isMatch = await bcrypt.compare(data.password, cand.passwordHash);
        if (isMatch) {
          authenticatedUser = cand;
          break;
        }
      }
    }

    // 2. Fallback for Teacher account: If no user matched password yet, check Teacher collection
    if (!authenticatedUser && !isStudentLogin) {
      const teacher = await Teacher.findOne({
        $or: [
          { email: emailRegex },
          { email: cleanSearch },
          ...(cleanPhone ? [{ phone: searchVal }, { phone: cleanPhone }] : []),
        ],
        status: { $ne: "deleted" },
      });

      if (teacher) {
        let teacherUser: IUser | null = null;
        if (teacher.userId) {
          teacherUser = await User.findOne({ _id: teacher.userId, status: { $ne: "deleted" } });
        }

        if (teacherUser && data.password) {
          const isMatch = await bcrypt.compare(data.password, teacherUser.passwordHash);
          if (isMatch) {
            authenticatedUser = teacherUser;
          }
        }

        // If teacher user doc doesn't exist, create it with input password or default
        if (!authenticatedUser && !teacherUser) {
          const passToSet = data.password || `Tp${teacher.phone.slice(-4)}@${new Date().getFullYear()}`;
          const passwordHash = await bcrypt.hash(passToSet, 10);

          const newUser = await User.create({
            instituteId: teacher.instituteId,
            role: "teacher",
            name: teacher.name,
            email: teacher.email || (isEmail ? cleanSearch : `${teacher.phone}@teacher.local`),
            phone: teacher.phone,
            passwordHash,
            linkedId: teacher._id,
          });

          teacher.userId = newUser._id as unknown as import("mongoose").Types.ObjectId;
          await teacher.save();

          authenticatedUser = newUser;
        }
      }
    }

    // 3. Fallback for Student account: If no user matched password yet, check Student collection
    if (!authenticatedUser && (isStudentLogin || !isEmail)) {
      const student = await Student.findOne({
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
        let studentUser: IUser | null = null;
        if (student.userId) {
          studentUser = await User.findOne({ _id: student.userId, status: { $ne: "deleted" } });
        }

        if (studentUser && data.password) {
          const isMatch = await bcrypt.compare(data.password, studentUser.passwordHash);
          if (isMatch) {
            authenticatedUser = studentUser;
          }
        }

        if (!authenticatedUser && !studentUser) {
          const passToSet = data.password || "Student@123";
          const passwordHash = await bcrypt.hash(passToSet, 10);

          const newUser = await User.create({
            instituteId: student.instituteId,
            role: "student",
            name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
            email: student.email || `${student.admissionNo.toLowerCase()}@coaching.local`,
            phone: student.phone,
            passwordHash,
            linkedId: student._id,
          });

          student.userId = newUser._id as unknown as import("mongoose").Types.ObjectId;
          await student.save();

          authenticatedUser = newUser;
        }
      }
    }

    if (!authenticatedUser) {
      throw new AppError("Invalid email/phone or password", 401);
    }

    if (authenticatedUser.status === "inactive") {
      throw new AppError("Your account has been deactivated. Contact admin.", 403);
    }

    // Ensure linkedId is populated on student/teacher user doc
    if (authenticatedUser.role === "student" && !authenticatedUser.linkedId) {
      const studentDoc = await Student.findOne({
        instituteId: authenticatedUser.instituteId,
        $or: [{ phone: authenticatedUser.phone }, { email: authenticatedUser.email }, { name: authenticatedUser.name }],
        status: { $ne: "deleted" },
      });
      if (studentDoc) {
        authenticatedUser.linkedId = studentDoc._id;
        authenticatedUser.name = studentDoc.name;
        await authenticatedUser.save();
      }
    } else if (authenticatedUser.role === "teacher") {
      const teacherDoc = await Teacher.findOne({
        instituteId: authenticatedUser.instituteId,
        $or: [{ _id: authenticatedUser.linkedId }, { phone: authenticatedUser.phone }, { email: authenticatedUser.email }],
        status: { $ne: "deleted" },
      });
      if (teacherDoc) {
        if (!authenticatedUser.linkedId) authenticatedUser.linkedId = teacherDoc._id;
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

    const tokens = authService.generateTokens(authenticatedUser);

    authenticatedUser.refreshToken = tokens.refreshToken;
    authenticatedUser.lastLogin = new Date();
    await authenticatedUser.save();

    let instituteName = "";
    let instituteCode = "";
    if (authenticatedUser.instituteId) {
      const inst = await Institute.findById(authenticatedUser.instituteId);
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

  refreshAccessToken: async (refreshToken: string) => {
    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "refresh_secret";
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError("Invalid refresh token", 401);
      }

      const tokens = authService.generateTokens(user);
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return tokens;
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  },

  logout: async (userId: string) => {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  },

  sendOtp: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new AppError("A valid email address is required to receive OTP", 400);
    }

    // Search in User collection first (covers Teacher, Owner, Admin, Accountant, Student)
    let user = await User.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
    let teacher = null;
    let student = null;

    if (!user) {
      teacher = await Teacher.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
    }

    if (!user && !teacher) {
      student = await Student.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
    }

    if (!user && !teacher && !student) {
      throw new AppError("No account registered with this email address.", 404);
    }

    const recipientName = user ? user.name : (teacher ? teacher.name : (student?.name || "User"));

    // Generate 6-digit OTP code
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Remove existing OTPs for this email and save new one
    await Otp.deleteMany({ email: cleanEmail });
    await Otp.create({ email: cleanEmail, otpCode, expiresAt });

    // Dispatch email via EmailService
    await emailService.sendOtpEmail(cleanEmail, otpCode, recipientName);

    return { message: `6-digit OTP code sent successfully to ${cleanEmail}` };
  },

  verifyOtp: async (email: string, otpCode: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanEmail || !cleanCode) {
      throw new AppError("Email address and OTP code are required", 400);
    }

    // Verify OTP in DB
    const otpRecord = await Otp.findOne({ email: cleanEmail, otpCode: cleanCode });
    if (!otpRecord) {
      throw new AppError("Invalid or expired OTP code. Please request a new code.", 400);
    }

    // Remove OTP after verification
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find User matching email
    let user = await User.findOne({ email: cleanEmail, status: { $ne: "deleted" } });

    // Auto-provision Teacher user account if teacher record exists without user account
    if (!user) {
      const teacher = await Teacher.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
      if (teacher) {
        if (teacher.userId) {
          user = await User.findOne({ _id: teacher.userId, status: { $ne: "deleted" } });
        }
        if (!user) {
          const pass = `Tp${teacher.phone.slice(-4)}@${new Date().getFullYear()}`;
          const defaultPassword = await bcrypt.hash(pass, 10);
          user = await User.create({
            instituteId: teacher.instituteId,
            role: "teacher",
            name: teacher.name,
            email: teacher.email || cleanEmail,
            phone: teacher.phone,
            passwordHash: defaultPassword,
            linkedId: teacher._id,
          });

          teacher.userId = user._id as unknown as import("mongoose").Types.ObjectId;
          await teacher.save();
        }
      }
    }

    // Auto-provision Student user account if student record exists without user account
    if (!user) {
      const student = await Student.findOne({ email: cleanEmail, status: { $ne: "deleted" } });
      if (student) {
        if (student.userId) {
          user = await User.findOne({ _id: student.userId, status: { $ne: "deleted" } });
        }
        if (!user) {
          const defaultPassword = await bcrypt.hash("Student@123", 10);
          user = await User.create({
            instituteId: student.instituteId,
            role: "student",
            name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
            email: student.email || cleanEmail,
            phone: student.phone,
            passwordHash: defaultPassword,
            linkedId: student._id,
          });

          student.userId = user._id as unknown as import("mongoose").Types.ObjectId;
          await student.save();
        }
      }
    }

    if (!user) {
      throw new AppError("Account setup incomplete. Please contact institute admin.", 404);
    }

    if (user.status === "inactive") {
      throw new AppError("Your account has been deactivated. Contact admin.", 403);
    }

    const tokens = authService.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    let instituteName = "";
    if (user.instituteId) {
      const inst = await Institute.findById(user.instituteId);
      if (inst) instituteName = inst.name;
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
};
