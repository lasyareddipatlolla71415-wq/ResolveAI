import mongoose from "mongoose";

const mongooseOptions: Parameters<typeof mongoose.connect>[1] = {
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10
};

export async function connectDatabase(uri?: string) {
  if (!uri) {
    if (isMongoDbRequired()) {
      throw new Error("MONGODB_URI is required but was not provided.");
    }

    console.warn("MONGODB_URI is not set. API started in explicit development memory mode.");
    return;
  }

  // Register lifecycle listeners once before connecting.
  mongoose.connection.once("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err.message));
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));

  try {
    await mongoose.connect(uri, mongooseOptions);
  } catch (error) {
    if (isMongoDbRequired()) {
      throw error;
    }

    console.error("MongoDB connection failed. Continuing in explicit development memory mode.", error);
  }
}

export function isMongoDbRequired() {
  return process.env.MONGODB_REQUIRED === "true" || process.env.NODE_ENV === "production";
}

export function getDatabaseStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    required: isMongoDbRequired(),
    mode: mongoose.connection.readyState === 1 ? "mongodb" : "development-memory"
  };
}
