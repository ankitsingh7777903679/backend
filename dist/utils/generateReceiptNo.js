"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceiptNo = void 0;
const fee_model_1 = require("../models/fee/fee.model");
const generateReceiptNo = async (instituteId) => {
    const currentYear = new Date().getFullYear();
    const count = await fee_model_1.Fee.countDocuments({ instituteId });
    let sequenceNum = count + 1;
    let candidate = `REC-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;
    while (await fee_model_1.Fee.findOne({ instituteId, receiptNo: candidate })) {
        sequenceNum++;
        candidate = `REC-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;
    }
    return candidate;
};
exports.generateReceiptNo = generateReceiptNo;
