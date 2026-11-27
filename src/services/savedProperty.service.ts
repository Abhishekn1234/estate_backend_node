import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { decodeTimestampCursor, encodeTimestampCursor } from "../utils/pagination";

export const saveProperty = async (
    userId: string,
    propertyId: string
) => {
    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            isActive: true
        }
    });

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.ownerId === userId) {
        throw new ApiError(400, "You cannot save your own property");
    }

    return prisma.savedProperty.create({
        data: {
            userId,
            propertyId
        },
        include: {
            property: {
                include: {
                    images: true
                }
            }
        }
    });
};

export const isPropertySaved = async (
    userId: string,
    propertyId: string
): Promise<boolean> => {
    const savedProperty = await prisma.savedProperty.findUnique({
        where: {
            userId_propertyId: {
                userId,
                propertyId
            }
        },
        select: { id: true }
    });

    return Boolean(savedProperty);
};

export const getSavedProperties = async (userId: string, limit = 10, cursor?: string) => {
    const cursorValue = cursor ? decodeTimestampCursor(cursor) : undefined;
    const entries = await prisma.savedProperty.findMany({
        where: {
            userId,
            property: {
                isActive: true
            },
            ...(cursorValue && {
                OR: [
                    { createdAt: { lt: cursorValue.createdAt } },
                    { createdAt: cursorValue.createdAt, id: { lt: cursorValue.id } }
                ]
            })
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        include: {
            property: {
                select: {
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
                }
            }
        }
    });
    const hasMore = entries.length > limit;
    const items = entries.slice(0, limit);

    return {
        items,
        pagination: {
            limit,
            hasMore,
            nextCursor: hasMore
                ? encodeTimestampCursor(items[items.length - 1])
                : null
        }
    };
};

export const removeSavedProperty = async (
    userId: string,
    propertyId: string
) => {
    const saved = await prisma.savedProperty.findUnique({
        where: {
            userId_propertyId: {
                userId,
                propertyId
            }
        }
    });

    if (!saved) {
        throw new ApiError(404, "Saved property not found");
    }

    await prisma.savedProperty.delete({
        where: {
            id: saved.id
        }
    });

    return true;
};