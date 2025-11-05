import winston from "winston";
import fs from "fs";
import path from "path";

const env = process.env.NODE_ENV || "development";
const isDev = env === "development";

// ✅ Use writable path for dev; /tmp fallback for cloud
const logDir = isDev ? "logs" : "/tmp/logs";

// Try to create the log directory (safe for dev)
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch {
  console.warn("⚠️ Log directory creation skipped (read-only filesystem)");
}

// Define levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Color map
const colors = {
  error: "red",
  warn: "yellow",
  info: "blue",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Formats
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Transports
const transports = [
  new winston.transports.Console({
    format: isDev ? devFormat : prodFormat,
  }),
];

// Only write files locally (safe)
if (isDev) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({ filename: "logs/info.log", level: "info" }),
    new winston.transports.File({ filename: "logs/http.log", level: "http" }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    })
  );
}

// Logger instance
const logger = winston.createLogger({
  level: isDev ? "debug" : "warn",
  levels,
  format: isDev ? devFormat : prodFormat,
  transports,
});

// Exception handling
if (isDev) {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
    })
  );
  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
    })
  );
} else {
  // ✅ In production, only log to console
  logger.exceptions.handle(new winston.transports.Console());
  logger.rejections.handle(new winston.transports.Console());
}

export default logger;
