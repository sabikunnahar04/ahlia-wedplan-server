import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DB_URI);

let db;

export async function connectDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME || 'wedplan');
  console.log('Connected to MongoDB');
  return db;
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
