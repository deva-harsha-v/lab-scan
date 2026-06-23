/**
 * Shared Prisma client singleton.
 * Importing this module always returns the same PrismaClient instance,
 * preventing connection pool exhaustion under concurrent load.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = global._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global._prisma = prisma;
}

module.exports = prisma;
