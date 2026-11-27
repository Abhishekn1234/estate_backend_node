import { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { successResponse } from "../utils/response";
import { deleteImage, uploadImage } from "../services/image.service";
import { validateImageSignature } from "../utils/imageValidation";

export const addImages = asyncHandler(async (req: Request, res: Response) => {
    const property = await prisma.property.findUnique({
        where: { id: req.params.id }
    });

    if (!property || !property.isActive) {
        throw new ApiError(404, "Property not found");
    }

    if (
        property.ownerId !== req.user!.userId &&
        req.user!.role !== "ADMIN"
    ) {
        throw new ApiError(403, "You cannot upload images for this property");
    }

    const files: Express.Multer.File[] = Array.isArray(req.files) ? req.files : [];

    if (!files || files.length === 0) {
        throw new ApiError(400, "Please select at least one image");
    }

    for (const file of files) {
        validateImageSignature(file.mimetype, file.buffer);
    }

    const existingCount = await prisma.propertyImage.count({
        where: { propertyId: property.id }
    });

    if (existingCount + files.length > 10) {
        throw new ApiError(400, "A property can have at most 10 images");
    }

    const uploaded: { imageUrl: string; publicId: string }[] = [];

    try {
        const results = await Promise.allSettled(
            files.map(file => uploadImage(file.buffer))
        );
        const failedResult = results.find(
            (result): result is PromiseRejectedResult => result.status === "rejected"
        );

        for (const result of results) {
            if (result.status === "fulfilled") {
                uploaded.push(result.value);
            }
        }

        if (failedResult) {
            throw failedResult.reason;
        }
    } catch (error) {
        await Promise.allSettled(
            uploaded.map(image => deleteImage(image.publicId))
        );

        throw error;
    }

    try {
        const images = await prisma.$transaction(async tx => {
            const lockedProperty = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT id
                FROM "Property"
                WHERE id = ${property.id} AND "isActive" = true
                FOR UPDATE
            `;

            if (lockedProperty.length === 0) {
                throw new ApiError(404, "Property not found");
            }

            const currentCount = await tx.propertyImage.count({
                where: { propertyId: property.id }
            });

            if (currentCount + uploaded.length > 10) {
                throw new ApiError(400, "A property can have at most 10 images");
            }

            return tx.propertyImage.createManyAndReturn({
                data: uploaded.map(image => ({
                    imageUrl: image.imageUrl,
                    publicId: image.publicId,
                    propertyId: property.id
                }))
            });
        });

        return successResponse(
            res,
            "Images uploaded successfully",
            images,
            201
        );
    } catch (error) {
        await Promise.allSettled(
            uploaded.map(image => deleteImage(image.publicId))
        );

        throw error;
    }
});

export const removeImage = asyncHandler(async (req: Request, res: Response) => {
    const image = await prisma.propertyImage.findUnique({
        where: { id: req.params.imageId },
        include: { property: true }
    });

    if (!image) {
        throw new ApiError(404, "Image not found");
    }

    if (image.propertyId !== req.params.id) {
        throw new ApiError(404, "Image not found");
    }

    if (
        image.property.ownerId !== req.user!.userId &&
        req.user!.role !== "ADMIN"
    ) {
        throw new ApiError(403, "You cannot delete this image");
    }

    if (image.publicId) {
        await deleteImage(image.publicId);
    }

    await prisma.propertyImage.delete({
        where: { id: image.id }
    });

    return successResponse(res, "Image deleted successfully", null);
});