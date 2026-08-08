import { Exam } from "../../models/exam/exam.model";
import { Student } from "../../models/student/student.model";
import { Teacher } from "../../models/teacher/teacher.model";
import { ExamResult, IExamResult } from "../../models/examResult/examResult.model";
import { AppError } from "../../utils/AppError";
import { CreateExamInput } from "../../validations/exam/exam.validation";
import { Types } from "mongoose";
import { notificationService } from "../notification/notification.service";

export const examService = {
  getAll: async (
    instituteId: string,
    query: { search?: string; type?: string },
    userRole?: string,
    userId?: string
  ) => {
    const filter: Record<string, unknown> = { instituteId, status: { $ne: "deleted" } };

    if (query.type && query.type !== "all") {
      filter.examType = query.type;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { batchName: { $regex: query.search, $options: "i" } },
        { subject: { $regex: query.search, $options: "i" } },
      ];
    }

    // If user is a Staff Teacher, filter exams by their assigned batches
    if (userRole === "teacher" && userId && Types.ObjectId.isValid(userId)) {
      const teacherDoc = await Teacher.findOne({
        instituteId: new Types.ObjectId(instituteId),
        $or: [{ userId: new Types.ObjectId(userId) }, { _id: new Types.ObjectId(userId) }],
        status: { $ne: "deleted" },
      });
      const assignedBatchIds = teacherDoc?.assignedBatchIds || [];
      filter.batchId = { $in: assignedBatchIds };
    }

    // If user is a Student or Parent, strictly filter exams by their assigned batch!
    if (userRole === "student" || userRole === "parent") {
      let studentBatchName = "";
      if (userId && Types.ObjectId.isValid(userId)) {
        const student = await Student.findOne({
          instituteId: new Types.ObjectId(instituteId),
          $or: [{ _id: new Types.ObjectId(userId) }, { userId: new Types.ObjectId(userId) }],
          status: { $ne: "deleted" },
        });
        if (student && student.batchName) {
          studentBatchName = student.batchName.trim();
        }
      }

      if (studentBatchName) {
        const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const batchRegex = new RegExp(`^${escapeRegExp(studentBatchName)}$`, "i");

        // Student can only see exams matching their batch, or marked 'all' / 'All Batches'
        const batchConditions = [
          { batchName: batchRegex },
          { batchName: { $regex: /^all$/i } },
          { batchName: { $regex: /^all batches$/i } },
          { batchName: { $exists: false } },
          { batchName: "" },
        ];

        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: batchConditions }];
          delete filter.$or;
        } else {
          filter.$or = batchConditions;
        }
      }
    }

    const exams = await Exam.find(filter).sort({ examDate: -1 });
    return exams;
  },

  getById: async (id: string, instituteId: string) => {
    const exam = await Exam.findOne({ _id: id, instituteId });
    if (!exam) throw new AppError("Exam record not found", 404);
    return exam;
  },

  create: async (data: CreateExamInput, instituteId: string, userId?: string) => {
    const safeUserId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
    const exam = await Exam.create({
      ...data,
      instituteId,
      examDate: new Date(data.examDate),
      createdByUserId: safeUserId,
    });

    // Trigger Test Scheduled Notification to batch students
    notificationService
      .sendTestScheduledNotification(
        instituteId,
        exam.batchName,
        exam.title,
        exam.examDate,
        exam.startTime,
        exam.mode
      )
      .catch(() => {});

    return exam;
  },

  update: async (id: string, data: Partial<CreateExamInput>, instituteId: string) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.examDate) {
      updateData.examDate = new Date(data.examDate);
    }
    const exam = await Exam.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!exam) throw new AppError("Exam not found", 404);
    return exam;
  },

  delete: async (id: string, instituteId: string) => {
    const exam = await Exam.findOneAndUpdate(
      { _id: id, instituteId },
      { $set: { status: "deleted" } },
      { new: true }
    );
    if (!exam) throw new AppError("Exam not found", 404);
    return exam;
  },

  submitLiveExam: async (
    examId: string,
    userOrStudentId: string,
    instituteId: string,
    answers: { questionIndex: number; selectedOption: string }[]
  ) => {
    if (!Types.ObjectId.isValid(examId)) throw new AppError("Invalid Exam ID", 400);

    const instIdObj = new Types.ObjectId(instituteId);
    const examIdObj = new Types.ObjectId(examId);

    const exam = await Exam.findOne({ _id: examIdObj, instituteId: instIdObj, status: { $ne: "deleted" } });
    if (!exam) throw new AppError("Exam not found", 404);

    // Find student document
    let student = null;
    if (Types.ObjectId.isValid(userOrStudentId)) {
      const targetObjId = new Types.ObjectId(userOrStudentId);
      student = await Student.findOne({
        instituteId: instIdObj,
        $or: [{ _id: targetObjId }, { userId: targetObjId }],
        status: { $ne: "deleted" },
      });
    }

    // STRICT BATCH ENFORCEMENT GUARD FOR LIVE EXAM SUBMISSION:
    if (student && student.batchName && exam.batchName) {
      const examBatch = exam.batchName.trim().toLowerCase();
      const studentBatch = student.batchName.trim().toLowerCase();

      const isUniversalBatch =
        examBatch === "all" ||
        examBatch === "all batches" ||
        examBatch === "" ||
        !exam.batchName;

      if (!isUniversalBatch && examBatch !== studentBatch) {
        throw new AppError(
          `Access Denied: You belong to the '${student.batchName}' batch, but this exam is restricted to the '${exam.batchName}' batch.`,
          403
        );
      }
    }

    const studentIdObj = student ? student._id : (Types.ObjectId.isValid(userOrStudentId) ? new Types.ObjectId(userOrStudentId) : new Types.ObjectId());
    const studentName = student ? (student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim()) : "Student";
    const rollNo = student?.admissionNo || "";

    // Check if student has already submitted this exam (Strict 1-Attempt Policy)
    const existingResult = await ExamResult.findOne({
      instituteId: instIdObj,
      examId: examIdObj,
      studentId: studentIdObj,
      status: { $ne: "deleted" },
    });
    if (existingResult) {
      throw new AppError("You have already submitted this exam. Re-attempts are not allowed.", 400);
    }

    // Grade questions
    const questions = exam.questions || [];
    let totalScore = 0;
    const gradedAnswers = questions.map((q, idx) => {
      const studentAns = answers.find((a) => a.questionIndex === idx);
      const selected = studentAns ? studentAns.selectedOption : "";
      const isCorrect = selected === q.correctOption;
      const marksAwarded = isCorrect ? (q.marks || 4) : 0;
      totalScore += marksAwarded;

      return {
        questionIndex: idx,
        questionText: q.questionText,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        marksAwarded,
        explanation: q.explanation || "",
      };
    });

    const isPassed = totalScore >= exam.passingMarks;

    // Save/Update ExamResult
    const examResult = await ExamResult.findOneAndUpdate(
      { instituteId: instIdObj, examId: examIdObj, studentId: studentIdObj },
      {
        $set: {
          studentName,
          rollNo,
          marksObtained: totalScore,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          isPassed,
          studentAnswers: gradedAnswers,
          status: "active",
        },
      },
      { upsert: true, new: true }
    );

    // Recalculate ranks for all submissions of this exam
    const allResults = await ExamResult.find({
      instituteId: instIdObj,
      examId: examIdObj,
      status: { $ne: "deleted" },
    }).sort({ marksObtained: -1, createdAt: 1 });

    let calculatedRank = 1;
    for (let i = 0; i < allResults.length; i++) {
      allResults[i].rank = i + 1;
      await allResults[i].save();
      if (allResults[i]._id.toString() === examResult._id.toString()) {
        calculatedRank = i + 1;
      }
    }

    // Trigger Test Submitted & Test Evaluated Score & Rank Notifications to Student
    const studentUserId = student?.userId || (Types.ObjectId.isValid(userOrStudentId) ? userOrStudentId : undefined);
    if (studentUserId) {
      notificationService
        .sendTestSubmittedNotification(instituteId, studentIdObj, studentUserId, exam.title)
        .catch(() => {});

      notificationService
        .sendTestEvaluatedNotification(
          instituteId,
          studentIdObj,
          studentUserId,
          exam.title,
          totalScore,
          exam.totalMarks,
          calculatedRank
        )
        .catch(() => {});
    }

    return {
      examResultId: examResult._id.toString(),
      marksObtained: totalScore,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      isPassed,
      rank: calculatedRank,
      totalStudents: allResults.length,
      studentAnswers: gradedAnswers,
    };
  },

  getExamLeaderboard: async (examId: string, instituteId: string) => {
    if (!Types.ObjectId.isValid(examId)) throw new AppError("Invalid Exam ID", 400);

    const instIdObj = new Types.ObjectId(instituteId);
    const examIdObj = new Types.ObjectId(examId);

    const exam = await Exam.findOne({ _id: examIdObj, instituteId: instIdObj });
    if (!exam) throw new AppError("Exam not found", 404);

    const results = await ExamResult.find({
      instituteId: instIdObj,
      examId: examIdObj,
      status: { $ne: "deleted" },
    }).sort({ marksObtained: -1, createdAt: 1 });

    const totalSubmitted = results.length;
    const topperScore = totalSubmitted > 0 ? results[0].marksObtained : 0;
    const totalMarksSum = results.reduce((acc: number, r: IExamResult) => acc + (r.marksObtained || 0), 0);
    const classAverage = totalSubmitted > 0 ? Math.round(totalMarksSum / totalSubmitted) : 0;

    const leaderboard = results.map((r: IExamResult, index: number) => ({
      id: r._id.toString(),
      studentId: r.studentId.toString(),
      studentName: r.studentName,
      rollNo: r.rollNo || "",
      marksObtained: r.marksObtained,
      totalMarks: r.totalMarks,
      rank: r.rank || index + 1,
      isPassed: r.isPassed,
      submittedAt: r.createdAt,
    }));

    return {
      exam: {
        id: exam._id.toString(),
        title: exam.title,
        batchName: exam.batchName,
        subject: exam.subject,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
      },
      stats: {
        topperScore,
        classAverage,
        totalSubmitted,
      },
      leaderboard,
    };
  },
};
