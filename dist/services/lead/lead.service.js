"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadService = void 0;
const lead_model_1 = require("../../models/lead/lead.model");
const student_model_1 = require("../../models/student/student.model");
const generateAdmissionNo_1 = require("../../utils/generateAdmissionNo");
const AppError_1 = require("../../utils/AppError");
exports.leadService = {
    getAll: async (instituteId, query) => {
        const filter = { instituteId, status: { $ne: "deleted" } };
        if (query.stage && query.stage !== "all") {
            filter.pipelineStage = query.stage;
        }
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: "i" } },
                { phone: { $regex: query.search, $options: "i" } },
                { courseInterested: { $regex: query.search, $options: "i" } },
            ];
        }
        const leads = await lead_model_1.Lead.find(filter).sort({ createdAt: -1 });
        const newCount = leads.filter((l) => l.pipelineStage === "new").length;
        const demoCount = leads.filter((l) => l.pipelineStage === "demo_scheduled").length;
        const followUpCount = leads.filter((l) => l.pipelineStage === "follow_up").length;
        const convertedCount = leads.filter((l) => l.pipelineStage === "converted").length;
        return {
            leads,
            metrics: {
                newCount,
                demoCount,
                followUpCount,
                convertedCount,
            },
        };
    },
    create: async (data, instituteId) => {
        const lead = await lead_model_1.Lead.create({
            ...data,
            instituteId,
            followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        });
        return lead;
    },
    updateStage: async (id, stage, instituteId) => {
        const lead = await lead_model_1.Lead.findOneAndUpdate({ _id: id, instituteId }, { $set: { pipelineStage: stage } }, { new: true });
        if (!lead)
            throw new AppError_1.AppError("Lead record not found", 404);
        return lead;
    },
    convertLeadToStudent: async (id, instituteId) => {
        const lead = await lead_model_1.Lead.findOne({ _id: id, instituteId });
        if (!lead)
            throw new AppError_1.AppError("Lead inquiry not found", 404);
        if (lead.pipelineStage === "converted" && lead.convertedStudentId) {
            throw new AppError_1.AppError("Lead has already been converted to an active student", 400);
        }
        const admissionNo = await (0, generateAdmissionNo_1.generateAdmissionNo)(instituteId);
        const student = await student_model_1.Student.create({
            instituteId,
            admissionNo,
            firstName: lead.name.split(" ")[0] || lead.name,
            lastName: lead.name.split(" ").slice(1).join(" ") || "Student",
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            parentName: lead.parentName || "Parent",
            parentPhone: lead.parentPhone || lead.phone,
            batchName: lead.courseInterested,
            feeStatus: "pending",
            portalAccess: "disabled",
            attendancePercentage: 100,
        });
        lead.pipelineStage = "converted";
        lead.convertedStudentId = student._id;
        await lead.save();
        return { lead, student };
    },
};
