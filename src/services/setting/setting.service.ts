import { Setting } from "../../models/setting/setting.model";
import { Institute } from "../../models/institute/institute.model";
import { Types } from "mongoose";

export const settingService = {
  get: async (instituteId: string) => {
    let setting = await Setting.findOne({ instituteId });
    if (!setting) {
      setting = await Setting.create({
        instituteId: new Types.ObjectId(instituteId),
        academicYear: "2026-2027",
      });
    }

    const institute = await Institute.findById(instituteId).select("code name ownerName phone email address gstNo brandColor logo");

    return {
      ...setting.toObject(),
      instituteName: institute?.name || "",
      ownerName: institute?.ownerName || "",
      institutePhone: institute?.phone || "",
      instituteEmail: institute?.email || "",
      instituteAddress: institute?.address || "",
      instituteCode: institute?.code || "",
      gstNo: institute?.gstNo || "",
    };
  },

  update: async (data: Record<string, unknown>, instituteId: string) => {
    const {
      instituteName,
      ownerName,
      institutePhone,
      instituteEmail,
      instituteAddress,
      gstNo,
      ...settingData
    } = data;

    if (
      instituteName !== undefined ||
      ownerName !== undefined ||
      institutePhone !== undefined ||
      instituteEmail !== undefined ||
      instituteAddress !== undefined ||
      gstNo !== undefined
    ) {
      const instUpdate: Record<string, unknown> = {};
      if (instituteName !== undefined) instUpdate.name = String(instituteName).trim();
      if (ownerName !== undefined) instUpdate.ownerName = String(ownerName).trim();
      if (institutePhone !== undefined) instUpdate.phone = String(institutePhone).trim();
      if (instituteEmail !== undefined) instUpdate.email = String(instituteEmail).trim().toLowerCase();
      if (instituteAddress !== undefined) instUpdate.address = String(instituteAddress).trim();
      if (gstNo !== undefined) instUpdate.gstNo = String(gstNo).trim();

      if (Object.keys(instUpdate).length > 0) {
        await Institute.updateOne({ _id: instituteId }, { $set: instUpdate });
      }
    }

    const setting = await Setting.findOneAndUpdate(
      { instituteId },
      { $set: settingData },
      { new: true, upsert: true, runValidators: true }
    );

    const institute = await Institute.findById(instituteId).select("code name ownerName phone email address gstNo brandColor logo");

    return {
      ...setting.toObject(),
      instituteName: institute?.name || "",
      ownerName: institute?.ownerName || "",
      institutePhone: institute?.phone || "",
      instituteEmail: institute?.email || "",
      instituteAddress: institute?.address || "",
      instituteCode: institute?.code || "",
      gstNo: institute?.gstNo || "",
    };
  },
};
