import morgan from "morgan";
import logger from "./winston.logger.js";

const stream = {
  write: (message) => {
    try {
      logger.http(message.trim());
    } catch (err) {
      console.error("Morgan stream error:", err);
    }
  },
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream, skip }
);

export default morganMiddleware;
