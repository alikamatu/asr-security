import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix Node.js Windows SRV lookup issue for MongoDB Atlas (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if custom DNS servers cannot be set
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asr-security';
const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/asr-security';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        return await mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 5000,
        });
      } catch (primaryErr) {
        const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        console.warn(`Primary MongoDB URI connection failed (${errMsg}). Trying local MongoDB...`);
        
        if (MONGODB_URI !== LOCAL_FALLBACK_URI) {
          try {
            return await mongoose.connect(LOCAL_FALLBACK_URI, {
              bufferCommands: false,
              serverSelectionTimeoutMS: 3000,
            });
          } catch (localErr) {
            console.error('Local fallback MongoDB connection also failed:', localErr);
          }
        }
        throw primaryErr;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
