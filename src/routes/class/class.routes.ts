import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  shiftStudents,
} from "../../controllers/class/class.controller";
import {
  createClassValidator,
  updateClassValidator,
  shiftStudentsValidator,
} from "../../validations/class/class.validation";

const router = Router();

// All routes require authentication
router.use(verifyToken);

router
  .route("/")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), getAllClasses)
  .post(checkRole("owner", "admin"), validate("body", createClassValidator), createClass);

router.post("/shift-students", checkRole("owner", "admin"), validate("body", shiftStudentsValidator), shiftStudents);

router
  .route("/:id")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), getClassById)
  .put(checkRole("owner", "admin"), validate("body", updateClassValidator), updateClass)
  .delete(checkRole("owner", "admin"), deleteClass);

export default router;
