import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../../models/user/user.model";
import { Institute } from "../../models/institute/institute.model";
import { Student } from "../../models/student/student.model";
import { AppError } from "../../utils/AppError";
import { RegisterInstituteInput, LoginInput } from "../../validations/auth/auth.validation";

export const authService = {

  generateTokens: (user: IUser) => {
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

    // 1. Create Institute
    const institute = await Institute.create({
      name: data.instituteName,
      ownerName: data.ownerName,
      phone: data.phone,
      email: data.email,
    });

    // 2. Hash Password & Create Owner User
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      instituteId: institute._id,
      role: "owner",
      name: data.ownerName,
      email: data.email,
      phone: data.phone,
      passwordHash,
    });

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
    const isStudentLogin = data.role === "student";

    const query: Record<string, unknown> = {
      $or: isEmail ? [{ email: cleanSearch }] : [{ phone: searchVal }, { email: cleanSearch }],
      status: { $ne: "deleted" },
    };

    if (isStudentLogin) {
      query.role = "student";
    }

    // 1. Search in User collection matching specific role
    let user = await User.findOne(query);

    // 2. Fallback for Student login: If student User record not found, search Student collection
    if (!user && (isStudentLogin || !isEmail)) {
      const student = await Student.findOne({
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
          user = await User.findOne({ _id: student.userId, status: { $ne: "deleted" } });
        }

        if (!user) {
          const defaultPassword = data.password || "Student@123";
          const passwordHash = await bcrypt.hash(defaultPassword, 10);

          user = await User.create({
            instituteId: student.instituteId,
            role: "student",
            name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
            email: student.email || `${student.admissionNo.toLowerCase()}@coaching.local`,
            phone: student.phone,
            passwordHash,
            linkedId: student._id,
          });

          student.userId = user._id as unknown as import("mongoose").Types.ObjectId;
          await student.save();
        }
      }
    }

    if (!user) {
      throw new AppError("Invalid email/phone or password", 401);
    }

    if (user.status === "inactive") {
      throw new AppError("Your account has been deactivated. Contact admin.", 403);
    }

    // Ensure linkedId is populated on student user doc
    if (user.role === "student" && !user.linkedId) {
      const studentDoc = await Student.findOne({
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
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);

    if (!isMatch) {
      throw new AppError("Invalid email/phone or password", 401);
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
};
