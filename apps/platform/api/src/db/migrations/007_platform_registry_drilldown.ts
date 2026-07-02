import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "007_platform_registry_drilldown",
  description: "Platform registry module groups and module registry records",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_module_groups (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        platform_registry_id BIGINT UNSIGNED NOT NULL,
        group_key VARCHAR(120) NOT NULL,
        name VARCHAR(180) NOT NULL,
        description TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_platform_module_group_key (platform_registry_id, group_key),
        CONSTRAINT fk_platform_module_groups_platform
          FOREIGN KEY (platform_registry_id) REFERENCES platform_registry(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_module_registry (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        module_group_id BIGINT UNSIGNED NOT NULL,
        module_key VARCHAR(120) NOT NULL,
        name VARCHAR(180) NOT NULL,
        route_path VARCHAR(180) NULL,
        description TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_platform_module_registry_key (module_group_id, module_key),
        CONSTRAINT fk_platform_module_registry_group
          FOREIGN KEY (module_group_id) REFERENCES platform_module_groups(id)
      )
    `);

    await db.execute(`
      INSERT IGNORE INTO platform_registry (name, platform, description, active)
      VALUES
        ('SUPER ADMIN', 'super-admin', 'Super Admin Desk platform modules and controls.', 1),
        ('ADMIN', 'admin', 'Staff admin platform modules and controls.', 1),
        ('TENANTS', 'tenants', 'Tenant workspace platform modules and controls.', 1)
    `);

    await seedSuperAdmin(db);
  }
};

type Db = Parameters<Migration["up"]>[0];

async function seedSuperAdmin(db: Db) {
  const [platformRows] = await db.execute<Array<{ id: number | string }>>(
    "SELECT id FROM platform_registry WHERE platform = 'super-admin' AND name = 'SUPER ADMIN' LIMIT 1"
  );
  const platformId = platformRows[0]?.id;
  if (!platformId) return;

  const groups = [
    ["admin", "Admin", "Tenant, domain, subscription, app, and industry administration.", 10],
    ["platform-foundation", "Platform Foundation", "Audit, health, settings, and feature controls.", 20],
    ["project-manager", "Project Manager", "Project management registries and planning modules.", 30],
    ["database", "Database", "Database manager and migration controls.", 40],
    ["access-control", "Access Control", "Users, roles, permissions, and sessions.", 50],
    ["operations", "Operations", "Queue, support, workbench, and developer documentation.", 60],
    ["apps-compliance", "Apps & Compliance", "ZETRO, GST, and compliance application controls.", 70]
  ] as const;

  for (const [groupKey, name, description, sortOrder] of groups) {
    await db.execute(
      `INSERT IGNORE INTO platform_module_groups (platform_registry_id, group_key, name, description, sort_order, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [platformId, groupKey, name, description, sortOrder]
    );
  }

  const moduleGroups = {
    admin: [
      ["tenant", "Tenant", "/sa/tenants", "Tenant registry and lifecycle.", 10],
      ["domain", "Domain", "/sa/domains", "Tenant domain mappings.", 20],
      ["plan", "Plan", "/sa/plans", "Subscription plan catalog.", 30],
      ["subscription", "Subscription", "/sa/subscriptions", "Tenant subscription lifecycle.", 40],
      ["apps", "Apps", "/sa/modules", "Platform app catalog.", 50],
      ["industry", "Industry", "/sa/industries", "Industry pack registry.", 60],
      ["module-registry", "Module Registry", "/sa/platform-registry", "Project manager module registry for platform features.", 70]
    ],
    "platform-foundation": [
      ["compliance", "Compliance", "/sa/audit", "Audit and compliance activity.", 10],
      ["health", "Health", "/sa/health", "Platform health checks.", 20],
      ["settings", "Settings", "/sa/settings", "Platform settings.", 30],
      ["features", "Features", "/sa/features", "Feature flag controls.", 40]
    ],
    "project-manager": [
      ["platform-registry", "Platform Registry", "/sa/platform-registry", "Platform, module group, and module registry drill-down.", 10]
    ],
    database: [
      ["database-manager", "Database Manager", "/sa/database", "Database operations manager.", 10],
      ["migrations", "Migrations", "/sa/migrations", "Platform migration status.", 20]
    ],
    "access-control": [
      ["users", "Users", "/sa/users", "Platform users.", 10],
      ["roles", "Roles", "/sa/roles", "Role registry.", 20],
      ["permissions", "Permissions", "/sa/permissions", "Permission matrix.", 30],
      ["sessions", "Sessions", "/sa/sessions", "Session registry.", 40]
    ],
    operations: [
      ["queue", "Queue", "/sa/queue", "Queue operations.", 10],
      ["support", "Support", "/sa/support", "Support desk activity.", 20],
      ["workbench", "Workbench", "/sa/workbench", "Agent workbench.", 30],
      ["dev-docs", "Dev Docs", "/sa/devdocs", "Developer documentation.", 40]
    ],
    "apps-compliance": [
      ["zetro", "ZETRO", "/sa/zetro", "ZETRO setup.", 10],
      ["gst", "GST", "/sa/gst", "GST setup.", 20]
    ]
  } as const;

  for (const [groupKey, modules] of Object.entries(moduleGroups)) {
    const [groupRows] = await db.execute<Array<{ id: number | string }>>(
      "SELECT id FROM platform_module_groups WHERE platform_registry_id = ? AND group_key = ? LIMIT 1",
      [platformId, groupKey]
    );
    const groupId = groupRows[0]?.id;
    if (!groupId) continue;

    for (const [moduleKey, name, routePath, description, sortOrder] of modules) {
      await db.execute(
        `INSERT IGNORE INTO platform_module_registry (module_group_id, module_key, name, route_path, description, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [groupId, moduleKey, name, routePath, description, sortOrder]
      );
    }
  }
}
