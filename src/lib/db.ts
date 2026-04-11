import mongoose from "mongoose";
import "./registerModels";

// Prefer standard URI (no SRV) when set — bypasses DNS querySrv which can fail on some networks/VPNs
// No throw at import time so Vercel build can complete (env may be missing at build time).
function getMongoUri(): string {
  return (
    process.env.MONGODB_URI_STANDARD ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/taja-shop'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global cache in development to prevent multiple connections
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();
  if (!process.env.MONGODB_URI_STANDARD && !process.env.MONGODB_URI) {
    throw new Error('Please define MONGODB_URI (or MONGODB_URI_STANDARD) in environment variables.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB connected');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: unknown) {
    cached.promise = null;
    // Log underlying cause so we can tell DNS vs firewall vs timeout
    const err = e as { message?: string; cause?: { message?: string; code?: string } };
    if (err.cause?.message) console.error('[MongoDB] Cause:', err.cause.message, err.cause.code ?? '');
    throw e;
  }

  return cached.conn;
}

// Support both default import and named import styles:
// - import connectDB from "@/lib/db"
// - import { connectDB } from "@/lib/db"
export { connectDB };
export default connectDB;

