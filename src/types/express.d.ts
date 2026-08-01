export interface JWTPayload {
  userId: string;
  instituteId: string;
  role: "super_admin" | "owner" | "admin" | "teacher" | "accountant" | "student" | "parent";
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: JWTPayload;
    }
  }
}
