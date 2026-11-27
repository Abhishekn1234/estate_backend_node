import { ApiError } from "./ApiError";

export interface TimestampCursor {
    id: string;
    createdAt: Date;
}

export const encodeTimestampCursor = ({ id, createdAt }: TimestampCursor): string =>
    Buffer.from(JSON.stringify({ id, createdAt: createdAt.toISOString() })).toString("base64url");

export const decodeTimestampCursor = (cursor: string): TimestampCursor => {
    try {
        const decoded: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
            throw new Error("Invalid cursor");
        }

        const value = decoded as Record<string, unknown>;
        if (
            typeof value.id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id) ||
            typeof value.createdAt !== "string" ||
            Number.isNaN(Date.parse(value.createdAt))
        ) {
            throw new Error("Invalid cursor");
        }

        return { id: value.id, createdAt: new Date(value.createdAt) };
    } catch {
        throw new ApiError(400, "Invalid pagination cursor");
    }
};
