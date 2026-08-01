"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const class_controller_1 = require("../../controllers/class/class.controller");
const class_validation_1 = require("../../validations/class/class.validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
router
    .route("/")
    .get(class_controller_1.getAllClasses)
    .post((0, validate_middleware_1.validate)("body", class_validation_1.createClassValidator), class_controller_1.createClass);
router.post("/shift-students", (0, validate_middleware_1.validate)("body", class_validation_1.shiftStudentsValidator), class_controller_1.shiftStudents);
router
    .route("/:id")
    .get(class_controller_1.getClassById)
    .put((0, validate_middleware_1.validate)("body", class_validation_1.updateClassValidator), class_controller_1.updateClass)
    .delete(class_controller_1.deleteClass);
exports.default = router;
