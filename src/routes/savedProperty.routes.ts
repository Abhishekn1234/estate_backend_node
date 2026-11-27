import { Router } from "express";
import * as controller from "../controllers/savedProperty.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
    savedPropertyIdParamSchema,
    savedPropertyListQuerySchema
} from "../validators/property.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(savedPropertyListQuerySchema), controller.getAll);
router.get("/:propertyId", validate(savedPropertyIdParamSchema), controller.getStatus);
router.post("/:propertyId", validate(savedPropertyIdParamSchema), controller.save);
router.delete("/:propertyId", validate(savedPropertyIdParamSchema), controller.remove);

export default router;