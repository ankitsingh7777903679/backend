"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLeadToStudent = exports.updateLeadStage = exports.createLead = exports.getAllLeads = void 0;
const lead_service_1 = require("../../services/lead/lead.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllLeads = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await lead_service_1.leadService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(result, "Leads fetched successfully"));
});
exports.createLead = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const lead = await lead_service_1.leadService.create(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(lead, "Lead inquiry created successfully"));
});
exports.updateLeadStage = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { stage } = req.body;
    const lead = await lead_service_1.leadService.updateStage(req.params.id, stage, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(lead, "Lead stage updated"));
});
exports.convertLeadToStudent = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await lead_service_1.leadService.convertLeadToStudent(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(result, "Lead successfully converted into enrolled student!"));
});
