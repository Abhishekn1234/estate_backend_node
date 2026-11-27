import { Router } from "express";

import * as propertyController from "../controllers/property.controller";
import * as imageController from "../controllers/image.controller";

import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { upload } from "../middleware/upload.middleware";

import {
    createPropertySchema,
    myPropertiesQuerySchema,
    propertyIdParamSchema,
    propertyImageParamsSchema,
    propertyListSchema,
    updatePropertySchema
} from "../validators/property.validator";

const router = Router();

router.get("/", validate(propertyListSchema), propertyController.getAll);
router.get(
    "/mine",
    authenticate,
    validate(myPropertiesQuerySchema),
    propertyController.getMine
);
router.get(
    "/:id/similar",
    validate(propertyIdParamSchema),
    propertyController.similar
);

router.post(
    "/:id/images",
    authenticate,
    validate(propertyIdParamSchema),
    upload.array("images", 10),
    imageController.addImages
);

router.delete(
    "/:id/images/:imageId",
    authenticate,
    validate(propertyImageParamsSchema),
    imageController.removeImage
);

router.get("/:id", validate(propertyIdParamSchema), propertyController.getOne);

router.post(
    "/",
    authenticate,
    validate(createPropertySchema),
    propertyController.create
);

router.put(
    "/:id",
    authenticate,
    validate(propertyIdParamSchema),
    validate(updatePropertySchema),
    propertyController.update
);

router.delete(
    "/:id",
    authenticate,
    validate(propertyIdParamSchema),
    propertyController.remove
);

export default router;