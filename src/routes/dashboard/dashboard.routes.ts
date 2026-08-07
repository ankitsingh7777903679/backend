import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { getDashboardStats } from "../../controllers/dashboard/dashboard.controller";

import { checkRole } from "../../middleware/rbac.middleware";

const router = Router();

router.use(verifyToken);

router.get("/stats", checkRole("owner", "admin", "teacher", "accountant"), getDashboardStats);

export default router;
