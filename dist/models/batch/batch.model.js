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
exports.Batch = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const batchSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    classId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Class" },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    teacherName: { type: String, trim: true, default: "Prof. Rahul Sharma" },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    days: [{ type: String }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    roomNo: { type: String, trim: true },
    fees: { type: Number, required: true, default: 0 },
    capacity: { type: Number, required: true, default: 30 },
    enrolledCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "completed", "deleted"], default: "active" },
}, { timestamps: true });
batchSchema.index({ instituteId: 1, status: 1 });
batchSchema.index({ instituteId: 1, classId: 1 });
exports.Batch = mongoose_1.default.model("Batch", batchSchema);
