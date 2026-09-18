// src/config/env.ts
//
// Validates process.env once, at import time, so a missing/malformed variable
// crashes the app immediately on startup with a clear message — not three
// layers deep inside a JWT-signing call at 2am.

import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive().default(4000),

  // 18-security-design.md: "signed with a rotatable secret (env var, not
  // committed)". Two distinct secrets so a leaked access-token secret can't
  // be used to forge refresh tokens, and vice versa.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET should be a long random string (32+ chars)"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET should be a long random string (32+ chars)"),

  // 18-security-design.md: "API restricted to the known frontend origin(s);
  // wildcard * never used once JWTs are involved."
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment configuration:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

const parsedEnv = loadEnv();

// JWT expiry values are fixed by 18-security-design.md, not environment
// configurable — they're constants, not secrets, so they live here rather
// than in .env.
export const env = {
  ...parsedEnv,
    jwt: {
    accessTokenExpiry: "15m" as const,
    refreshTokenExpiry: "7d" as const,
    refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
    },
  auth: {
    // FR-1.5: lock the account after 5 consecutive failed attempts
    maxFailedLoginAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  bcryptCost: 12, // 18-security-design.md: "bcrypt (cost factor 12)"
};

export type Env = typeof env;