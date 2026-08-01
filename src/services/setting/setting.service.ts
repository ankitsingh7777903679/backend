import { Setting } from "../../models/setting/setting.model";
import { UpdateSettingInput } from "../../validations/setting/setting.validation";
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
    return setting;
  },

  update: async (data: UpdateSettingInput, instituteId: string) => {
    const setting = await Setting.findOneAndUpdate(
      { instituteId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
    return setting;
  },
};
