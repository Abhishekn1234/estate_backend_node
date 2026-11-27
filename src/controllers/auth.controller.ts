import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import { env } from "../config/env";

const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth"
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.registerUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        ...cookieOptions,
        maxAge: Math.max(0, result.refreshTokenExpiresAt.getTime() - Date.now())
    });

    return successResponse(
        res,
        "Registration successful",
        {
            user: result.user,
            accessToken: result.accessToken
        },
        201
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        ...cookieOptions,
        maxAge: Math.max(0, result.refreshTokenExpiresAt.getTime() - Date.now())
    });

    return successResponse(res, "Login successful", {
        user: result.user,
        accessToken: result.accessToken
    });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token missing"
        });
    }

    const tokens = await authService.refreshUserToken(refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, {
        ...cookieOptions,
        maxAge: Math.max(0, tokens.refreshTokenExpiresAt.getTime() - Date.now())
    });

    return successResponse(res, "Token refreshed", {
        accessToken: tokens.accessToken
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
        await authService.logoutUser(refreshToken);
    }

    res.clearCookie("refreshToken", cookieOptions);

    return successResponse(res, "Logged out successfully", null);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.userId);

    return successResponse(res, "User profile fetched", user);
});