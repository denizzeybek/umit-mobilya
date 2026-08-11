import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * One mongod for the whole run. Each worker gets its own database inside it
 * (see `setup-env.ts`), which is cheaper than a server per spec file and still
 * keeps parallel workers from writing over each other.
 */
export default async function globalSetup(): Promise<void> {
  const server = await MongoMemoryServer.create();

  (globalThis as { __MONGO_SERVER__?: MongoMemoryServer }).__MONGO_SERVER__ =
    server;

  process.env['MONGO_MEMORY_URI'] = server.getUri();
}
