"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHomework = exports.updateHomework = exports.createHomework = exports.getHomework = exports.getAllHomework = exports.teacherHwUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const homework_service_1 = require("../../services/homework/homework.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
const googleDrive_service_1 = require("../../services/googleDrive/googleDrive.service");
const googleDriveToken_model_1 = require("../../models/googleDriveToken/googleDriveToken.model");
const teacherHwUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, _file, cb) => cb(null, true), // Allow all file types (PDF, Word, Excel, PPT, Images, Zip, etc.)
});
exports.teacherHwUploadMiddleware = teacherHwUpload.array("files", 10);
exports.getAllHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const list = await homework_service_1.homeworkService.getAll(req.user.instituteId, req.query, req.user);
    res.json(apiResponse_1.apiResponse.success(list, "Homework records fetched successfully"));
});
exports.getHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const item = await homework_service_1.homeworkService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item));
});
exports.createHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, batchName, subject, description, dueDate, links } = req.body;
    const attachments = [];
    const files = req.files || (req.file ? [req.file] : []);
    if (files && files.length > 0) {
        const tokenDoc = await googleDriveToken_model_1.GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
        if (tokenDoc) {
            for (const file of files) {
                const driveResult = await googleDrive_service_1.googleDriveService.uploadFile(tokenDoc, file.buffer, file.originalname, file.mimetype, req.user.instituteId.toString());
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
        let parsedLinks = [];
        if (Array.isArray(links)) {
            parsedLinks = links;
        }
        else if (typeof links === "string") {
            try {
                const jsonParsed = JSON.parse(links);
                parsedLinks = Array.isArray(jsonParsed) ? jsonParsed : [links];
            }
            catch {
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
    const item = await homework_service_1.homeworkService.create({
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
    }, req.user.instituteId, req.user.userId);
    res.status(201).json(apiResponse_1.apiResponse.success(item, "Homework assignment created successfully"));
});
exports.updateHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, batchName, subject, description, dueDate, links, existingAttachments } = req.body;
    let attachments = [];
    // Parse existing attachments if passed from frontend
    if (existingAttachments) {
        try {
            attachments = typeof existingAttachments === "string" ? JSON.parse(existingAttachments) : existingAttachments;
        }
        catch {
            attachments = [];
        }
    }
    // Upload any new files to Google Drive
    const files = req.files || (req.file ? [req.file] : []);
    if (files && files.length > 0) {
        const tokenDoc = await googleDriveToken_model_1.GoogleDriveToken.findOne({ instituteId: req.user.instituteId, userType: "institute" });
        if (tokenDoc) {
            for (const file of files) {
                const driveResult = await googleDrive_service_1.googleDriveService.uploadFile(tokenDoc, file.buffer, file.originalname, file.mimetype, req.user.instituteId.toString());
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
        let parsedLinks = [];
        if (Array.isArray(links)) {
            parsedLinks = links;
        }
        else if (typeof links === "string") {
            try {
                const jsonParsed = JSON.parse(links);
                parsedLinks = Array.isArray(jsonParsed) ? jsonParsed : [links];
            }
            catch {
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
    const updatePayload = {};
    if (title !== undefined)
        updatePayload.title = title;
    if (batchName !== undefined)
        updatePayload.batchName = batchName;
    if (subject !== undefined)
        updatePayload.subject = subject;
    if (description !== undefined)
        updatePayload.description = description;
    if (dueDate !== undefined)
        updatePayload.dueDate = dueDate;
    updatePayload.attachments = attachments;
    if (primaryAttachment) {
        updatePayload.attachmentUrl = primaryAttachment.url;
        updatePayload.attachmentName = primaryAttachment.name;
        updatePayload.driveFileId = primaryAttachment.driveFileId;
    }
    const item = await homework_service_1.homeworkService.update(req.params.id, updatePayload, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(item, "Homework assignment updated successfully"));
});
exports.deleteHomework = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await homework_service_1.homeworkService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Homework record removed successfully"));
});
