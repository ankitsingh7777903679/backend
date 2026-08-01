"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAdmissionNo = void 0;
const student_model_1 = require("../models/student/student.model");
const generateAdmissionNo = async (instituteId) => {
    const currentYear = new Date().getFullYear();
    const count = await student_model_1.Student.countDocuments({ instituteId });
    let sequenceNum = count + 1;
    let candidate = `ADM-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;
    while (await student_model_1.Student.findOne({ instituteId, admissionNo: candidate })) {
        sequenceNum++;
        candidate = `ADM-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;
    }
    return candidate;
};
exports.generateAdmissionNo = generateAdmissionNo;
