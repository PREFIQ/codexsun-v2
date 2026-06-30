import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@codexsun/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codexsun/ui/components/dialog"
import { Input } from "@codexsun/ui/components/input"
import { Switch } from "@codexsun/ui/components/switch"
import { WorkspacePage } from "@codexsun/ui/workspace/page"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspaceLookup, type WorkspaceLookupCreateMode, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup"
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceSelect } from "@codexsun/ui/workspace/select"
import { WorkspaceDetailTable, WorkspaceShowCard, WorkspaceShowLayout } from "@codexsun/ui/workspace/show"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table"
import { WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { apiDelete, apiGet, apiPost, apiPut } from "../../api"

type FieldKind = "text" | "select" | "number" | "toggle" | "lookup" | "date"

type ModuleField = {
  key: string
  label: string
  allowTextValue?: boolean
  kind?: FieldKind
  createDescription?: string
  createLabel?: string
  createMode?: WorkspaceLookupCreateMode
  createTitle?: string
  lookupOptions?: WorkspaceLookupOption[]
  options?: string[]
  required?: boolean
}

type ModuleRecord = {
  id: string
  name: string
  code: string
  status: string
  owner: string
  category: string
  updated: string
  fields: Record<string, string | boolean>
}

type ModuleConfig = {
  actionLabel: string
  categoryLabel: string
  codeLabel: string
  description: string
  emptyLabel: string
  fields: ModuleField[]
  nameLabel: string
  records: ModuleRecord[]
  searchPlaceholder: string
  title: string
}

type ModuleView =
  | { mode: "list" }
  | { mode: "show"; record: ModuleRecord }
  | { mode: "upsert"; record: ModuleRecord | null; returnTo: "list" | "show" }

type TenantLookupDTO = {
  dbName: string
  id: string
  status: string
  tenantCode: string
  tenantName: string
}

type DomainMappingDTO = {
  id: string
  tenantId: string
  tenantCode: string
  tenantName: string
  domainName: string
  landingApp: string
  isPrimary: boolean
  status: string
  updatedAt?: string
}

type SubscriptionDTO = {
  id: string
  tenantId: string
  tenantCode: string
  tenantName: string
  planName: string
  billingCycle: string
  seats: number
  startsOn?: string | null
  renewsOn?: string | null
  amount?: number | null
  currency: string
  status: string
  notes: string
  updatedAt?: string
}

type SubscriptionPlanDTO = {
  id: string
  planName: string
  billingCycle: string
  seats: number
  amount?: number | null
  currency: string
  status: string
  description: string
  updatedAt?: string
}

type PlatformAppDTO = {
  id: string
  moduleKey: string
  displayName: string
  scope: string
  version: string
  defaultEnabled: boolean
  status: string
  updatedAt?: string
}

type PlatformIndustryDTO = {
  id: string
  industryName: string
  industryCode: string
  segment: string
  defaultTemplate: string
  status: string
  updatedAt?: string
}

const statusOptions = ["active", "inactive", "pending", "configured", "planned", "review"]

export const superAdminModuleConfigs = {
  domains: {
    title: "Tenant Domains",
    description: "Map public domains and local hosts to platform tenants.",
    actionLabel: "domain",
    nameLabel: "Domain",
    codeLabel: "Tenant",
    categoryLabel: "",
    searchPlaceholder: "Search domain, tenant, landing app, or status",
    emptyLabel: "No domains found.",
    fields: [
      { key: "name", label: "Domain", required: true },
      {
        key: "code",
        label: "Tenant",
        kind: "lookup",
        required: true,
        createMode: "popup",
        createLabel: "Create tenant",
        createTitle: "Create tenant",
        createDescription: "Create the tenant shell and use it for this domain mapping.",
        allowTextValue: false,
      },
      { key: "landing", label: "Landing app", kind: "select", options: ["Billing", "Sites", "ZETRO"] },
      { key: "primary", label: "Primary domain", kind: "toggle" },
      { key: "status", label: "Status", kind: "select", options: ["active", "inactive", "pending"] },
    ],
    records: [
      record("domain-1", "codexsun.localhost", "CODEXSUN", "Billing", "active", "Billing", { landing: "Billing", primary: true }),
      record("domain-2", "admin.codexsun.local", "CODEXSUN", "ZETRO", "pending", "Platform", { landing: "ZETRO", primary: false }),
    ],
  },
  subscriptions: {
    title: "Subscriptions",
    description: "Review tenant plans, lifecycle, billing status, and renewal controls.",
    actionLabel: "subscription",
    nameLabel: "Plan",
    codeLabel: "Tenant",
    categoryLabel: "Billing cycle",
    searchPlaceholder: "Search plan, tenant, cycle, or status",
    emptyLabel: "No subscriptions found.",
    fields: [
      {
        key: "name",
        label: "Plan",
        kind: "lookup",
        required: true,
        createMode: "popup",
        createLabel: "Create plan",
        createTitle: "Create plan",
        createDescription: "Create a reusable subscription plan and select it for this tenant.",
        allowTextValue: false,
      },
      {
        key: "code",
        label: "Tenant",
        kind: "lookup",
        required: true,
        createMode: "popup",
        createLabel: "Create tenant",
        createTitle: "Create tenant",
        createDescription: "Create the tenant shell and use it for this subscription.",
        allowTextValue: false,
      },
      { key: "category", label: "Billing cycle", kind: "select", options: ["Monthly", "Quarterly", "Half yearly", "Yearly"] },
      { key: "seats", label: "Seats", kind: "number" },
      { key: "startsOn", label: "Start date", kind: "date" },
      { key: "renewal", label: "Renewal date", kind: "date" },
      { key: "amount", label: "Amount", kind: "number" },
      { key: "currency", label: "Currency", kind: "select", options: ["INR", "USD", "EUR", "GBP"] },
      { key: "notes", label: "Notes" },
      { key: "status", label: "Status", kind: "select", options: ["active", "trial", "pending", "expired", "suspended", "inactive"] },
    ],
    records: [
      record("sub-1", "Professional", "CODEXSUN", "Monthly", "active", "Billing", { amount: "2500", currency: "INR", seats: "25", startsOn: "2026-07-01", renewal: "2026-07-31" }),
      record("sub-2", "Enterprise", "NORTHWIND", "Yearly", "trial", "Billing", { amount: "120000", currency: "INR", seats: "120", startsOn: "2026-07-01", renewal: "2026-12-31" }),
    ],
  },
  plans: {
    title: "Plans",
    description: "Maintain reusable subscription plans for tenant billing lifecycle.",
    actionLabel: "plan",
    nameLabel: "Plan",
    codeLabel: "Code",
    categoryLabel: "Billing cycle",
    searchPlaceholder: "Search plan, cycle, amount, or status",
    emptyLabel: "No plans found.",
    fields: [
      { key: "name", label: "Plan", required: true },
      { key: "code", label: "Code", required: true },
      { key: "category", label: "Billing cycle", kind: "select", options: ["Monthly", "Quarterly", "Half yearly", "Yearly"] },
      { key: "seats", label: "Seats", kind: "number" },
      { key: "amount", label: "Amount", kind: "number" },
      { key: "currency", label: "Currency", kind: "select", options: ["INR", "USD", "EUR", "GBP"] },
      { key: "description", label: "Description" },
      { key: "status", label: "Status", kind: "select", options: ["active", "trial", "inactive"] },
    ],
    records: [
      record("plan-1", "Professional", "professional", "Monthly", "active", "Billing", { amount: "2500", currency: "INR", description: "Default professional workspace plan.", seats: "25" }),
      record("plan-2", "Enterprise", "enterprise", "Yearly", "active", "Billing", { amount: "120000", currency: "INR", description: "Large tenant workspace plan.", seats: "120" }),
    ],
  },
  modules: {
    title: "Apps",
    description: "Control platform app availability across tenant workspaces.",
    actionLabel: "app",
    nameLabel: "App",
    codeLabel: "Module key",
    categoryLabel: "Scope",
    searchPlaceholder: "Search app, module key, scope, or status",
    emptyLabel: "No apps found.",
    fields: [
      { key: "name", label: "App", required: true },
      { key: "code", label: "Module key", required: true },
      { key: "category", label: "Scope", kind: "select", options: ["Platform", "Tenant", "Industry"] },
      { key: "version", label: "Version" },
      { key: "defaultEnabled", label: "Default enabled", kind: "toggle" },
      { key: "status", label: "Status", kind: "select", options: ["active", "inactive", "planned"] },
    ],
    records: [],
  },
  industries: {
    title: "Industries",
    description: "Define industry verticals and module scoping for tenants.",
    actionLabel: "industry",
    nameLabel: "Industry",
    codeLabel: "Code",
    categoryLabel: "Segment",
    searchPlaceholder: "Search industry, code, segment, or status",
    emptyLabel: "No industries found.",
    fields: [
      { key: "name", label: "Industry", required: true },
      { key: "code", label: "Code", required: true },
      { key: "category", label: "Segment", kind: "select", options: ["Retail", "Manufacturing", "Services", "Logistics"] },
      { key: "template", label: "Default template" },
      { key: "status", label: "Status", kind: "select", options: ["active", "planned", "inactive"] },
    ],
    records: [],
  },
  audit: moduleConfig("Compliance", "Review platform compliance controls, audits, and retention signals.", "control", [
    record("audit-1", "Audit trail retention", "AUDIT-RETENTION", "Security", "active", "Compliance", { frequency: "Daily", ownerTeam: "Security" }),
    record("audit-2", "Data export review", "DATA-EXPORT", "Privacy", "review", "Compliance", { frequency: "Weekly", ownerTeam: "Operations" }),
  ]),
  migrations: moduleConfig("Migrations", "Track platform and tenant migration status before deployment.", "migration", [
    record("migration-1", "Master foundation", "001_master_foundation", "Master DB", "configured", "Database", { version: "4/4", ownerTeam: "Platform" }),
    record("migration-2", "Tenant foundation", "001_tenant_foundation", "Tenant DB", "configured", "Database", { version: "1/1", ownerTeam: "Platform" }),
  ]),
  database: moduleConfig("Master Database", "Review master database health, ownership, and operational readiness.", "database item", [
    record("db-1", "Master database", "codexsun_master_db", "MariaDB", "active", "Database", { host: "localhost", port: "3306" }),
    record("db-2", "Tenant test database", "tenant_test_001_db", "MariaDB", "active", "Database", { host: "localhost", port: "3306" }),
  ]),
  health: moduleConfig("Health", "Monitor service readiness and platform operating checks.", "health check", [
    record("health-1", "Platform API", "platform-api", "Service", "active", "Operations", { latency: "596 ms", endpoint: "127.0.0.1:5510" }),
    record("health-2", "Platform Web", "platform-web", "Service", "active", "Operations", { latency: "560 ms", endpoint: "127.0.0.1:5520" }),
  ]),
  settings: moduleConfig("Settings", "Manage platform-wide settings and environment defaults.", "setting", [
    record("setting-1", "Database preflight", "CODEXSUN_DEV_SKIP_DB", "Development", "active", "Platform", { value: "0", scope: "Local" }),
    record("setting-2", "Port policy", "CODEXSUN_DEV_PORT_POLICY", "Development", "configured", "Platform", { value: "auto", scope: "Local" }),
  ]),
  features: moduleConfig("Features", "Manage feature flags used by platform and tenant workspaces.", "feature", [
    record("feature-1", "Workspace design system", "workspace.design", "UI", "active", "Platform", { rollout: "100%", ownerTeam: "Design System" }),
    record("feature-2", "Animated tabs", "workspace.tabs", "UI", "active", "Platform", { rollout: "100%", ownerTeam: "Design System" }),
  ]),
  users: moduleConfig("Users", "Review platform users, access state, and account ownership.", "user", [
    record("user-1", "SUNDAR", "sundar@sundar.com", "Super admin", "active", "Access", { lastLogin: "Today", desk: "Super Admin" }),
    record("user-2", "Support Admin", "support@codexsun.local", "Support", "inactive", "Access", { lastLogin: "Not yet", desk: "Admin" }),
  ]),
  roles: moduleConfig("Roles", "Group permissions into reusable access roles.", "role", [
    record("role-1", "Super Admin", "super-admin", "Platform", "active", "Access", { permissions: "All", users: "1" }),
    record("role-2", "Support", "support", "Operations", "active", "Access", { permissions: "Limited", users: "1" }),
  ]),
  permissions: moduleConfig("Permissions", "Maintain platform permission keys and access surfaces.", "permission", [
    record("permission-1", "Tenant Manage", "tenant.manage", "Admin", "active", "Access", { scope: "Platform", risk: "High" }),
    record("permission-2", "Settings View", "settings.view", "Admin", "active", "Access", { scope: "Platform", risk: "Low" }),
  ]),
  sessions: moduleConfig("Sessions", "Review active sessions and sign-in surface usage.", "session", [
    record("session-1", "SUNDAR session", "SA-SESSION-001", "Browser", "active", "Access", { ip: "127.0.0.1", desk: "Super Admin" }),
    record("session-2", "Tenant admin session", "TENANT-SESSION-001", "Browser", "inactive", "Access", { ip: "127.0.0.1", desk: "Tenant" }),
  ]),
  queue: moduleConfig("Queue", "Inspect background queue work and retry state.", "queue job", [
    record("queue-1", "Migration status sync", "queue.migration.sync", "System", "configured", "Operations", { attempts: "0", priority: "Normal" }),
    record("queue-2", "Tenant database check", "queue.tenant.db", "System", "active", "Operations", { attempts: "0", priority: "High" }),
  ]),
  support: moduleConfig("Support", "Track platform support workflows and escalation ownership.", "support item", [
    record("support-1", "Tenant onboarding", "SUP-ONBOARDING", "Playbook", "active", "Support", { sla: "4 hours", ownerTeam: "Support" }),
    record("support-2", "Database access", "SUP-DB-ACCESS", "Playbook", "review", "Support", { sla: "1 day", ownerTeam: "Platform" }),
  ]),
  workbench: moduleConfig("Workbench", "Manage internal tools for platform operations and testing.", "workbench tool", [
    record("workbench-1", "API runner", "tool.api-runner", "Developer", "active", "Platform", { visibility: "Internal", ownerTeam: "Platform" }),
    record("workbench-2", "Schema inspector", "tool.schema-inspector", "Database", "planned", "Platform", { visibility: "Internal", ownerTeam: "Database" }),
  ]),
  devdocs: moduleConfig("Dev Docs", "Organize technical notes and implementation references.", "document", [
    record("docs-1", "Development rules", "assist.rules", "Assist", "active", "Documentation", { path: "assist/governance/rules.md", ownerTeam: "Engineering" }),
    record("docs-2", "Workspace system", "workspace.design", "Design", "active", "Documentation", { path: "packages/ui/src/workspace", ownerTeam: "Design System" }),
  ]),
  zetro: moduleConfig("ZETRO", "Configure the AI business assistant platform area.", "ZETRO item", [
    record("zetro-1", "AI Provider", "zetro.provider", "Provider", "planned", "ZETRO", { provider: "OpenAI", mode: "Workbench" }),
    record("zetro-2", "Knowledge Base", "zetro.knowledge", "Knowledge", "planned", "ZETRO", { provider: "Internal", mode: "Tenant scoped" }),
  ]),
  gst: moduleConfig("GST", "Manage GST compliance setup, rates, HSN/SAC codes, and e-invoice readiness.", "GST item", [
    record("gst-1", "Tax Categories", "GST-RATES", "GST Setup", "configured", "Compliance", { slab: "0, 5, 12, 18, 28", ownerTeam: "Billing" }),
    record("gst-2", "HSN / SAC Codes", "HSN-SAC", "Classification", "pending", "Compliance", { slab: "Mixed", ownerTeam: "Billing" }),
  ]),
} satisfies Record<string, ModuleConfig>

export type SuperAdminModuleKey = keyof typeof superAdminModuleConfigs

export function SuperAdminModulePage({
  config,
}: {
  config: ModuleConfig
  onBack: () => void
}) {
  const isDomainModule = config.actionLabel === "domain"
  const isSubscriptionModule = config.actionLabel === "subscription"
  const isPlanModule = config.actionLabel === "plan"
  const isAppModule = config.actionLabel === "app"
  const isIndustryModule = config.actionLabel === "industry"
  const usesTenantLookup = isDomainModule || isSubscriptionModule
  const usesPlanLookup = isSubscriptionModule
  const usesApiRecords = isDomainModule || isSubscriptionModule || isPlanModule || isAppModule || isIndustryModule
  const queryClient = useQueryClient()
  const storageKey = `codexsun.sa.module.${config.actionLabel.replace(/\s+/g, "-")}.records`
  const [localRecords, setLocalRecords] = useState<ModuleRecord[]>(() => loadModuleRecords(storageKey, config.records))
  const [view, setView] = useState<ModuleView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [pendingForceDelete, setPendingForceDelete] = useState<ModuleRecord | null>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    code: true,
    name: true,
    owner: false,
    status: true,
    updated: true,
  })

  const tenantsQuery = useQuery<TenantLookupDTO[]>({
    enabled: usesTenantLookup,
    queryKey: ["admin", "tenants"],
    queryFn: () => apiGet<TenantLookupDTO[]>("/admin/tenants", "sa"),
  })
  const domainsQuery = useQuery<DomainMappingDTO[]>({
    enabled: isDomainModule,
    queryKey: ["admin", "domains"],
    queryFn: () => apiGet<DomainMappingDTO[]>("/admin/domains", "sa"),
  })
  const subscriptionsQuery = useQuery<SubscriptionDTO[]>({
    enabled: isSubscriptionModule,
    queryKey: ["admin", "subscriptions"],
    queryFn: () => apiGet<SubscriptionDTO[]>("/admin/subscriptions", "sa"),
  })
  const plansQuery = useQuery<SubscriptionPlanDTO[]>({
    enabled: isPlanModule || usesPlanLookup,
    queryKey: ["admin", "subscription-plans"],
    queryFn: () => apiGet<SubscriptionPlanDTO[]>("/admin/subscription-plans", "sa"),
  })
  const appsQuery = useQuery<PlatformAppDTO[]>({
    enabled: isAppModule,
    queryKey: ["admin", "platform-apps"],
    queryFn: () => apiGet<PlatformAppDTO[]>("/admin/platform-apps", "sa"),
  })
  const industriesQuery = useQuery<PlatformIndustryDTO[]>({
    enabled: isIndustryModule,
    queryKey: ["admin", "industries"],
    queryFn: () => apiGet<PlatformIndustryDTO[]>("/admin/industries", "sa"),
  })
  const createTenantMutation = useMutation({
    mutationFn: (name: string) => {
      const tenantCode = normalizeTenantCode(name)
      return apiPost<TenantLookupDTO>("/admin/tenants", {
        corporateId: tenantCode.toUpperCase(),
        dbName: `${tenantCode.replace(/-/g, "_")}_db`,
        slug: tenantCode,
        status: "active",
        tenantCode,
        tenantName: name,
      }, "sa")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] })
    },
  })
  const createDomainMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPost<DomainMappingDTO>("/admin/domains", toDomainApiPayload(recordItem, tenantsQuery.data ?? []), "sa"),
    onSuccess: async (domain) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "domains"] })
      const savedRecord = domainMappingToRecord(domain)
      toast.success(`${config.title} saved`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Domain save failed", { description: error instanceof Error ? error.message : "Unable to save domain." }),
  })
  const updateDomainMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPut<DomainMappingDTO>(`/admin/domains/${recordItem.id}`, toDomainApiPayload(recordItem, tenantsQuery.data ?? []), "sa"),
    onSuccess: async (domain) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "domains"] })
      const savedRecord = domainMappingToRecord(domain)
      toast.success(`${config.title} updated`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Domain update failed", { description: error instanceof Error ? error.message : "Unable to update domain." }),
  })
  const deleteDomainMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiDelete<{ deleted: boolean; domainName: string; id: string }>(`/admin/domains/${recordItem.id}`, "sa"),
    onSuccess: async (_data, recordItem) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "domains"] })
      setPendingForceDelete(null)
      setView({ mode: "list" })
      toast.success("Domain deleted", {
        description: `${recordItem.name} was permanently removed.`,
      })
    },
    onError: (error) => toast.error("Domain delete failed", { description: error instanceof Error ? error.message : "Unable to delete domain." }),
  })
  const createSubscriptionMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPost<SubscriptionDTO>("/admin/subscriptions", toSubscriptionApiPayload(recordItem, tenantsQuery.data ?? []), "sa"),
    onSuccess: async (subscription) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] })
      const savedRecord = subscriptionToRecord(subscription)
      toast.success(`${config.title} saved`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Subscription save failed", { description: error instanceof Error ? error.message : "Unable to save subscription." }),
  })
  const updateSubscriptionMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPut<SubscriptionDTO>(`/admin/subscriptions/${recordItem.id}`, toSubscriptionApiPayload(recordItem, tenantsQuery.data ?? []), "sa"),
    onSuccess: async (subscription) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] })
      const savedRecord = subscriptionToRecord(subscription)
      toast.success(`${config.title} updated`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Subscription update failed", { description: error instanceof Error ? error.message : "Unable to update subscription." }),
  })
  const createPlanMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPost<SubscriptionPlanDTO>("/admin/subscription-plans", toSubscriptionPlanApiPayload(recordItem), "sa"),
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "subscription-plans"] })
      const savedRecord = subscriptionPlanToRecord(plan)
      toast.success(`${isSubscriptionModule ? "Plan" : config.title} saved`, {
        description: `${savedRecord.name} is ready in the plan list.`,
      })
      if (isPlanModule) setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Plan save failed", { description: error instanceof Error ? error.message : "Unable to save plan." }),
  })
  const updatePlanMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPut<SubscriptionPlanDTO>(`/admin/subscription-plans/${recordItem.id}`, toSubscriptionPlanApiPayload(recordItem), "sa"),
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "subscription-plans"] })
      const savedRecord = subscriptionPlanToRecord(plan)
      toast.success(`${config.title} updated`, {
        description: `${savedRecord.name} is ready in the plan list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Plan update failed", { description: error instanceof Error ? error.message : "Unable to update plan." }),
  })
  const createAppMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPost<PlatformAppDTO>("/admin/platform-apps", toPlatformAppApiPayload(recordItem), "sa"),
    onSuccess: async (appRecord) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "platform-apps"] })
      const savedRecord = platformAppToRecord(appRecord)
      toast.success(`${config.title} saved`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("App save failed", { description: error instanceof Error ? error.message : "Unable to save app." }),
  })
  const updateAppMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPut<PlatformAppDTO>(`/admin/platform-apps/${encodeURIComponent(recordItem.id)}`, toPlatformAppApiPayload(recordItem), "sa"),
    onSuccess: async (appRecord) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "platform-apps"] })
      const savedRecord = platformAppToRecord(appRecord)
      toast.success(`${config.title} updated`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("App update failed", { description: error instanceof Error ? error.message : "Unable to update app." }),
  })
  const createIndustryMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPost<PlatformIndustryDTO>("/admin/industries", toPlatformIndustryApiPayload(recordItem), "sa"),
    onSuccess: async (industry) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "industries"] })
      const savedRecord = platformIndustryToRecord(industry)
      toast.success(`${config.title} saved`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Industry save failed", { description: error instanceof Error ? error.message : "Unable to save industry." }),
  })
  const updateIndustryMutation = useMutation({
    mutationFn: (recordItem: ModuleRecord) => apiPut<PlatformIndustryDTO>(`/admin/industries/${recordItem.id}`, toPlatformIndustryApiPayload(recordItem), "sa"),
    onSuccess: async (industry) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "industries"] })
      const savedRecord = platformIndustryToRecord(industry)
      toast.success(`${config.title} updated`, {
        description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
      })
      setView({ mode: "show", record: savedRecord })
    },
    onError: (error) => toast.error("Industry update failed", { description: error instanceof Error ? error.message : "Unable to update industry." }),
  })
  const records = isDomainModule
    ? (domainsQuery.data ?? []).map(domainMappingToRecord)
    : isSubscriptionModule
      ? (subscriptionsQuery.data ?? []).map(subscriptionToRecord)
      : isPlanModule
        ? (plansQuery.data ?? []).map(subscriptionPlanToRecord)
        : isAppModule
          ? (appsQuery.data ?? []).map(platformAppToRecord)
          : isIndustryModule
            ? (industriesQuery.data ?? []).map(platformIndustryToRecord)
            : localRecords
  const visibleListColumns = {
    ...visibleColumns,
    category: !isDomainModule,
    owner: false,
  }
  const tenantLookupOptions = useMemo(
    () => (tenantsQuery.data ?? []).map(tenantToLookupOption),
    [tenantsQuery.data],
  )
  const planLookupOptions = useMemo(
    () => (plansQuery.data ?? []).map(planToLookupOption),
    [plansQuery.data],
  )

  const filteredRecords = useMemo(() => {
    const term = searchValue.trim().toLowerCase()
    return records.filter((recordItem) => {
      const matchesSearch =
        !term ||
        [
          recordItem.name,
          recordItem.code,
          recordItem.category,
          recordItem.owner,
          recordItem.status,
          ...Object.values(recordItem.fields).map(String),
        ].some((value) => value.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "all" || recordItem.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [records, searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage))
  const pageRecords = filteredRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const filterOptions = useMemo(
    () => [
      { id: "all", label: `All ${config.actionLabel}s` },
      ...Array.from(new Set(records.map((recordItem) => recordItem.status))).map((status) => ({
        id: status,
        label: toTitle(status),
      })),
    ],
    [config.actionLabel, records],
  )

  useEffect(() => {
    if (!usesApiRecords) saveModuleRecords(storageKey, localRecords)
  }, [localRecords, storageKey, usesApiRecords])

  if (view.mode === "show") {
    const suspended = isInactive(view.record.status)
    return (
      <WorkspacePage
        title={view.record.name}
        description={`Review ${config.actionLabel} details, status, and operating context.`}
        technicalName={`page.${config.actionLabel}.show`}
        actions={
          <>
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: view.record, returnTo: "show" })}>
              <Pencil className="size-4" />
              Edit
            </Button>
            {isDomainModule ? (
              <Button type="button" variant="outline" className="h-9 rounded-md text-destructive hover:text-destructive" onClick={() => setPendingForceDelete(view.record)}>
                <Trash2 className="size-4" />
                Force delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md"
                onClick={() => {
                  const updated = { ...view.record, status: suspended ? "active" : "inactive", updated: "Today" }
                  if (isSubscriptionModule) {
                    updateSubscriptionMutation.mutate(updated)
                    return
                  }
                  if (isPlanModule) {
                    updatePlanMutation.mutate(updated)
                    return
                  }
                  if (isAppModule) {
                    updateAppMutation.mutate(updated)
                    return
                  }
                  if (isIndustryModule) {
                    updateIndustryMutation.mutate(updated)
                    return
                  }
                  setLocalRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)))
                  setView({ mode: "show", record: updated })
                  toast.info(`${config.title} updated`, { description: `${updated.name} is now ${updated.status}.` })
                }}
              >
                {suspended ? "Restore" : "Suspend"}
              </Button>
            )}
          </>
        }
      >
        <WorkspaceShowLayout>
          <WorkspaceShowCard title={`${toTitle(config.actionLabel)} profile`}>
            <WorkspaceDetailTable
              rows={[
                [config.nameLabel, view.record.name],
                [config.codeLabel, <span className="font-mono text-xs">{view.record.code}</span>],
                ...(isDomainModule ? [] : [[config.categoryLabel, view.record.category] as [string, ReactNode]]),
                ["Status", <WorkspaceStatusBadge label={view.record.status} tone={statusTone(view.record.status)} />],
                ...config.fields
                  .filter((field) => !["name", "code", "category", "status"].includes(field.key))
                  .map((field): [string, ReactNode] => [field.label, formatValue(view.record.fields[field.key])]),
              ]}
            />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Operating context">
            <WorkspaceDetailTable
              rows={[
                ["Updated", view.record.updated],
                ["Record ID", <span className="font-mono text-xs">{view.record.id}</span>],
              ]}
            />
          </WorkspaceShowCard>
        </WorkspaceShowLayout>
        <DomainForceDeleteDialog
          deleting={deleteDomainMutation.isPending}
          record={pendingForceDelete}
          onClose={() => setPendingForceDelete(null)}
          onConfirm={(recordItem) => deleteDomainMutation.mutate(recordItem)}
        />
      </WorkspacePage>
    )
  }

  if (view.mode === "upsert") {
    return (
      <ModuleUpsertPage
        config={config}
        planLookupOptions={planLookupOptions}
        records={records}
        tenantLookupOptions={tenantLookupOptions}
        onLookupCreate={async (field, value) => {
          if (usesTenantLookup && field.key === "code") {
            const tenant = await createTenantMutation.mutateAsync(value)
            return tenantToLookupOption(tenant)
          }
          if (usesPlanLookup && field.key === "name") {
            const plan = await createPlanMutation.mutateAsync({
              category: "Monthly",
              code: normalizeTenantCode(value),
              fields: { amount: "", category: "Monthly", code: normalizeTenantCode(value), currency: "INR", description: "", name: value, seats: "1", status: "active" },
              id: "",
              name: value,
              owner: "",
              status: "active",
              updated: "Today",
            })
            return planToLookupOption(plan)
          }
          return undefined
        }}
        record={view.record}
        onBack={() => setView(view.returnTo === "show" && view.record ? { mode: "show", record: view.record } : { mode: "list" })}
        onSubmit={(recordItem) => {
          const savedRecord = {
            ...recordItem,
            id: recordItem.id || `${config.actionLabel}-${Date.now()}`,
            updated: "Today",
          }
          if (isDomainModule) {
            if (recordItem.id) updateDomainMutation.mutate(savedRecord)
            else createDomainMutation.mutate(savedRecord)
            return
          }
          if (isSubscriptionModule) {
            if (recordItem.id) updateSubscriptionMutation.mutate(savedRecord)
            else createSubscriptionMutation.mutate(savedRecord)
            return
          }
          if (isPlanModule) {
            if (recordItem.id) updatePlanMutation.mutate(savedRecord)
            else createPlanMutation.mutate(savedRecord)
            return
          }
          if (isAppModule) {
            if (recordItem.id) updateAppMutation.mutate(savedRecord)
            else createAppMutation.mutate(savedRecord)
            return
          }
          if (isIndustryModule) {
            if (recordItem.id) updateIndustryMutation.mutate(savedRecord)
            else createIndustryMutation.mutate(savedRecord)
            return
          }
          setLocalRecords((current) => {
            if (recordItem.id) {
              return current.map((item) => (item.id === recordItem.id ? savedRecord : item))
            }
            return [savedRecord, ...current]
          })
          toast.success(recordItem.id ? `${config.title} updated` : `${config.title} saved`, {
            description: `${savedRecord.name} is ready in the ${config.title.toLowerCase()} list.`,
          })
          setView({ mode: "show", record: savedRecord })
        }}
      />
    )
  }

  return (
    <WorkspacePage
      title={config.title}
      description={config.description}
      technicalName={`page.${config.actionLabel}.list`}
      actions={
        <>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => {
            if (isDomainModule) void queryClient.invalidateQueries({ queryKey: ["admin", "domains"] })
            if (isSubscriptionModule) void queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] })
            if (isPlanModule) void queryClient.invalidateQueries({ queryKey: ["admin", "subscription-plans"] })
            if (isAppModule) void queryClient.invalidateQueries({ queryKey: ["admin", "platform-apps"] })
            if (isIndustryModule) void queryClient.invalidateQueries({ queryKey: ["admin", "industries"] })
            toast.info(`${config.title} refreshed`)
          }}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null, returnTo: "list" })}>
            <Plus className="size-4" />
            New {config.actionLabel}
          </Button>
        </>
      }
    >
      <WorkspaceFilters
        columnOptions={[
          { id: "name", label: config.nameLabel, checked: visibleListColumns.name, onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, name: checked })) },
          { id: "code", label: config.codeLabel, checked: visibleListColumns.code, onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, code: checked })) },
          ...(isDomainModule ? [] : [
            { id: "category", label: config.categoryLabel, checked: visibleListColumns.category, onCheckedChange: (checked: boolean) => setVisibleColumns((current) => ({ ...current, category: checked })) },
          ]),
          { id: "status", label: "Status", checked: visibleListColumns.status, onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, status: checked })) },
          { id: "updated", label: "Updated", checked: visibleListColumns.updated, onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, updated: checked })) },
        ]}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterValueChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}
        onSearchValueChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onShowAllColumns={() => setVisibleColumns({ category: !isDomainModule, code: true, name: true, owner: false, status: true, updated: true })}
        searchPlaceholder={config.searchPlaceholder}
        searchValue={searchValue}
      />
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <Header>#</Header>
                {visibleListColumns.name ? <Header>{config.nameLabel}</Header> : null}
                {visibleListColumns.code ? <Header>{config.codeLabel}</Header> : null}
                {visibleListColumns.category ? <Header>{config.categoryLabel}</Header> : null}
                {visibleListColumns.status ? <Header>Status</Header> : null}
                {visibleListColumns.updated ? <Header>Updated</Header> : null}
                <Header className="text-right">Action</Header>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((recordItem, index) => (
                <tr key={recordItem.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  {visibleListColumns.name ? (
                    <td className="px-4 py-2.5">
                      <button className="max-w-72 cursor-pointer truncate font-medium hover:underline" type="button" onClick={() => setView({ mode: "show", record: recordItem })}>
                        {recordItem.name}
                      </button>
                    </td>
                  ) : null}
                  {visibleListColumns.code ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{recordItem.code}</td> : null}
                  {visibleListColumns.category ? <td className="px-4 py-2.5">{recordItem.category}</td> : null}
                  {visibleListColumns.status ? (
                    <td className="px-4 py-2.5">
                      <WorkspaceStatusBadge label={recordItem.status} tone={statusTone(recordItem.status)} />
                    </td>
                  ) : null}
                  {visibleListColumns.updated ? <td className="px-4 py-2.5 text-muted-foreground">{recordItem.updated}</td> : null}
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={recordItem.name}
                      deleteLabel={isDomainModule ? "Force delete" : "Suspend"}
                      isSuspended={!isDomainModule && isInactive(recordItem.status)}
                      restoreLabel="Restore"
                      onDelete={() => {
                        if (isDomainModule) {
                          setPendingForceDelete(recordItem)
                          return
                        }
                        toggleRecordStatus(recordItem, "inactive")
                      }}
                      onEdit={() => setView({ mode: "upsert", record: recordItem, returnTo: "list" })}
                      onView={() => setView({ mode: "show", record: recordItem })}
                      {...(!isDomainModule ? { onRestore: () => toggleRecordStatus(recordItem, "active") } : {})}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageRecords.length === 0 ? <WorkspaceTableEmptyState>{config.emptyLabel}</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredRecords.length)}
        singularLabel={`${config.actionLabel}s`}
        totalCount={filteredRecords.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setCurrentPage(1)
        }}
      />
      <DomainForceDeleteDialog
        deleting={deleteDomainMutation.isPending}
        record={pendingForceDelete}
        onClose={() => setPendingForceDelete(null)}
        onConfirm={(recordItem) => deleteDomainMutation.mutate(recordItem)}
      />
    </WorkspacePage>
  )

  function toggleRecordStatus(recordItem: ModuleRecord, status: string) {
    const updated = { ...recordItem, status, updated: "Today" }
    if (isDomainModule) {
      updateDomainMutation.mutate(updated)
      return
    }
    if (isSubscriptionModule) {
      updateSubscriptionMutation.mutate(updated)
      return
    }
    if (isPlanModule) {
      updatePlanMutation.mutate(updated)
      return
    }
    if (isAppModule) {
      updateAppMutation.mutate(updated)
      return
    }
    if (isIndustryModule) {
      updateIndustryMutation.mutate(updated)
      return
    }
    setLocalRecords((current) => current.map((item) => (item.id === recordItem.id ? updated : item)))
    toast.info(`${config.title} updated`, { description: `${updated.name} is now ${updated.status}.` })
  }
}

function ModuleUpsertPage({
  config,
  onBack,
  onLookupCreate,
  onSubmit,
  planLookupOptions,
  records,
  record,
  tenantLookupOptions,
}: {
  config: ModuleConfig
  onBack: () => void
  onLookupCreate?: ((field: ModuleField, value: string) => Promise<WorkspaceLookupOption | undefined>) | undefined
  onSubmit: (record: ModuleRecord) => void
  planLookupOptions: WorkspaceLookupOption[]
  records: ModuleRecord[]
  record: ModuleRecord | null
  tenantLookupOptions: WorkspaceLookupOption[]
}) {
  const isEdit = Boolean(record)
  const [form, setForm] = useState<Record<string, string | boolean>>(() => ({
    category: record?.category ?? "",
    code: record?.code ?? "",
    name: record?.name ?? "",
    owner: record?.owner ?? config.records[0]?.owner ?? "Platform",
    status: record?.status ?? "active",
    ...record?.fields,
  }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved: ModuleRecord = {
      category: String(form.category ?? ""),
      code: String(form.code ?? ""),
      fields: Object.fromEntries(config.fields.map((field) => [field.key, form[field.key] ?? ""])),
      id: record?.id ?? "",
      name: String(form.name ?? ""),
      owner: String(form.owner ?? "Platform"),
      status: String(form.status ?? "active"),
      updated: record?.updated ?? "Today",
    }
    onSubmit(saved)
  }

  return (
    <WorkspaceUpsertPage
      title={isEdit ? `Edit ${config.actionLabel}` : `New ${config.actionLabel}`}
      description={`${isEdit ? "Update" : "Create"} ${config.actionLabel} details using the shared workspace form pattern.`}
      action={
        <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
          <X className="size-4" />
          Cancel
        </Button>
      }
    >
      <form onSubmit={submit}>
        <WorkspaceFormPanel
          title={`${toTitle(config.actionLabel)} details`}
          description="Keep identity, status, and operational context in the same structure across modules."
          footer={
            <>
              <Button type="submit" className="rounded-md bg-foreground text-background hover:bg-foreground/90">
                <Save className="size-4" />
                {isEdit ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            {config.fields.map((field) => (
              <WorkspaceFormField key={field.key} label={field.label}>
                <FieldInput
                  field={field}
                  onLookupCreate={onLookupCreate}
                  planLookupOptions={planLookupOptions}
                  records={records}
                  tenantLookupOptions={tenantLookupOptions}
                  value={form[field.key] ?? ""}
                  onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                />
              </WorkspaceFormField>
            ))}
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      </form>
    </WorkspaceUpsertPage>
  )
}

function FieldInput({
  field,
  onChange,
  onLookupCreate,
  planLookupOptions,
  records,
  tenantLookupOptions,
  value,
}: {
  field: ModuleField
  onChange: (value: string | boolean) => void
  onLookupCreate?: ((field: ModuleField, value: string) => Promise<WorkspaceLookupOption | undefined>) | undefined
  planLookupOptions: WorkspaceLookupOption[]
  records: ModuleRecord[]
  tenantLookupOptions: WorkspaceLookupOption[]
  value: string | boolean
}) {
  if (field.kind === "toggle") {
    const active = Boolean(value)
    return (
      <div className={active ? "flex h-11 items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 text-emerald-800" : "flex h-11 items-center justify-between rounded-md border border-border/70 bg-muted/35 px-3 text-muted-foreground"}>
        <span className="text-sm font-medium">{active ? "Enabled" : "Disabled"}</span>
        <Switch
          checked={active}
          className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-muted-foreground/35"
          onCheckedChange={onChange}
        />
      </div>
    )
  }

  if (field.kind === "select") {
    return (
      <WorkspaceSelect
        ariaLabel={field.label}
        options={(field.options ?? statusOptions).map((option) => ({
          label: toTitle(option),
          value: option,
        }))}
        placeholder={`Select ${field.label.toLowerCase()}`}
        value={String(value)}
        onValueChange={onChange}
      />
    )
  }

  if (field.kind === "lookup") {
    return (
      <WorkspaceLookup
        createDescription={field.createDescription}
        createLabel={field.createLabel}
        createMode={field.createMode}
        createTitle={field.createTitle}
        options={
          field.key === "code" && tenantLookupOptions.length
            ? tenantLookupOptions
            : field.key === "name" && planLookupOptions.length
              ? planLookupOptions
              : buildFieldLookupOptions(field, records)
        }
        placeholder={`Search ${field.label.toLowerCase()}`}
        allowTextValue={field.allowTextValue}
        value={String(value)}
        onCreate={onLookupCreate ? (createdValue) => onLookupCreate(field, createdValue) : undefined}
        onValueChange={(nextValue) => onChange(nextValue)}
      />
    )
  }

  if (field.kind === "date") {
    return (
      <WorkspaceDatePicker
        ariaLabel={field.label}
        placeholder={`Select ${field.label.toLowerCase()}`}
        value={String(value)}
        onValueChange={onChange}
      />
    )
  }

  return (
    <Input
      className="h-11 rounded-md"
      required={field.required}
      type={field.kind === "number" ? "number" : "text"}
      value={String(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function Header({ children, className }: { children: ReactNode; className?: string }) {
  return <WorkspaceTableHeaderCell className={className}>{children}</WorkspaceTableHeaderCell>
}

function DomainForceDeleteDialog({
  deleting,
  onClose,
  onConfirm,
  record,
}: {
  deleting: boolean
  onClose: () => void
  onConfirm: (record: ModuleRecord) => void
  record: ModuleRecord | null
}) {
  const [confirmation, setConfirmation] = useState("")
  const expectedValue = record?.name ?? ""
  const confirmed = Boolean(record && confirmation.trim() === expectedValue)

  useEffect(() => {
    setConfirmation("")
  }, [record?.id])

  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => {
      if (!open && !deleting) onClose()
    }}>
      <DialogContent className="rounded-md border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Permanently delete domain</DialogTitle>
          <DialogDescription>
            This will remove the domain mapping from the database. Type the domain name to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {expectedValue}
          </div>
          <Input
            autoFocus
            aria-label="Confirm domain name"
            className="h-10 rounded-md"
            disabled={deleting}
            placeholder="Type domain name"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-md" disabled={deleting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={!confirmed || deleting || !record}
            onClick={() => {
              if (record && confirmed) onConfirm(record)
            }}
          >
            <Trash2 className="size-4" />
            {deleting ? "Deleting..." : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function record(
  id: string,
  name: string,
  code: string,
  category: string,
  status: string,
  owner: string,
  fields: Record<string, string | boolean> = {},
): ModuleRecord {
  return {
    category,
    code,
    fields: {
      category,
      code,
      name,
      owner,
      status,
      ...fields,
    },
    id,
    name,
    owner,
    status,
    updated: "Today",
  }
}

function moduleConfig(title: string, description: string, actionLabel: string, records: ModuleRecord[]): ModuleConfig {
  return {
    actionLabel,
    categoryLabel: "Category",
    codeLabel: "Code",
    description,
    emptyLabel: `No ${actionLabel}s found.`,
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "code", label: "Code", required: true },
      { key: "category", label: "Category" },
      { key: "status", label: "Status", kind: "select", options: statusOptions },
      { key: "ownerTeam", label: "Owner team" },
    ],
    nameLabel: "Name",
    records,
    searchPlaceholder: `Search ${actionLabel}, code, category, or status`,
    title,
  }
}

function loadModuleRecords(storageKey: string, fallback: ModuleRecord[]) {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as ModuleRecord[] : fallback
  } catch {
    return fallback
  }
}

function domainMappingToRecord(domain: DomainMappingDTO): ModuleRecord {
  const landingApp = domain.landingApp || "Billing"
  return {
    category: landingApp,
    code: domain.tenantCode,
    fields: {
      category: landingApp,
      code: domain.tenantCode,
      landing: landingApp,
      name: domain.domainName,
      primary: domain.isPrimary,
      status: domain.status,
    },
    id: domain.id,
    name: domain.domainName,
    owner: "",
    status: domain.status,
    updated: formatApiDate(domain.updatedAt),
  }
}

function subscriptionToRecord(subscription: SubscriptionDTO): ModuleRecord {
  const billingCycle = subscription.billingCycle || "Monthly"
  return {
    category: billingCycle,
    code: subscription.tenantCode,
    fields: {
      amount: subscription.amount === null || subscription.amount === undefined ? "" : String(subscription.amount),
      category: billingCycle,
      code: subscription.tenantCode,
      currency: subscription.currency || "INR",
      name: subscription.planName,
      notes: subscription.notes || "",
      renewal: subscription.renewsOn ? String(subscription.renewsOn).slice(0, 10) : "",
      seats: String(subscription.seats ?? 1),
      startsOn: subscription.startsOn ? String(subscription.startsOn).slice(0, 10) : "",
      status: subscription.status,
    },
    id: subscription.id,
    name: subscription.planName,
    owner: "",
    status: subscription.status,
    updated: formatApiDate(subscription.updatedAt),
  }
}

function subscriptionPlanToRecord(plan: SubscriptionPlanDTO): ModuleRecord {
  const billingCycle = plan.billingCycle || "Monthly"
  const code = normalizeTenantCode(plan.planName)
  return {
    category: billingCycle,
    code,
    fields: {
      amount: plan.amount === null || plan.amount === undefined ? "" : String(plan.amount),
      category: billingCycle,
      code,
      currency: plan.currency || "INR",
      description: plan.description || "",
      name: plan.planName,
      seats: String(plan.seats ?? 1),
      status: plan.status,
    },
    id: plan.id,
    name: plan.planName,
    owner: "",
    status: plan.status,
    updated: formatApiDate(plan.updatedAt),
  }
}

function platformAppToRecord(appRecord: PlatformAppDTO): ModuleRecord {
  return {
    category: appRecord.scope || "tenant",
    code: appRecord.moduleKey,
    fields: {
      category: appRecord.scope || "tenant",
      code: appRecord.moduleKey,
      defaultEnabled: appRecord.defaultEnabled,
      name: appRecord.displayName,
      status: appRecord.status,
      version: appRecord.version || "1.0.0",
    },
    id: appRecord.moduleKey,
    name: appRecord.displayName,
    owner: "",
    status: appRecord.status,
    updated: formatApiDate(appRecord.updatedAt),
  }
}

function platformIndustryToRecord(industry: PlatformIndustryDTO): ModuleRecord {
  return {
    category: industry.segment || "General",
    code: industry.industryCode,
    fields: {
      category: industry.segment || "General",
      code: industry.industryCode,
      name: industry.industryName,
      status: industry.status,
      template: industry.defaultTemplate || "",
    },
    id: industry.id,
    name: industry.industryName,
    owner: "",
    status: industry.status,
    updated: formatApiDate(industry.updatedAt),
  }
}

function tenantToLookupOption(tenant: TenantLookupDTO): WorkspaceLookupOption {
  return {
    description: tenant.tenantName,
    label: tenant.tenantCode,
    meta: tenant.dbName,
    value: tenant.tenantCode,
  }
}

function planToLookupOption(plan: SubscriptionPlanDTO): WorkspaceLookupOption {
  return {
    description: `${plan.billingCycle} | ${plan.seats} seats`,
    label: plan.planName,
    meta: `${plan.currency} ${plan.amount ?? 0}`,
    value: plan.planName,
  }
}

function toDomainApiPayload(recordItem: ModuleRecord, tenants: TenantLookupDTO[]) {
  const tenant = tenants.find((item) => item.tenantCode === recordItem.code)
  if (!tenant) {
    throw new Error("Select a valid tenant before saving the domain.")
  }
  return {
    domainName: recordItem.name,
    isPrimary: Boolean(recordItem.fields.primary),
    landingApp: typeof recordItem.fields.landing === "string" ? recordItem.fields.landing : null,
    status: recordItem.status,
    tenantId: tenant.id,
  }
}

function toSubscriptionPlanApiPayload(recordItem: ModuleRecord) {
  return {
    amount: emptyToNull(recordItem.fields.amount),
    billingCycle: recordItem.category || "Monthly",
    currency: typeof recordItem.fields.currency === "string" && recordItem.fields.currency ? recordItem.fields.currency : "INR",
    description: emptyToNull(recordItem.fields.description),
    planName: recordItem.name,
    seats: Number(recordItem.fields.seats) || 1,
    status: recordItem.status,
  }
}

function toSubscriptionApiPayload(recordItem: ModuleRecord, tenants: TenantLookupDTO[]) {
  const tenant = tenants.find((item) => item.tenantCode === recordItem.code)
  if (!tenant) {
    throw new Error("Select a valid tenant before saving the subscription.")
  }
  return {
    amount: emptyToNull(recordItem.fields.amount),
    billingCycle: recordItem.category,
    currency: typeof recordItem.fields.currency === "string" && recordItem.fields.currency ? recordItem.fields.currency : "INR",
    notes: emptyToNull(recordItem.fields.notes),
    planName: recordItem.name,
    renewsOn: emptyToNull(recordItem.fields.renewal),
    seats: Number(recordItem.fields.seats) || 1,
    startsOn: emptyToNull(recordItem.fields.startsOn),
    status: recordItem.status,
    tenantId: tenant.id,
  }
}

function toPlatformAppApiPayload(recordItem: ModuleRecord) {
  return {
    defaultEnabled: Boolean(recordItem.fields.defaultEnabled),
    displayName: recordItem.name,
    moduleKey: recordItem.code,
    scope: recordItem.category || "tenant",
    status: recordItem.status,
    version: typeof recordItem.fields.version === "string" && recordItem.fields.version ? recordItem.fields.version : "1.0.0",
  }
}

function toPlatformIndustryApiPayload(recordItem: ModuleRecord) {
  return {
    defaultTemplate: emptyToNull(recordItem.fields.template),
    industryCode: recordItem.code,
    industryName: recordItem.name,
    segment: recordItem.category || "General",
    status: recordItem.status,
  }
}

function emptyToNull(value: string | boolean | undefined) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeTenantCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function formatApiDate(value: string | undefined) {
  if (!value) return "Today"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Today" : date.toLocaleDateString()
}

function saveModuleRecords(storageKey: string, records: ModuleRecord[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(records))
  } catch {}
}

function buildFieldLookupOptions(field: ModuleField, records: ModuleRecord[]) {
  const baseOptions = field.lookupOptions ?? []
  const dynamicOptions: WorkspaceLookupOption[] = []
  for (const recordItem of records) {
    const option = lookupOptionFromRecordField(field, recordItem)
    if (option) dynamicOptions.push(option)
  }
  const optionMap = new Map<string, WorkspaceLookupOption>()
  for (const option of [...baseOptions, ...dynamicOptions]) {
    optionMap.set(option.value, option)
  }
  return Array.from(optionMap.values())
}

function lookupOptionFromRecordField(field: ModuleField, recordItem: ModuleRecord) {
  const rawValue =
    field.key === "name" ? recordItem.name :
    field.key === "code" ? recordItem.code :
    field.key === "category" ? recordItem.category :
    recordItem.fields[field.key]
  if (typeof rawValue !== "string" || !rawValue.trim()) return null
  const option: WorkspaceLookupOption = {
    label: rawValue,
    value: rawValue,
  }
  if (field.key === "code") {
    option.description = `${recordItem.name} mapping`
    option.meta = recordItem.owner
  }
  return option
}

function statusTone(status: string) {
  if (status === "active" || status === "configured") return "success"
  if (status === "pending" || status === "planned" || status === "review") return "warning"
  if (status === "inactive" || status === "suspended") return "danger"
  return "neutral"
}

function isInactive(status: string) {
  return status === "inactive" || status === "suspended"
}

function toTitle(value: string) {
  return value
    .split(/[-_\s.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatValue(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  return value || "Not set"
}
