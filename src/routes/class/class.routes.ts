import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
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
  .get(getAllClasses)
  .post(validate("body", createClassValidator), createClass);

router.post("/shift-students", validate("body", shiftStudentsValidator), shiftStudents);

router
  .route("/:id")
  .get(getClassById)
  .put(validate("body", updateClassValidator), updateClass)
  .delete(deleteClass);

export default router;
