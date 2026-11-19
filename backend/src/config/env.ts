import dotenv from 'dotenv';
import path from 'path';
import { assertStrongJwtSecret } from './security';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const jwtSecret = assertStrongJwtSecret('JWT_SECRET', process.env.JWT_SECRET);
const jwtRefreshSecret = assertStrongJwtSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);

if (jwtSecret === jwtRefreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'https://unior.edu.bo').replace(/\/$/, ''),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  storageRoot: path.resolve(process.cwd(), process.env.STORAGE_ROOT || './storage'),
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_BYTES || 20 * 1024 * 1024),
  isProd: (process.env.NODE_ENV || 'development') === 'production',
};
