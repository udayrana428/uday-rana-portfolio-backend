// src/server.js
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { httpServer } from "./app.js";
import logger from "./logger/winston.logger.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Wait until DB is fully connected before starting server
    const db = await connectDB();
    if (!db.connection?.readyState) {
      throw new Error("MongoDB not connected properly");
    }

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    httpServer.on("error", (error) => {
      logger.error("❌ Server failed to start:", error);
    });
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
  }
};

startServer();
