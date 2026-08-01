import { Router } from "express";
import multer from "multer";
import { generateAiQuestions } from "../../controllers/aiQuestionGenerator/aiQuestionGenerator.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

router.use(verifyToken);
router.post(
  "/generate-questions",
  checkRole("owner", "admin", "teacher"),
  upload.single("file"),
  generateAiQuestions
);

export default router;
