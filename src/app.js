import express from "express";
import cors from "cors";
import { createServer } from "http";
import { errorHandler } from "./middlewares/error.middlewares.js";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();

const httpServer = createServer(app);

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*"
        : process.env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

app.set("trust proxy", 1);
// rate limiter middleware for all the requests
app.use(apiLimiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Morgan Middleware
app.use(morganMiddleware);

// API Routes
import healthcheckRouter from "./routes/healthcheck.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);

// App Routes
import projectRouter from "./routes/project.routes.js";
import morganMiddleware from "./logger/morgan.logger.js";
import connectDB from "./db/index.js";

app.use("/api/v1/projects", projectRouter);

// common error handling middleware
app.use(errorHandler);

export { httpServer };
// ✅ For Vercel / Serverless
export default async function handler(req, res) {
  await connectDB(); // ensure DB is connected before handling request
  return app(req, res);
}
