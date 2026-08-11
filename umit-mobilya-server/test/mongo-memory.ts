import mongoose from 'mongoose';

/**
 * Connects the default mongoose connection — the one the legacy CommonJS
 * models register on — to this worker's in-memory database. The server itself
 * is started once in `global-setup.ts`.
 */
export async function connectTestMongo(): Promise<void> {
  const uri = process.env['MONGO_URI'];
  if (!uri) {
    throw new Error('MONGO_URI yok — test/setup-env.ts çalışmamış olmalı.');
  }
  await mongoose.connect(uri);
}

export async function disconnectTestMongo(): Promise<void> {
  await mongoose.disconnect();
}

export async function clearCollections(): Promise<void> {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}
