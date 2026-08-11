import { Router } from "express";
import * as feeController from "../../controllers/fee/fee.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { approvePaymentProofSchema, recordFeeSchema, rejectPaymentProofSchema, setupInstallmentPlanSchema, submitPaymentProofSchema } from "../../validations/fee/fee.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), feeController.getAllFees)
  .post(checkRole("owner", "admin", "teacher", "accountant"), validate("body", recordFeeSchema), feeController.recordFeePayment);

router.get("/ledger/:studentId", checkRole("owner", "admin", "teacher", "accountant", "student", "parent"), feeController.getStudentLedger);

router.post("/submit-proof", checkRole("owner", "admin", "teacher", "student"), validate("body", submitPaymentProofSchema), feeController.submitPaymentProof);
router.get("/pending-proofs", checkRole("owner", "admin", "teacher", "accountant"), feeController.getPendingProofs);
router.post("/approve-proof/:feeId", checkRole("owner", "admin", "teacher", "accountant"), validate("body", approvePaymentProofSchema), feeController.approvePaymentProof);
router.post("/reject-proof/:feeId", checkRole("owner", "admin", "teacher", "accountant"), validate("body", rejectPaymentProofSchema), feeController.rejectPaymentProof);

router.post("/installment-plan/:studentId", checkRole("owner", "admin", "teacher", "accountant"), validate("body", setupInstallmentPlanSchema), feeController.setupInstallmentPlan);
router.get("/installment-plan/:studentId", checkRole("owner", "admin", "teacher", "accountant", "student", "parent"), feeController.getInstallmentPlan);

export default router;
