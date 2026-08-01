import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth/auth.routes";
import dashboardRoutes from "./routes/dashboard/dashboard.routes";
import classRoutes from "./routes/class/class.routes";
import batchRoutes from "./routes/batch/batch.routes";
import teacherRoutes from "./routes/teacher/teacher.routes";
import studentRoutes from "./routes/student/student.routes";
import attendanceRoutes from "./routes/attendance/attendance.routes";
import feeRoutes from "./routes/fee/fee.routes";
import leadRoutes from "./routes/lead/lead.routes";
import examRoutes from "./routes/exam/exam.routes";
import examResultRoutes from "./routes/examResult/examResult.routes";
import homeworkRoutes from "./routes/homework/homework.routes";
import noticeRoutes from "./routes/notice/notice.routes";
import timetableRoutes from "./routes/timetable/timetable.routes";
import whatsappRoutes from "./routes/whatsapp/whatsapp.routes";
import reportRoutes from "./routes/report/report.routes";
import superAdminRoutes from "./routes/superAdmin/superAdmin.routes";
import settingRoutes from "./routes/setting/setting.routes";
import notificationRoutes from "./routes/notification/notification.routes";
import materialRoutes from "./routes/studyMaterial/studyMaterial.routes";
import aiQuestionRoutes from "./routes/aiQuestionGenerator/aiQuestionGenerator.routes";
import { errorHandler } from "./middleware/errorHandler.middleware";

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", process.env.ADMIN_URL || "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Coaching SaaS API Server is running clean",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/exams", examResultRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/ai", aiQuestionRoutes);

// Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;
