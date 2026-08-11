"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = void 0;
const mongoose_1 = require("mongoose");
const student_model_1 = require("../../models/student/student.model");
const user_model_1 = require("../../models/user/user.model");
const class_model_1 = require("../../models/class/class.model");
const teacher_model_1 = require("../../models/teacher/teacher.model");
const examResult_model_1 = require("../../models/examResult/examResult.model");
const exam_model_1 = require("../../models/exam/exam.model");
const generateAdmissionNo_1 = require("../../utils/generateAdmissionNo");
const AppError_1 = require("../../utils/AppError");
const notification_service_1 = require("../notification/notification.service");
const portalAccess_service_1 = require("../portalAccess/portalAccess.service");
exports.studentService = {
    getAll: async (instituteId, query, reqUser) => {
        const filter = {
            instituteId,
            status: { $ne: "deleted" },
        };
        // Keep this authorization scope when a class filter is subsequently applied.
        let assignedBatchIds;
        if (reqUser && reqUser.role === "teacher") {
            const teacherDoc = await teacher_model_1.Teacher.findOne({
                instituteId,
                $or: [{ userId: reqUser.userId }, { _id: reqUser.userId }],
                status: { $ne: "deleted" },
            });
            assignedBatchIds = teacherDoc?.assignedBatchIds || [];
            filter.batchId = { $in: assignedBatchIds };
        }
        // Filter by batch: look up class by name to get _id, then filter by batchId
        // This handles names with special chars like "Class 12 (Science)"
        if (query.batch && query.batch !== "all") {
            const escaped = query.batch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matchingClasses = await class_model_1.Class.find({
                instituteId,
                name: { $regex: `^${escaped}$`, $options: "i" },
                status: { $ne: "deleted" },
            }).select("_id name");
            if (matchingClasses.length > 0) {
                const matchingIds = matchingClasses.map((c) => c._id);
                filter.batchId = {
                    $in: assignedBatchIds
                        ? matchingIds.filter((id) => assignedBatchIds.some((assigned) => assigned.equals(id)))
                        : matchingIds,
                };
            }
            else {
                if (assignedBatchIds) {
                    filter.batchId = { $in: [] };
                    return student_model_1.Student.find(filter).sort({ createdAt: -1 });
                }
                // Fallback: match batchName string (for legacy data)
                filter.$or = [
                    { batchName: { $regex: `^${escaped}$`, $options: "i" } },
                    { className: { $regex: `^${escaped}$`, $options: "i" } },
                ];
            }
        }
        if (query.feeStatus) {
            filter.feeStatus = query.feeStatus;
        }
        // Note: search $or is separate — don't overwrite batch filter
        if (query.search) {
            const searchRegex = { $regex: query.search, $options: "i" };
            const searchOr = [
                { name: searchRegex },
                { admissionNo: searchRegex },
                { phone: searchRegex },
                { parentPhone: searchRegex },
            ];
            // Combine search with existing batch filter using $and
            if (filter.$or || filter.batchId) {
                filter.$and = [
                    filter.$or ? { $or: filter.$or } : { batchId: filter.batchId },
                    { $or: searchOr },
                ];
                delete filter.$or;
                if (filter.batchId)
                    delete filter.batchId;
            }
            else {
                filter.$or = searchOr;
            }
        }
        const students = await student_model_1.Student.find(filter).sort({ createdAt: -1 });
        return students;
    },
    getById: async (id, instituteId) => {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new AppError_1.AppError("Invalid Student ID format", 400);
        }
        const instIdObj = new mongoose_1.Types.ObjectId(instituteId);
        const idObj = new mongoose_1.Types.ObjectId(id);
        // Search by student._id OR userId
        let student = await student_model_1.Student.findOne({ _id: idObj, instituteId: instIdObj, status: { $ne: "deleted" } });
        if (!student) {
            student = await student_model_1.Student.findOne({ userId: idObj, instituteId: instIdObj, status: { $ne: "deleted" } });
        }
        if (!student)
            throw new AppError_1.AppError("Student record not found", 404);
        const studentObj = student.toObject();
        // Look up class details to get real batch timing
        let classDoc = null;
        if (student.batchId) {
            classDoc = await class_model_1.Class.findOne({ _id: student.batchId, instituteId: instIdObj });
        }
        if (!classDoc && (student.batchName || student.schoolClass)) {
            const clsName = student.batchName || student.schoolClass;
            const escaped = (clsName || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            classDoc = await class_model_1.Class.findOne({
                instituteId: instIdObj,
                name: { $regex: `^${escaped}$`, $options: "i" },
                status: { $ne: "deleted" },
            });
        }
        return {
            ...studentObj,
            timing: classDoc?.timing || student.timing || "07:00 AM - 08:30 AM",
            shift: classDoc?.shift || "morning",
            days: classDoc?.days || "Mon – Sat (Daily)",
        };
    },
    create: async (data, instituteId, actorId) => {
        const existing = await student_model_1.Student.findOne({ phone: data.phone, instituteId, status: { $ne: "deleted" } });
        if (existing) {
            throw new AppError_1.AppError("A student with this phone number already exists", 409);
        }
        const admissionNo = await (0, generateAdmissionNo_1.generateAdmissionNo)(instituteId);
        const fullName = data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Student";
        const batchOrClass = data.className || data.batchName || "General Class";
        // Auto-resolve batchId from className if batchId is not provided
        let resolvedBatchId = data.batchId;
        if (!resolvedBatchId) {
            const clsDoc = await class_model_1.Class.findOne({ instituteId, name: batchOrClass, status: { $ne: "deleted" } });
            if (clsDoc) {
                resolvedBatchId = clsDoc._id.toString();
            }
        }
        const studentEmail = data.email?.trim().toLowerCase() || null;
        const formattedInstallmentPlan = Array.isArray(data.installmentPlan)
            ? data.installmentPlan.map((inst) => ({
                installmentNo: Number(inst.installmentNo),
                title: String(inst.title),
                amount: Number(inst.amount),
                dueDate: new Date(inst.dueDate),
                paidAmount: Number(inst.paidAmount) || 0,
                dueAmount: Number(inst.dueAmount) || Number(inst.amount),
                feeStatus: inst.feeStatus || "pending",
            }))
            : undefined;
        const { portalAccessEnabled, ...studentData } = data;
        const student = await student_model_1.Student.create({
            ...studentData,
            name: fullName,
            email: studentEmail,
            batchName: batchOrClass,
            batchId: resolvedBatchId,
            admissionNo,
            instituteId,
            feeStatus: "pending",
            portalAccess: "disabled",
            monthlyFee: data.monthlyFee !== undefined && data.monthlyFee !== null ? Number(data.monthlyFee) : 0,
            feeBillingType: data.feeBillingType || data.billingCycleType || "monthly",
            billingCycleType: data.feeBillingType || data.billingCycleType || "monthly",
            totalCourseFee: Number(data.totalCourseFee) || 0,
            numberOfInstallments: Number(data.numberOfInstallments) || (formattedInstallmentPlan?.length || 1),
            installmentPlan: formattedInstallmentPlan,
            attendancePercentage: 100,
        });
        if (portalAccessEnabled)
            await portalAccess_service_1.portalAccessService.createInvitation("student", student._id.toString(), instituteId, actorId);
        // Trigger Welcome & Batch Enrolled Notifications
        if (student.userId) {
            notification_service_1.notificationService.sendWelcomeNotification(instituteId, student._id, student.userId, fullName).catch(() => { });
            notification_service_1.notificationService.sendBatchEnrolledNotification(instituteId, student._id, student.userId, fullName, batchOrClass).catch(() => { });
        }
        return student;
    },
    update: async (id, data, instituteId) => {
        const updateData = { ...data };
        if (data.monthlyFee !== undefined) {
            updateData.monthlyFee = Number(data.monthlyFee);
        }
        if (data.totalCourseFee !== undefined) {
            updateData.totalCourseFee = Number(data.totalCourseFee);
        }
        if (data.feeBillingType || data.billingCycleType) {
            const bType = data.feeBillingType || data.billingCycleType;
            updateData.feeBillingType = bType;
            updateData.billingCycleType = bType;
            if (bType === "monthly") {
                updateData.installmentPlan = [];
                updateData.totalCourseFee = 0;
                updateData.numberOfInstallments = 0;
            }
        }
        if (data.feeBillingType !== "monthly" && Array.isArray(data.installmentPlan)) {
            updateData.installmentPlan = data.installmentPlan.map((inst) => ({
                installmentNo: Number(inst.installmentNo),
                title: String(inst.title),
                amount: Number(inst.amount),
                dueDate: new Date(inst.dueDate),
                paidAmount: Number(inst.paidAmount) || 0,
                dueAmount: Number(inst.dueAmount) || Number(inst.amount),
                feeStatus: inst.feeStatus || "pending",
            }));
        }
        const existingStudent = await student_model_1.Student.findOne({ _id: id, instituteId, status: { $ne: "deleted" } });
        const oldBatchName = existingStudent?.batchName || "";
        if ((data.className || data.batchName) && !data.batchId) {
            const clsName = data.className || data.batchName;
            const clsDoc = await class_model_1.Class.findOne({ instituteId, name: clsName, status: { $ne: "deleted" } });
            if (clsDoc) {
                updateData.batchId = clsDoc._id.toString();
                updateData.batchName = clsDoc.name;
            }
        }
        else if (data.batchId) {
            const clsDoc = await class_model_1.Class.findOne({ instituteId, _id: data.batchId, status: { $ne: "deleted" } });
            if (clsDoc) {
                updateData.batchName = clsDoc.name;
                updateData.className = clsDoc.name;
            }
        }
        const student = await student_model_1.Student.findOneAndUpdate({ _id: id, instituteId }, { $set: updateData }, { new: true, runValidators: true });
        if (!student)
            throw new AppError_1.AppError("Student not found", 404);
        // Sync updates to linked User account
        if (student.userId) {
            const userUpdate = {};
            if (data.name)
                userUpdate.name = data.name;
            if (data.phone)
                userUpdate.phone = data.phone;
            if (data.email)
                userUpdate.email = data.email.trim().toLowerCase();
            if (Object.keys(userUpdate).length > 0) {
                await user_model_1.User.updateOne({ _id: student.userId }, { $set: userUpdate });
            }
        }
        if (student.userId && updateData.batchName && updateData.batchName !== oldBatchName) {
            // Trigger Targeted Batch Changed Notification ONLY to this specific student!
            notification_service_1.notificationService
                .sendBatchChangedNotification(instituteId, student._id, student.userId, student.name, oldBatchName || "Previous Class", student.batchName || "New Batch", student.timing)
                .catch(() => { });
        }
        return student;
    },
    delete: async (id, instituteId) => {
        const student = await student_model_1.Student.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!student)
            throw new AppError_1.AppError("Student not found", 404);
        if (student.userId) {
            await user_model_1.User.findOneAndUpdate({ _id: student.userId, instituteId }, { $set: { status: "deleted" } });
        }
        return student;
    },
    getExamResults: async (studentId, instituteId) => {
        if (!mongoose_1.Types.ObjectId.isValid(studentId)) {
            throw new AppError_1.AppError("Invalid Student ID format", 400);
        }
        const instIdObj = new mongoose_1.Types.ObjectId(instituteId);
        const studIdObj = new mongoose_1.Types.ObjectId(studentId);
        // Search by student._id OR userId
        let student = await student_model_1.Student.findOne({ _id: studIdObj, instituteId: instIdObj, status: { $ne: "deleted" } });
        if (!student) {
            student = await student_model_1.Student.findOne({ userId: studIdObj, instituteId: instIdObj, status: { $ne: "deleted" } });
        }
        const targetStudentId = student ? student._id : studIdObj;
        const targetStudentName = student ? (student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim()) : "";
        const queryOr = [
            { studentId: targetStudentId },
            { studentId: studIdObj },
        ];
        if (targetStudentName) {
            queryOr.push({ studentName: { $regex: `^${targetStudentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" } });
        }
        if (student?.firstName) {
            queryOr.push({ studentName: { $regex: student.firstName, $options: "i" } });
        }
        const rawResults = await examResult_model_1.ExamResult.find({
            instituteId: instIdObj,
            status: { $ne: "deleted" },
            $or: queryOr,
        }).sort({ createdAt: -1 });
        const resultsWithExamDetails = await Promise.all(rawResults.map(async (res) => {
            const examDoc = await exam_model_1.Exam.findOne({ _id: res.examId, instituteId: instIdObj });
            return {
                id: res._id.toString(),
                examId: res.examId.toString(),
                testTitle: examDoc?.title || "Tuition Chapter Test",
                subject: examDoc?.subject || "General",
                examType: examDoc?.examType || "mock_test",
                examDate: examDoc?.examDate || res.createdAt,
                batchName: examDoc?.batchName || student?.batchName || "Tuition Batch",
                marksObtained: res.marksObtained,
                totalMarks: res.totalMarks,
                passingMarks: res.passingMarks,
                isPassed: res.isPassed,
                rank: res.rank || 1,
                remarks: res.remarks || "",
                answers: res.studentAnswers || [],
                createdAt: res.createdAt,
            };
        }));
        const totalTestsTaken = resultsWithExamDetails.length;
        let totalMarksObtained = 0;
        let totalPossibleMarks = 0;
        let passedCount = 0;
        resultsWithExamDetails.forEach((r) => {
            totalMarksObtained += r.marksObtained;
            totalPossibleMarks += r.totalMarks;
            if (r.isPassed)
                passedCount++;
        });
        const averagePercentage = totalPossibleMarks > 0 ? Math.round((totalMarksObtained / totalPossibleMarks) * 100) : 0;
        const passRatePercentage = totalTestsTaken > 0 ? Math.round((passedCount / totalTestsTaken) * 100) : 0;
        return {
            summary: {
                totalTestsTaken,
                totalMarksObtained,
                totalPossibleMarks,
                averagePercentage,
                passedCount,
                failedCount: totalTestsTaken - passedCount,
                passRatePercentage,
            },
            results: resultsWithExamDetails,
        };
    },
};
