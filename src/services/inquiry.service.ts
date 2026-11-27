import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { decodeTimestampCursor, encodeTimestampCursor } from "../utils/pagination";

export const createInquiry = async (
    buyerId: string,
    propertyId: string,
    message: string
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

    if (property.ownerId === buyerId) {
        throw new ApiError(400, "You cannot inquire about your own property");
    }

    return prisma.$transaction(async tx => {
        const buyer = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "User" WHERE id = ${buyerId} FOR UPDATE
        `;

        if (buyer.length === 0) {
            throw new ApiError(401, "Authentication required");
        }

        const existingInquiry = await tx.inquiry.findUnique({
            where: {
                buyerId_propertyId: {
                    buyerId,
                    propertyId
                }
            }
        });

        if (existingInquiry) {
            throw new ApiError(409, "You have already submitted an inquiry");
        }

        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentInquiryCount = await tx.inquiry.count({
            where: {
                buyerId,
                createdAt: { gte: hourAgo }
            }
        });

        if (recentInquiryCount >= 5) {
            throw new ApiError(429, "You can submit at most five inquiries per hour");
        }

        return tx.inquiry.create({
            data: {
                buyerId,
                propertyId,
                message
            },
            include: {
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        city: true,
                        ownerId: true
                    }
                }
            }
        });
    });
};

const getPaginatedInquiries = async (
    where: Prisma.InquiryWhereInput,
    limit: number,
    cursor?: string,
    received = false
) => {
    const cursorValue = cursor ? decodeTimestampCursor(cursor) : undefined;
    const entries = await prisma.inquiry.findMany({
        where: {
            ...where,
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
            ...(received && {
                buyer: {
                    select: { id: true, name: true, email: true, phone: true }
                }
            }),
            property: received
                ? { select: { id: true, title: true, city: true } }
                : {
                    select: {
                        id: true,
                        title: true,
                        city: true
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

export const getMyInquiries = async (userId: string, limit = 10, cursor?: string) =>
    getPaginatedInquiries({ buyerId: userId }, limit, cursor);

export const getReceivedInquiries = async (userId: string, limit = 10, cursor?: string) =>
    getPaginatedInquiries({ property: { ownerId: userId } }, limit, cursor, true);

export const updateReceivedInquiryStatus = async (
    ownerId: string,
    inquiryId: string,
    status: "CONTACTED" | "CLOSED"
) => {
    const inquiry = await prisma.inquiry.findFirst({
        where: {
            id: inquiryId,
            property: { ownerId }
        },
        select: { id: true }
    });

    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found");
    }

    return prisma.inquiry.update({
        where: { id: inquiry.id },
        data: { status },
        select: {
            id: true,
            status: true
        }
    });
};