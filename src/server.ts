import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    logger.warn("⚠️  JWT_ACCESS_SECRET or JWT_REFRESH_SECRET missing from environment. Using default secure session keys in dev mode.");
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "tuitionpro_dev_access_secret_key_2026";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "tuitionpro_dev_refresh_secret_key_2026";
  }

  await connectDB();

  app.listen(PORT, () => {
    logger.info(`⚙️  API Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
};

startServer();
