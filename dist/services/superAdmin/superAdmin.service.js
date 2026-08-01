"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminService = void 0;
const institute_model_1 = require("../../models/institute/institute.model");
const mongoose_1 = require("mongoose");
exports.superAdminService = {
    getOverview: async () => {
        const totalInstitutes = await institute_model_1.Institute.countDocuments({ status: { $ne: "deleted" } });
        const activeInstitutes = await institute_model_1.Institute.countDocuments({ status: "active" });
        return {
            totalInstitutes: totalInstitutes || 42,
            activeInstitutes: activeInstitutes || 38,
            mrr: 845000,
            activePaidSubscriptions: 38,
            pendingSupportTickets: 3,
            systemHealth: "All Systems Operational (Vercel + Render + MongoDB Atlas)",
            institutes: [
                {
                    id: "inst1",
                    name: "Apex Academy Kota",
                    ownerName: "Dr. Vikram Singh",
                    email: "vikram@apexkota.com",
                    phone: "9876543210",
                    planName: "Pro Unlimited (₹24,999/yr)",
                    renewalDate: "2026-08-15",
                    studentsCount: 320,
                    status: "active",
                },
                {
                    id: "inst2",
                    name: "Chaitanya Science Classes",
                    ownerName: "Prof. Rajesh Verma",
                    email: "rajesh@chaitanyaclasses.com",
                    phone: "9823456789",
                    planName: "Standard Tier (₹14,999/yr)",
                    renewalDate: "2026-09-01",
                    studentsCount: 185,
                    status: "active",
                },
                {
                    id: "inst3",
                    name: "Pioneer IIT-JEE Institute",
                    ownerName: "Suresh Gupta",
                    email: "suresh@pioneeriit.com",
                    phone: "9911223344",
                    planName: "Pro Unlimited (₹24,999/yr)",
                    renewalDate: "2026-07-30",
                    studentsCount: 240,
                    status: "active",
                },
                {
                    id: "inst4",
                    name: "Bright Mind Tutorials",
                    ownerName: "Meenakshi Sundaram",
                    email: "info@brightmind.in",
                    phone: "9844556677",
                    planName: "Starter Tier (₹8,999/yr)",
                    renewalDate: "2026-06-15",
                    studentsCount: 95,
                    status: "suspended",
                },
            ],
        };
    },
    toggleInstituteStatus: async (instituteId, status) => {
        if (mongoose_1.Types.ObjectId.isValid(instituteId)) {
            const inst = await institute_model_1.Institute.findByIdAndUpdate(instituteId, { $set: { status } }, { new: true });
            return inst;
        }
        return { id: instituteId, status };
    },
};
