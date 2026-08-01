import { Router } from "express";
import * as examResultController from "../../controllers/examResult/examResult.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { submitExamResultsSchema } from "../../validations/examResult/examResult.validation";

const router = Router();

router.use(verifyToken);

router.route("/:examId/results")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), examResultController.getResultsByExam)
  .post(checkRole("owner", "admin", "teacher"), validate("body", submitExamResultsSchema), examResultController.submitResults);

export default router;
