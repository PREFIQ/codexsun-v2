import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  AUTH_MODE: z.enum(["cookie", "jwt", "hybrid"]).default("jwt"),
  PLATFORM_API_HOST: z.string().default("127.0.0.1"),
  PLATFORM_API_PORT: z.coerce.number().int().positive().default(5510),
  PLATFORM_WEB_ORIGIN: z.string().default("http://127.0.0.1:5520"),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_DRIVER: z.enum(["mariadb", "mysql2"]).default("mariadb"),
  DB_MASTER_NAME: z.string().default("codexsun_master_db"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  SOFTWARE_ADMIN_EMAIL: z.string().default(""),
  SOFTWARE_ADMIN_NAME: z.string().default(""),
  SOFTWARE_ADMIN_PASSWORD: z.string().default(""),
  SUPER_ADMIN_EMAIL: z.string().default(""),
  SUPER_ADMIN_NAME: z.string().default(""),
  SUPER_ADMIN_PASSWORD: z.string().default(""),
  TENANT_TEST_DB_NAME: z.string().default("tenant_test_001_db"),
  TENANT_ADMIN_EMAIL: z.string().default(""),
  TENANT_ADMIN_NAME: z.string().default(""),
  TENANT_ADMIN_PASSWORD: z.string().default(""),
  STORAGE_ROOT: z.string().default("storage"),
  CODEXSUN_DEV_SKIP_DB: z.string().default("")
});

export const env = loadEnv(envSchema);
