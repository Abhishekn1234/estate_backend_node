import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as inquiryController from "../controllers/inquiry.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
    inquiryListQuerySchema,
    inquirySchema,
    inquiryStatusSchema
} from "../validators/inquiry.validator";

const router = Router();

const inquiryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many inquiries. Try again later."
    }
});

router.post(
    "/",
    authenticate,
    inquiryLimiter,
    validate(inquirySchema),
    inquiryController.create
);

router.get(
    "/mine",
    authenticate,
    validate(inquiryListQuerySchema),
    inquiryController.getMine
);

router.get(
    "/received",
    authenticate,
    validate(inquiryListQuerySchema),
    inquiryController.getReceived
);

router.patch(
    "/:inquiryId/status",
    authenticate,
    validate(inquiryStatusSchema),
    inquiryController.updateReceivedStatus
);

export default router;