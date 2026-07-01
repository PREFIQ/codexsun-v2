import { useState } from "react"
import { Button, Card } from "@codexsun/ui"

const sections = [
  { key: "overview", label: "Overview", content: "CODEXSUN is a multi-tenant platform built with Fastify (Node.js), React (Vite), and MariaDB. The architecture uses a master database for platform-level data and per-tenant databases for tenant-scoped data." },
  { key: "auth", label: "Authentication & Authorization", content: "Three desk types: super_admin (/sa), staff_admin (/admin), tenant (/tenant). JWT-based auth with session store. Permissions are granted via roles (rolePermissionMap). Routes use guard functions: requireSession, requireSuperAdmin, requirePermission." },
  { key: "multi-tenant", label: "Multi-Tenant Context", content: "Tenants are identified via x-tenant-id header. SA can act on any tenant. Tenant users must match their session tenant. The registerTenantContext plugin reads x-tenant-id and decorates request.tenantId." },
  { key: "modules", label: "Module System", content: "Modules are registered in platformModuleCatalog (catalog/contracts.ts). Activation stored in tenant_module_activation table. Feature gates: requireFeatureEnabled checks module activation for a tenant." },
  { key: "migrations", label: "Migrations", content: "MigrationRunner class in db/migration-runner.ts. Migrations are objects with id, description, up function. Master migrations are indexed in master-index.ts. The run command applies pending migrations." },
  { key: "api", label: "API Conventions", content: "All responses use ok()/fail() envelope helpers. Meta includes requestId, optional correlationId, optional tenantId. Routes are registered as Fastify plugins (register*Routes). Core routes use /core/* prefix." },
  { key: "core", label: "Core App (apps/core)", content: "The core app owns common definitions (30 types), contacts, companies, and products. CoreRouteContext pattern injects platform guards at registration time. In-memory repositories with soft-delete (archive/restore)." },
  { key: "boundaries", label: "App Boundaries", content: "apps/core = master modules (owned by core). packages/platform = platform services (tenants, auth, audit, settings). apps/platform/api = API gateway + admin/tenant routes. apps/platform/web = React SPA frontend." },
]

export function DevDocs({ onBack }: { onBack: () => void }) {
  const [activeSection, setActiveSection] = useState("overview")
  const current = sections.find((s) => s.key === activeSection)!

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Developer Documentation" description="Architecture, conventions, and API references"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {sections.map((s) => (
              <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                style={{ textAlign: "left", padding: "0.5rem", border: "none", borderRadius: "6px", cursor: "pointer", background: activeSection === s.key ? "var(--cx-primary)" : "transparent", color: activeSection === s.key ? "white" : "var(--cx-foreground)", fontSize: "0.85rem" }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ padding: "1rem", border: "1px solid var(--cx-border)", borderRadius: "8px", lineHeight: 1.6, fontSize: "0.9rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>{current.label}</h3>
            <p style={{ color: "var(--cx-muted)" }}>{current.content}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
