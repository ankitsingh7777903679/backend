import { Lead } from "../../models/lead/lead.model";
import { Student } from "../../models/student/student.model";
import { User } from "../../models/user/user.model";
import { generateAdmissionNo } from "../../utils/generateAdmissionNo";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError";
import { CreateLeadInput } from "../../validations/lead/lead.validation";

export const leadService = {
  getAll: async (instituteId: string, query: { search?: string; stage?: string }) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };

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

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

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

  create: async (data: CreateLeadInput, instituteId: string) => {
    const lead = await Lead.create({
      ...data,
      instituteId,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    });
    return lead;
  },

  updateStage: async (id: string, stage: string, instituteId: string) => {
    const lead = await Lead.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { pipelineStage: stage } },
      { new: true }
    );
    if (!lead) throw new AppError("Lead record not found", 404);
    return lead;
  },

  convertLeadToStudent: async (id: string, instituteId: string) => {
    const lead = await Lead.findOne({ _id: id, instituteId });
    if (!lead) throw new AppError("Lead inquiry not found", 404);

    if (lead.pipelineStage === "converted" && lead.convertedStudentId) {
      throw new AppError("Lead has already been converted to an active student", 400);
    }

    const admissionNo = await generateAdmissionNo(instituteId);
    const passwordHash = await bcrypt.hash("Student@123", 10);

    const user = await User.create({
      instituteId,
      role: "student",
      name: lead.name,
      email: lead.email || `${admissionNo.toLowerCase()}@coaching.local`,
      phone: lead.phone,
      passwordHash,
    });

    const student = await Student.create({
      instituteId,
      userId: user._id,
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
      attendancePercentage: 100,
    });

    user.linkedId = student._id as unknown as import("mongoose").Types.ObjectId;
    await user.save();

    lead.pipelineStage = "converted";
    lead.convertedStudentId = student._id as unknown as import("mongoose").Types.ObjectId;
    await lead.save();

    return { lead, student };
  },
};
