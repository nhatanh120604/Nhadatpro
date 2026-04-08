import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Global Prisma singleton instance to prevent multiple connections in dev 
// during hot reloading

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const rawConnectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const connectionString = rawConnectionString!.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const rawConnectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
    const connectionString = rawConnectionString!.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
