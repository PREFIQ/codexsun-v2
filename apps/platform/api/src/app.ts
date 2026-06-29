import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { createDatabasePool, type CompatibleDbPool } from "@codexsun/framework/db";
import { AuthService, DatabaseSessionStore } from "@codexsun/platform/auth";
import { MasterDbTenantRepository, TenantLookupService, TenantService } from "@codexsun/platform/tenant";
import { AuditService, MasterDbAuditRepository } from "@codexsun/platform/audit";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerTenantRoutes } from "./tenant/routes.js";
import { bootstrapDatabases, createServerConnection } from "./db/bootstrap.js";
import { getDatabaseShutdownHooks } from "./db/shutdown.js";
import { env } from "./env.js";

declare module "fastify" {
  interface FastifyInstance {
    masterDbPool: CompatibleDbPool;
    authService: AuthService;
    auditService: AuditService;
    tenantLookup: TenantLookupService;
    tenantService: TenantService;
  }
}

type AuthUserRecord = {
  email: string;
  password_hash: string;
  status: string;
};

export async function createApp() {
  let dbStatus = {
    masterDatabase: env.DB_MASTER_NAME,
    ready: false,
    tenantTestDatabase: env.TENANT_TEST_DB_NAME
  };

  // 1. Create master DB pool
  const masterDbPool = createDatabasePool({
    driver: env.DB_DRIVER,
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_MASTER_NAME
  });

  // 2. Initialize Platform Services
  const tenantLookup = new TenantLookupService(masterDbPool);
  const tenantRepository = new MasterDbTenantRepository(masterDbPool);
  const tenantService = new TenantService(tenantRepository);

  const userFinder = {
    async findMasterUser(desk: "sa" | "admin", email: string) {
      const tableName = desk === "sa" ? "super_admin_users" : "staff_users";
      const [rows] = await masterDbPool.execute<AuthUserRecord[]>(
        `SELECT id, display_name, email, password_hash, status FROM ${tableName} WHERE email = ? LIMIT 1`,
        [email]
      );
      return rows[0] ?? null;
    },
    async findTenantUser(databaseName: string, email: string) {
      const conn = await createServerConnection(databaseName);
      try {
        const [rows] = await conn.execute<AuthUserRecord[]>(
          "SELECT id, display_name, email, password_hash, role_key, status FROM tenant_users WHERE email = ? LIMIT 1",
          [email]
        );
        return rows[0] ?? null;
      } finally {
        await conn.end();
      }
    }
  };

  const authMode = env.AUTH_MODE;
  const sessionStore = authMode === "cookie" || authMode === "hybrid"
    ? new DatabaseSessionStore(masterDbPool)
    : undefined;
  const authService = new AuthService(env.JWT_SECRET, tenantLookup, userFinder, authMode, sessionStore);
  const auditRepository = new MasterDbAuditRepository(masterDbPool);
  const auditService = new AuditService(auditRepository);

  const app = await createApiApp({
    appName: "CODEXSUN Platform API",
    cookieSecret: env.JWT_SECRET,
    corsOrigins: [env.PLATFORM_WEB_ORIGIN],
    environment: env.NODE_ENV,
    shutdownHooks: [
      ...getDatabaseShutdownHooks(),
      async () => {
        app.log.info("Closing master database pool...");
        await masterDbPool.end();
      }
    ],
    onReady: async () => {
      dbStatus = await bootstrapDatabases();
      if (!dbStatus.ready) {
        app.log.warn({ database: dbStatus }, "Database bootstrap is degraded");
      }
    }
  });

  // 3. Decorate app with pool & services
  app.decorate("masterDbPool", masterDbPool);
  app.decorate("authService", authService);
  app.decorate("auditService", auditService);
  app.decorate("tenantLookup", tenantLookup);
  app.decorate("tenantService", tenantService);

  const healthChecks: HealthCheck[] = [
    {
      name: "platform-api",
      check: () => ({
        details: {
          database: dbStatus
        },
        status: dbStatus.ready ? "ok" : "degraded"
      })
    }
  ];

  registerRequestLogging(app);
  registerHealthRoute(app, healthChecks);

  await registerAuthRoutes(app);
  await registerTenantRoutes(app);

  return app;
}
