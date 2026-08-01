import { Types } from "mongoose";
import { ExamResult } from "../../models/examResult/examResult.model";
import { Exam } from "../../models/exam/exam.model";
import { AppError } from "../../utils/AppError";
import { SubmitExamResultsInput } from "../../validations/examResult/examResult.validation";

export const examResultService = {
  getResultsByExam: async (examId: string, instituteId: string) => {
    if (!Types.ObjectId.isValid(examId)) {
      throw new AppError("Invalid Exam ID format", 400);
    }
    const results = await ExamResult.find({
      examId: new Types.ObjectId(examId),
      instituteId: new Types.ObjectId(instituteId),
      status: { $ne: "deleted" },
    }).sort({ rollNo: 1, studentName: 1 });

    return results;
  },

  submitResults: async (examId: string, data: SubmitExamResultsInput, instituteId: string) => {
    if (!Types.ObjectId.isValid(examId)) {
      throw new AppError("Invalid Exam ID format", 400);
    }

    const exam = await Exam.findOne({ _id: examId, instituteId: new Types.ObjectId(instituteId) });
    if (!exam) {
      throw new AppError("Exam record not found", 404);
    }

    const instIdObj = new Types.ObjectId(instituteId);
    const examIdObj = new Types.ObjectId(examId);

    // Process each student mark entry with upsert logic
    const operations = data.results.map((item) => {
      const studentIdObj = new Types.ObjectId(item.studentId);
      const isPassed = item.marksObtained >= exam.passingMarks;

      return {
        updateOne: {
          filter: { instituteId: instIdObj, examId: examIdObj, studentId: studentIdObj },
          update: {
            $set: {
              studentName: item.studentName,
              rollNo: item.rollNo || "",
              marksObtained: item.marksObtained,
              totalMarks: exam.totalMarks,
              passingMarks: exam.passingMarks,
              isPassed,
              remarks: item.remarks || "",
              status: "active" as const,
            },
          },
          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      await ExamResult.bulkWrite(operations);
    }

    // Update exam status to completed
    exam.examStatus = "completed";
    await exam.save();

    // Fetch and return saved results
    return ExamResult.find({
      examId: examIdObj,
      instituteId: instIdObj,
      status: { $ne: "deleted" },
    });
  },
};
