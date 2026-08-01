"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI;
        if (!connStr) {
            logger_1.logger.error("MONGODB_URI is missing in environment variables.");
            process.exit(1);
        }
        await mongoose_1.default.connect(connStr);
        logger_1.logger.info("MongoDB Atlas connected successfully.");
    }
    catch (error) {
        logger_1.logger.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
