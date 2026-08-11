import { Request, Response } from "express";
import multer from "multer";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";
import { googleDriveService } from "../../services/googleDrive/googleDrive.service";
import { GoogleDriveToken } from "../../models/googleDriveToken/googleDriveToken.model";
import { HomeworkSubmission } from "../../models/homeworkSubmission/homeworkSubmission.model";
import { Homework } from "../../models/homework/homework.model";
import { Student } from "../../models/student/student.model";

// ─── Multer config (Any file type: PDF, Images, Word, Excel, PPT, Zip, Text, etc.) ─
const submissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, _file, cb) => {
    // Allow all file types as requested by user
    cb(null, true);
  },
});

export const submissionUploadMiddleware = submissionUpload.array("files", 10);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/homework/student/drive-status
// ────────────────────────────────────────────────────────────────────────────
export const getStudentDriveStatus = catchAsync(async (req: Request, res: Response) => {
  const tokenDoc = await GoogleDriveToken.findOne({
    instituteId: req.user.instituteId,
    userId: req.user.userId,
    userType: "student",
  });
  return res.json(
    apiResponse.success(
      {
        connected: !!tokenDoc,
        connectedEmail: tokenDoc?.connectedEmail || null,
        folderUrl: tokenDoc?.folderUrl || null,
      },
      "Student Drive status retrieved"
    )
  );
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/homework/student/drive-auth
// ────────────────────────────────────────────────────────────────────────────
export const getStudentDriveAuthUrl = catchAsync(async (req: Request, res: Response) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    return res.status(500).json(
      apiResponse.error("Google OAuth not configured. Please add GOOGLE_CLIENT_ID to backend .env.")
    );
  }

  // Find student record to get studentId
  const student = await Student.findOne({ userId: req.user.userId, instituteId: req.user.instituteId });
  const studentId = student ? student._id.toString() : "unknown";

  const state = `${req.user.instituteId}::${req.user.userId}::${studentId}`;
  const authUrl = googleDriveService.getStudentAuthUrl(state);
  return res.json(apiResponse.success({ authUrl }, "Student Google auth URL generated"));
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/homework/student/drive-callback  (no auth middleware)
// ────────────────────────────────────────────────────────────────────────────
export const handleStudentDriveCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (error) return res.redirect(`${frontendUrl}/my-homework?error=access_denied`);
  if (!code || !state) return res.redirect(`${frontendUrl}/my-homework?error=invalid_callback`);

  const parts = state.split("::");
  const [instituteId, userId, studentId] = parts;

  try {
    await googleDriveService.handleStudentCallback(code, instituteId, userId, studentId || "");
    return res.redirect(`${frontendUrl}/my-homework?connected=true`);
  } catch (err) {
    console.error("Student Drive callback error:", err);
    return res.redirect(`${frontendUrl}/my-homework?error=oauth_failed`);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/homework/:id/submit  (student uploads their work: files and/or links)
// ────────────────────────────────────────────────────────────────────────────
export const submitHomework = catchAsync(async (req: Request, res: Response) => {
  const homework = await Homework.findOne({ _id: req.params.id, instituteId: req.user.instituteId });
  if (!homework) return res.status(404).json(apiResponse.error("Homework not found."));

  const student = await Student.findOne({ userId: req.user.userId, instituteId: req.user.instituteId });
  if (!student) return res.status(404).json(apiResponse.error("Student profile not found."));

  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
  const { links } = req.body;

  if ((!files || files.length === 0) && !links) {
    return res.status(400).json(apiResponse.error("Please attach at least one file or link to submit."));
  }

  const attachments: Array<{ name: string; url: string; driveFileId?: string; type: "file" | "link"; fileSizeMb?: number }> = [];

  // Upload files to student's Drive if any
  if (files && files.length > 0) {
    const tokenDoc = await GoogleDriveToken.findOne({
      instituteId: req.user.instituteId,
      userId: req.user.userId,
      userType: "student",
    });

    if (!tokenDoc) {
      return res.status(400).json(apiResponse.error("Google Drive not connected. Please connect your Drive first to upload files."));
    }

    for (const file of files) {
      const driveResult = await googleDriveService.uploadFileByUserId(
        req.user.instituteId.toString(),
        req.user.userId.toString(),
        file.buffer,
        file.originalname,
        file.mimetype
      );
      const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
      attachments.push({
        name: file.originalname,
        url: driveResult.viewUrl,
        driveFileId: driveResult.fileId,
        type: "file",
        fileSizeMb,
      });
    }
  }

  // Process links
  if (links) {
    let parsedLinks: string[] = [];
    if (Array.isArray(links)) {
      parsedLinks = links;
    } else if (typeof links === "string") {
      try {
        const jsonParsed = JSON.parse(links);
        parsedLinks = Array.isArray(jsonParsed) ? jsonParsed : [links];
      } catch {
        parsedLinks = links.split("\n").map((l) => l.trim()).filter(Boolean);
      }
    }
    parsedLinks.forEach((linkUrl) => {
      if (typeof linkUrl === "string" && linkUrl.trim()) {
        const trimmed = linkUrl.trim();
        attachments.push({
          name: trimmed,
          url: trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
          type: "link",
        });
      }
    });
  }

  // Check if already submitted
  let submission = await HomeworkSubmission.findOne({
    homeworkId: req.params.id,
    studentId: student._id,
    instituteId: req.user.instituteId,
  });

  const now = new Date();
  const isLate = now > new Date(homework.dueDate);

  const primaryAttachment = attachments.find((a) => a.type === "file") || attachments[0];

  if (submission) {
    // Re-submission: update
    submission.driveFileId = primaryAttachment?.driveFileId;
    submission.driveViewUrl = primaryAttachment?.url;
    submission.fileName = primaryAttachment?.name;
    submission.attachments = attachments;
    submission.submittedAt = now;
    submission.isLate = isLate;
    submission.submissionStatus = "submitted";
    submission.teacherRemarks = undefined;
    submission.marksObtained = undefined;
    await submission.save();
  } else {
    // First submission
    submission = await HomeworkSubmission.create({
      instituteId: req.user.instituteId,
      homeworkId: req.params.id,
      studentId: student._id,
      studentUserId: req.user.userId,
      studentName: student.name,
      batchName: student.batchName || "",
      driveFileId: primaryAttachment?.driveFileId,
      driveViewUrl: primaryAttachment?.url,
      fileName: primaryAttachment?.name,
      attachments,
      submittedAt: now,
      isLate,
      submissionStatus: "submitted",
    });

    // Increment homework totalSubmissions counter
    await Homework.updateOne({ _id: req.params.id, instituteId: req.user.instituteId }, { $inc: { totalSubmissions: 1 } });
  }

  return res.status(201).json(apiResponse.success(submission, isLate ? "Submitted (Late)" : "Submitted successfully! ✅"));
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/homework/my-submissions  (student sees their own)
// ────────────────────────────────────────────────────────────────────────────
export const getMySubmissions = catchAsync(async (req: Request, res: Response) => {
  const student = await Student.findOne({ userId: req.user.userId, instituteId: req.user.instituteId });
  if (!student) return res.status(404).json(apiResponse.error("Student profile not found."));

  const submissions = await HomeworkSubmission.find({
    studentId: student._id,
    instituteId: req.user.instituteId,
    status: "active",
  }).sort({ createdAt: -1 });

  return res.json(apiResponse.success(submissions, "Your submissions fetched."));
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/homework/:id/submissions  (teacher sees ALL batch students + submission status)
// ────────────────────────────────────────────────────────────────────────────
export const getHomeworkSubmissions = catchAsync(async (req: Request, res: Response) => {
  const homework = await Homework.findOne({ _id: req.params.id, instituteId: req.user.instituteId });
  if (!homework) return res.status(404).json(apiResponse.error("Homework not found."));

  // Fetch actual submissions from DB
  const existingSubmissions = await HomeworkSubmission.find({
    homeworkId: req.params.id,
    instituteId: req.user.instituteId,
    status: "active",
  }).sort({ submittedAt: -1 });

  // Map studentId -> submission doc
  const subMap = new Map<string, any>();
  existingSubmissions.forEach((sub) => {
    subMap.set(sub.studentId.toString(), sub.toObject());
  });

  // Parse target batch names
  const targetBatches = homework.batchName
    ? homework.batchName.split(",").map((b) => b.trim()).filter(Boolean)
    : [];

  const isAllBatches = targetBatches.length === 0 || targetBatches.includes("All Batches");

  // Query enrolled students in target batch(es)
  let studentQuery: Record<string, any> = {
    instituteId: req.user.instituteId,
    status: "active",
  };

  if (!isAllBatches && targetBatches.length > 0) {
    const batchRegexes = targetBatches.map((b) => new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
    studentQuery.$or = [
      { batchName: { $in: batchRegexes } },
      { schoolClass: { $in: batchRegexes } },
    ];
  }

  let enrolledStudents = await Student.find(studentQuery).sort({ name: 1 });

  // Fallback: if no students matched target batch query, fetch all active students
  if (enrolledStudents.length === 0 && !isAllBatches) {
    enrolledStudents = await Student.find({ instituteId: req.user.instituteId, status: "active" }).sort({ name: 1 });
  }

  const processedStudentIds = new Set<string>();

  const resultItems: any[] = enrolledStudents.map((st) => {
    const stIdStr = st._id.toString();
    processedStudentIds.add(stIdStr);
    const existingSub = subMap.get(stIdStr);

    const studentProfile = {
      admissionNo: st.admissionNo,
      name: st.name,
      phone: st.phone,
      email: st.email || "",
      parentName: st.parentName,
      parentPhone: st.parentPhone,
      gender: st.gender,
      batchName: st.batchName || st.schoolClass || homework.batchName,
      schoolName: st.schoolName || "",
      schoolClass: st.schoolClass || "",
      photo: st.photo || "",
      address: st.address || "",
    };

    if (existingSub) {
      return {
        ...existingSub,
        isSubmitted: true,
        parentPhone: st.parentPhone,
        admissionNo: st.admissionNo,
        studentProfile,
      };
    }

    return {
      _id: `unsubmitted_${st._id}`,
      homeworkId: homework._id,
      studentId: st._id,
      studentName: st.name,
      admissionNo: st.admissionNo,
      phone: st.phone,
      parentPhone: st.parentPhone,
      batchName: st.batchName || st.schoolClass || homework.batchName,
      submissionStatus: "not_submitted",
      isSubmitted: false,
      isLate: false,
      studentProfile,
    };
  });

  // Also append any submission from a student that wasn't in batch roster query
  existingSubmissions.forEach((sub) => {
    if (!processedStudentIds.has(sub.studentId.toString())) {
      resultItems.push({
        ...sub.toObject(),
        isSubmitted: true,
      });
    }
  });

  const submittedCount = resultItems.filter((i) => i.isSubmitted && i.submissionStatus !== "not_submitted").length;
  const checkedCount = resultItems.filter((i) => i.submissionStatus === "checked").length;
  const pendingCount = resultItems.length - submittedCount;

  return res.json(
    apiResponse.success(
      {
        submissions: resultItems,
        stats: {
          totalEnrolled: resultItems.length,
          submittedCount,
          pendingCount,
          checkedCount,
        },
      },
      "Submissions and batch roster fetched successfully."
    )
  );
});

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/homework/submissions/:subId/review  (teacher reviews)
// ────────────────────────────────────────────────────────────────────────────
export const reviewSubmission = catchAsync(async (req: Request, res: Response) => {
  const { submissionStatus, teacherRemarks, marksObtained } = req.body;

  const submission = await HomeworkSubmission.findOne({
    _id: req.params.subId,
    instituteId: req.user.instituteId,
    status: "active",
  });
  if (!submission) return res.status(404).json(apiResponse.error("Submission not found."));

  if (submissionStatus) submission.submissionStatus = submissionStatus;
  if (teacherRemarks !== undefined) submission.teacherRemarks = teacherRemarks?.trim();
  if (marksObtained !== undefined) submission.marksObtained = marksObtained;

  await submission.save();

  return res.json(apiResponse.success(submission, "Submission reviewed successfully."));
});

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/homework/submissions/:subId  (teacher deletes)
// ────────────────────────────────────────────────────────────────────────────
export const deleteSubmission = catchAsync(async (req: Request, res: Response) => {
  const submission = await HomeworkSubmission.findOneAndUpdate(
    { _id: req.params.subId, instituteId: req.user.instituteId },
    { status: "deleted" },
    { new: true }
  );
  if (!submission) return res.status(404).json(apiResponse.error("Submission not found."));

  return res.json(apiResponse.success(null, "Submission deleted."));
});
