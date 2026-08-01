"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.sendBroadcast = exports.createTemplate = exports.getAllTemplates = void 0;
const whatsapp_service_1 = require("../../services/whatsapp/whatsapp.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllTemplates = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const templates = await whatsapp_service_1.whatsappService.getAllTemplates(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(templates, "WhatsApp templates fetched successfully"));
});
exports.createTemplate = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const template = await whatsapp_service_1.whatsappService.createTemplate(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(template, "WhatsApp template created & approved by Meta"));
});
exports.sendBroadcast = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await whatsapp_service_1.whatsappService.sendBroadcast(req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(result, "WhatsApp broadcast dispatched successfully"));
});
exports.deleteTemplate = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await whatsapp_service_1.whatsappService.deleteTemplate(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "WhatsApp template removed"));
});
