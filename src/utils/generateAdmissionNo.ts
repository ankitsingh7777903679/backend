import { Student } from "../models/student/student.model";

export const generateAdmissionNo = async (instituteId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await Student.countDocuments({ instituteId });
  let sequenceNum = count + 1;
  let candidate = `ADM-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;

  while (await Student.findOne({ instituteId, admissionNo: candidate })) {
    sequenceNum++;
    candidate = `ADM-${currentYear}-${String(sequenceNum).padStart(4, "0")}`;
  }

  return candidate;
};
