import { PrismaClient } from "@prisma/client";

// Keep a single Prisma instance during hot reloads in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"], // add "query" here if you want to debug queries
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
