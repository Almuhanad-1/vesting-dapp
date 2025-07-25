import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Supabase specific options
  verbose: true,
  strict: true,
} satisfies Config;
