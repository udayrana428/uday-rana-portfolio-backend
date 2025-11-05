import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { httpServer } from "./app.js";
import logger from "./logger/winston.logger.js";

dotenv.config({
  path: "./.env",
});

const startServer = () => {
  httpServer.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
  });
  httpServer.on("error", (error) => {
    logger.error("Server failed to start: ", error);
    process.exit(1);
  });
};

try {
  await connectDB();
  startServer();
} catch (error) {
  logger.error("MongoDB connection error: ", error);
  process.exit(1);
}
