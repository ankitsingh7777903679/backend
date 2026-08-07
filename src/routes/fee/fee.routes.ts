import { Router } from "express";
import * as feeController from "../../controllers/fee/fee.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { recordFeeSchema } from "../../validations/fee/fee.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "accountant"), feeController.getAllFees)
  .post(checkRole("owner", "admin", "accountant"), validate("body", recordFeeSchema), feeController.recordFeePayment);

router.get("/ledger/:studentId", checkRole("owner", "admin", "accountant", "parent", "student"), feeController.getStudentLedger);

export default router;
