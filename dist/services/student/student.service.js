"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = void 0;
const mongoose_1 = require("mongoose");
const student_model_1 = require("../../models/student/student.model");
const user_model_1 = require("../../models/user/user.model");
const class_model_1 = require("../../models/class/class.model");
const examResult_model_1 = require("../../models/examResult/examResult.model");
const exam_model_1 = require("../../models/exam/exam.model");
const generateAdmissionNo_1 = require("../../utils/generateAdmissionNo");
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppError_1 = require("../../utils/AppError");
exports.studentService = {
    getAll: async (instituteId, query) => {
        const filter = {
            instituteId,
            status: { $ne: "deleted" },
        };
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
                // Filter by batchId (most reliable after shifts)
                filter.batchId = { $in: matchingClasses.map((c) => c._id) };
            }
            else {
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
    create: async (data, instituteId) => {
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
        // Auto-create login User credential for Student
        const defaultPassword = "Student@123";
        const passwordHash = await bcrypt_1.default.hash(defaultPassword, 10);
        const user = await user_model_1.User.create({
            instituteId,
            role: "student",
            name: fullName,
            email: data.email || `${admissionNo.toLowerCase()}@coaching.local`,
            phone: data.phone,
            passwordHash,
        });
        const student = await student_model_1.Student.create({
            ...data,
            name: fullName,
            batchName: batchOrClass,
            batchId: resolvedBatchId,
            admissionNo,
            instituteId,
            userId: user._id,
            feeStatus: "pending",
            monthlyFee: Number(data.monthlyFee) || 1500,
            attendancePercentage: 100,
        });
        user.linkedId = student._id;
        await user.save();
        return student;
    },
    update: async (id, data, instituteId) => {
        const updateData = { ...data };
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
        return student;
    },
    delete: async (id, instituteId) => {
        const student = await student_model_1.Student.findOneAndUpdate({ _id: id, instituteId }, { $set: { status: "deleted" } }, { new: true });
        if (!student)
            throw new AppError_1.AppError("Student not found", 404);
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
