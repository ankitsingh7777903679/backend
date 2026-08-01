import { Router } from "express";
import * as homeworkController from "../../controllers/homework/homework.controller";
import * as submissionCtrl from "../../controllers/homeworkSubmission/homeworkSubmission.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createHomeworkSchema, updateHomeworkSchema } from "../../validations/homework/homework.validation";

const router = Router();

// ⚠️ Student Google Drive callback — NO auth middleware
router.get("/student/drive-callback", submissionCtrl.handleStudentDriveCallback);

router.use(verifyToken);

// Homework CRUD
router.route("/")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), homeworkController.getAllHomework)
  .post(
    checkRole("owner", "admin", "teacher"),
    homeworkController.teacherHwUploadMiddleware,
    homeworkController.createHomework
  );

// Student Drive OAuth
router.get("/student/drive-status", checkRole("student"), submissionCtrl.getStudentDriveStatus);
router.get("/student/drive-auth", checkRole("student"), submissionCtrl.getStudentDriveAuthUrl);

// Student submission routes
router.get("/my-submissions", checkRole("student"), submissionCtrl.getMySubmissions);

// Teacher review routes (BEFORE /:id to avoid conflict)
router.put("/submissions/:subId/review", checkRole("owner", "admin", "teacher"), submissionCtrl.reviewSubmission);
router.delete("/submissions/:subId", checkRole("owner", "admin", "teacher"), submissionCtrl.deleteSubmission);

// Per-homework
router.route("/:id")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), homeworkController.getHomework)
  .put(
    checkRole("owner", "admin", "teacher"),
    homeworkController.teacherHwUploadMiddleware,
    homeworkController.updateHomework
  )
  .delete(checkRole("owner", "admin"), homeworkController.deleteHomework);

// Submissions for a specific homework
router.get("/:id/submissions", checkRole("owner", "admin", "teacher"), submissionCtrl.getHomeworkSubmissions);
router.post(
  "/:id/submit",
  checkRole("student"),
  submissionCtrl.submissionUploadMiddleware,
  submissionCtrl.submitHomework
);

export default router;

