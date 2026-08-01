"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceService = void 0;
const attendance_model_1 = require("../../models/attendance/attendance.model");
const student_model_1 = require("../../models/student/student.model");
const class_model_1 = require("../../models/class/class.model");
const logger_1 = require("../../utils/logger");
const mongoose_1 = require("mongoose");
exports.attendanceService = {
    getBatchAttendance: async (instituteId, batchId, dateStr) => {
        const filter = { instituteId, dateStr };
        if (batchId) {
            if (mongoose_1.Types.ObjectId.isValid(batchId)) {
                filter.$or = [
                    { batchId: new mongoose_1.Types.ObjectId(batchId) },
                    { batchName: batchId },
                ];
            }
            else {
                filter.batchName = batchId;
            }
        }
        const record = await attendance_model_1.Attendance.findOne(filter);
        return record;
    },
    getAllRecords: async (instituteId, query) => {
        const filter = { instituteId };
        if (query.batchId)
            filter.batchId = query.batchId;
        if (query.dateStr)
            filter.dateStr = query.dateStr;
        const records = await attendance_model_1.Attendance.find(filter).sort({ dateStr: -1 });
        return records;
    },
    markAttendance: async (data, instituteId, userId, userName) => {
        const totalPresent = data.records.filter((r) => r.status === "present").length;
        const totalAbsent = data.records.filter((r) => r.status === "absent").length;
        const totalLate = data.records.filter((r) => r.status === "late").length;
        const totalLeave = data.records.filter((r) => r.status === "leave").length;
        const date = new Date(data.dateStr);
        let resolvedBatchId = mongoose_1.Types.ObjectId.isValid(data.batchId)
            ? new mongoose_1.Types.ObjectId(data.batchId)
            : undefined;
        if (!resolvedBatchId && data.batchName) {
            const clsDoc = await class_model_1.Class.findOne({ instituteId, name: data.batchName, status: { $ne: "deleted" } });
            if (clsDoc) {
                resolvedBatchId = clsDoc._id;
            }
        }
        const formattedRecords = await Promise.all(data.records.map(async (r) => {
            let studId = mongoose_1.Types.ObjectId.isValid(r.studentId)
                ? new mongoose_1.Types.ObjectId(r.studentId)
                : undefined;
            if (!studId && (r.admissionNo || r.studentName)) {
                const studentDoc = await student_model_1.Student.findOne({
                    instituteId,
                    status: { $ne: "deleted" },
                    $or: [{ admissionNo: r.admissionNo }, { name: r.studentName }],
                });
                if (studentDoc) {
                    studId = studentDoc._id;
                }
            }
            return {
                studentId: studId || new mongoose_1.Types.ObjectId(),
                studentName: r.studentName,
                admissionNo: r.admissionNo,
                status: r.status,
                remarks: r.remarks,
            };
        }));
        const safeUserId = userId && mongoose_1.Types.ObjectId.isValid(userId) ? new mongoose_1.Types.ObjectId(userId) : undefined;
        // Filter query for findOneAndUpdate
        const queryFilter = { instituteId, dateStr: data.dateStr };
        if (resolvedBatchId) {
            queryFilter.batchId = resolvedBatchId;
        }
        else {
            queryFilter.batchName = data.batchName;
        }
        // Update or Insert Attendance for that Batch & Date
        const attendance = await attendance_model_1.Attendance.findOneAndUpdate(queryFilter, {
            $set: {
                instituteId,
                batchId: resolvedBatchId,
                batchName: data.batchName,
                date,
                dateStr: data.dateStr,
                markedByUserId: safeUserId,
                markedByName: userName || "Admin Teacher",
                records: formattedRecords,
                totalPresent,
                totalAbsent,
                totalLate,
                totalLeave,
                whatsappAlertsSent: data.sendWhatsAppAlerts,
            },
        }, { upsert: true, new: true, runValidators: true });
        // Mock WhatsApp trigger log for absent students
        if (data.sendWhatsAppAlerts && totalAbsent > 0) {
            logger_1.logger.info(`[WhatsApp Cloud API Mock] Sent ${totalAbsent} absent alerts for batch ${data.batchName} on ${data.dateStr}`);
        }
        return attendance;
    },
    getStudentAttendanceHistory: async (instituteId, userId, userEmail, userName) => {
        let studentDoc = null;
        if (mongoose_1.Types.ObjectId.isValid(userId)) {
            studentDoc = await student_model_1.Student.findOne({ instituteId, status: { $ne: "deleted" }, userId: new mongoose_1.Types.ObjectId(userId) });
        }
        if (!studentDoc && (userEmail || userName)) {
            studentDoc = await student_model_1.Student.findOne({
                instituteId,
                status: { $ne: "deleted" },
                $or: [{ email: userEmail }, { name: userName }],
            });
        }
        const allBatchesAttendance = await attendance_model_1.Attendance.find({ instituteId }).sort({ dateStr: 1 });
        const studentRecords = [];
        for (const att of allBatchesAttendance) {
            if (Array.isArray(att.records)) {
                const found = att.records.find((r) => (studentDoc && r.studentId && r.studentId.toString() === studentDoc._id.toString()) ||
                    (studentDoc && r.admissionNo && r.admissionNo === studentDoc.admissionNo) ||
                    (studentDoc && r.studentName && r.studentName.toLowerCase() === studentDoc.name.toLowerCase()) ||
                    (userName && r.studentName && r.studentName.toLowerCase() === userName.toLowerCase()));
                if (found) {
                    studentRecords.push({
                        dateStr: att.dateStr,
                        batchName: att.batchName,
                        status: found.status,
                        remarks: found.remarks,
                    });
                }
            }
        }
        return studentRecords;
    },
};
