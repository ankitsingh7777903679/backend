import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";
import { Student } from "../../models/student/student.model";
import { Class } from "../../models/class/class.model";
import { Fee } from "../../models/fee/fee.model";
import { Exam } from "../../models/exam/exam.model";
import { Teacher } from "../../models/teacher/teacher.model";

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const instituteId = req.user.instituteId;
  const isTeacher = req.user.role === "teacher";

  let studentFilter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };
  let classFilter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };
  let examFilter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };
  let canViewFees = true;

  if (isTeacher) {
    const teacherDoc = await Teacher.findOne({
      instituteId,
      $or: [{ userId: req.user.userId }, { _id: req.user.userId }],
      status: { $ne: "deleted" },
    });
    const assignedBatchIds = teacherDoc?.assignedBatchIds || [];
    const perms = teacherDoc?.permissions || req.user.permissions || [];

    studentFilter.batchId = { $in: assignedBatchIds };
    classFilter._id = { $in: assignedBatchIds };
    examFilter.batchId = { $in: assignedBatchIds };
    canViewFees = perms.includes("manage_fees");
  }

  // 1. Total Enrolled Students
  const totalStudents = await Student.countDocuments(studentFilter);

  // 2. Total Pending Fees (Hidden/0 for teachers without manage_fees permission)
  let feePendingAmount = 0;
  let pendingCount = 0;

  if (canViewFees) {
    const pendingStudents = await Student.find({
      ...studentFilter,
      feeStatus: "pending",
    });
    feePendingAmount = pendingStudents.reduce((sum, s) => sum + (s.monthlyFee || 1500), 0);
    pendingCount = pendingStudents.length;
  }

  // 3. Active Classes Count
  const activeClasses = await Class.countDocuments(classFilter);

  // 4. Tests Created Count
  const testsCreated = await Exam.countDocuments(examFilter);

  // 5. Recent 5 Enrolled Students
  const recentStudentsDocs = await Student.find(studentFilter)
    .sort({ createdAt: -1 })
    .limit(5);

  const recentStudents = recentStudentsDocs.map((s) => {
    const initials = s.name ? s.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "ST";
    return {
      id: s._id.toString(),
      name: s.name,
      class: s.batchName || "General Class",
      timing: s.timing || "05:00 PM",
      feeStatus: s.feeStatus || "pending",
      initials,
      phone: s.phone,
    };
  });

  res.status(200).json(
    apiResponse.success(
      {
        totalStudents,
        feePendingAmount,
        pendingCount,
        activeClasses,
        testsCreated,
        recentStudents,
      },
      "Dashboard analytics fetched successfully"
    )
  );
});
