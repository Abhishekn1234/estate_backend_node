import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = verifyAccessToken(token);

        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token"
        });
    }
};

export const authorizeAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};