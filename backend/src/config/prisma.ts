import { PrismaClient } from '@prisma/client';
import { env } from './env';

export const prisma = new PrismaClient({
  log: env.isProd ? ['error'] : ['error', 'warn'],
});

export async function connectDatabase() {
  await prisma.$connect();
}
