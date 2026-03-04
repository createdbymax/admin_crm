import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPgPool?: Pool;
};

const databaseUrl = process.env.DATABASE_URL;
const parsedPoolMax = Number(process.env.PG_POOL_MAX ?? "3");
const poolMax = Number.isFinite(parsedPoolMax) && parsedPoolMax > 0 ? parsedPoolMax : 3;
const accelerateUrl = databaseUrl?.startsWith("prisma+postgres://")
  ? databaseUrl
  : undefined;
if (!accelerateUrl && !databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}
const pgPool =
  accelerateUrl || !databaseUrl
    ? undefined
    : globalForPrisma.prismaPgPool ??
      new Pool({
        connectionString: databaseUrl,
        max: poolMax,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 10_000,
        ssl: databaseUrl.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      });

const prismaClient = accelerateUrl
  ? new PrismaClient({
      log: ["error", "warn"],
      accelerateUrl,
    })
  : new PrismaClient({
      log: ["error", "warn"],
      adapter: new PrismaPg(pgPool!),
    });

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  if (!globalForPrisma.prismaPgPool && pgPool) {
    globalForPrisma.prismaPgPool = pgPool;
  }
}
