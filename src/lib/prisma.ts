import { PrismaClient } from '../../generated/prisma'
import { initializeDatabase } from './db-init'

// Inicializar la base de datos en Vercel (copiar a /tmp)
initializeDatabase()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma