import { PrismaClient } from "@/generated/client/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// In Prisma 7, we pass the URL object directly to the adapter
const adapter = new PrismaBetterSqlite3({ 
  url: "file:./prisma/dev.db" 
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
