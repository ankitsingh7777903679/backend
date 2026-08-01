import { Fee } from "../models/fee/fee.model";

export const generateReceiptNo = async (instituteId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await Fee.countDocuments({ instituteId });
  let sequenceNum = count + 1;
  let candidate = `REC-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;

  while (await Fee.findOne({ instituteId, receiptNo: candidate })) {
    sequenceNum++;
    candidate = `REC-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;
  }

  return candidate;
};
