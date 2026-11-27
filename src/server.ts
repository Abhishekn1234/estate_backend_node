import "./config/env";

import app from "./app";
import { connectDatabase, prisma } from "./config/database";
import { env } from "./config/env";

const startServer = async () => {
    try {
        await connectDatabase();

        const server = app.listen(env.PORT, () => {
            console.log("--------------------------------");
            console.log("Real Estate Backend Started");
            console.log(`Port: ${env.PORT}`);
            console.log(`Environment: ${env.NODE_ENV}`);
            console.log(`API: http://localhost:${env.PORT}`);
            console.log(`Swagger: http://localhost:${env.PORT}/api-docs`);
            console.log("--------------------------------");
        });

        const shutdown = async () => {
            console.log("Shutting down server...");

            server.close(async () => {
                await prisma.$disconnect();
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {
        console.error("Server startup failed:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();