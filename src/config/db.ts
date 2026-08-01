import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { GoogleDriveToken } from "../models/googleDriveToken/googleDriveToken.model";

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      logger.error("MONGODB_URI is missing in environment variables.");
      process.exit(1);
    }
    await mongoose.connect(connStr);
    logger.info("MongoDB Atlas connected successfully.");

    // Sync indexes to drop stale legacy indexes (e.g. instituteId_1)
    try {
      await GoogleDriveToken.syncIndexes();
      logger.info("GoogleDriveToken indexes synchronized cleanly.");
    } catch (idxErr) {
      logger.warn("GoogleDriveToken index sync warning:", idxErr);
    }
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
