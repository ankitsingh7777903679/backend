import { Types } from "mongoose";
import { Student } from "../models/student/student.model";
import { ParentStudent } from "../models/parentStudent/parentStudent.model";
import { AppError } from "./AppError";
import { JWTPayload } from "../types/express";

const STAFF_ROLES = new Set(["owner", "admin", "teacher", "accountant"]);

/**
 * Returns the student IDs the authenticated user is allowed to act on.
 * - staff: unbounded (institute-level access, caller must scope queries)
 * - student: their own Student profile (via Student.userId)
 * - parent: every Student linked through the ParentStudent relationship
 * - super_admin: no student relationship
 */
export const getLinkedStudentIds = async (
  user: JWTPayload,
  instituteId: string
): Promise<string[]> => {
  if (user.role === "student") {
    const student = await Student.findOne({
      userId: user.userId,
      instituteId,
      status: { $ne: "deleted" },
    }).select("_id");
    return student ? [student._id.toString()] : [];
  }

  if (user.role === "parent") {
    const links = await ParentStudent.find({
      parentUserId: user.userId,
      instituteId,
      status: "active",
    }).select("studentId");
    return links.map((link) => link.studentId.toString());
  }

  return [];
};

/**
 * Resolves the target studentId a request may act on. Staff members may pass
 * any studentId (within their institute); learner accounts (student/parent)
 * always resolve their target strictly from the authenticated user, never
 * from an arbitrary request-supplied ID.
 */
export const resolveStudentAccess = async (
  user: JWTPayload,
  instituteId: string,
  requestedStudentId?: string
): Promise<string> => {
  if (STAFF_ROLES.has(user.role)) {
    if (!requestedStudentId || !Types.ObjectId.isValid(requestedStudentId)) {
      throw new AppError("A valid student ID is required", 400);
    }
    return requestedStudentId;
  }

  if (user.role === "student") {
    const student = await Student.findOne({
      userId: user.userId,
      instituteId,
      status: { $ne: "deleted" },
    }).select("_id");
    if (!student) {
      throw new AppError("Student profile not found for your account", 404);
    }
    const ownId = student._id.toString();
    if (requestedStudentId && requestedStudentId !== ownId) {
      throw new AppError("You can only view your own student records", 403);
    }
    return ownId;
  }

  if (user.role === "parent") {
    const links = await ParentStudent.find({
      parentUserId: user.userId,
      instituteId,
      status: "active",
    }).select("studentId");
    if (links.length === 0) {
      throw new AppError("No linked student found for your parent account", 403);
    }
    const linkedIds = new Set(links.map((link) => link.studentId.toString()));
    if (requestedStudentId) {
      if (!linkedIds.has(requestedStudentId)) {
        throw new AppError("You can only view records for your linked children", 403);
      }
      return requestedStudentId;
    }
    if (links.length === 1) {
      return links[0].studentId.toString();
    }
    throw new AppError("Multiple linked children found; a student ID is required", 400);
  }

  throw new AppError("Access denied", 403);
};
