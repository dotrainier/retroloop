import { PrismaClient } from '@prisma/client';

// In dev, Next.js hot-reload re-runs modules, which would otherwise create a
// new PrismaClient (and a new DB connection) on every reload and exhaust the
// connection limit. Caching one instance on globalThis avoids that.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
