import { Router } from "express";
import * as leadController from "../../controllers/lead/lead.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createLeadSchema } from "../../validations/lead/lead.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), leadController.getAllLeads)
  .post(checkRole("owner", "admin", "accountant"), validate("body", createLeadSchema), leadController.createLead);

router.put("/:id/stage", checkRole("owner", "admin", "accountant"), leadController.updateLeadStage);
router.post("/:id/convert", checkRole("owner", "admin", "accountant"), leadController.convertLeadToStudent);

export default router;
