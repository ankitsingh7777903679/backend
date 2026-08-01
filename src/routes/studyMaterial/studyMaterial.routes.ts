import { Router } from "express";
import * as materialCtrl from "../../controllers/studyMaterial/studyMaterial.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";

const router = Router();

// ⚠️  Google redirects here AFTER teacher grants permission — no auth middleware here!
router.get("/google/callback", materialCtrl.handleGoogleCallback);

// All other routes require auth
router.use(verifyToken);

// Google Drive OAuth status & initiation
router.get("/google/status", checkRole("owner", "admin", "teacher"), materialCtrl.getDriveStatus);
router.get("/google/auth", checkRole("owner", "admin", "teacher"), materialCtrl.getGoogleAuthUrl);

// Study Materials CRUD
router.get("/", checkRole("owner", "admin", "teacher", "student"), materialCtrl.getAllMaterials);

router.post(
  "/upload",
  checkRole("owner", "admin", "teacher"),
  materialCtrl.uploadMiddleware,
  materialCtrl.uploadMaterial
);

router.put("/:id", checkRole("owner", "admin", "teacher"), materialCtrl.uploadMiddleware, materialCtrl.updateMaterial);
router.delete("/:id", checkRole("owner", "admin", "teacher"), materialCtrl.deleteMaterial);

router.post("/:id/download", checkRole("owner", "admin", "teacher", "student"), materialCtrl.incrementDownload);

export default router;
