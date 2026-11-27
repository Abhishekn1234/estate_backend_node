import { z } from "zod";

export const inquirySchema = z.object({
    body: z.object({
        propertyId: z.string().uuid(),
        message: z.string().trim().min(10).max(1000)
    }).strict()
});

export const inquiryListQuerySchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(50).optional(),
        cursor: z.string().min(1).max(256).optional()
    }).strict()
});

export const inquiryStatusSchema = z.object({
    params: z.object({
        inquiryId: z.string().uuid()
    }).strict(),
    body: z.object({
        status: z.enum(["CONTACTED", "CLOSED"])
    }).strict()
});