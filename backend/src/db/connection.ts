import mongoose from 'mongoose';

export interface DatabaseStatus {
  connected: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'disabled';
  dbName: string | null;
  host: string | null;
  message: string;
}

let isConnecting = false;

export async function connectDatabase(): Promise<DatabaseStatus> {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    console.log('[MongoDB] MONGODB_URI is not set. Operating in hybrid in-memory persistence mode.');
    return {
      connected: false,
      status: 'disabled',
      dbName: null,
      host: null,
      message: 'MongoDB URI not provided. In-memory storage is active.',
    };
  }

  if (mongoose.connection.readyState === 1) {
    return {
      connected: true,
      status: 'connected',
      dbName: mongoose.connection.name || 'geoscope',
      host: mongoose.connection.host || 'localhost',
      message: 'MongoDB connected successfully',
    };
  }

  if (isConnecting) {
    return {
      connected: false,
      status: 'connecting',
      dbName: null,
      host: null,
      message: 'MongoDB connection in progress...',
    };
  }

  try {
    isConnecting = true;
    console.log('[MongoDB] Attempting connection to MongoDB cluster...');

    // Mask credentials for safe logging
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[MongoDB] Target: ${maskedUri}`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnecting = false;
    const dbName = mongoose.connection.name || 'geoscope';
    const host = mongoose.connection.host || 'cluster';
    console.log(`[MongoDB] Connected successfully to database: "${dbName}" at host: ${host}`);

    return {
      connected: true,
      status: 'connected',
      dbName,
      host,
      message: 'Connected to MongoDB',
    };
  } catch (err: any) {
    isConnecting = false;
    console.warn('[MongoDB] Connection failed, falling back to in-memory mode:', err.message);
    return {
      connected: false,
      status: 'disconnected',
      dbName: null,
      host: null,
      message: `Connection failed: ${err.message}. Operating in in-memory fallback mode.`,
    };
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return {
        connected: true,
        status: 'connected',
        dbName: mongoose.connection.name || 'geoscope',
        host: mongoose.connection.host || 'localhost',
        message: 'MongoDB connected and operational',
      };
    case 2:
      return {
        connected: false,
        status: 'connecting',
        dbName: null,
        host: null,
        message: 'MongoDB connecting...',
      };
    default:
      if (!process.env.MONGODB_URI) {
        return {
          connected: false,
          status: 'disabled',
          dbName: null,
          host: null,
          message: 'MongoDB not configured (In-Memory Fallback active)',
        };
      }
      return {
        connected: false,
        status: 'disconnected',
        dbName: null,
        host: null,
        message: 'MongoDB disconnected (In-Memory Fallback active)',
      };
  }
}
