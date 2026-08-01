import { Router } from "express";
import * as reportController from "../../controllers/report/report.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";

const router = Router();

router.use(verifyToken);

router.get("/financial", checkRole("owner", "admin", "accountant"), reportController.getFinancialSummary);
router.get("/student/:studentId/progress-report", reportController.getStudentProgressReport);

export default router;
