import { Router } from "express";
import * as whatsappController from "../../controllers/whatsapp/whatsapp.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createTemplateSchema, sendBroadcastSchema } from "../../validations/whatsapp/whatsapp.validation";

const router = Router();

router.use(verifyToken);

router.route("/templates")
  .get(checkRole("owner", "admin", "teacher", "accountant"), whatsappController.getAllTemplates)
  .post(checkRole("owner", "admin"), validate("body", createTemplateSchema), whatsappController.createTemplate);

router.post("/broadcast", checkRole("owner", "admin", "teacher"), validate("body", sendBroadcastSchema), whatsappController.sendBroadcast);
router.delete("/templates/:id", checkRole("owner", "admin"), whatsappController.deleteTemplate);

export default router;
