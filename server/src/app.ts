import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getDatabaseStatus } from "./config/database.js";
import { getQdrantStatus } from "./config/qdrant.js";

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:") || origin === process.env.CLIENT_URL) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "resolveai-api",
      database: getDatabaseStatus(),
      qdrant: getQdrantStatus()
    });
  });

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
