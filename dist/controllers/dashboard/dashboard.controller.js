"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
const student_model_1 = require("../../models/student/student.model");
const class_model_1 = require("../../models/class/class.model");
const exam_model_1 = require("../../models/exam/exam.model");
exports.getDashboardStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instituteId = req.user.instituteId;
    // 1. Total Enrolled Students
    const totalStudents = await student_model_1.Student.countDocuments({
        instituteId,
        status: { $ne: "deleted" },
    });
    // 2. Total Pending Fees
    const pendingStudents = await student_model_1.Student.find({
        instituteId,
        feeStatus: "pending",
        status: { $ne: "deleted" },
    });
    const feePendingAmount = pendingStudents.reduce((sum, s) => sum + (s.monthlyFee || 1500), 0);
    const pendingCount = pendingStudents.length;
    // 3. Active Classes Count
    const activeClasses = await class_model_1.Class.countDocuments({
        instituteId,
        status: { $ne: "deleted" },
    });
    // 4. Tests Created Count
    const testsCreated = await exam_model_1.Exam.countDocuments({
        instituteId,
        status: { $ne: "deleted" },
    });
    // 5. Recent 5 Enrolled Students
    const recentStudentsDocs = await student_model_1.Student.find({
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
    res.status(200).json(apiResponse_1.apiResponse.success({
        totalStudents,
        feePendingAmount,
        pendingCount,
        activeClasses,
        testsCreated,
        recentStudents,
    }, "Dashboard analytics fetched successfully"));
});
