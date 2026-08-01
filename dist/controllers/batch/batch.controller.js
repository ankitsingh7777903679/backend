"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBatch = exports.updateBatch = exports.createBatch = exports.getBatch = exports.getAllBatches = void 0;
const batch_service_1 = require("../../services/batch/batch.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllBatches = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const batches = await batch_service_1.batchService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(batches, "Batches fetched successfully"));
});
exports.getBatch = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const batch = await batch_service_1.batchService.getById(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(batch));
});
exports.createBatch = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const batch = await batch_service_1.batchService.create(req.body, req.user.instituteId);
    res.status(201).json(apiResponse_1.apiResponse.success(batch, "Batch created successfully"));
});
exports.updateBatch = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const batch = await batch_service_1.batchService.update(req.params.id, req.body, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(batch, "Batch updated successfully"));
});
exports.deleteBatch = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await batch_service_1.batchService.delete(req.params.id, req.user.instituteId);
    res.json(apiResponse_1.apiResponse.success(null, "Batch removed successfully"));
});
