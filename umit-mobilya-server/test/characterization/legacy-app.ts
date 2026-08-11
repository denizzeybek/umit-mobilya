import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const requireLegacy = createRequire(__filename);

export const TEST_JWT_SECRET = 'characterization-secret';

/**
 * Boots the still-Express half of the API exactly as `app.js` does — same
 * middleware order, same router — so a characterization spec measures the
 * behaviour that is actually deployed today, not an approximation of it.
 */
export function createLegacyApp(): Express {
  process.env['JWT_SECRET'] = TEST_JWT_SECRET;

  const legacyRoutes = requireLegacy(
    join(process.cwd(), 'routes', 'index.js'),
  ) as express.RequestHandler;

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(legacyRoutes);

  return app;
}

export function signTestToken(userId = '507f1f77bcf86cd799439011'): string {
  return jwt.sign({ id: userId }, TEST_JWT_SECRET, { expiresIn: '1h' });
}
