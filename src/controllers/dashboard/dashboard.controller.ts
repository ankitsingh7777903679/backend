import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";
import { Student } from "../../models/student/student.model";
import { Class } from "../../models/class/class.model";
import { Fee } from "../../models/fee/fee.model";
import { Exam } from "../../models/exam/exam.model";

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const instituteId = req.user.instituteId;

  // 1. Total Enrolled Students
  const totalStudents = await Student.countDocuments({
    instituteId,
    status: { $ne: "deleted" },
  });

  // 2. Total Pending Fees
  const pendingStudents = await Student.find({
    instituteId,
    feeStatus: "pending",
    status: { $ne: "deleted" },
  });
  const feePendingAmount = pendingStudents.reduce((sum, s) => sum + (s.monthlyFee || 1500), 0);
  const pendingCount = pendingStudents.length;

  // 3. Active Classes Count
  const activeClasses = await Class.countDocuments({
    instituteId,
    status: { $ne: "deleted" },
  });

  // 4. Tests Created Count
  const testsCreated = await Exam.countDocuments({
    instituteId,
    status: { $ne: "deleted" },
  });

  // 5. Recent 5 Enrolled Students
  const recentStudentsDocs = await Student.find({
    instituteId,
    status: { $ne: "deleted" },
  })
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
