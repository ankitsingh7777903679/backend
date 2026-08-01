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
exports.Notice = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const noticeSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    targetAudience: { type: String, enum: ["all", "students", "teachers", "parents", "batch_specific"], default: "all" },
    targetBatchName: { type: String, trim: true },
    priority: { type: String, enum: ["high", "medium", "normal"], default: "normal" },
    sendWhatsApp: { type: Boolean, default: true },
    sendInApp: { type: Boolean, default: true },
    attachmentName: { type: String, trim: true },
    attachmentUrl: { type: String },
    publishedByName: { type: String, default: "Institute Admin" },
    publishedByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });
noticeSchema.index({ instituteId: 1, priority: 1 });
noticeSchema.index({ instituteId: 1, targetAudience: 1 });
exports.Notice = mongoose_1.default.model("Notice", noticeSchema);
