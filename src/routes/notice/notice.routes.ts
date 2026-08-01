import { Router } from "express";
import * as noticeController from "../../controllers/notice/notice.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createNoticeSchema, updateNoticeSchema } from "../../validations/notice/notice.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "student", "parent", "accountant"), noticeController.getAllNotices)
  .post(checkRole("owner", "admin", "teacher"), validate("body", createNoticeSchema), noticeController.createNotice);

router.post("/:id/resend-whatsapp", checkRole("owner", "admin", "teacher"), noticeController.resendWhatsAppBroadcast);

router.route("/:id")
  .get(checkRole("owner", "admin", "teacher", "student", "parent", "accountant"), noticeController.getNotice)
  .put(checkRole("owner", "admin", "teacher"), validate("body", updateNoticeSchema), noticeController.updateNotice)
  .delete(checkRole("owner", "admin"), noticeController.deleteNotice);

export default router;
