import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

interface TokenPayload {
    userId: string;
    role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRES as SignOptions["expiresIn"]
    });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRES as SignOptions["expiresIn"]
    });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const getTokenExpirationDate = (token: string): Date => {
    const payload = jwt.decode(token);

    if (!payload || typeof payload === "string" || typeof payload.exp !== "number") {
        throw new Error("Token does not contain a valid expiration");
    }

    return new Date(payload.exp * 1000);
};

export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};