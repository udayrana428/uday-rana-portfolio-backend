import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import fs from "fs";
import path from "path";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000), // auto-reconnect
});

const logFile = path.join(process.cwd(), "rate-limit-logs.txt");

// 📊 Configuration
const BLOCK_THRESHOLD = 10; // number of rate-limit violations before IP is blocked
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 🛑 Middleware: Checks if the IP is blocked before hitting any route
 */
export const blockCheckMiddleware = async (req, res, next) => {
  try {
    const ip = ipKeyGenerator(req);
    const isBlocked = await redis.get(`blocked:${ip}`);

    if (isBlocked) {
      return res.status(403).json({
        error:
          "🚫 Your IP is temporarily blocked due to repeated abuse. Please try again later.",
      });
    }

    next();
  } catch (err) {
    console.error("Redis block check error:", err);
    next(); // fail-open if Redis is down (industry standard)
  }
};

/**
 * 🧠 Helper: Log to file (non-blocking & fail-safe)
 */
const appendLog = (message) => {
  fs.appendFile(logFile, message, (err) => {
    if (err) console.error("Failed to write rate-limit log:", err);
  });
};

/**
 * 🌐 Global rate limiter middleware
 */
export const createLimiter = ({ windowMs, max }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req),

    handler: async (req, res, next, options) => {
      const ip = ipKeyGenerator(req);
      const now = new Date().toISOString();
      const endpoint = req.originalUrl;

      const logMessage = `[${now}] ⚠️ Rate limit exceeded by ${ip} on ${endpoint}\n`;
      appendLog(logMessage);
      console.warn(logMessage.trim());

      try {
        const violationKey = `violations:${ip}`;
        const currentCount = await redis.incr(violationKey);

        if (currentCount === 1) {
          await redis.pexpire(violationKey, BLOCK_DURATION_MS);
        }

        if (currentCount >= BLOCK_THRESHOLD) {
          await redis.set(`blocked:${ip}`, "true", "PX", BLOCK_DURATION_MS);
          const blockLog = `[${now}] 🚫 IP ${ip} BLOCKED for 24h after ${currentCount} violations\n`;
          appendLog(blockLog);
          console.warn(blockLog.trim());
        }
      } catch (err) {
        console.error("Redis violation tracking failed:", err);
      }

      res.status(options.statusCode).json({
        error: `Too many requests. Allowed ${options.max} per ${
          options.windowMs / 60000
        } minutes.`,
      });
    },
  });

// 📉 Stricter for login/signup (prevent brute-force)
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
});

// 📊 Normal API routes
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

// 🔍 Search routes (often abused)
export const searchLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});
