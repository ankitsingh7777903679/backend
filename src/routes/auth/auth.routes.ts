import { Router } from "express";
import * as authController from "../../controllers/auth/auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { verifyToken } from "../../middleware/auth.middleware";
import {
  registerInstituteSchema,
  loginSchema,
  refreshTokenSchema,
} from "../../validations/auth/auth.validation";

const router = Router();

router.post("/register", validate("body", registerInstituteSchema), authController.registerInstitute);
router.post("/login",    validate("body", loginSchema),            authController.login);
router.post("/refresh",  validate("body", refreshTokenSchema),     authController.refreshToken);
router.post("/logout",   verifyToken,                              authController.logout);

export default router;
