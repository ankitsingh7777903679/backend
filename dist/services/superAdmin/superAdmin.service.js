"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminService = void 0;
const institute_model_1 = require("../../models/institute/institute.model");
const student_model_1 = require("../../models/student/student.model");
const AppError_1 = require("../../utils/AppError");
const mongoose_1 = require("mongoose");
exports.superAdminService = {
    getOverview: async () => {
        const institutesDoc = await institute_model_1.Institute.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 });
        const totalInstitutes = institutesDoc.length;
        const activeInstitutes = institutesDoc.filter((i) => i.status === "active").length;
        const instituteList = await Promise.all(institutesDoc.map(async (inst) => {
            const studentCount = await student_model_1.Student.countDocuments({ instituteId: inst._id, status: { $ne: "deleted" } });
            return {
                id: inst._id.toString(),
                _id: inst._id.toString(),
                name: inst.name,
                ownerName: inst.ownerName || "Institute Admin",
                email: inst.email,
                phone: inst.phone || "",
                planName: inst.subscriptionPlan ? `${inst.subscriptionPlan.toUpperCase()} Plan` : "Starter Tier",
                renewalDate: inst.updatedAt ? new Date(inst.updatedAt).toISOString().split("T")[0] : "2026-12-31",
                studentsCount: studentCount,
                status: inst.status || "active",
            };
        }));
        return {
            totalInstitutes,
            activeInstitutes,
            mrr: activeInstitutes * 15000,
            activePaidSubscriptions: activeInstitutes,
            pendingSupportTickets: 0,
            systemHealth: "All Systems Operational (MongoDB + Express)",
            institutes: instituteList,
        };
    },
    toggleInstituteStatus: async (instituteId, status) => {
        if (!mongoose_1.Types.ObjectId.isValid(instituteId)) {
            throw new AppError_1.AppError("Invalid institute ID format", 400);
        }
        const inst = await institute_model_1.Institute.findByIdAndUpdate(instituteId, { $set: { status } }, { new: true });
        if (!inst) {
            throw new AppError_1.AppError("Institute not found", 404);
        }
        return {
            id: inst._id.toString(),
            _id: inst._id.toString(),
            name: inst.name,
            status: inst.status,
        };
    },
};
