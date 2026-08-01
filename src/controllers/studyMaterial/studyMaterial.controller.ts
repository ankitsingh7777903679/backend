import { Request, Response } from "express";
import multer from "multer";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";
import { googleDriveService } from "../../services/googleDrive/googleDrive.service";
import { GoogleDriveToken } from "../../models/googleDriveToken/googleDriveToken.model";
import { StudyMaterial } from "../../models/studyMaterial/studyMaterial.model";
import { Student } from "../../models/student/student.model";

// Multer: store uploaded files in memory (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "video/mp4", "video/avi", "video/mkv",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' not allowed. Use PDF, images, Word, PPT, or video.`));
    }
  },
});

export const uploadMiddleware = upload.single("file");

function detectFileType(mimeType: string, fileName: string): "pdf" | "image" | "doc" | "ppt" | "video" | "other" {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("presentation") || fileName.match(/\.(ppt|pptx)$/i)) return "ppt";
  if (mimeType.includes("document") || mimeType.includes("msword") || fileName.match(/\.(doc|docx)$/i)) return "doc";
  if (mimeType.includes("video")) return "video";
  return "other";
}

// ────────────────────────────────────────────────────
// GET /api/materials/google/status
// ────────────────────────────────────────────────────
export const getDriveStatus = catchAsync(async (req: Request, res: Response) => {
  const tokenDoc = await GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
  return res.json(
    apiResponse.success(
      {
        connected: !!tokenDoc,
        connectedEmail: tokenDoc?.connectedEmail || null,
        folderUrl: tokenDoc?.folderUrl || null,
      },
      "Drive status retrieved"
    )
  );
});

// ────────────────────────────────────────────────────
// GET /api/materials/google/auth
// ────────────────────────────────────────────────────
export const getGoogleAuthUrl = catchAsync(async (req: Request, res: Response) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    return res.status(500).json(
      apiResponse.error("Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env file.")
    );
  }
  const state = `${req.user.instituteId}::${req.user.userId}`;
  const authUrl = googleDriveService.getAuthUrl(state);
  return res.json(apiResponse.success({ authUrl }, "Google auth URL generated"));
});

// ────────────────────────────────────────────────────
// GET /api/materials/google/callback
// ────────────────────────────────────────────────────
export const handleGoogleCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (error) {
    return res.redirect(`${frontendUrl}/materials?error=access_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/materials?error=invalid_callback`);
  }

  const [instituteId, userId] = state.split("::");

  try {
    await googleDriveService.handleCallback(code, instituteId, userId);
    return res.redirect(`${frontendUrl}/materials?connected=true`);
  } catch (err: unknown) {
    console.error("Google Drive callback error:", err);
    return res.redirect(`${frontendUrl}/materials?error=oauth_failed`);
  }
});

// ────────────────────────────────────────────────────
// POST /api/materials/upload
// ────────────────────────────────────────────────────
export const uploadMaterial = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json(apiResponse.error("No file uploaded. Please select a file."));
  }

  const tokenDoc = await GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
  if (!tokenDoc) {
    return res.status(400).json(
      apiResponse.error("Google Drive not connected. Please connect Google Drive first from the Materials page.")
    );
  }

  const { title, description, subject, chapter, topic, batchName, batchNames, tags, expiryDate } = req.body;

  if (!subject) {
    return res.status(400).json(apiResponse.error("Subject is required."));
  }

  // Parse batchNames into an array of selected batch strings
  let parsedBatchNames: string[] = [];

  if (Array.isArray(batchNames)) {
    parsedBatchNames = batchNames.map((b: string) => String(b).trim()).filter(Boolean);
  } else if (typeof batchNames === "string" && batchNames.trim()) {
    try {
      const jsonParsed = JSON.parse(batchNames);
      if (Array.isArray(jsonParsed)) {
        parsedBatchNames = jsonParsed.map((b: string) => String(b).trim()).filter(Boolean);
      } else {
        parsedBatchNames = batchNames.split(",").map((b: string) => b.trim()).filter(Boolean);
      }
    } catch {
      parsedBatchNames = batchNames.split(",").map((b: string) => b.trim()).filter(Boolean);
    }
  } else if (typeof batchName === "string" && batchName.trim()) {
    parsedBatchNames = batchName.split(",").map((b: string) => b.trim()).filter(Boolean);
  }

  if (parsedBatchNames.length === 0) {
    parsedBatchNames = ["All Batches"];
  }

  const primaryBatchName = parsedBatchNames.join(", ");

  // Upload file to Google Drive
  const driveResult = await googleDriveService.uploadFile(
    tokenDoc,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    req.user.instituteId.toString()
  );

  const fileSizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2));
  const fileType = detectFileType(req.file.mimetype, req.file.originalname);

  const parsedTags = tags
    ? Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : String(tags).split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const material = await StudyMaterial.create({
    instituteId: req.user.instituteId,
    uploadedBy: req.user.userId,
    title: title?.trim() || req.file.originalname,
    description: description?.trim() || "",
    subject: subject.trim(),
    chapter: chapter?.trim() || "",
    topic: topic?.trim() || "",
    batchName: primaryBatchName,
    batchNames: parsedBatchNames,
    fileType,
    driveFileId: driveResult.fileId,
    driveViewUrl: driveResult.viewUrl,
    driveDownloadUrl: driveResult.downloadUrl,
    fileName: req.file.originalname,
    fileSizeMb,
    tags: parsedTags,
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
  });

  return res.status(201).json(apiResponse.success(material, `"${material.title}" uploaded to Google Drive successfully!`));
});

// ────────────────────────────────────────────────────
// GET /api/materials
// ────────────────────────────────────────────────────
export const getAllMaterials = catchAsync(async (req: Request, res: Response) => {
  const { subject, batchName, search } = req.query as Record<string, string>;

  const now = new Date();
  const filter: Record<string, unknown> = {
    instituteId: req.user.instituteId,
    status: "active",
    $and: [
      {
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: now } },
        ],
      },
    ],
  };

  if (subject) filter.subject = { $regex: subject, $options: "i" };

  let targetBatchesToMatch: string[] = [];

  // If request is from a student, find the student's assigned batch
  if (req.user.role === "student") {
    const student = await Student.findOne({ userId: req.user.userId, instituteId: req.user.instituteId });
    if (student) {
      if (student.batchName) targetBatchesToMatch.push(student.batchName);
      if (student.schoolClass && !targetBatchesToMatch.includes(student.schoolClass)) {
        targetBatchesToMatch.push(student.schoolClass);
      }
    }
  } else if (batchName && batchName !== "All Batches") {
    targetBatchesToMatch.push(batchName);
  }

  // Filter materials: material must have "All Batches" OR match student's target batch
  if (targetBatchesToMatch.length > 0) {
    (filter.$and as object[]).push({
      $or: [
        { batchNames: { $in: [...targetBatchesToMatch, "All Batches"] } },
        { batchName: { $in: [...targetBatchesToMatch, "All Batches"] } },
        { batchName: { $regex: targetBatchesToMatch.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), $options: "i" } },
        { batchNames: { $size: 0 } },
      ],
    });
  }

  if (search) {
    (filter.$and as object[]).push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { chapter: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
      ],
    });
  }

  const materials = await StudyMaterial.find(filter).sort({ createdAt: -1 });

  return res.json(apiResponse.success(materials, "Study materials fetched successfully"));
});

// ────────────────────────────────────────────────────
// DELETE /api/materials/:id
// ────────────────────────────────────────────────────
export const deleteMaterial = catchAsync(async (req: Request, res: Response) => {
  const material = await StudyMaterial.findOne({
    _id: req.params.id,
    instituteId: req.user.instituteId,
  });

  if (!material) {
    return res.status(404).json(apiResponse.error("Study material not found."));
  }

  // Try to delete from Google Drive
  const tokenDoc = await GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
  if (tokenDoc && material.driveFileId) {
    try {
      await googleDriveService.deleteFile(tokenDoc, material.driveFileId, req.user.instituteId.toString());
    } catch {
      // File may have already been deleted from Drive manually — continue
    }
  }

  material.status = "deleted";
  await material.save();

  return res.json(apiResponse.success(null, `"${material.title}" deleted successfully.`));
});

// ────────────────────────────────────────────────────
// POST /api/materials/:id/download
// ────────────────────────────────────────────────────
export const incrementDownload = catchAsync(async (req: Request, res: Response) => {
  await StudyMaterial.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
  return res.json(apiResponse.success(null, "Download count updated"));
});

// ────────────────────────────────────────────────────
// PUT /api/materials/:id
// ────────────────────────────────────────────────────
export const updateMaterial = catchAsync(async (req: Request, res: Response) => {
  const material = await StudyMaterial.findOne({
    _id: req.params.id,
    instituteId: req.user.instituteId,
    status: "active",
  });

  if (!material) {
    return res.status(404).json(apiResponse.error("Study material not found."));
  }

  const { title, description, subject, chapter, topic, batchName, batchNames, tags, expiryDate } = req.body;

  // Check if a new file is attached during edit
  if (req.file) {
    const tokenDoc = await GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
    if (tokenDoc) {
      const driveResult = await googleDriveService.uploadFile(
        tokenDoc,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user.instituteId.toString()
      );
      const fileSizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2));
      material.fileName = req.file.originalname;
      material.driveViewUrl = driveResult.viewUrl;
      material.driveDownloadUrl = driveResult.downloadUrl;
      material.driveFileId = driveResult.fileId;
      material.fileSizeMb = fileSizeMb;
    }
  }

  if (title) material.title = title.trim();
  if (description !== undefined) material.description = description.trim();
  if (subject) material.subject = subject.trim();
  if (chapter !== undefined) material.chapter = chapter.trim();
  if (topic !== undefined) material.topic = topic.trim();
  if (expiryDate !== undefined) material.expiryDate = expiryDate ? new Date(expiryDate) : undefined;

  if (tags !== undefined) {
    material.tags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : String(tags).split(",").map((t) => t.trim()).filter(Boolean);
  }

  if (batchNames !== undefined || batchName !== undefined) {
    let parsedBatchNames: string[] = [];
    if (Array.isArray(batchNames)) {
      parsedBatchNames = batchNames.map((b: string) => String(b).trim()).filter(Boolean);
    } else if (typeof batchNames === "string" && batchNames.trim()) {
      try {
        const jsonParsed = JSON.parse(batchNames);
        if (Array.isArray(jsonParsed)) {
          parsedBatchNames = jsonParsed.map((b: string) => String(b).trim()).filter(Boolean);
        } else {
          parsedBatchNames = batchNames.split(",").map((b: string) => b.trim()).filter(Boolean);
        }
      } catch {
        parsedBatchNames = batchNames.split(",").map((b: string) => b.trim()).filter(Boolean);
      }
    } else if (typeof batchName === "string" && batchName.trim()) {
      parsedBatchNames = batchName.split(",").map((b: string) => b.trim()).filter(Boolean);
    }

    if (parsedBatchNames.length === 0) parsedBatchNames = ["All Batches"];

    material.batchNames = parsedBatchNames;
    material.batchName = parsedBatchNames.join(", ");
  }

  await material.save();

  return res.json(apiResponse.success(material, `"${material.title}" updated successfully.`));
});

