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
exports.Institute = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const instituteSchema = new mongoose_1.Schema({
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, trim: true },
    logo: { type: String },
    gstNo: { type: String, trim: true },
    brandColor: { type: String, default: "#4F46E5" },
    whatsappNumber: { type: String },
    subscriptionPlan: { type: String, enum: ["free", "starter", "pro", "enterprise"], default: "free" },
    status: { type: String, enum: ["active", "suspended", "deleted"], default: "active" },
}, { timestamps: true });
instituteSchema.index({ code: 1 }, { unique: true });
instituteSchema.index({ email: 1 }, { unique: true });
instituteSchema.index({ phone: 1 });
instituteSchema.index({ status: 1 });
exports.Institute = mongoose_1.default.model("Institute", instituteSchema);
