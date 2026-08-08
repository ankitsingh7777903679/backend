import { Request, Response } from "express";
import multer from "multer";
import { homeworkService } from "../../services/homework/homework.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";
import { googleDriveService } from "../../services/googleDrive/googleDrive.service";
import { GoogleDriveToken } from "../../models/googleDriveToken/googleDriveToken.model";

const teacherHwUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, _file, cb) => cb(null, true), // Allow all file types (PDF, Word, Excel, PPT, Images, Zip, etc.)
});

export const teacherHwUploadMiddleware = teacherHwUpload.array("files", 10);

export const getAllHomework = catchAsync(async (req: Request, res: Response) => {
  const list = await homeworkService.getAll(req.user.instituteId, req.query as { search?: string; status?: string }, req.user);
  res.json(apiResponse.success(list, "Homework records fetched successfully"));
});

export const getHomework = catchAsync(async (req: Request, res: Response) => {
  const item = await homeworkService.getById(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(item));
});

export const createHomework = catchAsync(async (req: Request, res: Response) => {
  const { title, batchName, subject, description, dueDate, links } = req.body;

  const attachments: Array<{ name: string; url: string; driveFileId?: string; type: "file" | "link"; fileSizeMb?: number }> = [];

  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  if (files && files.length > 0) {
    const tokenDoc = await GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
    if (tokenDoc) {
      for (const file of files) {
        const driveResult = await googleDriveService.uploadFile(
          tokenDoc,
          file.buffer,
          file.originalname,
          file.mimetype,
          req.user.instituteId.toString()
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
  }

  // Parse external links
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

  const primaryAttachment = attachments.find((a) => a.type === "file") || attachments[0];

  const item = await homeworkService.create(
    {
      title,
      batchName,
      subject,
      description,
      dueDate,
      attachmentUrl: primaryAttachment?.url,
      attachmentName: primaryAttachment?.name,
      driveFileId: primaryAttachment?.driveFileId,
      attachments,
      homeworkStatus: "active",
    },
    req.user.instituteId,
    req.user.userId
  );
  res.status(201).json(apiResponse.success(item, "Homework assignment created successfully"));
});

export const updateHomework = catchAsync(async (req: Request, res: Response) => {
  const { title, batchName, subject, description, dueDate, links, existingAttachments } = req.body;

  let attachments: Array<{ name: string; url: string; driveFileId?: string; type: "file" | "link"; fileSizeMb?: number }> = [];

  // Parse existing attachments if passed from frontend
  if (existingAttachments) {
    try {
      attachments = typeof existingAttachments === "string" ? JSON.parse(existingAttachments) : existingAttachments;
    } catch {
      attachments = [];
    }
  }

  // Upload any new files to Google Drive
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

  if (files && files.length > 0) {
    const tokenDoc = await GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
    if (tokenDoc) {
      for (const file of files) {
        const driveResult = await googleDriveService.uploadFile(
          tokenDoc,
          file.buffer,
          file.originalname,
          file.mimetype,
          req.user.instituteId.toString()
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
  }

  // Parse new external links
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

  const primaryAttachment = attachments.find((a) => a.type === "file") || attachments[0];

  const updatePayload: Record<string, any> = {};
  if (title !== undefined) updatePayload.title = title;
  if (batchName !== undefined) updatePayload.batchName = batchName;
  if (subject !== undefined) updatePayload.subject = subject;
  if (description !== undefined) updatePayload.description = description;
  if (dueDate !== undefined) updatePayload.dueDate = dueDate;
  updatePayload.attachments = attachments;
  if (primaryAttachment) {
    updatePayload.attachmentUrl = primaryAttachment.url;
    updatePayload.attachmentName = primaryAttachment.name;
    updatePayload.driveFileId = primaryAttachment.driveFileId;
  }

  const item = await homeworkService.update(req.params.id as string, updatePayload, req.user.instituteId);
  res.json(apiResponse.success(item, "Homework assignment updated successfully"));
});

export const deleteHomework = catchAsync(async (req: Request, res: Response) => {
  await homeworkService.delete(req.params.id as string, req.user.instituteId);
  res.json(apiResponse.success(null, "Homework record removed successfully"));
});
