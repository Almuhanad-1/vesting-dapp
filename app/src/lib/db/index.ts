// src/lib/db/index.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// src/lib/validations/deployment.ts
import { z } from "zod";

export const tokenConfigSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/),
  totalSupply: z.string().regex(/^\d+(\.\d+)?$/),
  decimals: z.number().min(0).max(18).default(18),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
});

export const vestingScheduleSchema = z.object({
  category: z.string().min(1),
  cliffMonths: z.number().min(0).max(60),
  vestingMonths: z.number().min(1).max(120),
  revocable: z.boolean().default(false),
  description: z.string().optional(),
});

export const beneficiarySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  category: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const deploymentRequestSchema = z.object({
  tokenConfig: tokenConfigSchema,
  vestingSchedules: z.array(vestingScheduleSchema).min(1),
  beneficiaries: z.array(beneficiarySchema).min(1),
});
