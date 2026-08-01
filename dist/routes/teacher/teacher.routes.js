"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherController = __importStar(require("../../controllers/teacher/teacher.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const teacher_validation_1 = require("../../validations/teacher/teacher.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
router.route("/")
    .get((0, rbac_middleware_1.checkRole)("owner", "admin", "teacher", "accountant"), teacherController.getAllTeachers)
    .post((0, rbac_middleware_1.checkRole)("owner", "admin"), (0, validate_middleware_1.validate)("body", teacher_validation_1.createTeacherSchema), teacherController.createTeacher);
router.route("/:id")
    .get((0, rbac_middleware_1.checkRole)("owner", "admin", "teacher"), teacherController.getTeacher)
    .put((0, rbac_middleware_1.checkRole)("owner", "admin"), (0, validate_middleware_1.validate)("body", teacher_validation_1.updateTeacherSchema), teacherController.updateTeacher)
    .delete((0, rbac_middleware_1.checkRole)("owner", "admin"), teacherController.deleteTeacher);
exports.default = router;
