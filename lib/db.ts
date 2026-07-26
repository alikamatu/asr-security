import mongoose from 'mongoose';
import dns from 'node:dns';

// Force custom DNS resolvers for MongoDB Atlas SRV lookups on Windows
function ensureDNS() {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch {
    // Ignore if custom DNS servers cannot be set
  }
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

/**
 * Resolve an SRV URI to a direct-connection URI by manually querying DNS.
 * Falls back to null if resolution fails.
 */
async function resolveSrvToDirectUri(srvUri: string): Promise<string | null> {
  try {
    const url = new URL(srvUri);
    const hostname = url.hostname;

    ensureDNS();
    const records: dns.SrvRecord[] = await new Promise((resolve, reject) => {
      dns.resolveSrv(`_mongodb._tcp.${hostname}`, (err, recs) => {
        if (err) reject(err);
        else resolve(recs);
      });
    });

    let txtOptions = '';
    try {
      const txtRecords: string[][] = await new Promise((resolve, reject) => {
        dns.resolveTxt(hostname, (err, recs) => {
          if (err) reject(err);
          else resolve(recs);
        });
      });
      if (txtRecords.length > 0) {
        txtOptions = txtRecords[0].join('');
      }
    } catch {
      // TXT records are optional
    }

    const hosts = records.map(r => `${r.name}:${r.port}`).join(',');
    const userInfo = url.username ? `${url.username}:${url.password}@` : '';
    const dbName = url.pathname || '/';
    const existingParams = url.searchParams.toString();
    const allParams = [txtOptions, existingParams, 'tls=true'].filter(Boolean).join('&');

    return `mongodb://${userInfo}${hosts}${dbName}?${allParams}`;
  } catch {
    return null;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      ensureDNS();

      // Attempt 1: Connect with the URI as-is
      try {
        return await mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 45000,
        });
      } catch (primaryErr) {
        const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        console.warn(`Primary MongoDB connection failed (${errMsg}).`);

        // Attempt 2: If SRV URI, resolve manually and retry with direct URI
        if (MONGODB_URI.startsWith('mongodb+srv://')) {
          try {
            const directUri = await resolveSrvToDirectUri(MONGODB_URI);
            if (directUri) {
              console.log('Retrying with manually resolved direct URI...');
              // Disconnect any partial state
              try { await mongoose.disconnect(); } catch { /* ignore */ }
              return await mongoose.connect(directUri, {
                bufferCommands: false,
                serverSelectionTimeoutMS: 15000,
                socketTimeoutMS: 45000,
              });
            }
          } catch (resolveErr) {
            const resolveMsg = resolveErr instanceof Error ? resolveErr.message : String(resolveErr);
            console.warn(`SRV manual resolution failed (${resolveMsg}).`);
          }
        }

        // Attempt 3: Local fallback
        if (MONGODB_URI !== LOCAL_FALLBACK_URI) {
          try {
            console.warn('Trying local MongoDB fallback...');
            try { await mongoose.disconnect(); } catch { /* ignore */ }
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
