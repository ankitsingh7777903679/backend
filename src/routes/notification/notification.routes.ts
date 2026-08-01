import { Router } from "express";
import * as notificationController from "../../controllers/notification/notification.controller";
import { verifyToken } from "../../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);

router.get("/", notificationController.getMyNotifications);
router.patch("/mark-read", notificationController.markRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;
