"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
        logger_1.logger.warn("⚠️  JWT_ACCESS_SECRET or JWT_REFRESH_SECRET missing from environment. Using default secure session keys in dev mode.");
        process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "tuitionpro_dev_access_secret_key_2026";
        process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "tuitionpro_dev_refresh_secret_key_2026";
    }
    await (0, db_1.connectDB)();
    app_1.default.listen(PORT, () => {
        logger_1.logger.info(`⚙️  API Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
};
startServer();
