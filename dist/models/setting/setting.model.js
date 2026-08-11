"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const settingSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, unique: true, index: true },
    academicYear: { type: String, default: "2026-2027" },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "Asia/Kolkata" },
    whatsappEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    attendanceReminderTime: { type: String, default: "10:30 AM" },
    feeReminderDaysBefore: { type: Number, default: 5 },
    upiId: { type: String, trim: true },
    payeeName: { type: String, trim: true },
    upiNote: { type: String, trim: true, default: "Monthly Tuition Fee" },
    lateFeePerDay: { type: Number, default: 10 },
    dueDayOfMonth: { type: Number, default: 5 },
    graceDays: { type: Number, default: 2 },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });
exports.Setting = mongoose_1.default.model("Setting", settingSchema);
