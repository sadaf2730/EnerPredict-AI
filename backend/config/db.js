const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  // Reuse existing connection across warm serverless function invocations
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy_dashboard';

  try {
    // Attempt connecting to the configured MongoDB URI with a short timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.log(`[MongoDB] Could not reach standalone MongoDB at ${uri} (${err.message}).`);

    // In production or Vercel serverless environments, fail fast without memory server
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.error(`[MongoDB] Critical Database Connection Error in production: ${err.message}`);
      throw err;
    }

    console.log('[MongoDB] Initializing embedded MongoDB server for development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'energy_dashboard',
        }
      });
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Connected to embedded MongoDB at: ${memoryUri}`);
      return conn;
    } catch (memErr) {
      console.error(`[MongoDB] Critical Database Connection Error: ${memErr.message}`);
      throw memErr;
    }
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, closeDB };
