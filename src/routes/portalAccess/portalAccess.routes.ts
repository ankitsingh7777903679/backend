import { Router } from "express";
import * as controller from "../../controllers/portalAccess/portalAccess.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { z } from "zod";

const router = Router();
const profileParams = z.object({ profileType: z.enum(["teacher", "student"]), profileId: z.string().min(1) });
const accessBody = z.object({ enabled: z.boolean() });
const activateBody = z.object({ password: z.string().min(8) });

router.post("/activate/:token", validate("body", activateBody), controller.acceptInvitation);
router.use(verifyToken);
router.get("/", checkRole("owner", "admin"), controller.listPending);
router.get("/migration-report", checkRole("owner", "admin"), controller.getMigrationReport);
router.post("/:profileType/:profileId", checkRole("owner", "admin"), validate("params", profileParams), controller.createInvitation);
router.patch("/:profileType/:profileId/access", checkRole("owner", "admin"), validate("params", profileParams), validate("body", accessBody), controller.setPortalAccess);
router.post("/:id/revoke", checkRole("owner", "admin"), controller.revokeInvitation);

export default router;
