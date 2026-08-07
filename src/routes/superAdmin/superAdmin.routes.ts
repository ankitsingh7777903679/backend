import { Router } from "express";
import * as superAdminController from "../../controllers/superAdmin/superAdmin.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";

const router = Router();

router.use(verifyToken);

router.get("/overview", checkRole("super_admin"), superAdminController.getOverview);
router.patch("/institutes/:id/status", checkRole("super_admin"), superAdminController.toggleInstituteStatus);

export default router;
