import { createApiApp, registerHealthRoute, registerRequestLogging } from "@codexsun/framework/api";
import type { HealthCheck } from "@codexsun/framework/health";
import { createDatabasePool, type CompatibleDbPool } from "@codexsun/framework/db";
import { AuthService, DatabaseSessionStore } from "@codexsun/platform/auth";
import { MasterDbTenantRepository, TenantLookupService, TenantService } from "@codexsun/platform/tenant";
import { AuditService, MasterDbAuditRepository } from "@codexsun/platform/audit";
import { ActivationService } from "@codexsun/platform/activation";
import { ModuleCatalogService } from "@codexsun/platform/catalog";
import { PermissionService } from "@codexsun/platform/permissions";
import { SubscriptionService } from "@codexsun/platform/subscription";
import { MasterDbUserRepository, UserService } from "@codexsun/platform/users";
import { InMemoryRoleRepository, RoleService } from "@codexsun/platform/roles";
import { SettingsService, MasterDbSettingsRepository } from "@codexsun/platform/settings";
import { ActivityService, InMemoryActivityRepository } from "@codexsun/platform/activity";
import { FileService, InMemoryFileRepository } from "@codexsun/platform/files";
import { NotificationService, InMemoryNotificationRepository } from "@codexsun/platform/notifications";
import { TemplateService, InMemoryTemplateRepository } from "@codexsun/platform/templates";
import { AgentService, InMemoryAgentRepository } from "@codexsun/platform/agents";
import {
  CoreDefinitionService, CoreRecordService, InMemoryCoreRecordRepository,
  ContactService as CoreContactService, DatabaseContactRepository as CoreDatabaseContactRepository,
  CompanyService, DatabaseCompanyRepository,
  ProductService, InMemoryProductRepository,
  WorkOrderService, InMemoryWorkOrderRepository,
  createAllCommonModuleServices,
  registerAllCoreRoutes
} from "@codexsun/core";
import type { CoreRouteContext, CommonModuleServiceMap } from "@codexsun/core";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerTenantRoutes } from "./tenant/routes.js";
import { registerAdminRoutes } from "./admin/routes.js";
import { registerSettingsRoutes } from "./settings/routes.js";
import { registerActivityRoutes } from "./activity/routes.js";
import { registerFileRoutes } from "./files/routes.js";
import { registerNotificationRoutes } from "./notifications/routes.js";
import { registerTemplateRoutes } from "./templates/routes.js";
import { registerAgentRoutes } from "./agents/routes.js";
import { requireSession, requireActiveTenant, requireFeatureEnabled, requirePermission } from "./auth/guards.js";
import { bootstrapDatabases, createServerConnection } from "./db/bootstrap.js";
import { getDatabaseShutdownHooks } from "./db/shutdown.js";
import { env } from "./env.js";

declare module "fastify" {
  interface FastifyInstance {
    activationService: ActivationService;
    activityService: ActivityService;
    agentService: AgentService;
    auditService: AuditService;
    authService: AuthService;
    coreDefinitionService: CoreDefinitionService;
    coreRecordService: CoreRecordService;
    coreContactService: CoreContactService;
    coreCompanyService: CompanyService;
    coreProductService: ProductService;
    coreWorkOrderService: WorkOrderService;
    coreCommonServices: CommonModuleServiceMap;
    fileService: FileService;
    masterDbPool: CompatibleDbPool;
    moduleCatalog: ModuleCatalogService;
    notificationService: NotificationService;
    permissionService: PermissionService;
    roleService: RoleService;
    settingsService: SettingsService;
    subscriptionService: SubscriptionService;
    templateService: TemplateService;
    tenantLookup: TenantLookupService;
    tenantService: TenantService;
    userService: UserService;
  }
}

type AuthUserRecord = {
  email: string;
  password_hash: string;
  status: string;
};

export async function createApp() {
  let dbStatus = {
    bootstrap: "pending",
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
  const activationService = new ActivationService(masterDbPool);
  const moduleCatalog = new ModuleCatalogService(masterDbPool);
  const permissionService = new PermissionService();
  const subscriptionService = new SubscriptionService();
  const userRepository = new MasterDbUserRepository(masterDbPool);
  const userService = new UserService(userRepository);
  const roleRepository = new InMemoryRoleRepository();
  const roleService = new RoleService(roleRepository);
  // Seed initial system roles
  for (const r of roleService.getAllSystemRoles()) {
    const existing = await roleRepository.getByKey(r.key);
    if (!existing) {
      await roleRepository.create({
        key: r.key,
        label: r.label,
        description: `System ${r.userType} role`,
        permissions: [],
        userType: r.userType
      });
    }
  }

  const settingsRepository = new MasterDbSettingsRepository(masterDbPool);
  const settingsService = new SettingsService(settingsRepository);
  const activityRepository = new InMemoryActivityRepository();
  const activityService = new ActivityService(activityRepository);
  const fileRepository = new InMemoryFileRepository();
  const fileService = new FileService(fileRepository);
  const notificationRepository = new InMemoryNotificationRepository();
  const notificationService = new NotificationService(notificationRepository);
  const templateRepository = new InMemoryTemplateRepository();
  const templateService = new TemplateService(templateRepository);
  const agentRepository = new InMemoryAgentRepository();
  const agentService = new AgentService(agentRepository);

  // Core services
  const coreDefinitionService = new CoreDefinitionService();
  const coreRecordRepository = new InMemoryCoreRecordRepository();
  const coreRecordService = new CoreRecordService(coreRecordRepository);
  const coreContactRepository = new CoreDatabaseContactRepository(masterDbPool);
  const coreContactService = new CoreContactService(coreContactRepository);
  const coreCompanyRepository = new DatabaseCompanyRepository(masterDbPool);
  const coreCompanyService = new CompanyService(coreCompanyRepository);
  const coreProductRepository = new InMemoryProductRepository();
  const coreProductService = new ProductService(coreProductRepository);
  const coreWorkOrderRepository = new InMemoryWorkOrderRepository();
  const coreWorkOrderService = new WorkOrderService(coreWorkOrderRepository);
  const coreCommonServices = createAllCommonModuleServices({ pool: masterDbPool });

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
      if (flagEnabled(env.CODEXSUN_DEV_SKIP_DB)) {
        dbStatus = {
          bootstrap: "skipped",
          masterDatabase: env.DB_MASTER_NAME,
          ready: true,
          tenantTestDatabase: env.TENANT_TEST_DB_NAME
        };
        return;
      }

      const nextStatus = await bootstrapDatabases();
      dbStatus = {
        ...nextStatus,
        bootstrap: nextStatus.ready ? "complete" : "degraded"
      };
      if (!dbStatus.ready) {
        app.log.warn({ database: dbStatus }, "Database bootstrap is degraded");
      }
    }
  });

  // 3. Decorate app with pool & services
  app.decorate("masterDbPool", masterDbPool);
  app.decorate("authService", authService);
  app.decorate("auditService", auditService);
  app.decorate("activationService", activationService);
  app.decorate("moduleCatalog", moduleCatalog);
  app.decorate("permissionService", permissionService);
  app.decorate("subscriptionService", subscriptionService);
  app.decorate("tenantLookup", tenantLookup);
  app.decorate("tenantService", tenantService);
  app.decorate("userService", userService);
  app.decorate("roleService", roleService);
  app.decorate("settingsService", settingsService);
  app.decorate("activityService", activityService);
  app.decorate("fileService", fileService);
  app.decorate("notificationService", notificationService);
  app.decorate("templateService", templateService);
  app.decorate("agentService", agentService);
  app.decorate("coreDefinitionService", coreDefinitionService);
  app.decorate("coreRecordService", coreRecordService);
  app.decorate("coreContactService", coreContactService);
  app.decorate("coreCompanyService", coreCompanyService);
  app.decorate("coreProductService", coreProductService);
  app.decorate("coreWorkOrderService", coreWorkOrderService);
  app.decorate("coreCommonServices", coreCommonServices);

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
  await registerAdminRoutes(app);
  await registerSettingsRoutes(app);
  await registerActivityRoutes(app);
  await registerFileRoutes(app);
  await registerNotificationRoutes(app);
  await registerTemplateRoutes(app);
  await registerAgentRoutes(app);

  // Core routes
  const coreCtx: CoreRouteContext = {
    guardSession: (app, request) => requireSession(app, request),
    guardActiveTenant: (app, tenantId) => requireActiveTenant(app, tenantId),
    guardFeatureEnabled: (app, tenantId, featureKey) => requireFeatureEnabled(app, tenantId, featureKey),
    guardPermission: (session, permission) => requirePermission(session, permission)
  };
  await registerAllCoreRoutes(app, coreCtx);

  return app;
}

function flagEnabled(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
