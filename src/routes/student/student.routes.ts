import { Router } from "express";
import * as studentController from "../../controllers/student/student.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createStudentSchema, updateStudentSchema } from "../../validations/student/student.validation";

const router = Router();

router.use(verifyToken);

// Student self-service routes (MUST be before /:id to avoid "me" being treated as an ID)
router.get("/me", checkRole("student"), studentController.getMyProfile);
router.get("/me/exam-results", checkRole("student"), studentController.getMyExamResults);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), studentController.getAllStudents)
  .post(checkRole("owner", "admin", "teacher", "accountant"), validate("body", createStudentSchema), studentController.createStudent);

router.route("/:id")
  .get(checkRole("owner", "admin", "teacher", "accountant"), studentController.getStudent)
  .put(checkRole("owner", "admin", "teacher", "accountant"), validate("body", updateStudentSchema), studentController.updateStudent)
  .delete(checkRole("owner", "admin", "teacher"), studentController.deleteStudent);

router.get("/:id/exam-results", checkRole("owner", "admin", "teacher", "accountant"), studentController.getStudentExamResults);

export default router;

