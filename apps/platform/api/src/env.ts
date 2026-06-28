import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PLATFORM_API_HOST: z.string().default("127.0.0.1"),
  PLATFORM_API_PORT: z.coerce.number().int().positive().default(4100),
  PLATFORM_WEB_ORIGIN: z.string().default("http://127.0.0.1:4200"),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_DRIVER: z.enum(["mariadb", "mysql2"]).default("mariadb"),
  DB_MASTER_NAME: z.string().default("codexsun_master_db"),
  TENANT_TEST_DB_NAME: z.string().default("tenant_test_001_db"),
  SESSION_SECRET: z.string().min(12).default("change-this-development-secret")
});

export const env = loadEnv(envSchema);
