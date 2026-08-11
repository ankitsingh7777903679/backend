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
exports.Teacher = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const teacherSchema = new mongoose_1.Schema({
    instituteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    teachingType: { type: String, enum: ["coaching", "home_tuition", "both"], default: "coaching" },
    portalAccess: { type: String, enum: ["disabled", "invited", "active"], default: "disabled" },
    subjects: [{ type: String, trim: true }],
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    employmentType: { type: String, enum: ["full_time", "part_time", "guest"], default: "full_time" },
    joiningDate: { type: Date },
    photo: { type: String },
    assignedBatchIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Class" }],
    permissions: [{
            type: String,
            default: [
                "manage_students",
                "mark_attendance",
                "manage_classes",
                "manage_homework",
                "manage_materials",
                "manage_tests",
                "view_student_reports"
            ]
        }],
    status: { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
}, { timestamps: true });
teacherSchema.index({ instituteId: 1, status: 1 });
teacherSchema.index({ instituteId: 1, phone: 1 });
teacherSchema.index({ userId: 1 }, { unique: true, sparse: true });
exports.Teacher = mongoose_1.default.model("Teacher", teacherSchema);
