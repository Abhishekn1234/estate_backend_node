import multer from "multer";
import { Request } from "express";
import { ApiError } from "../utils/ApiError";

export const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },

    fileFilter: (req: Request, file, callback) => {
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.mimetype)) {
            return callback(new ApiError(400, "Only JPEG, PNG, WebP, or AVIF images are allowed"));
        }

        callback(null, true);
    }
});