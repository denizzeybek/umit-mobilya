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

/**
 * Empties every collection in this worker's database.
 *
 * Asks the server what exists rather than iterating `connection.collections`,
 * which only lists collections a model has been registered for. The Nest app
 * runs on its own connection, so that list is empty here — and a clear that
 * silently does nothing leaves state bleeding between tests.
 */
export async function clearCollections(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Mongo bağlantısı yok — connectTestMongo çağrılmamış.');
  }

  const collections = await db.collections();
  await Promise.all(
    collections.map((collection) => collection.deleteMany({})),
  );
}
