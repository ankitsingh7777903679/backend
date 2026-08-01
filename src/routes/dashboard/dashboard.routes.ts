import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { getDashboardStats } from "../../controllers/dashboard/dashboard.controller";

const router = Router();

router.use(verifyToken);

router.get("/stats", getDashboardStats);

export default router;
