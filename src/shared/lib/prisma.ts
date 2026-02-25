import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/**
 * Lazy singleton: the client is created on first property access,
 * not at import time. This prevents build failures when DATABASE_URL
 * is unavailable (e.g., during `next build` static analysis).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const instance = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = instance;
    }
    return Reflect.get(instance, prop);
  },
});
