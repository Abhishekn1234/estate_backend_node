import { Request, Response } from "express";
import * as savedService from "../services/savedProperty.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";

export const save = asyncHandler(async (req: Request, res: Response) => {
    const result = await savedService.saveProperty(
        req.user!.userId,
        req.params.propertyId
    );

    return successResponse(
        res,
        "Property saved successfully",
        result,
        201
    );
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await savedService.getSavedProperties(
        req.user!.userId,
        Number(req.query.limit) || 10,
        typeof req.query.cursor === "string" ? req.query.cursor : undefined
    );

    return successResponse(
        res,
        "Saved properties fetched",
        result
    );
});

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
    const saved = await savedService.isPropertySaved(
        req.user!.userId,
        req.params.propertyId
    );

    return successResponse(res, "Saved property status fetched", { saved });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    await savedService.removeSavedProperty(
        req.user!.userId,
        req.params.propertyId
    );

    return successResponse(
        res,
        "Property removed from saved list",
        null
    );
});