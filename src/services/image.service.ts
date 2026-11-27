import { Readable } from "stream";
import cloudinary from "../config/cloudinary";
import { ApiError } from "../utils/ApiError";
import type { UploadApiErrorResponse } from "cloudinary";

const cloudinarySettings = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
] as const;

const getMissingCloudinarySettings = (): string[] =>
    cloudinarySettings.filter(key => !process.env[key]?.trim());

const assertCloudinaryConfigured = (): void => {
    const missingSettings = getMissingCloudinarySettings();
    if (missingSettings.length > 0) {
        throw new ApiError(
            503,
            `Image storage is not configured. Set ${missingSettings.join(", ")} in the backend .env file and restart the server.`
        );
    }
};

const getProviderError = (error: UploadApiErrorResponse | Error): ApiError => {
    const statusCode = "http_code" in error ? error.http_code : undefined;

    if (statusCode === 401 || statusCode === 403) {
        return new ApiError(
            502,
            "Cloudinary rejected the upload. Verify that CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET belong to the same active account and that image uploads are enabled."
        );
    }

    return new ApiError(
        502,
        statusCode
            ? `The image provider could not complete the upload (HTTP ${statusCode}). Please try again later.`
            : "The image provider could not complete the upload. Please try again later."
    );
};

export const uploadImage = async (
    buffer: Buffer
): Promise<{ imageUrl: string; publicId: string }> => {
    assertCloudinaryConfigured();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "real-estate/properties",
                resource_type: "image",
                allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"]
            },
            (error, result) => {
                if (error || !result) {
                    return reject(getProviderError(error ?? new Error("Upload failed")));
                }

                resolve({
                    imageUrl: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        Readable.from(buffer).pipe(stream);
    });
};

export const deleteImage = async (publicId: string) => {
    assertCloudinaryConfigured();

    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        const providerError = error as UploadApiErrorResponse | Error;
        throw getProviderError(providerError);
    }
};
