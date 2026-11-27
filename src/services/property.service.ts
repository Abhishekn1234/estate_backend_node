import {
    Prisma,
    PropertyType,
    ListingType
} from "@prisma/client";

import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { PropertyListQuery } from "../validators/property.validator";

interface PropertyInput {
    title: string;
    description: string;
    price: number;
    city: string;
    locality: string;
    address?: string;
    propertyType: PropertyType;
    listingType: ListingType;
    bedrooms: number;
    bathrooms: number;
    area: number;
    furnishing?: string;
    latitude?: number;
    longitude?: number;
}

const propertyCardSelect = {
    id: true,
    title: true,
    price: true,
    city: true,
    locality: true,
    propertyType: true,
    listingType: true,
    bedrooms: true,
    bathrooms: true,
    area: true,
    isActive: true,
    ownerId: true,
    createdAt: true,
    updatedAt: true,
    images: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { id: true, imageUrl: true }
    }
} satisfies Prisma.PropertySelect;

export const createProperty = async (
    userId: string,
    data: PropertyInput
) => {
    return prisma.property.create({
        data: {
            ...data,
            ownerId: userId
        },
        include: {
            images: true
        }
    });
};

type PropertySort = "newest" | "price_asc" | "price_desc";

interface PropertyCursor {
    sort: PropertySort;
    id: string;
    createdAt?: string;
    price?: string;
}

const invalidCursor = (): never => {
    throw new ApiError(400, "Invalid pagination cursor");
};

const decodeCursor = (cursor: string, sort: PropertySort): PropertyCursor => {
    try {
        const decoded: unknown = JSON.parse(
            Buffer.from(cursor, "base64url").toString("utf8")
        );

        if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
            return invalidCursor();
        }

        const value = decoded as Record<string, unknown>;
        if (
            value.sort !== sort ||
            typeof value.id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)
        ) {
            return invalidCursor();
        }

        if (sort === "newest") {
            if (
                typeof value.createdAt !== "string" ||
                Number.isNaN(Date.parse(value.createdAt))
            ) {
                return invalidCursor();
            }

            return {
                sort,
                id: value.id,
                createdAt: new Date(value.createdAt).toISOString()
            };
        }

        if (
            typeof value.price !== "string" ||
            !/^\d+(\.\d{1,2})?$/.test(value.price) ||
            !Number.isFinite(Number(value.price))
        ) {
            return invalidCursor();
        }

        return { sort, id: value.id, price: value.price };
    } catch {
        return invalidCursor();
    }
};

const encodeCursor = (
    property: { id: string; createdAt: Date; price: Prisma.Decimal },
    sort: PropertySort
): string => {
    const cursor: PropertyCursor = sort === "newest"
        ? { sort, id: property.id, createdAt: property.createdAt.toISOString() }
        : { sort, id: property.id, price: property.price.toString() };

    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
};

export const getProperties = async (query: PropertyListQuery) => {
    const limit = query.limit ?? 10;
    const page = query.page ?? 1;
    const sort: PropertySort = query.sort ?? "newest";

    const where: Prisma.PropertyWhereInput = {
        isActive: true
    };

    if (query.city) {
        where.city = {
            contains: query.city,
            mode: "insensitive"
        };
    }

    if (query.locality) {
        where.locality = {
            contains: query.locality,
            mode: "insensitive"
        };
    }

    const andConditions: Prisma.PropertyWhereInput[] = [];

    if (query.location) {
        andConditions.push({
            OR: [
                { city: { contains: query.location, mode: "insensitive" } },
                { locality: { contains: query.location, mode: "insensitive" } }
            ]
        });
    }

    if (query.propertyType) {
        where.propertyType = query.propertyType;
    }

    if (query.listingType) {
        where.listingType = query.listingType;
    }

    if (query.bedrooms !== undefined) {
        where.bedrooms = query.bedrooms;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {
            ...(query.minPrice !== undefined && { gte: query.minPrice }),
            ...(query.maxPrice !== undefined && { lte: query.maxPrice })
        };
    }

    if (query.cursor) {
        const cursor = decodeCursor(query.cursor, sort);
        if (sort === "newest" && cursor.createdAt) {
            andConditions.push({
                OR: [
                    { createdAt: { lt: new Date(cursor.createdAt) } },
                    {
                        createdAt: new Date(cursor.createdAt),
                        id: { gt: cursor.id }
                    }
                ]
            });
        } else if (cursor.price !== undefined) {
            const priceCondition = sort === "price_asc"
                ? { gt: cursor.price }
                : { lt: cursor.price };

            andConditions.push({
                OR: [
                    { price: priceCondition },
                    { price: cursor.price, id: { gt: cursor.id } }
                ]
            });
        } else {
            return invalidCursor();
        }
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput[] = sort === "newest"
        ? [{ createdAt: "desc" }, { id: "asc" }]
        : [
            { price: sort === "price_asc" ? "asc" : "desc" },
            { id: "asc" }
        ];

    if (query.cursor) {

        const properties = await prisma.property.findMany({
            where,
            take: limit + 1,
            orderBy,
            select: propertyCardSelect
        });

        const hasMore = properties.length > limit;
        const items = properties.slice(0, limit);

        return {
            items,
            pagination: {
                limit,
                hasMore,
                nextCursor: hasMore
                    ? encodeCursor(items[items.length - 1], sort)
                    : null
            }
        };
    }

    const [items, total] = await prisma.$transaction([
        prisma.property.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            select: propertyCardSelect
        }),
        prisma.property.count({ where })
    ]);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
            nextCursor: items.length > 0 && page * limit < total
                ? encodeCursor(items[items.length - 1], sort)
                : null
        }
    };
};

export const getMyProperties = async (
    ownerId: string,
    page = 1,
    limit = 10
) => {
    const where: Prisma.PropertyWhereInput = { ownerId };
    const [items, total] = await prisma.$transaction([
        prisma.property.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            select: propertyCardSelect
        }),
        prisma.property.count({ where })
    ]);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        }
    };
};

export const getPropertyById = async (id: string) => {
    const property = await prisma.property.findFirst({
        where: {
            id,
            isActive: true
        },
        include: {
            images: true,
            owner: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    return property;
};

export const updateProperty = async (
    id: string,
    userId: string,
    data: Partial<PropertyInput>,
    isAdmin = false
) => {
    const property = await prisma.property.findFirst({
        where: {
            id,
            isActive: true
        }
    });

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.ownerId !== userId && !isAdmin) {
        throw new ApiError(403, "You cannot update this property");
    }

    return prisma.property.update({
        where: { id },
        data,
        include: {
            images: true
        }
    });
};

export const deleteProperty = async (
    id: string,
    userId: string,
    isAdmin = false
) => {
    const property = await prisma.property.findUnique({
        where: { id }
    });

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.ownerId !== userId && !isAdmin) {
        throw new ApiError(403, "You cannot delete this property");
    }

    await prisma.property.update({
        where: { id },
        data: { isActive: false }
    });

    return true;
};

export const getSimilarProperties = async (id: string) => {
    const property = await getPropertyById(id);

    const price = Number(property.price);
    const minPrice = price * 0.8;
    const maxPrice = price * 1.2;

    return prisma.property.findMany({
        where: {
            id: { not: id },
            isActive: true,
            city: property.city,
            propertyType: property.propertyType,
            bedrooms: property.bedrooms,
            price: {
                gte: minPrice,
                lte: maxPrice
            }
        },
        take: 6,
        orderBy: {
            createdAt: "desc"
        },
        select: propertyCardSelect
    });
};