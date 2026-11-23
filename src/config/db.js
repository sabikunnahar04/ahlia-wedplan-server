
import { MongoClient } from "mongodb";

const uri = process.env.DB_URI;

if (!uri) {
  throw new Error("Please define DB_URI in environment variables");
}

const options = {};

let cached = globalThis._mongo;

if (!cached) {
  cached = globalThis._mongo = {
    client: null,
    promise: null,
  };
}

export async function connectDB() {
  if (!cached.promise) {
    cached.client = new MongoClient(uri, options);

    cached.promise = cached.client
      .connect()
      .then((client) => {
        console.log("Connected to MongoDB");
        return client;
      })
      .catch((error) => {
        cached.promise = null;
        cached.client = null;
        throw error;
      });
  }

  const client = await cached.promise;

  return client.db(process.env.DB_NAME || "wedplan");
}

export default connectDB;
