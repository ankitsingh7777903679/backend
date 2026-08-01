"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSlot = exports.updateSlot = exports.createSlot = exports.getSlot = exports.getAllSlots = void 0;
const timetable_service_1 = require("../../services/timetable/timetable.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllSlots = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const slots = await timetable_service_1.timetableService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(slots, "Timetable slots fetched successfully"));
});
exports.getSlot = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const slot = await timetable_service_1.timetableService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(slot));
});
exports.createSlot = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const slot = await timetable_service_1.timetableService.create(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(slot, "Class slot added to timetable successfully"));
});
exports.updateSlot = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const slot = await timetable_service_1.timetableService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(slot, "Class slot updated successfully"));
});
exports.deleteSlot = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await timetable_service_1.timetableService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Class slot removed from timetable"));
});
