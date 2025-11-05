import mongoose from "mongoose";
import logger from "../logger/winston.logger.js";

let isConnected = false; // track the connection

const connectDB = async () => {
  if (isConnected) {
    logger.info("🟢 Using existing MongoDB connection");
    return mongoose.connection;
  }

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    isConnected = connectionInstance.connections[0].readyState;
    logger.info(
      `☘️ MongoDB Connected! Host: ${connectionInstance.connection.host}`
    );

    return connectionInstance;
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

export default connectDB;
