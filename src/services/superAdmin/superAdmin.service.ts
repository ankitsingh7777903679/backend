import { Institute } from "../../models/institute/institute.model";
import { Student } from "../../models/student/student.model";
import { AppError } from "../../utils/AppError";
import { Types } from "mongoose";

export const superAdminService = {
  getOverview: async () => {
    const institutesDoc = await Institute.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 });
    const totalInstitutes = institutesDoc.length;
    const activeInstitutes = institutesDoc.filter((i) => i.status === "active").length;

    const instituteList = await Promise.all(
      institutesDoc.map(async (inst) => {
        const studentCount = await Student.countDocuments({ instituteId: inst._id, status: { $ne: "deleted" } });
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
      })
    );

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

  toggleInstituteStatus: async (instituteId: string, status: "active" | "suspended") => {
    if (!Types.ObjectId.isValid(instituteId)) {
      throw new AppError("Invalid institute ID format", 400);
    }
    const inst = await Institute.findByIdAndUpdate(instituteId, { $set: { status } }, { new: true });
    if (!inst) {
      throw new AppError("Institute not found", 404);
    }
    return {
      id: inst._id.toString(),
      _id: inst._id.toString(),
      name: inst.name,
      status: inst.status,
    };
  },
};
