// src/db/index.js
import mongoose from "mongoose";
import logger from "../logger/winston.logger.js";

let cached = global.mongoose; // Use a global cache for serverless
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    logger.info("✅ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGODB_URI?.includes(process.env.DB_NAME)
      ? process.env.MONGODB_URI
      : `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;

    cached.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        logger.info(
          `☘️ MongoDB Connected! Host: ${mongooseInstance.connection.host}`
        );
        return mongooseInstance;
      })
      .catch((error) => {
        logger.error("❌ MongoDB connection failed:", error);
        throw error; // Don't exit process; throw instead (Vercel-safe)
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectDB;
