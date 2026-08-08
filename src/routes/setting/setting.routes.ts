import { Router } from "express";
import * as settingController from "../../controllers/setting/setting.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "student", "parent", "accountant"), settingController.getSetting)
  .put(checkRole("owner", "admin"), settingController.updateSetting);

export default router;
