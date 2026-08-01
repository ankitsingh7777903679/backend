"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordFeePayment = exports.getAllFees = void 0;
const fee_service_1 = require("../../services/fee/fee.service");
const catchAsync_1 = require("../../utils/catchAsync");
const apiResponse_1 = require("../../utils/apiResponse");
exports.getAllFees = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await fee_service_1.feeService.getAll(req.user.instituteId, req.query);
    res.json(apiResponse_1.apiResponse.success(result, "Fee records fetched"));
});
exports.recordFeePayment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const fee = await fee_service_1.feeService.recordPayment(req.body, req.user.instituteId, req.user.userId);
    res.status(201).json(apiResponse_1.apiResponse.success(fee, "Payment recorded and receipt generated"));
});
