import { Router } from "express";
import * as feeController from "../../controllers/fee/fee.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { recordFeeSchema, setupInstallmentPlanSchema } from "../../validations/fee/fee.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), feeController.getAllFees)
  .post(checkRole("owner", "admin", "teacher", "accountant"), validate("body", recordFeeSchema), feeController.recordFeePayment);

router.get("/ledger/:studentId", checkRole("owner", "admin", "teacher", "accountant", "parent", "student"), feeController.getStudentLedger);

router.post("/submit-proof", checkRole("owner", "admin", "teacher", "student", "parent"), feeController.submitPaymentProof);
router.get("/pending-proofs", checkRole("owner", "admin", "teacher", "accountant"), feeController.getPendingProofs);
router.post("/approve-proof/:feeId", checkRole("owner", "admin", "teacher", "accountant"), feeController.approvePaymentProof);
router.post("/reject-proof/:feeId", checkRole("owner", "admin", "teacher", "accountant"), feeController.rejectPaymentProof);

router.post("/installment-plan/:studentId", checkRole("owner", "admin", "teacher", "accountant"), validate("body", setupInstallmentPlanSchema), feeController.setupInstallmentPlan);
router.get("/installment-plan/:studentId", checkRole("owner", "admin", "teacher", "accountant", "parent", "student"), feeController.getInstallmentPlan);

export default router;
