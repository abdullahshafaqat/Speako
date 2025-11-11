import mongoose from "mongoose";
import dotenv from "dotenv";
import { config } from "../config/config.js";

export async function connectToDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log("MongoDB connected");
  return mongoose.connection;
}

export function connectDB() {
  return connectToDatabase(config.mongoUri);
}
