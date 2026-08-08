import { JWTPayload } from "../types/express";
import { Teacher } from "../models/teacher/teacher.model";
import mongoose from "mongoose";

export interface BatchFilterResult {
  instituteId: mongoose.Types.ObjectId | string;
  isOwnerOrAdmin: boolean;
  assignedBatchIds: mongoose.Types.ObjectId[];
  queryFilter: Record<string, unknown>;
}

/**
 * Builds automatic multi-tenant + batch-scoped MongoDB query filter.
 * - Owners & Admins: Sees ALL institute records.
 * - Staff Teachers: Sees ONLY records belonging to their assigned batches.
 */
export async function getTeacherBatchFilter(reqUser: JWTPayload): Promise<BatchFilterResult> {
  const instId = new mongoose.Types.ObjectId(reqUser.instituteId);
  const isOwnerOrAdmin = reqUser.role === "owner" || reqUser.role === "admin" || reqUser.role === "super_admin";

  if (isOwnerOrAdmin) {
    return {
      instituteId: instId,
      isOwnerOrAdmin: true,
      assignedBatchIds: [],
      queryFilter: { instituteId: instId },
    };
  }

  // For Staff Teacher: Find assigned batches from Teacher model
  const teacher = await Teacher.findOne({
    instituteId: instId,
    $or: [{ userId: reqUser.userId }, { _id: reqUser.userId }],
    status: { $ne: "deleted" },
  });

  const assignedBatchIds = teacher?.assignedBatchIds || [];

  return {
    instituteId: instId,
    isOwnerOrAdmin: false,
    assignedBatchIds,
    queryFilter: {
      instituteId: instId,
      batchId: { $in: assignedBatchIds },
    },
  };
}
