import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";

import authRoutes from "./routes/auth.routes";
import propertyRoutes from "./routes/property.routes";
import inquiryRoutes from "./routes/inquiry.routes";
import savedPropertyRoutes from "./routes/savedProperty.routes";

import {
    errorHandler,
    notFoundHandler
} from "./middleware/error.middleware";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api", globalLimiter);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Real Estate API is running",
        environment: env.NODE_ENV
    });
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/saved-properties", savedPropertyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;