import { Router } from "express";
import * as teacherController from "../../controllers/teacher/teacher.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createTeacherSchema, updateTeacherSchema } from "../../validations/teacher/teacher.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), teacherController.getAllTeachers)
  .post(checkRole("owner", "admin"), validate("body", createTeacherSchema), teacherController.createTeacher);

router.route("/:id")
  .get(checkRole("owner", "admin", "teacher"), teacherController.getTeacher)
  .put(checkRole("owner", "admin"), validate("body", updateTeacherSchema), teacherController.updateTeacher)
  .delete(checkRole("owner", "admin"), teacherController.deleteTeacher);

export default router;
