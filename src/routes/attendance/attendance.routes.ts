import { Router } from "express";
import * as attendanceController from "../../controllers/attendance/attendance.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { markAttendanceSchema } from "../../validations/attendance/attendance.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), attendanceController.getAllAttendance)
  .post(checkRole("owner", "admin", "teacher"), validate("body", markAttendanceSchema), attendanceController.markAttendance);

router.get("/batch", checkRole("owner", "admin", "teacher"), attendanceController.getBatchAttendance);
router.get("/my-history", checkRole("student"), attendanceController.getMyAttendanceHistory);

export default router;
