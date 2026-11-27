import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import multer from "multer";
import { ZodError } from "zod";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(error);

    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
    }

    if (error instanceof multer.MulterError) {
        const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }

    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.flatten()
        });
    }

    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    ) {
        return res.status(409).json({
            success: false,
            message: "This record already exists"
        });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025") {
        return res.status(404).json({
            success: false,
            message: "Record not found"
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        ...(env.NODE_ENV === "development" && { error: error.message })
    });
};

export const notFoundHandler = (
    req: Request,
    res: Response
) => {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};