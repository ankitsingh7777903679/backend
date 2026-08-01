"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const student_model_1 = require("../../models/student/student.model");
const fee_model_1 = require("../../models/fee/fee.model");
const lead_model_1 = require("../../models/lead/lead.model");
const class_model_1 = require("../../models/class/class.model");
const attendance_model_1 = require("../../models/attendance/attendance.model");
exports.reportService = {
    getFinancialSummary: async (instituteId) => {
        const [fees, classes, leadsCount, students] = await Promise.all([
            fee_model_1.Fee.find({ instituteId, status: { $ne: "deleted" } }),
            class_model_1.Class.find({ instituteId, status: { $ne: "deleted" } }),
            lead_model_1.Lead.countDocuments({ instituteId, status: { $ne: "deleted" } }),
            student_model_1.Student.find({ instituteId, status: { $ne: "deleted" } }),
        ]);
        let totalCollected = 0;
        let pendingDues = 0;
        let totalPaidInvoices = 0;
        let totalPendingInvoices = 0;
        fees.forEach((f) => {
            totalCollected += f.paidAmount || 0;
            pendingDues += f.dueAmount || 0;
            if (f.feeStatus === "paid")
                totalPaidInvoices++;
            if (f.feeStatus === "pending" || f.feeStatus === "overdue")
                totalPendingInvoices++;
        });
        // If no fee records exist yet, calculate estimate based on student feeStatus & monthlyFee
        if (fees.length === 0) {
            students.forEach((s) => {
                const fee = s.monthlyFee || 1500;
                if (s.feeStatus === "paid") {
                    totalCollected += fee;
                    totalPaidInvoices++;
                }
                else {
                    pendingDues += fee;
                    totalPendingInvoices++;
                }
            });
        }
        // Average Attendance Calculation
        const attendanceLogs = await attendance_model_1.Attendance.find({ instituteId });
        let avgAttendanceStr = "95.0%";
        if (attendanceLogs.length > 0) {
            let grandPresent = 0;
            let grandTotal = 0;
            attendanceLogs.forEach((a) => {
                grandPresent += a.totalPresent || 0;
                grandTotal += (a.totalPresent || 0) + (a.totalAbsent || 0);
            });
            if (grandTotal > 0) {
                avgAttendanceStr = `${((grandPresent / grandTotal) * 100).toFixed(1)}%`;
            }
        }
        // Dynamic Batch Breakdown from Classes & Students
        const batchBreakdown = await Promise.all(classes.map(async (c) => {
            const enrolled = students.filter((s) => s.batchId?.toString() === c._id.toString() || s.batchName === c.name || s.schoolClass === c.name);
            const enrolledCount = enrolled.length;
            const totalTarget = enrolled.reduce((acc, s) => acc + (s.monthlyFee || 1500), 0);
            const collectedSum = enrolled
                .filter((s) => s.feeStatus === "paid")
                .reduce((acc, s) => acc + (s.monthlyFee || 1500), 0);
            const pendingSum = totalTarget - collectedSum;
            const rate = totalTarget > 0 ? `${((collectedSum / totalTarget) * 100).toFixed(1)}%` : "0.0%";
            return {
                batchName: c.name,
                enrolled: enrolledCount,
                target: `₹${totalTarget.toLocaleString("en-IN")}`,
                collected: `₹${collectedSum.toLocaleString("en-IN")}`,
                pending: `₹${pendingSum.toLocaleString("en-IN")}`,
                rate,
            };
        }));
        return {
            totalCollected,
            pendingDues,
            avgAttendance: avgAttendanceStr,
            totalLeads: leadsCount,
            totalStudents: students.length,
            totalPaidInvoices,
            totalPendingInvoices,
            batchBreakdown,
        };
    },
};
