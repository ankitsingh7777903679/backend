import { Router } from "express";
import * as timetableController from "../../controllers/timetable/timetable.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createTimetableSlotSchema, updateTimetableSlotSchema } from "../../validations/timetable/timetable.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), timetableController.getAllSlots)
  .post(checkRole("owner", "admin", "teacher"), validate("body", createTimetableSlotSchema), timetableController.createSlot);

router.route("/:id")
  .get(checkRole("owner", "admin", "teacher", "student", "parent"), timetableController.getSlot)
  .put(checkRole("owner", "admin", "teacher"), validate("body", updateTimetableSlotSchema), timetableController.updateSlot)
  .delete(checkRole("owner", "admin"), timetableController.deleteSlot);

export default router;
