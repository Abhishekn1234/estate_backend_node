import { Request, Response } from "express";
import * as propertyService from "../services/property.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import { propertyListSchema } from "../validators/property.validator";

export const create = asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.createProperty(
        req.user!.userId,
        req.body
    );

    return successResponse(
        res,
        "Property created successfully",
        property,
        201
    );
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const query = propertyListSchema.shape.query.parse(req.query);
    const properties = await propertyService.getProperties(query);

    return successResponse(
        res,
        "Properties fetched successfully",
        properties
    );
});

export const getMine = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const properties = await propertyService.getMyProperties(
        req.user!.userId,
        page,
        limit
    );

    return successResponse(res, "Your properties fetched successfully", properties);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.getPropertyById(req.params.id);

    return successResponse(res, "Property details fetched", property);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.updateProperty(
        req.params.id,
        req.user!.userId,
        req.body,
        req.user!.role === "ADMIN"
    );

    return successResponse(res, "Property updated successfully", property);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await propertyService.deleteProperty(
        req.params.id,
        req.user!.userId,
        req.user!.role === "ADMIN"
    );

    return successResponse(res, "Property deleted successfully", null);
});

export const similar = asyncHandler(async (req: Request, res: Response) => {
    const properties = await propertyService.getSimilarProperties(
        req.params.id
    );

    return successResponse(
        res,
        "Similar properties fetched",
        properties
    );
});