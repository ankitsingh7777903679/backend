"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
const student_model_1 = require("../../models/student/student.model");
const class_model_1 = require("../../models/class/class.model");
const exam_model_1 = require("../../models/exam/exam.model");
const teacher_model_1 = require("../../models/teacher/teacher.model");
exports.getDashboardStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instituteId = req.user.instituteId;
    const isTeacher = req.user.role === "teacher";
    let studentFilter = { instituteId, status: { $ne: "deleted" } };
    let classFilter = { instituteId, status: { $ne: "deleted" } };
    let examFilter = { instituteId, status: { $ne: "deleted" } };
    let canViewFees = true;
    if (isTeacher) {
        const teacherDoc = await teacher_model_1.Teacher.findOne({
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
    const totalStudents = await student_model_1.Student.countDocuments(studentFilter);
    // 2. Total Pending Fees (Hidden/0 for teachers without manage_fees permission)
    let feePendingAmount = 0;
    let pendingCount = 0;
    if (canViewFees) {
        const pendingStudents = await student_model_1.Student.find({
            ...studentFilter,
            feeStatus: "pending",
        });
        feePendingAmount = pendingStudents.reduce((sum, s) => sum + (s.monthlyFee || 1500), 0);
        pendingCount = pendingStudents.length;
    }
    // 3. Active Classes Count
    const activeClasses = await class_model_1.Class.countDocuments(classFilter);
    // 4. Tests Created Count
    const testsCreated = await exam_model_1.Exam.countDocuments(examFilter);
    // 5. Recent 5 Enrolled Students
    const recentStudentsDocs = await student_model_1.Student.find(studentFilter)
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
