import { z } from "zod";

const propertyFields = {
    title: z.string().trim().min(5).max(150),
    description: z.string().trim().min(20).max(10000),
    price: z.coerce.number().positive().max(999999999999.99),
    city: z.string().trim().min(2).max(100),
    locality: z.string().trim().min(2).max(100),
    address: z.string().trim().max(300).optional(),
    propertyType: z.enum([
        "APARTMENT",
        "VILLA",
        "HOUSE",
        "PLOT",
        "COMMERCIAL"
    ]),
    listingType: z.enum(["SALE", "RENT"]),
    bedrooms: z.coerce.number().int().min(0).max(100),
    bathrooms: z.coerce.number().int().min(0).max(100),
    area: z.coerce.number().positive().max(10000000),
    furnishing: z.string().trim().max(50).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional()
};

export const createPropertySchema = z.object({
    body: z.object({
        ...propertyFields
    }).strict()
});

export const updatePropertySchema = z.object({
    body: z.object(propertyFields).partial().strict().refine(
        data => Object.keys(data).length > 0,
        "At least one field is required"
    )
});

export const propertyListSchema = z.object({
    query: z.object({
        city: z.string().trim().min(2).max(100).optional(),
        locality: z.string().trim().min(2).max(100).optional(),
        location: z.string().trim().min(2).max(100).optional(),
        propertyType: z.enum([
            "APARTMENT",
            "VILLA",
            "HOUSE",
            "PLOT",
            "COMMERCIAL"
        ]).optional(),
        listingType: z.enum(["SALE", "RENT"]).optional(),
        bedrooms: z.coerce.number().int().min(0).max(100).optional(),
        minPrice: z.coerce.number().finite().min(0).max(999999999999.99).optional(),
        maxPrice: z.coerce.number().finite().min(0).max(999999999999.99).optional(),
        sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional(),
        page: z.coerce.number().int().min(1).max(1000).optional(),
        cursor: z.string().min(1).max(512).optional()
    }).strict().refine(
        query => query.minPrice === undefined ||
            query.maxPrice === undefined ||
            query.minPrice <= query.maxPrice,
        { message: "minPrice must not be greater than maxPrice" }
    ).refine(
        query => !(query.cursor && query.page !== undefined),
        { message: "Use either cursor or page pagination, not both" }
    )
});

export type PropertyListQuery = z.infer<typeof propertyListSchema>["query"];

export const myPropertiesQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).max(1000).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional()
    }).strict()
});

export const propertyIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }).strict()
});

export const propertyImageParamsSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        imageId: z.string().uuid()
    }).strict()
});

export const savedPropertyIdParamSchema = z.object({
    params: z.object({
        propertyId: z.string().uuid()
    }).strict()
});

export const savedPropertyListQuerySchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(50).optional(),
        cursor: z.string().min(1).max(256).optional()
    }).strict()
});