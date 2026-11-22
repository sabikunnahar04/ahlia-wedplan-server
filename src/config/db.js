
// import { MongoClient } from 'mongodb';

// const client = new MongoClient(process.env.DB_URI);

// let db;
// let dbPromise;

// export async function connectDB() {
//   if (db) {
//     return db;
//   }

//   if (!dbPromise) {
//     dbPromise = client.connect()
//       .then(() => {
//         db = client.db(process.env.DB_NAME || 'wedplan');
//         console.log('Connected to MongoDB');
//         return db;
//       })
//       .catch((error) => {
//         dbPromise = null;
//         throw error;
//       });
//   }

//   return dbPromise;
// }

// export function getDb() {
//   if (!db) {
//     throw new Error('Database not connected');
//   }

//   return db;
// }

// export function getClient() {
//   return client;
// }


import { MongoClient } from "mongodb";

const uri = process.env.DB_URL;

if (!uri) {
  throw new Error("Please define DB_URL in environment variables");
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

    cached.promise = cached.client.connect().catch((error) => {
      cached.promise = null;
      cached.client = null;
      throw error;
    });
  }

  const client = await cached.promise;

  return client.db(process.env.DB_NAME || "wedplan");
}

export default connectDB;