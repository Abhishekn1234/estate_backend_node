import { Request, Response } from "express";
import * as inquiryService from "../services/inquiry.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";

export const create = asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await inquiryService.createInquiry(
        req.user!.userId,
        req.body.propertyId,
        req.body.message
    );

    return successResponse(
        res,
        "Inquiry submitted successfully",
        inquiry,
        201
    );
});

export const getMine = asyncHandler(async (req: Request, res: Response) => {
    const inquiries = await inquiryService.getMyInquiries(
        req.user!.userId,
        Number(req.query.limit) || 10,
        typeof req.query.cursor === "string" ? req.query.cursor : undefined
    );

    return successResponse(
        res,
        "Your inquiries fetched successfully",
        inquiries
    );
});

export const getReceived = asyncHandler(async (req: Request, res: Response) => {
    const inquiries = await inquiryService.getReceivedInquiries(
        req.user!.userId,
        Number(req.query.limit) || 10,
        typeof req.query.cursor === "string" ? req.query.cursor : undefined
    );

    return successResponse(
        res,
        "Received inquiries fetched successfully",
        inquiries
    );
});

export const updateReceivedStatus = asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await inquiryService.updateReceivedInquiryStatus(
        req.user!.userId,
        req.params.inquiryId,
        req.body.status
    );

    return successResponse(res, "Inquiry status updated", inquiry);
});