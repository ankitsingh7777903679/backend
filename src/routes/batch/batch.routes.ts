import { Router } from "express";
import * as batchController from "../../controllers/batch/batch.controller";
import { verifyToken } from "../../middleware/auth.middleware";
import { checkRole } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createBatchSchema, updateBatchSchema } from "../../validations/batch/batch.validation";

const router = Router();

router.use(verifyToken);

router.route("/")
  .get(checkRole("owner", "admin", "teacher", "accountant"), batchController.getAllBatches)
  .post(checkRole("owner", "admin"), validate("body", createBatchSchema), batchController.createBatch);

router.route("/:id")
  .get(checkRole("owner", "admin", "teacher"), batchController.getBatch)
  .put(checkRole("owner", "admin"), validate("body", updateBatchSchema), batchController.updateBatch)
  .delete(checkRole("owner", "admin"), batchController.deleteBatch);

export default router;
