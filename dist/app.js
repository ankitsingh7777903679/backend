"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard/dashboard.routes"));
const class_routes_1 = __importDefault(require("./routes/class/class.routes"));
const batch_routes_1 = __importDefault(require("./routes/batch/batch.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher/teacher.routes"));
const student_routes_1 = __importDefault(require("./routes/student/student.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance/attendance.routes"));
const fee_routes_1 = __importDefault(require("./routes/fee/fee.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead/lead.routes"));
const exam_routes_1 = __importDefault(require("./routes/exam/exam.routes"));
const examResult_routes_1 = __importDefault(require("./routes/examResult/examResult.routes"));
const homework_routes_1 = __importDefault(require("./routes/homework/homework.routes"));
const notice_routes_1 = __importDefault(require("./routes/notice/notice.routes"));
const timetable_routes_1 = __importDefault(require("./routes/timetable/timetable.routes"));
const whatsapp_routes_1 = __importDefault(require("./routes/whatsapp/whatsapp.routes"));
const report_routes_1 = __importDefault(require("./routes/report/report.routes"));
const superAdmin_routes_1 = __importDefault(require("./routes/superAdmin/superAdmin.routes"));
const setting_routes_1 = __importDefault(require("./routes/setting/setting.routes"));
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const app = (0, express_1.default)();
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", process.env.ADMIN_URL || "http://localhost:3001"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check Endpoint
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Coaching SaaS API Server is running clean",
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/classes", class_routes_1.default);
app.use("/api/batches", batch_routes_1.default);
app.use("/api/teachers", teacher_routes_1.default);
app.use("/api/students", student_routes_1.default);
app.use("/api/attendance", attendance_routes_1.default);
app.use("/api/fees", fee_routes_1.default);
app.use("/api/leads", lead_routes_1.default);
app.use("/api/exams", examResult_routes_1.default);
app.use("/api/exams", exam_routes_1.default);
app.use("/api/homework", homework_routes_1.default);
app.use("/api/notices", notice_routes_1.default);
app.use("/api/timetable", timetable_routes_1.default);
app.use("/api/whatsapp", whatsapp_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/super-admin", superAdmin_routes_1.default);
app.use("/api/settings", setting_routes_1.default);
// Global Error Handler (MUST BE LAST)
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
