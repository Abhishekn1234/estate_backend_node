import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import {
    generateAccessToken,
    generateRefreshToken,
    getTokenExpirationDate,
    hashToken,
    verifyRefreshToken
} from "../utils/token";

interface RegisterInput {
    name: string;
    email: string;
    phone?: string;
    password: string;
}

interface LoginInput {
    email: string;
    password: string;
}

const createTokenPair = async (
    user: { id: string; role: string }
) => {
    const payload = {
        userId: user.id,
        role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const refreshTokenExpiresAt = getTokenExpirationDate(refreshToken);

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            userId: user.id,
            expiresAt: refreshTokenExpiresAt
        }
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt };
};

export const registerUser = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
        throw new ApiError(409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email.toLowerCase(),
            phone: data.phone,
            password: hashedPassword
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
        }
    });

    const tokens = await createTokenPair(user);

    return { user, ...tokens };
};

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
    });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const passwordValid = await bcrypt.compare(
        data.password,
        user.password
    );

    if (!passwordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const tokens = await createTokenPair(user);

    const { password, ...safeUser } = user;

    return {
        user: safeUser,
        ...tokens
    };
};

export const refreshUserToken = async (refreshToken: string) => {
    let payload;

    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash }
    });

    if (
        !storedToken ||
        storedToken.expiresAt <= new Date() ||
        storedToken.userId !== payload.userId
    ) {
        throw new ApiError(401, "Refresh token is no longer valid");
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId }
    });

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    const tokens = await prisma.$transaction(async (tx) => {
        await tx.refreshToken.delete({
            where: { id: storedToken.id }
        });

        const accessToken = generateAccessToken({
            userId: user.id,
            role: user.role
        });

        const newRefreshToken = generateRefreshToken({
            userId: user.id,
            role: user.role
        });
        const refreshTokenExpiresAt = getTokenExpirationDate(newRefreshToken);

        await tx.refreshToken.create({
            data: {
                tokenHash: hashToken(newRefreshToken),
                userId: user.id,
                expiresAt: refreshTokenExpiresAt
            }
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
            refreshTokenExpiresAt
        };
    });

    return tokens;
};

export const logoutUser = async (refreshToken: string) => {
    await prisma.refreshToken.deleteMany({
        where: {
            tokenHash: hashToken(refreshToken)
        }
    });
};

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user;
};