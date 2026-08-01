"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingService = void 0;
const setting_model_1 = require("../../models/setting/setting.model");
const mongoose_1 = require("mongoose");
exports.settingService = {
    get: async (instituteId) => {
        let setting = await setting_model_1.Setting.findOne({ instituteId });
        if (!setting) {
            setting = await setting_model_1.Setting.create({
                instituteId: new mongoose_1.Types.ObjectId(instituteId),
                academicYear: "2026-2027",
            });
        }
        return setting;
    },
    update: async (data, instituteId) => {
        const setting = await setting_model_1.Setting.findOneAndUpdate({ instituteId }, { $set: data }, { new: true, upsert: true, runValidators: true });
        return setting;
    },
};
