// SERVER-ONLY Prisma client - never imported on client side
import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export types only for client-side usage
export type { 
  PrismaClient,
  Prisma,
} from '@prisma/client'
