import { Router } from "express";
import * as examController from "../../controllers/exam/exam.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createExamSchema, updateExamSchema } from "../../validations/exam/exam.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), examController.getAllExams)
  .post(checkRole("owner", "admin", "teacher"), validate("body", createExamSchema), examController.createExam);

router.post("/:id/submit", checkRole("student"), examController.submitLiveExam);
router.get("/:id/leaderboard", checkRole("owner", "admin", "teacher", "student", "parent"), examController.getExamLeaderboard);

router.route("/:id")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), examController.getExam)
  .put(checkRole("owner", "admin", "teacher"), validate("body", updateExamSchema), examController.updateExam)
  .delete(checkRole("owner", "admin"), examController.deleteExam);

export default router;
