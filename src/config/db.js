
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DB_URI);

let db;
let dbPromise;

export async function connectDB() {
  if (db) {
    return db;
  }

  if (!dbPromise) {
    dbPromise = client.connect()
      .then(() => {
        db = client.db(process.env.DB_NAME || 'wedplan');
        console.log('Connected to MongoDB');
        return db;
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }

  return dbPromise;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected');
  }

  return db;
}

export function getClient() {
  return client;
}
