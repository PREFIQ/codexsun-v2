import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codexsun/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs"
import { Textarea } from "@codexsun/ui/components/textarea"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert"
import { cn } from "@codexsun/ui/lib/utils"
import { CommonRecordAutocomplete } from "@codexsun/core-web/components/CommonRecordAutocomplete"
import { apiGet, apiPost, apiPut, getTenantId } from "../../api"

type CompanyRecord = {
  companyId: string
  tenantId: string
  legalName: string
  tradeName?: string
  companyGroupId?: string
  phone: Array<{ phoneId: string; label: string; number: string; isPrimary: boolean }>
  email: Array<{ emailId: string; label: string; address: string; isPrimary: boolean }>
  addresses: Array<{
    addressId: string
    tenantId: string
    label: string
    line1: string
    line2?: string
    country: string
    state?: string
    district?: string
    city?: string
    pincode?: string
    gstStateCode?: string
    isDefault: boolean
    addressType: string
    createdAt: string
    updatedAt: string
  }>
  bankAccounts: Array<{
    accountId: string
    accountHolderName: string
    accountNumber: string
    accountTypeId?: string
    ifscCode: string
    bankName?: string
    branchName?: string
    isDefault: boolean
  }>
  taxIdentities: Array<{ taxId: string; type: "gstin" | "pan" | "tan" | "cin" | "other"; value: string; isDefault: boolean }>
  website?: string
  logoUrl?: string
  logoDarkUrl?: string
  faviconUrl?: string
  notes?: string
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}

type CompanyPhone = CompanyRecord["phone"][number]
type CompanyEmail = CompanyRecord["email"][number]
type CompanyAddress = CompanyRecord["addresses"][number]
type CompanyBankAccount = CompanyRecord["bankAccounts"][number]
type CompanyTaxIdentity = CompanyRecord["taxIdentities"][number] & { rowId?: string }
type CompanySocialLink = {
  id: string
  platform: string
  url: string
  isActive: boolean
}

type CompanyForm = {
  legalName: string
  tradeName: string
  companyGroupId: string
  tenantId: string
  industry: string
  gstin: string
  msmeNo: string
  msmeType: string
  tdsAvailable: boolean
  tcsAvailable: boolean
  taxIdentities: CompanyTaxIdentity[]
  emails: CompanyEmail[]
  phones: CompanyPhone[]
  website: string
  addresses: CompanyAddress[]
  bankAccounts: CompanyBankAccount[]
  socialLinks: CompanySocialLink[]
  logoUrl: string
  logoDarkUrl: string
  faviconUrl: string
  notes: string
  isActive: boolean
}

type AppModuleKey = "default-company" | "users" | "roles" | "permissions" | "settings" | "landing" | "accounting-year"

type PermissionKey =
  | "application.company.view"
  | "application.company.manage"
  | "application.accounting-year.manage"
  | "application.users.manage"
  | "application.roles.manage"
  | "application.settings.manage"
  | "billing.entries.manage"
  | "billing.masters.manage"
  | "billing.common.manage"

type ApplicationRoleRecord = {
  id: string
  name: string
  code: string
  description: string
  permissions: PermissionKey[]
  status: "active" | "archived"
  updatedAt: string
}

type ApplicationUserRecord = {
  id: string
  name: string
  email: string
  mobile: string
  roleId: string
  status: "active" | "archived"
  updatedAt: string
}

type ApplicationSettingsRecord = {
  appName: string
  defaultTimezone: string
  enforceTwoFactor: boolean
  allowUserInvites: boolean
  invoicePrefix: string
  autoLockMinutes: string
  updatedAt: string
}

type LocalRecord = {
  id: string
  name: string
  code: string
  category: string
  email?: string | undefined
  description?: string | undefined
  fromDate?: string | undefined
  isDefault?: boolean | undefined
  toDate?: string | undefined
  status: "active" | "archived"
  updatedAt: string
}

const appModuleMeta: Record<AppModuleKey, { title: string; description: string; icon: typeof Building2; seed: LocalRecord[] }> = {
  "default-company": {
    title: "Default Company",
    description: "Choose the company used first across Application and Billing desks.",
    icon: Building2,
    seed: [{ id: "default-company-main", name: "Primary company", code: "DEFAULT", category: "Application", status: "active", updatedAt: new Date().toISOString() }],
  },
  "accounting-year": {
    title: "Accounting Year",
    description: "Open, close, and switch active accounting years.",
    icon: CalendarDays,
    seed: [{ id: "ay-2026", name: "FY 2026-27", code: "2026-27", category: "Open", fromDate: "2026-04-01", isDefault: true, status: "active", toDate: "2027-03-31", updatedAt: new Date().toISOString() }],
  },
  users: {
    title: "Users",
    description: "Manage application users and desk access.",
    icon: UsersRound,
    seed: [{ id: "user-admin", name: "Admin", code: "ADMIN", category: "Owner", email: "admin@tenant.com", status: "active", updatedAt: new Date().toISOString() }],
  },
  roles: {
    title: "Roles",
    description: "Manage application roles and permissions.",
    icon: ShieldCheck,
    seed: [
      { id: "role-owner", name: "Owner", code: "owner", category: "System", status: "active", updatedAt: new Date().toISOString() },
      { id: "role-manager", name: "Manager", code: "manager", category: "Business", status: "active", updatedAt: new Date().toISOString() },
      { id: "role-operator", name: "Operator", code: "operator", category: "Business", status: "active", updatedAt: new Date().toISOString() },
    ],
  },
  permissions: {
    title: "Permissions",
    description: "Review permission boundaries used by application roles.",
    icon: LockKeyhole,
    seed: [],
  },
  settings: {
    title: "Settings",
    description: "Application-level billing and workspace settings.",
    icon: Settings2,
    seed: [
      { id: "setting-numbering", name: "Document numbering", code: "DOC_NO", category: "Billing", status: "active", updatedAt: new Date().toISOString() },
      { id: "setting-tax", name: "Tax behaviour", code: "TAX", category: "Finance", status: "active", updatedAt: new Date().toISOString() },
    ],
  },
  landing: {
    title: "Landing Desk",
    description: "Application desk landing and quick access area.",
    icon: UserRoundCog,
    seed: [{ id: "landing-main", name: "Application launch", code: "LANDING", category: "Workspace", status: "active", updatedAt: new Date().toISOString() }],
  },
}

export const DEFAULT_COMPANY_BINDING_KEY = "codexsun_application_default_company_binding"

export type DefaultCompanyBinding = {
  accountingYearId: string
  accountingYearName: string
  companyId: string
  companyName: string
  updatedAt: string
}

const companyTabs: Array<[string, string]> = [
  ["details", "Details"],
  ["tax", "Tax Details"],
  ["communication", "Communication"],
  ["addresses", "Addresses"],
  ["finance", "Finance"],
  ["logo", "Logo"],
  ["more", "More"],
]

const companyEmailTypes = ["Primary", "Work", "Billing", "Support", "Other"]
const companyPhoneTypes = ["Primary", "Mobile", "Office", "Support", "Other"]
const companyAddressTypes = ["Registered", "Billing", "Shipping", "Branch", "Other"]
const companyTaxTypes: CompanyTaxIdentity["type"][] = ["gstin", "pan", "tan", "cin", "other"]
const msmeCategories = ["Micro", "Small", "Medium"]
const socialPlatforms = ["Website", "LinkedIn", "Facebook", "Instagram", "X", "YouTube", "Other"]

const permissionGroups: Array<{ label: string; permissions: Array<{ key: PermissionKey; label: string }> }> = [
  {
    label: "Application",
    permissions: [
      { key: "application.company.view", label: "View company" },
      { key: "application.company.manage", label: "Manage company" },
      { key: "application.accounting-year.manage", label: "Manage accounting year" },
      { key: "application.users.manage", label: "Manage users" },
      { key: "application.roles.manage", label: "Manage roles" },
      { key: "application.settings.manage", label: "Manage settings" },
    ],
  },
  {
    label: "Billing",
    permissions: [
      { key: "billing.entries.manage", label: "Manage entries" },
      { key: "billing.masters.manage", label: "Manage masters" },
      { key: "billing.common.manage", label: "Manage common data" },
    ],
  },
]

const defaultRoleRecords: ApplicationRoleRecord[] = [
  { id: "role-owner", name: "Owner", code: "OWNER", description: "Full application and billing access.", permissions: permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.key)), status: "active", updatedAt: new Date().toISOString() },
  { id: "role-manager", name: "Manager", code: "MANAGER", description: "Can manage daily application and billing work.", permissions: ["application.company.view", "billing.entries.manage", "billing.masters.manage", "billing.common.manage"], status: "active", updatedAt: new Date().toISOString() },
  { id: "role-operator", name: "Operator", code: "OPERATOR", description: "Entry and lookup access for regular work.", permissions: ["application.company.view", "billing.entries.manage"], status: "active", updatedAt: new Date().toISOString() },
]

const defaultUserRecords: ApplicationUserRecord[] = [
  { id: "user-admin", name: "Admin", email: "admin@tenant.com", mobile: "+91-9876543210", roleId: "role-owner", status: "active", updatedAt: new Date().toISOString() },
]

const defaultSettingsRecord: ApplicationSettingsRecord = {
  appName: "Application Desk",
  defaultTimezone: "Asia/Calcutta",
  enforceTwoFactor: false,
  allowUserInvites: true,
  invoicePrefix: "INV",
  autoLockMinutes: "30",
  updatedAt: new Date().toISOString(),
}

export function ApplicationCompanyPage(_props: { onBack?: () => void }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"list" | "show" | "form">("list")
  const [editing, setEditing] = useState<CompanyRecord | null>(null)
  const [viewing, setViewing] = useState<CompanyRecord | null>(null)
  const [query, setQuery] = useState("")
  const companiesQuery = useQuery({
    queryKey: ["tenant", "companies"],
    queryFn: () => apiGet<CompanyRecord[]>("/core/companies", "tenant"),
  })
  const companies = companiesQuery.data ?? []
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return companies
    return companies.filter((company) =>
      [company.legalName, company.tradeName, company.companyGroupId, company.tenantId, company.email?.[0]?.address, company.phone?.[0]?.number, company.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [companies, query])

  if (mode === "show" && viewing) {
    return (
      <CompanyShowPage
        record={viewing}
        onBack={() => {
          setViewing(null)
          setMode("list")
        }}
        onEdit={() => {
          setEditing(viewing)
          setViewing(null)
          setMode("form")
        }}
        onArchive={() => archiveCompany(viewing, queryClient)}
        onRestore={() => restoreCompany(viewing, queryClient)}
      />
    )
  }

  if (mode === "form") {
    return (
      <CompanyUpsertPage
        key={editing?.companyId ?? "new"}
        record={editing}
        onCancel={() => {
          setEditing(null)
          setViewing(null)
          setMode("list")
        }}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ["tenant", "companies"] })
          setEditing(null)
          setViewing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage
      title="Company"
      description="Manage company identity, tenant context, address, tax, and bank details."
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => void companiesQuery.refetch()}>
            <RefreshCw className={cn("size-4", companiesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" onClick={() => { setEditing(null); setViewing(null); setMode("form") }}>
            <Plus className="size-4" />
            New company
          </Button>
        </>
      }
    >
      <WorkspaceFilters searchValue={query} onSearchValueChange={setQuery} />
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company Group</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="w-24 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company, index) => (
                <tr key={company.companyId} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => {
                        setViewing(company)
                        setEditing(null)
                        setMode("show")
                      }}
                    >
                      {company.tradeName || company.legalName}
                    </button>
                    {company.tradeName ? <div className="text-xs text-muted-foreground">{company.legalName}</div> : null}
                  </td>
                  <td className="px-4 py-3">{company.companyGroupId || "-"}</td>
                  <td className="px-4 py-3">{company.notes ? readMeta(company.notes).industry || "General" : "General"}</td>
                  <td className="px-4 py-3">{company.phone?.[0]?.number ?? ""}</td>
                  <td className="px-4 py-3">{company.email?.[0]?.address ?? ""}</td>
                  <td className="px-4 py-3">{company.taxIdentities.find((tax) => tax.type === "gstin")?.value ?? ""}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusBadge label={company.status} tone={company.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(company.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <WorkspaceRowActions
                      title={company.legalName}
                      isSuspended={company.status === "archived"}
                      onEdit={() => {
                        setEditing(company)
                        setMode("form")
                      }}
                      onDelete={() => archiveCompany(company, queryClient)}
                      onRestore={() => restoreCompany(company, queryClient)}
                    />
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {companiesQuery.isLoading ? "Loading companies..." : "No companies found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <WorkspacePagination
        page={1}
        rowsPerPage={100}
        showingLabel={`Showing ${filtered.length ? 1 : 0} to ${filtered.length} of ${filtered.length}`}
        singularLabel="companies"
        totalCount={filtered.length}
        totalPages={1}
        onPageChange={() => undefined}
        onRowsPerPageChange={() => undefined}
      />
    </WorkspacePage>
  )
}

function CompanyShowPage({
  onArchive,
  onBack,
  onEdit,
  onRestore,
  record,
}: {
  onArchive: () => void
  onBack: () => void
  onEdit: () => void
  onRestore: () => void
  record: CompanyRecord
}) {
  const meta = readMeta(record.notes)
  const isArchived = record.status === "archived"
  return (
    <WorkspacePage
      title={record.tradeName || record.legalName}
      description={record.legalName}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" onClick={onEdit}>
            <Save className="size-4" />
            Edit
          </Button>
          <Button type="button" variant={isArchived ? "outline" : "destructive"} onClick={isArchived ? onRestore : onArchive}>
            <Trash2 className="size-4" />
            {isArchived ? "Restore" : "Suspend"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <CompanyDetailCard
          title="Company profile"
          rows={[
            ["Legal name", record.legalName],
            ["Trade name", record.tradeName],
            ["Company group", record.companyGroupId],
            ["Industry", meta.industry || "General"],
            ["Website", record.website],
            ["Logo", record.logoUrl ? "Set" : ""],
            ["Logo dark", record.logoDarkUrl ? "Set" : ""],
            ["Favicon", record.faviconUrl ? "Set" : ""],
            ["Status", <WorkspaceStatusBadge key="status" label={record.status} tone={record.status === "active" ? "success" : "danger"} />],
          ]}
        />
        <CompanyDetailCard
          title="Compliance"
          rows={[
            ["GSTIN", record.taxIdentities.find((tax) => tax.type === "gstin")?.value],
            ["PAN", record.taxIdentities.find((tax) => tax.type === "pan")?.value],
            ["TAN", record.taxIdentities.find((tax) => tax.type === "tan")?.value],
            ["CIN", record.taxIdentities.find((tax) => tax.type === "cin")?.value],
            ["MSME", [meta.msmeType, meta.msmeNo].filter(Boolean).join(" - ")],
            ["TDS", meta.tdsAvailable ? "Yes" : "No"],
            ["TCS", meta.tcsAvailable ? "Yes" : "No"],
          ]}
        />
        <CompanyMiniList title="Emails" rows={record.email.map((email) => [email.address, email.label, email.isPrimary ? "Primary" : ""])} />
        <CompanyMiniList title="Phones" rows={record.phone.map((phone) => [phone.number, phone.label, phone.isPrimary ? "Primary" : ""])} />
        <CompanyMiniList title="Addresses" rows={record.addresses.map((address) => [address.line1 || "-", [address.city, address.state, address.pincode].filter(Boolean).join(", "), address.isDefault ? "Default" : ""])} />
        <CompanyMiniList title="Bank accounts" rows={record.bankAccounts.map((bank) => [bank.bankName || "-", bank.accountNumber, bank.isDefault ? "Primary" : ""])} />
        <CompanyMiniList title="Social links" rows={meta.socialLinks.map((link) => [link.platform, link.url, link.isActive ? "Active" : "Inactive"])} />
        <CompanyDetailCard title="Timestamps" rows={[["Created", formatDate(record.createdAt)], ["Updated", formatDate(record.updatedAt)]]} />
      </div>
    </WorkspacePage>
  )
}

function CompanyDetailCard({ rows, title }: { rows: Array<[string, ReactNode]>; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3 text-base font-semibold">{title}</div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-border last:border-0">
              <th className="w-44 bg-muted/35 px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">{label}</th>
              <td className="px-4 py-3">{value || "Not set"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompanyMiniList({ rows, title }: { rows: string[][]; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3 text-base font-semibold">{title}</div>
      {rows.length ? (
        <div className="divide-y divide-border">
          {rows.map((row, index) => (
            <div key={`${title}-${index}`} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-3">
              {row.map((cell, cellIndex) => (
                <span key={cellIndex} className={cellIndex === 0 ? "font-medium" : "text-muted-foreground"}>
                  {cell || "-"}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No records found.</div>
      )}
    </div>
  )
}

export function ApplicationDefaultCompanyPage({ onBack }: { onBack?: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [binding, setBinding] = useDefaultCompanyBinding()
  const [draft, setDraft] = useState<DefaultCompanyBinding>(() => binding)
  const companiesQuery = useQuery({
    queryKey: ["tenant", "companies"],
    queryFn: () => apiGet<CompanyRecord[]>("/core/companies", "tenant"),
  })
  const [accountingYears] = useLocalRecords("accounting-year", appModuleMeta["accounting-year"].seed)
  const companies = companiesQuery.data ?? []
  const selectedCompany = companies.find((company) => company.companyId === binding.companyId)
  const selectedYear = accountingYears.find((year) => year.id === binding.accountingYearId)

  useEffect(() => {
    if (!isEditing) setDraft(binding)
  }, [binding, isEditing])

  function updateBinding() {
    const company = companies.find((item) => item.companyId === draft.companyId)
    const year = accountingYears.find((item) => item.id === draft.accountingYearId)
    const nextBinding: DefaultCompanyBinding = {
      accountingYearId: year?.id ?? draft.accountingYearId,
      accountingYearName: year?.name ?? draft.accountingYearName,
      companyId: company?.companyId ?? draft.companyId,
      companyName: company?.tradeName || company?.legalName || draft.companyName,
      updatedAt: new Date().toISOString(),
    }
    setBinding(nextBinding)
    window.dispatchEvent(new CustomEvent("codexsun-default-company-updated", { detail: nextBinding }))
    toast.success("Default company updated")
    setIsEditing(false)
  }

  return (
    <WorkspacePage
      title="Default Company"
      description="Bind the active company and accounting year used by Application and Billing desks."
      actions={
        <>
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void companiesQuery.refetch()}>
            <RefreshCw className={cn("size-4", companiesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Company and accounting year binding</h2>
        </div>
        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <Label>Default company</Label>
            {isEditing ? (
              <Select value={draft.companyId} onValueChange={(companyId) => setDraft((current) => ({ ...current, companyId }))}>
                <SelectTrigger className="h-11 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.companyId} value={company.companyId}>
                      {company.tradeName || company.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <ReadOnlyValue primary={selectedCompany?.tradeName || selectedCompany?.legalName || binding.companyName || "No company selected"} secondary={selectedCompany?.tenantId ? `Tenant ${shortId(selectedCompany.tenantId)}` : "Open edit to select company"} />
            )}
          </div>
          <div className="grid gap-2">
            <Label>Accounting year</Label>
            {isEditing ? (
              <Select value={draft.accountingYearId} onValueChange={(accountingYearId) => setDraft((current) => ({ ...current, accountingYearId }))}>
                <SelectTrigger className="h-11 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountingYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <ReadOnlyValue primary={selectedYear?.name || binding.accountingYearName || "No accounting year selected"} secondary={selectedYear?.code || "Open edit to select accounting year"} />
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <Button type="button" onClick={updateBinding}>
                  <Save className="size-4" />
                  Update
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="size-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                <Settings2 className="size-4" />
                Edit switch
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-border bg-muted/20 px-6 py-4 text-sm text-muted-foreground">
          Active desk context: <span className="font-medium text-foreground">{selectedCompany?.tradeName || selectedCompany?.legalName || binding.companyName || "Company not set"}</span>
          <span className="px-2">/</span>
          <span className="font-medium text-foreground">{selectedYear?.name || binding.accountingYearName || "Accounting year not set"}</span>
        </div>
      </div>
    </WorkspacePage>
  )
}

function CompanyUpsertPage({ onCancel, onSaved, record }: { onCancel: () => void; onSaved: () => void; record: CompanyRecord | null }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CompanyForm>(() => companyToForm(record))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const hasErrors = Object.keys(errors).length > 0
  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.legalName.trim()) {
        setErrors({ legalName: "Legal name is required" })
        toast.error("Legal name is required")
        throw new Error("Validation failed")
      }
      setErrors({})
      const payload = companyPayload(form, record)
      const saved = record
        ? await apiPut<CompanyRecord>(`/core/companies/${record.companyId}`, payload, "tenant")
        : await apiPost<CompanyRecord>("/core/companies", payload, "tenant")
      if (record && record.status === "archived" && form.isActive) await apiPost(`/core/companies/${record.companyId}/restore`, undefined, "tenant")
      if (record && record.status === "active" && !form.isActive) await apiPost(`/core/companies/${record.companyId}/archive`, undefined, "tenant")
      if (!record && !form.isActive) await apiPost(`/core/companies/${saved.companyId}/archive`, undefined, "tenant")
      return saved
    },
    onSuccess: () => {
      toast.success(record ? "Company updated" : "Company created")
      void queryClient.invalidateQueries({ queryKey: ["tenant", "companies"] })
      onSaved()
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Validation failed") return
      toast.error(error instanceof Error ? error.message : "Company save failed")
    },
  })

  return (
    <WorkspacePage
      title={record ? "Edit company" : "New company"}
      description="Update company identity, tax, communication, address, and finance details."
      actions={
        <Button type="button" variant="outline" onClick={onCancel}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        {hasErrors ? (
          <WorkspaceFormBanner title="Required fields" tone="error">
            Fill the required fields before saving.
          </WorkspaceFormBanner>
        ) : null}
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
          <Tabs defaultValue="details">
            <div className="border-b border-border px-6 pt-2">
              <TabsList className="h-auto rounded-none bg-transparent p-0">
                {companyTabs.map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="details" className="m-0">
              <SectionShell>
                <div className="grid items-end gap-5 md:grid-cols-2">
                  <TextField label="Legal name" required value={form.legalName} error={errors.legalName} onChange={(legalName) => updateForm(setForm, { legalName })} />
                  <TextField label="Trade name" value={form.tradeName} onChange={(tradeName) => updateForm(setForm, { tradeName })} />
                  <LookupField definitionKey="company-groups" label="Company Group" value={form.companyGroupId} onChange={(companyGroupId) => updateForm(setForm, { companyGroupId })} />
                  <TextField label="GSTIN" value={form.gstin} onChange={(gstin) => updateForm(setForm, { gstin: gstin.toUpperCase() })} />
                  <TextField label="Tenant" value={form.tenantId} onChange={(tenantId) => updateForm(setForm, { tenantId })} />
                  <TextField label="Industry" value={form.industry} onChange={(industry) => updateForm(setForm, { industry })} />
                  <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => updateForm(setForm, { isActive })} className="md:col-span-2" />
                </div>
              </SectionShell>
            </TabsContent>

            <TabsContent value="tax" className="m-0">
              <SectionShell className="grid gap-5">
                <div className="grid items-end gap-5 md:grid-cols-2">
                  <TextField label="MSME No" value={form.msmeNo} onChange={(msmeNo) => updateForm(setForm, { msmeNo })} />
                  <SelectField label="MSME Category" value={form.msmeType} options={msmeCategories} onChange={(msmeType) => updateForm(setForm, { msmeType })} />
                  <StatusCard label="TDS Available" checked={form.tdsAvailable} onChange={(tdsAvailable) => updateForm(setForm, { tdsAvailable })} />
                  <StatusCard label="TCS Available" checked={form.tcsAvailable} onChange={(tcsAvailable) => updateForm(setForm, { tcsAvailable })} />
                </div>
                <CollectionCard title="Taxation" onAdd={() => setForm((current) => ({ ...current, taxIdentities: [...current.taxIdentities, emptyTaxIdentity("other")] }))}>
                  {form.taxIdentities.map((tax, index) => (
                    <div key={tax.rowId ?? tax.taxId ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <SelectField label="Tax type" value={tax.type} options={companyTaxTypes} onChange={(type) => updateArray(setForm, "taxIdentities", index, { type: type as CompanyTaxIdentity["type"] })} />
                      <TextField label="Tax value" value={tax.value} onChange={(value) => updateArray(setForm, "taxIdentities", index, { value: value.toUpperCase() })} />
                      <StatusCard label="Default" checked={tax.isDefault} onChange={(value) => updatePrimary(setForm, "taxIdentities", index, value, "isDefault")} />
                      <RemoveButton label="Remove tax" onClick={() => removeArrayItem(setForm, "taxIdentities", index, emptyTaxIdentity("pan", true))} />
                    </div>
                  ))}
                </CollectionCard>
              </SectionShell>
            </TabsContent>

            <TabsContent value="communication" className="m-0">
              <SectionShell className="grid gap-5">
                <CollectionCard title="Company Emails" onAdd={() => setForm((current) => ({ ...current, emails: [...current.emails, emptyEmail(current.emails.length === 0)] }))}>
                  {form.emails.map((email, index) => (
                    <div key={email.emailId ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <TextField label="Email" value={email.address} onChange={(address) => updateArray(setForm, "emails", index, { address })} />
                      <SelectField label="Email type" value={email.label} options={companyEmailTypes} onChange={(label) => updateArray(setForm, "emails", index, { label })} />
                      <StatusCard label="Primary" checked={email.isPrimary} onChange={(value) => updatePrimary(setForm, "emails", index, value)} />
                      <RemoveButton label="Remove email" onClick={() => removeArrayItem(setForm, "emails", index, emptyEmail(true))} />
                    </div>
                  ))}
                </CollectionCard>

                <CollectionCard title="Company Phones" onAdd={() => setForm((current) => ({ ...current, phones: [...current.phones, emptyPhone(current.phones.length === 0)] }))}>
                  {form.phones.map((phone, index) => (
                    <div key={phone.phoneId ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <TextField label="Phone" value={phone.number} onChange={(number) => updateArray(setForm, "phones", index, { number })} />
                      <SelectField label="Phone type" value={phone.label} options={companyPhoneTypes} onChange={(label) => updateArray(setForm, "phones", index, { label })} />
                      <StatusCard label="Primary" checked={phone.isPrimary} onChange={(value) => updatePrimary(setForm, "phones", index, value)} />
                      <RemoveButton label="Remove phone" onClick={() => removeArrayItem(setForm, "phones", index, emptyPhone(true))} />
                    </div>
                  ))}
                </CollectionCard>
              </SectionShell>
            </TabsContent>

            <TabsContent value="addresses" className="m-0">
              <SectionShell>
                <CollectionCard title="Addresses" onAdd={() => setForm((current) => ({ ...current, addresses: [...current.addresses, emptyAddress(current.addresses.length === 0)] }))}>
                  {form.addresses.map((address, index) => (
                    <div key={address.addressId ?? index} className="grid items-end gap-5 rounded-md border border-border p-4 md:grid-cols-2">
                      <SelectField label="Address type" value={address.addressType} options={companyAddressTypes} onChange={(addressType) => updateArray(setForm, "addresses", index, { addressType, label: addressType })} />
                      <div className="flex items-end justify-end">
                        <RemoveButton label="Remove address" onClick={() => removeArrayItem(setForm, "addresses", index, emptyAddress(true))} />
                      </div>
                      <TextField className="md:col-span-2" label="Address line 1" value={address.line1} onChange={(line1) => updateArray(setForm, "addresses", index, { line1 })} />
                      <TextField className="md:col-span-2" label="Address line 2" value={address.line2 ?? ""} onChange={(line2) => updateArray(setForm, "addresses", index, { line2 })} />
                      <LookupField
                        definitionKey="countries"
                        label="Country"
                        value={address.country}
                        createPayload={(name) => ({ code: codeFromName(name) })}
                        onChange={(country) => updateArray(setForm, "addresses", index, { country, state: "", district: "", city: "" })}
                      />
                      <LookupField
                        definitionKey="states"
                        label="State"
                        value={address.state ?? ""}
                        onChange={(state) => updateArray(setForm, "addresses", index, { state, district: "", city: "" })}
                        createEnabled={Boolean(address.country)}
                        createPayload={(name) => ({ code: codeFromName(name), countryId: address.country })}
                        emptyLabel={address.country ? "No states found." : "Select country first."}
                        filterRecord={(record) => sameId(record.countryId, address.country)}
                      />
                      <LookupField
                        definitionKey="districts"
                        label="District"
                        value={address.district ?? ""}
                        onChange={(district) => updateArray(setForm, "addresses", index, { district, city: "" })}
                        createEnabled={Boolean(address.state)}
                        createPayload={() => ({ stateId: address.state })}
                        emptyLabel={address.state ? "No districts found." : "Select state first."}
                        filterRecord={(record) => sameId(record.stateId, address.state ?? "")}
                      />
                      <LookupField
                        definitionKey="cities"
                        label="City"
                        value={address.city ?? ""}
                        onChange={(city) => updateArray(setForm, "addresses", index, { city })}
                        createEnabled={Boolean(address.district)}
                        createPayload={() => ({ districtId: address.district })}
                        emptyLabel={address.district ? "No cities found." : "Select district first."}
                        filterRecord={(record) => sameId(record.districtId, address.district ?? "")}
                      />
                      <LookupField definitionKey="pincodes" label="Pincode" value={address.pincode ?? ""} onChange={(pincode) => updateArray(setForm, "addresses", index, { pincode })} />
                      <StatusCard label="Default address" checked={address.isDefault} onChange={(value) => updatePrimary(setForm, "addresses", index, value, "isDefault")} />
                    </div>
                  ))}
                </CollectionCard>
              </SectionShell>
            </TabsContent>

            <TabsContent value="finance" className="m-0">
              <SectionShell>
                <CollectionCard title="Bank Accounts" onAdd={() => setForm((current) => ({ ...current, bankAccounts: [...current.bankAccounts, emptyBank(current.bankAccounts.length === 0)] }))}>
                  {form.bankAccounts.map((bank, index) => (
                    <div key={bank.accountId ?? index} className="grid items-end gap-5 rounded-md border border-border p-4 md:grid-cols-2">
                      <TextField label="Bank name" value={bank.bankName ?? ""} onChange={(bankName) => updateArray(setForm, "bankAccounts", index, { bankName })} />
                      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                        <TextField label="Account number" value={bank.accountNumber} onChange={(accountNumber) => updateArray(setForm, "bankAccounts", index, { accountNumber })} />
                        <RemoveButton label="Remove bank" onClick={() => removeArrayItem(setForm, "bankAccounts", index, emptyBank(true))} />
                      </div>
                      <LookupField definitionKey="bank-account-types" label="Account type" value={bank.accountTypeId ?? ""} onChange={(accountTypeId) => updateArray(setForm, "bankAccounts", index, { accountTypeId })} />
                      <TextField label="Holder name" value={bank.accountHolderName} onChange={(accountHolderName) => updateArray(setForm, "bankAccounts", index, { accountHolderName })} />
                      <TextField label="IFSC" value={bank.ifscCode} onChange={(ifscCode) => updateArray(setForm, "bankAccounts", index, { ifscCode: ifscCode.toUpperCase() })} />
                      <TextField label="Branch" value={bank.branchName ?? ""} onChange={(branchName) => updateArray(setForm, "bankAccounts", index, { branchName })} />
                      <StatusCard label="Primary bank" checked={bank.isDefault} onChange={(value) => updatePrimary(setForm, "bankAccounts", index, value, "isDefault")} />
                    </div>
                  ))}
                </CollectionCard>
              </SectionShell>
            </TabsContent>

            <TabsContent value="more" className="m-0">
              <SectionShell className="grid gap-5">
                <div className="grid gap-5">
                  <TextField label="Website" value={form.website} onChange={(website) => updateForm(setForm, { website })} />
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea className="min-h-28 rounded-md" value={form.notes} onChange={(event) => updateForm(setForm, { notes: event.target.value })} />
                  </div>
                </div>
                <CollectionCard title="Social Links" onAdd={() => setForm((current) => ({ ...current, socialLinks: [...current.socialLinks, emptySocial()] }))}>
                  {form.socialLinks.map((social, index) => (
                    <div key={social.id ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <SelectField label="Platform" value={social.platform} options={socialPlatforms} onChange={(platform) => updateArray(setForm, "socialLinks", index, { platform })} />
                      <TextField label="URL" value={social.url} onChange={(url) => updateArray(setForm, "socialLinks", index, { url })} />
                      <StatusCard label="Active" checked={social.isActive} onChange={(isActive) => updateArray(setForm, "socialLinks", index, { isActive })} />
                      <RemoveButton label="Remove social link" onClick={() => removeArrayItem(setForm, "socialLinks", index, emptySocial())} />
                    </div>
                  ))}
                </CollectionCard>
              </SectionShell>
            </TabsContent>

            <TabsContent value="logo" className="m-0">
              <SectionShell>
                <div className="grid gap-5 md:grid-cols-3">
                  <LogoUploadField label="Logo" value={form.logoUrl} onChange={(logoUrl) => updateForm(setForm, { logoUrl })} />
                  <LogoUploadField label="Logo dark" value={form.logoDarkUrl} onChange={(logoDarkUrl) => updateForm(setForm, { logoDarkUrl })} darkPreview />
                  <LogoUploadField label="Favicon" value={form.faviconUrl} onChange={(faviconUrl) => updateForm(setForm, { faviconUrl })} compact />
                </div>
              </SectionShell>
            </TabsContent>
          </Tabs>
          <FormFooter pending={mutation.isPending} onCancel={onCancel} />
        </div>
      </form>
    </WorkspacePage>
  )
}

export function ApplicationLocalModulePage({ moduleKey }: { moduleKey: AppModuleKey; onBack?: () => void }) {
  const meta = appModuleMeta[moduleKey]
  const [records, setRecords] = useLocalRecords(moduleKey, meta.seed)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editing, setEditing] = useState<LocalRecord | null>(null)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return records
    return records.filter((record) =>
      [record.name, record.code, record.category, record.email, record.description, record.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [query, records])

  if (mode === "form") {
    return (
      <LocalModuleUpsert
        moduleKey={moduleKey}
        record={editing}
        onCancel={() => {
          setEditing(null)
          setMode("list")
        }}
        onSave={(record) => {
          setRecords((current) => {
            const exists = current.some((item) => item.id === record.id)
            return exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current]
          })
          toast.success(editing ? `${meta.title} updated` : `${meta.title} created`)
          setEditing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage
      title={meta.title}
      description={meta.description}
      actions={
        <>
          <Button type="button" variant="outline">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => setMode("form")}>
            <Plus className="size-4" />
            New {meta.title.toLowerCase()}
          </Button>
        </>
      }
    >
      <WorkspaceFilters searchValue={query} onSearchValueChange={setQuery} />
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="w-24 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <tr key={record.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => {
                        setEditing(record)
                        setMode("form")
                      }}
                    >
                      {record.name}
                    </button>
                    {record.description ? <div className="text-xs text-muted-foreground">{record.description}</div> : null}
                  </td>
                  <td className="px-4 py-3">{record.code}</td>
                  <td className="px-4 py-3">{record.category}</td>
                  <td className="px-4 py-3">{record.email ?? ""}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusBadge label={record.status} tone={record.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <WorkspaceRowActions
                      title={record.name}
                      isSuspended={record.status === "archived"}
                      onEdit={() => {
                        setEditing(record)
                        setMode("form")
                      }}
                      onDelete={() => setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: "archived", updatedAt: new Date().toISOString() } : item)))}
                      onRestore={() => setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: "active", updatedAt: new Date().toISOString() } : item)))}
                    />
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <WorkspacePagination
        page={1}
        rowsPerPage={100}
        showingLabel={`Showing ${filtered.length ? 1 : 0} to ${filtered.length} of ${filtered.length}`}
        singularLabel={meta.title.toLowerCase()}
        totalCount={filtered.length}
        totalPages={1}
        onPageChange={() => undefined}
        onRowsPerPageChange={() => undefined}
      />
    </WorkspacePage>
  )
}

export function ApplicationAccountingYearPage(_props: { onBack?: () => void }) {
  const meta = appModuleMeta["accounting-year"]
  const [records, setRecords] = useLocalRecords("accounting-year", meta.seed)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editing, setEditing] = useState<LocalRecord | null>(null)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return records
    return records.filter((record) =>
      [record.name, record.code, record.fromDate, record.toDate, record.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [query, records])

  if (mode === "form") {
    return (
      <AccountingYearUpsert
        record={editing}
        onCancel={() => {
          setEditing(null)
          setMode("list")
        }}
        onSave={(record) => {
          setRecords((current) => {
            const normalized = record.isDefault ? current.map((item) => ({ ...item, isDefault: false })) : current
            const exists = normalized.some((item) => item.id === record.id)
            return exists ? normalized.map((item) => (item.id === record.id ? record : item)) : [record, ...normalized]
          })
          toast.success(editing ? "Accounting year updated" : "Accounting year created")
          setEditing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage
      title="Accounting Year"
      description="Manage financial year periods, defaults, and active status."
      actions={
        <>
          <Button type="button" variant="outline">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => setMode("form")}>
            <Plus className="size-4" />
            New accounting year
          </Button>
        </>
      }
    >
      <WorkspaceFilters searchValue={query} onSearchValueChange={setQuery} />
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">From Date</th>
                <th className="px-4 py-3">To Date</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="w-24 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <tr key={record.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => {
                        setEditing(record)
                        setMode("form")
                      }}
                    >
                      {record.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{record.code}</td>
                  <td className="px-4 py-3">{record.fromDate ?? ""}</td>
                  <td className="px-4 py-3">{record.toDate ?? ""}</td>
                  <td className="px-4 py-3">{record.isDefault ? <WorkspaceStatusBadge label="default" tone="success" /> : ""}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusBadge label={record.status} tone={record.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <WorkspaceRowActions
                      title={record.name}
                      isSuspended={record.status === "archived"}
                      onEdit={() => {
                        setEditing(record)
                        setMode("form")
                      }}
                      onDelete={() => setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: "archived", updatedAt: new Date().toISOString() } : item)))}
                      onRestore={() => setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: "active", updatedAt: new Date().toISOString() } : item)))}
                    />
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No accounting years found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <WorkspacePagination
        page={1}
        rowsPerPage={100}
        showingLabel={`Showing ${filtered.length ? 1 : 0} to ${filtered.length} of ${filtered.length}`}
        singularLabel="accounting years"
        totalCount={filtered.length}
        totalPages={1}
        onPageChange={() => undefined}
        onRowsPerPageChange={() => undefined}
      />
    </WorkspacePage>
  )
}

export function ApplicationUsersPage(_props: { onBack?: () => void }) {
  const [users, setUsers] = useApplicationUsers()
  const [roles] = useApplicationRoles()
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editing, setEditing] = useState<ApplicationUserRecord | null>(null)
  const roleLabel = (roleId: string) => roles.find((role) => role.id === roleId)?.name ?? roleId
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) => [user.name, user.email, user.mobile, roleLabel(user.roleId), user.status].some((value) => value.toLowerCase().includes(term)))
  }, [query, roles, users])

  if (mode === "form") {
    return (
      <UserUpsert
        record={editing}
        roles={roles}
        onCancel={() => {
          setEditing(null)
          setMode("list")
        }}
        onSave={(record) => {
          setUsers((current) => upsertRecord(current, record))
          toast.success(editing ? "User updated" : "User created")
          setEditing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage title="Users" description="Manage application users, role binding, and active state." actions={<ListActions label="New user" onNew={() => setMode("form")} />}>
      <WorkspaceFilters searchValue={query} onSearchValueChange={setQuery} />
      <DataTable
        columns={["#", "Name", "Email", "Mobile", "Role", "Status", "Updated", "Action"]}
        emptyLabel="No users found."
        rows={filtered.map((user, index) => [
          index + 1,
          <button key="name" className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setEditing(user); setMode("form") }}>{user.name}</button>,
          user.email,
          user.mobile,
          roleLabel(user.roleId),
          <WorkspaceStatusBadge key="status" label={user.status} tone={user.status === "active" ? "success" : "danger"} />,
          formatDate(user.updatedAt),
          <WorkspaceRowActions
            key="actions"
            title={user.name}
            isSuspended={user.status === "archived"}
            onEdit={() => { setEditing(user); setMode("form") }}
            onDelete={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: "archived", updatedAt: new Date().toISOString() } : item))}
            onRestore={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: "active", updatedAt: new Date().toISOString() } : item))}
          />,
        ])}
      />
      <SimplePagination count={filtered.length} label="users" />
    </WorkspacePage>
  )
}

function UserUpsert({ onCancel, onSave, record, roles }: { onCancel: () => void; onSave: (record: ApplicationUserRecord) => void; record: ApplicationUserRecord | null; roles: ApplicationRoleRecord[] }) {
  const [form, setForm] = useState(() => ({
    email: record?.email ?? "",
    isActive: record?.status !== "archived",
    mobile: record?.mobile ?? "",
    name: record?.name ?? "",
    roleId: record?.roleId ?? roles[0]?.id ?? "",
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function save() {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "Name is required"
    if (!form.email.trim()) nextErrors.email = "Email is required"
    if (!form.roleId.trim()) nextErrors.roleId = "Role is required"
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error(Object.values(nextErrors)[0])
      return
    }
    onSave({ id: record?.id ?? `user-${Date.now()}`, name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim(), roleId: form.roleId, status: form.isActive ? "active" : "archived", updatedAt: new Date().toISOString() })
  }

  return (
    <WorkspacePage title={record ? "Edit user" : "New user"} description="Set user identity, role, and access state." actions={<BackAction onBack={onCancel} />}>
      <FormPanel footer={<SaveCancelFooter onCancel={onCancel} onSave={save} />}>
        <Tabs defaultValue="details">
          <TabHeader tabs={[["details", "Details"], ["access", "Access"]]} />
          <TabsContent value="details" className="m-0">
            <SectionShell>
              <div className="grid items-end gap-5 md:grid-cols-2">
                <TextField label="Name" required value={form.name} error={errors.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
                <TextField label="Email" required value={form.email} error={errors.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
                <TextField label="Mobile" value={form.mobile} onChange={(mobile) => setForm((current) => ({ ...current, mobile }))} />
                <div className="grid gap-2">
                  <Label>Role<span className="ml-1 text-destructive">*</span></Label>
                  <Select value={form.roleId} onValueChange={(roleId) => setForm((current) => ({ ...current, roleId }))}>
                    <SelectTrigger className="h-11 rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent>{roles.filter((role) => role.status === "active").map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.roleId ? <p className="text-xs font-medium text-destructive">{errors.roleId}</p> : null}
                </div>
                <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => setForm((current) => ({ ...current, isActive }))} className="md:col-span-2" />
              </div>
            </SectionShell>
          </TabsContent>
          <TabsContent value="access" className="m-0">
            <SectionShell>
              <PermissionSummary permissions={roles.find((role) => role.id === form.roleId)?.permissions ?? []} />
            </SectionShell>
          </TabsContent>
        </Tabs>
      </FormPanel>
    </WorkspacePage>
  )
}

export function ApplicationRolesPage(_props: { onBack?: () => void }) {
  const [roles, setRoles] = useApplicationRoles()
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editing, setEditing] = useState<ApplicationRoleRecord | null>(null)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return roles
    return roles.filter((role) => [role.name, role.code, role.description, role.status].some((value) => value.toLowerCase().includes(term)))
  }, [query, roles])

  if (mode === "form") {
    return (
      <RoleUpsert
        record={editing}
        onCancel={() => {
          setEditing(null)
          setMode("list")
        }}
        onSave={(record) => {
          setRoles((current) => upsertRecord(current, record))
          toast.success(editing ? "Role updated" : "Role created")
          setEditing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage title="Roles" description="Manage role names and permission sets." actions={<ListActions label="New role" onNew={() => setMode("form")} />}>
      <WorkspaceFilters searchValue={query} onSearchValueChange={setQuery} />
      <DataTable
        columns={["#", "Name", "Code", "Permissions", "Status", "Updated", "Action"]}
        emptyLabel="No roles found."
        rows={filtered.map((role, index) => [
          index + 1,
          <button key="name" className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setEditing(role); setMode("form") }}>{role.name}</button>,
          role.code,
          `${role.permissions.length} permissions`,
          <WorkspaceStatusBadge key="status" label={role.status} tone={role.status === "active" ? "success" : "danger"} />,
          formatDate(role.updatedAt),
          <WorkspaceRowActions
            key="actions"
            title={role.name}
            isSuspended={role.status === "archived"}
            onEdit={() => { setEditing(role); setMode("form") }}
            onDelete={() => setRoles((current) => current.map((item) => item.id === role.id ? { ...item, status: "archived", updatedAt: new Date().toISOString() } : item))}
            onRestore={() => setRoles((current) => current.map((item) => item.id === role.id ? { ...item, status: "active", updatedAt: new Date().toISOString() } : item))}
          />,
        ])}
      />
      <SimplePagination count={filtered.length} label="roles" />
    </WorkspacePage>
  )
}

function RoleUpsert({ onCancel, onSave, record }: { onCancel: () => void; onSave: (record: ApplicationRoleRecord) => void; record: ApplicationRoleRecord | null }) {
  const [form, setForm] = useState(() => ({
    code: record?.code ?? "",
    description: record?.description ?? "",
    isActive: record?.status !== "archived",
    name: record?.name ?? "",
    permissions: record?.permissions ?? [],
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function togglePermission(permission: PermissionKey) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission],
    }))
  }

  function save() {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "Name is required"
    if (!form.code.trim()) nextErrors.code = "Code is required"
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error(Object.values(nextErrors)[0])
      return
    }
    onSave({ id: record?.id ?? `role-${Date.now()}`, name: form.name.trim(), code: form.code.trim().toUpperCase(), description: form.description.trim(), permissions: form.permissions, status: form.isActive ? "active" : "archived", updatedAt: new Date().toISOString() })
  }

  return (
    <WorkspacePage title={record ? "Edit role" : "New role"} description="Set role identity and permission boundaries." actions={<BackAction onBack={onCancel} />}>
      <FormPanel footer={<SaveCancelFooter onCancel={onCancel} onSave={save} />}>
        <Tabs defaultValue="details">
          <TabHeader tabs={[["details", "Details"], ["permissions", "Permissions"]]} />
          <TabsContent value="details" className="m-0">
            <SectionShell>
              <div className="grid items-end gap-5 md:grid-cols-2">
                <TextField label="Name" required value={form.name} error={errors.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
                <TextField label="Code" required value={form.code} error={errors.code} onChange={(code) => setForm((current) => ({ ...current, code: code.toUpperCase() }))} />
                <div className="grid gap-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea className="min-h-24 rounded-md" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                </div>
                <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => setForm((current) => ({ ...current, isActive }))} className="md:col-span-2" />
              </div>
            </SectionShell>
          </TabsContent>
          <TabsContent value="permissions" className="m-0">
            <SectionShell className="grid gap-5">
              {permissionGroups.map((group) => (
                <CollectionCard key={group.label} title={group.label}>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.permissions.map((permission) => (
                      <StatusCard key={permission.key} label={permission.label} checked={form.permissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} />
                    ))}
                  </div>
                </CollectionCard>
              ))}
            </SectionShell>
          </TabsContent>
        </Tabs>
      </FormPanel>
    </WorkspacePage>
  )
}

export function ApplicationPermissionsPage(_props: { onBack?: () => void }) {
  const [roles] = useApplicationRoles()
  return (
    <WorkspacePage title="Permissions" description="Review permission keys and which roles currently use them.">
      <div className="grid gap-5">
        {permissionGroups.map((group) => (
          <div key={group.label} className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-base font-semibold">{group.label}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-4 py-3">Permission</th>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {group.permissions.map((permission) => (
                    <tr key={permission.key} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{permission.label}</td>
                      <td className="px-4 py-3 font-mono text-xs">{permission.key}</td>
                      <td className="px-4 py-3">{roles.filter((role) => role.permissions.includes(permission.key)).map((role) => role.name).join(", ") || "No roles"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </WorkspacePage>
  )
}

export function ApplicationSettingsPage({ onBack }: { onBack?: () => void }) {
  const [settings, setSettings] = useApplicationSettings()
  const [form, setForm] = useState(settings)

  useEffect(() => setForm(settings), [settings])

  function save() {
    const next = { ...form, updatedAt: new Date().toISOString() }
    setSettings(next)
    toast.success("Settings updated")
  }

  return (
    <WorkspacePage title="Settings" description="Application-level defaults and access behaviour." actions={onBack ? <BackAction onBack={onBack} /> : null}>
      <FormPanel footer={<SaveCancelFooter onCancel={() => setForm(settings)} onSave={save} cancelLabel="Reset" />}>
        <Tabs defaultValue="general">
          <TabHeader tabs={[["general", "General"], ["security", "Security"], ["billing", "Billing"]]} />
          <TabsContent value="general" className="m-0">
            <SectionShell>
              <div className="grid items-end gap-5 md:grid-cols-2">
                <TextField label="Application name" value={form.appName} onChange={(appName) => setForm((current) => ({ ...current, appName }))} />
                <TextField label="Default timezone" value={form.defaultTimezone} onChange={(defaultTimezone) => setForm((current) => ({ ...current, defaultTimezone }))} />
              </div>
            </SectionShell>
          </TabsContent>
          <TabsContent value="security" className="m-0">
            <SectionShell>
              <div className="grid items-end gap-5 md:grid-cols-2">
                <TextField label="Auto lock minutes" value={form.autoLockMinutes} onChange={(autoLockMinutes) => setForm((current) => ({ ...current, autoLockMinutes }))} />
                <StatusCard label="Enforce two-factor" checked={form.enforceTwoFactor} onChange={(enforceTwoFactor) => setForm((current) => ({ ...current, enforceTwoFactor }))} />
                <StatusCard label="Allow user invites" checked={form.allowUserInvites} onChange={(allowUserInvites) => setForm((current) => ({ ...current, allowUserInvites }))} className="md:col-span-2" />
              </div>
            </SectionShell>
          </TabsContent>
          <TabsContent value="billing" className="m-0">
            <SectionShell>
              <TextField className="max-w-xl" label="Invoice prefix" value={form.invoicePrefix} onChange={(invoicePrefix) => setForm((current) => ({ ...current, invoicePrefix: invoicePrefix.toUpperCase() }))} />
            </SectionShell>
          </TabsContent>
        </Tabs>
      </FormPanel>
    </WorkspacePage>
  )
}

function AccountingYearUpsert({ onCancel, onSave, record }: { onCancel: () => void; onSave: (record: LocalRecord) => void; record: LocalRecord | null }) {
  const [form, setForm] = useState(() => ({
    code: record?.code ?? "",
    fromDate: record?.fromDate ?? "",
    isActive: record?.status !== "archived",
    isDefault: Boolean(record?.isDefault),
    name: record?.name ?? "",
    toDate: record?.toDate ?? "",
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function save() {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "Name is required"
    if (!form.code.trim()) nextErrors.code = "Code is required"
    if (!form.fromDate.trim()) nextErrors.fromDate = "From date is required"
    if (!form.toDate.trim()) nextErrors.toDate = "To date is required"
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      toast.error(Object.values(nextErrors)[0])
      return
    }
    setErrors({})
    onSave({
      category: "Open",
      code: form.code.trim(),
      fromDate: form.fromDate,
      id: record?.id ?? `ay-${Date.now()}`,
      isDefault: form.isDefault,
      name: form.name.trim(),
      status: form.isActive ? "active" : "archived",
      toDate: form.toDate,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <WorkspacePage
      title={record ? "Edit accounting year" : "New accounting year"}
      description="Set financial year name, code, date range, default, and active status."
      actions={
        <Button type="button" variant="outline" onClick={onCancel}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      }
    >
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Details</h2>
        </div>
        <SectionShell>
          <div className="grid items-end gap-5 md:grid-cols-2">
            <TextField label="Name" required value={form.name} error={errors.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
            <TextField label="Code" required value={form.code} error={errors.code} onChange={(code) => setForm((current) => ({ ...current, code: code.toUpperCase() }))} />
            <TextField label="From date" required type="date" value={form.fromDate} error={errors.fromDate} onChange={(fromDate) => setForm((current) => ({ ...current, fromDate }))} />
            <TextField label="To date" required type="date" value={form.toDate} error={errors.toDate} onChange={(toDate) => setForm((current) => ({ ...current, toDate }))} />
            <StatusCard label="Default" checked={form.isDefault} onChange={(isDefault) => setForm((current) => ({ ...current, isDefault }))} />
            <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => setForm((current) => ({ ...current, isActive }))} />
          </div>
        </SectionShell>
        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" onClick={save}>
            <Save className="size-4" />
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      </div>
    </WorkspacePage>
  )
}

function LocalModuleUpsert({
  moduleKey,
  onCancel,
  onSave,
  record,
}: {
  moduleKey: AppModuleKey
  onCancel: () => void
  onSave: (record: LocalRecord) => void
  record: LocalRecord | null
}) {
  const meta = appModuleMeta[moduleKey]
  const [form, setForm] = useState(() => ({
    name: record?.name ?? "",
    code: record?.code ?? "",
    category: record?.category ?? "",
    email: record?.email ?? "",
    description: record?.description ?? "",
    isActive: record?.status !== "archived",
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function save() {
    if (!form.name.trim()) {
      setErrors({ name: "Name is required" })
      toast.error("Name is required")
      return
    }
    onSave({
      id: record?.id ?? `${moduleKey}-${Date.now()}`,
      name: form.name.trim(),
      code: form.code.trim() || codeFromName(form.name),
      category: form.category.trim() || meta.title,
      email: form.email.trim() || undefined,
      description: form.description.trim() || undefined,
      status: form.isActive ? "active" : "archived",
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <WorkspacePage
      title={record ? `Edit ${meta.title.toLowerCase()}` : `New ${meta.title.toLowerCase()}`}
      description={meta.description}
      actions={
        <Button type="button" variant="outline" onClick={onCancel}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      }
    >
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <Tabs defaultValue="details">
          <div className="border-b border-border px-6 pt-2">
            <TabsList className="h-auto rounded-none bg-transparent p-0">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Details
              </TabsTrigger>
              <TabsTrigger value="access" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Access
              </TabsTrigger>
              <TabsTrigger value="more" className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                More
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="details" className="m-0">
            <SectionShell>
              <div className="grid items-end gap-5 md:grid-cols-2">
                <TextField label="Name" required value={form.name} error={errors.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
                <TextField label="Code" value={form.code} onChange={(code) => setForm((current) => ({ ...current, code: code.toUpperCase() }))} />
                <TextField label="Type" value={form.category} onChange={(category) => setForm((current) => ({ ...current, category }))} />
                <TextField label="Email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
                <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => setForm((current) => ({ ...current, isActive }))} className="md:col-span-2" />
              </div>
            </SectionShell>
          </TabsContent>
          <TabsContent value="access" className="m-0">
            <SectionShell>
              <div className="grid items-end gap-5 md:grid-cols-2">
                <InfoTile icon={<KeyRound className="size-5" />} title="Tenant isolated" description="Records stay scoped to the current Application desk tenant." />
                <InfoTile icon={<ShieldCheck className="size-5" />} title="Role aware" description="These records are ready to connect to tenant permissions when the server endpoint is added." />
              </div>
            </SectionShell>
          </TabsContent>
          <TabsContent value="more" className="m-0">
            <SectionShell>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea className="min-h-28 rounded-md" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
            </SectionShell>
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" onClick={save}>
            <Save className="size-4" />
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      </div>
    </WorkspacePage>
  )
}

export function ApplicationLandingPage({ onBack }: { onBack?: () => void }) {
  const modules: Array<{ key: AppModuleKey | "company"; title: string; description: string; icon: typeof Building2; href: string }> = [
    { key: "company", title: "Company", description: "Company profile, tax, address, and bank setup.", icon: Building2, href: "/app/company" },
    { key: "default-company", title: "Default Company", description: "Pick the primary company for desk actions.", icon: Building2, href: "/app/default-company" },
    { key: "accounting-year", title: "Accounting Year", description: "Control active financial years.", icon: CalendarDays, href: "/app/accounting-year" },
    { key: "settings", title: "Settings", description: "Application-level preferences.", icon: Settings2, href: "/app/settings" },
    { key: "users", title: "Users", description: "Team members and access state.", icon: UsersRound, href: "/app/users" },
    { key: "roles", title: "Roles", description: "Role groups and permissions.", icon: ShieldCheck, href: "/app/roles" },
  ]

  return (
    <WorkspacePage
      title="Landing Desk"
      description="Application launch area for company, users, roles, settings, and defaults."
      actions={
        onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <a key={module.key} href={module.href} className="group rounded-md border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-md bg-slate-950 text-white">
                  <Icon className="size-5" />
                </div>
                <ExternalLink className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{module.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
            </a>
          )
        })}
      </div>
    </WorkspacePage>
  )
}

function TextField({
  className,
  error,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  className?: string
  error?: string | undefined
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
  value: string
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input
        aria-invalid={Boolean(error)}
        className={cn("h-11 rounded-md", error && "border-destructive focus-visible:ring-destructive/30")}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

function LogoUploadField({
  compact,
  darkPreview,
  label,
  onChange,
  value,
}: {
  compact?: boolean
  darkPreview?: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const inputId = useMemo(() => `company-logo-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${newId()}`, [label])

  async function handleFile(file: File | undefined) {
    if (!file) return
    const isAllowed = file.type === "image/png" || file.type === "image/svg+xml" || /\.(png|svg)$/i.test(file.name)
    if (!isAllowed) {
      toast.error("Only SVG or PNG files are allowed")
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div className="rounded-md border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={inputId}>{label}</Label>
        {value ? (
          <Button aria-label={`Remove ${label}`} type="button" size="icon" variant="outline" onClick={() => onChange("")}>
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className={cn("mt-3 grid place-items-center rounded-md border border-dashed border-border p-3", compact ? "h-24" : "h-32", darkPreview ? "bg-zinc-950" : "bg-muted/30")}>
        {value ? (
          <img alt={`${label} preview`} className={cn("max-w-full object-contain", compact ? "max-h-16" : "max-h-24")} src={value} />
        ) : (
          <ImageIcon className={cn("size-8", darkPreview ? "text-zinc-400" : "text-muted-foreground")} />
        )}
      </div>
      <input
        id={inputId}
        className="hidden"
        type="file"
        accept=".svg,.png,image/svg+xml,image/png"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <Button asChild type="button" variant="outline" className="mt-3 w-full">
        <label htmlFor={inputId} className="cursor-pointer">
          <Upload className="size-4" />
          Upload SVG/PNG
        </label>
      </Button>
    </div>
  )
}

type CommonLookupRecord = {
  code?: string
  description?: string
  id: string | number
  isActive?: boolean
  name?: string
  ratePercent?: number
  [key: string]: unknown
}

function LookupField({
  createEnabled = true,
  createPayload,
  definitionKey,
  emptyLabel,
  error,
  filterRecord,
  label,
  onChange,
  value,
}: {
  createEnabled?: boolean
  createPayload?: (name: string) => Record<string, unknown>
  definitionKey: string
  emptyLabel?: string
  error?: string | undefined
  filterRecord?: (record: CommonLookupRecord) => boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <CommonRecordAutocomplete
        createEnabled={createEnabled}
        createPayload={createPayload}
        definitionKey={definitionKey}
        emptyLabel={emptyLabel}
        filterRecord={filterRecord}
        invalid={Boolean(error)}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
      />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CollectionCard({ children, onAdd, title }: { children: ReactNode; onAdd?: () => void; title: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {onAdd ? (
          <Button type="button" variant="outline" onClick={onAdd}>
            <Plus className="size-4" />
            Add
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

function ListActions({ label, onNew }: { label: string; onNew: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={onNew}>
        <Plus className="size-4" />
        {label}
      </Button>
    </div>
  )
}

function BackAction({ onBack }: { onBack: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onBack}>
      <ArrowLeft className="size-4" />
      Back
    </Button>
  )
}

function DataTable({ columns, emptyLabel, rows }: { columns: string[]; emptyLabel: string; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
              {columns.map((column) => (
                <th key={column} className={cn("px-4 py-3", column === "Action" && "text-right")}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={cn("px-4 py-3 align-middle", cellIndex === row.length - 1 && "text-right")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SimplePagination({ count, label }: { count: number; label: string }) {
  return (
    <WorkspacePagination
      page={1}
      rowsPerPage={100}
      showingLabel={`Showing ${count ? 1 : 0} to ${count} of ${count}`}
      singularLabel={label}
      totalCount={count}
      totalPages={1}
      onPageChange={() => undefined}
      onRowsPerPageChange={() => undefined}
    />
  )
}

function FormPanel({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      {children}
      {footer}
    </div>
  )
}

function TabHeader({ tabs }: { tabs: Array<[string, string]> }) {
  return (
    <div className="border-b border-border px-6 pt-2">
      <TabsList className="h-auto rounded-none bg-transparent p-0">
        {tabs.map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}

function SaveCancelFooter({ cancelLabel = "Cancel", onCancel, onSave }: { cancelLabel?: string; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
      <Button type="button" onClick={onSave}>
        <Save className="size-4" />
        Save
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        <X className="size-4" />
        {cancelLabel}
      </Button>
    </div>
  )
}

function PermissionSummary({ permissions }: { permissions: PermissionKey[] }) {
  const enabled = new Set(permissions)
  return (
    <div className="grid gap-5">
      {permissionGroups.map((group) => (
        <div key={group.label} className="rounded-md border border-border bg-background p-4">
          <h3 className="text-base font-semibold">{group.label}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {group.permissions.map((permission) => (
              <div key={permission.key} className={cn("rounded-md border px-3 py-2 text-sm", enabled.has(permission.key) ? "border-emerald-200 bg-emerald-50 text-foreground" : "border-border bg-muted/45 text-muted-foreground")}>
                {permission.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button aria-label={label} className="self-end" type="button" size="icon" variant="outline" onClick={onClick}>
      <Trash2 className="size-4" />
    </Button>
  )
}

function StatusCard({ checked, className, label, onChange }: { checked: boolean; className?: string; label: string; onChange: (value: boolean) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left transition-colors",
        checked ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70" : "border-border bg-muted/55 hover:bg-muted/75",
        className,
      )}
      onClick={() => onChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <CheckCircle2 className={cn("size-4 shrink-0", checked ? "text-emerald-600" : "text-muted-foreground")} />
        <span className="block leading-none">{label}</span>
      </span>
      <VisualSwitch checked={checked} />
    </div>
  )
}

function VisualSwitch({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", checked ? "bg-emerald-600" : "bg-muted-foreground/35")}>
      <span className={cn("block size-4 rounded-full bg-background shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </span>
  )
}

function FormFooter({ onCancel, pending }: { onCancel: () => void; pending: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
      <Button type="submit" disabled={pending}>
        <Save className={cn("size-4", pending && "animate-spin")} />
        Save
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        <X className="size-4" />
        Cancel
      </Button>
    </div>
  )
}

function InfoTile({ description, icon, title }: { description: string; icon: ReactNode; title: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyValue({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="flex h-11 min-w-0 flex-col justify-center rounded-md border border-border bg-background px-3">
      <span className="truncate text-sm font-medium text-foreground">{primary}</span>
      <span className="truncate text-xs text-muted-foreground">{secondary}</span>
    </div>
  )
}

function SectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6", className)}>{children}</div>
}

export function readDefaultCompanyBinding(): DefaultCompanyBinding {
  try {
    const stored = localStorage.getItem(DEFAULT_COMPANY_BINDING_KEY)
    if (stored) return JSON.parse(stored) as DefaultCompanyBinding
  } catch {}
  return {
    accountingYearId: "ay-2026",
    accountingYearName: "FY 2026-27",
    companyId: "",
    companyName: "",
    updatedAt: "",
  }
}

function useDefaultCompanyBinding() {
  const [binding, setBindingState] = useState<DefaultCompanyBinding>(() => readDefaultCompanyBinding())

  function setBinding(nextBinding: DefaultCompanyBinding) {
    setBindingState(nextBinding)
    try {
      localStorage.setItem(DEFAULT_COMPANY_BINDING_KEY, JSON.stringify(nextBinding))
    } catch {}
  }

  return [binding, setBinding] as const
}

function useLocalRecords(moduleKey: AppModuleKey, seed: LocalRecord[]) {
  const storageKey = `codexsun_application_${moduleKey}`
  const [records, setRecords] = useState<LocalRecord[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as LocalRecord[]) : seed
    } catch {
      return seed
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records))
    } catch {}
  }, [records, storageKey])
  return [records, setRecords] as const
}

function useApplicationRoles() {
  const storageKey = "codexsun_application_roles_v2"
  const [records, setRecords] = useState<ApplicationRoleRecord[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as ApplicationRoleRecord[]) : defaultRoleRecords
    } catch {
      return defaultRoleRecords
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records))
    } catch {}
  }, [records])
  return [records, setRecords] as const
}

function useApplicationUsers() {
  const storageKey = "codexsun_application_users_v2"
  const [records, setRecords] = useState<ApplicationUserRecord[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as ApplicationUserRecord[]) : defaultUserRecords
    } catch {
      return defaultUserRecords
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records))
    } catch {}
  }, [records])
  return [records, setRecords] as const
}

function useApplicationSettings() {
  const storageKey = "codexsun_application_settings_v2"
  const [record, setRecord] = useState<ApplicationSettingsRecord>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as ApplicationSettingsRecord) : defaultSettingsRecord
    } catch {
      return defaultSettingsRecord
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(record))
    } catch {}
  }, [record])
  return [record, setRecord] as const
}

function upsertRecord<T extends { id: string }>(records: T[], record: T) {
  return records.some((item) => item.id === record.id) ? records.map((item) => (item.id === record.id ? record : item)) : [record, ...records]
}

function companyToForm(record: CompanyRecord | null): CompanyForm {
  const meta = readMeta(record?.notes)
  const gstin = record?.taxIdentities.find((tax) => tax.type === "gstin")?.value ?? ""
  const taxRows = record?.taxIdentities.filter((tax) => tax.type !== "gstin").map((tax) => ({ ...tax, rowId: tax.taxId }))
  return {
    legalName: record?.legalName ?? "",
    tradeName: record?.tradeName ?? "",
    companyGroupId: record?.companyGroupId ?? "",
    tenantId: record?.tenantId ?? getTenantId() ?? "",
    industry: meta.industry || "General",
    gstin,
    msmeNo: meta.msmeNo || "",
    msmeType: meta.msmeType || "",
    tdsAvailable: Boolean(meta.tdsAvailable),
    tcsAvailable: Boolean(meta.tcsAvailable),
    taxIdentities: normalizeRows(taxRows, [
      emptyTaxIdentity("pan", true),
      emptyTaxIdentity("tan"),
    ]),
    emails: normalizeRows(record?.email, [emptyEmail(true)]),
    phones: normalizeRows(record?.phone, [emptyPhone(true)]),
    website: record?.website ?? "",
    addresses: normalizeRows(record?.addresses, [emptyAddress(true)]),
    bankAccounts: normalizeRows(record?.bankAccounts, [emptyBank(true)]),
    socialLinks: normalizeRows(meta.socialLinks, [emptySocial()]),
    logoUrl: record?.logoUrl ?? "",
    logoDarkUrl: record?.logoDarkUrl ?? "",
    faviconUrl: record?.faviconUrl ?? "",
    notes: meta.notes || "",
    isActive: record?.status !== "archived",
  }
}

function companyPayload(form: CompanyForm, record: CompanyRecord | null) {
  const now = new Date().toISOString()
  const tenantId = getTenantId() ?? form.tenantId
  const taxIdentities = [
    ...(form.gstin.trim()
      ? [{
          taxId: record?.taxIdentities.find((tax) => tax.type === "gstin")?.taxId ?? `gstin-${Date.now()}`,
          type: "gstin" as const,
          value: form.gstin.trim(),
          isDefault: true,
        }]
      : []),
    ...form.taxIdentities
    .filter((tax) => tax.value.trim())
    .map((tax, index) => ({
      taxId: tax.taxId || `${tax.type}-${Date.now()}-${index}`,
      type: tax.type,
      value: tax.value.trim(),
      isDefault: tax.isDefault,
    })),
  ]
  const phones = form.phones
    .filter((phone) => phone.number.trim())
    .map((phone, index) => ({
      phoneId: phone.phoneId || `phone-${Date.now()}-${index}`,
      label: phone.label || "Primary",
      number: phone.number.trim(),
      isPrimary: phone.isPrimary,
    }))
  const emails = form.emails
    .filter((email) => email.address.trim())
    .map((email, index) => ({
      emailId: email.emailId || `email-${Date.now()}-${index}`,
      label: email.label || "Primary",
      address: email.address.trim(),
      isPrimary: email.isPrimary,
    }))
  const addresses = form.addresses
    .filter((address) => address.line1.trim() || address.city?.trim() || address.pincode?.trim())
    .map((address, index) => ({
      addressId: address.addressId || `addr-${Date.now()}-${index}`,
      tenantId,
      label: address.label || address.addressType || "Registered",
      line1: address.line1.trim(),
      ...(address.line2?.trim() ? { line2: address.line2.trim() } : {}),
      country: address.country.trim(),
      ...(address.state?.trim() ? { state: address.state.trim() } : {}),
      ...(address.district?.trim() ? { district: address.district.trim() } : {}),
      ...(address.city?.trim() ? { city: address.city.trim() } : {}),
      ...(address.pincode?.trim() ? { pincode: address.pincode.trim() } : {}),
      ...(address.gstStateCode?.trim() ? { gstStateCode: address.gstStateCode.trim() } : {}),
      isDefault: address.isDefault,
      addressType: address.addressType || "Registered",
      createdAt: address.createdAt || now,
      updatedAt: now,
    }))
  const bankAccounts = form.bankAccounts
    .filter((bank) => bank.bankName?.trim() || bank.accountNumber.trim())
    .map((bank, index) => ({
      accountId: bank.accountId || `bank-${Date.now()}-${index}`,
      accountHolderName: bank.accountHolderName.trim(),
      accountNumber: bank.accountNumber.trim(),
      ...(bank.accountTypeId?.trim() ? { accountTypeId: bank.accountTypeId.trim() } : {}),
      ifscCode: bank.ifscCode.trim(),
      ...(bank.bankName?.trim() ? { bankName: bank.bankName.trim() } : {}),
      ...(bank.branchName?.trim() ? { branchName: bank.branchName.trim() } : {}),
      isDefault: bank.isDefault,
    }))

  return {
    legalName: form.legalName.trim(),
    tradeName: form.tradeName.trim() || undefined,
    companyGroupId: form.companyGroupId.trim() || undefined,
    phone: phones,
    email: emails,
    addresses,
    bankAccounts,
    taxIdentities,
    website: form.website.trim() || undefined,
    logoUrl: form.logoUrl.trim() || undefined,
    logoDarkUrl: form.logoDarkUrl.trim() || undefined,
    faviconUrl: form.faviconUrl.trim() || undefined,
    notes: writeMeta({
      industry: form.industry.trim() || "General",
      msmeNo: form.msmeNo.trim(),
      msmeType: form.msmeType.trim(),
      notes: form.notes.trim(),
      socialLinks: form.socialLinks,
      tcsAvailable: form.tcsAvailable,
      tdsAvailable: form.tdsAvailable,
    }),
  }
}

function readMeta(value: string | undefined) {
  if (!value) return { industry: "", msmeNo: "", msmeType: "", notes: "", socialLinks: [] as CompanySocialLink[], tcsAvailable: false, tdsAvailable: false }
  try {
    const parsed = JSON.parse(value) as {
      industry?: string
      msmeNo?: string
      msmeType?: string
      notes?: string
      socialLinks?: CompanySocialLink[]
      tcsAvailable?: boolean
      tdsAvailable?: boolean
    }
    return {
      industry: parsed.industry ?? "",
      msmeNo: parsed.msmeNo ?? "",
      msmeType: parsed.msmeType ?? "",
      notes: parsed.notes ?? "",
      socialLinks: parsed.socialLinks ?? [],
      tcsAvailable: Boolean(parsed.tcsAvailable),
      tdsAvailable: Boolean(parsed.tdsAvailable),
    }
  } catch {
    return { industry: "", msmeNo: "", msmeType: "", notes: value, socialLinks: [] as CompanySocialLink[], tcsAvailable: false, tdsAvailable: false }
  }
}

function writeMeta(meta: { industry: string; msmeNo: string; msmeType: string; notes: string; socialLinks: CompanySocialLink[]; tcsAvailable: boolean; tdsAvailable: boolean }) {
  return JSON.stringify(meta)
}

async function archiveCompany(company: CompanyRecord, queryClient: ReturnType<typeof useQueryClient>) {
  await apiPost(`/core/companies/${company.companyId}/archive`, undefined, "tenant")
  toast.success("Company suspended")
  void queryClient.invalidateQueries({ queryKey: ["tenant", "companies"] })
}

async function restoreCompany(company: CompanyRecord, queryClient: ReturnType<typeof useQueryClient>) {
  await apiPost(`/core/companies/${company.companyId}/restore`, undefined, "tenant")
  toast.success("Company restored")
  void queryClient.invalidateQueries({ queryKey: ["tenant", "companies"] })
}

function emptyEmail(isPrimary = false): CompanyEmail {
  return { emailId: newId(), label: "Primary", address: "", isPrimary }
}

function emptyPhone(isPrimary = false): CompanyPhone {
  return { phoneId: newId(), label: "Mobile", number: "", isPrimary }
}

function emptyAddress(isDefault = false): CompanyAddress {
  const now = new Date().toISOString()
  return {
    addressId: newId(),
    tenantId: getTenantId() ?? "",
    label: "Registered",
    line1: "",
    country: "",
    isDefault,
    addressType: "Registered",
    createdAt: now,
    updatedAt: now,
  }
}

function emptyBank(isDefault = false): CompanyBankAccount {
  return { accountId: newId(), accountHolderName: "", accountNumber: "", accountTypeId: "", ifscCode: "", bankName: "", branchName: "", isDefault }
}

function emptyTaxIdentity(type: CompanyTaxIdentity["type"], isDefault = false): CompanyTaxIdentity {
  return { taxId: newId(), rowId: newId(), type, value: "", isDefault }
}

function emptySocial(): CompanySocialLink {
  return { id: newId(), platform: "Website", url: "", isActive: true }
}

function updateForm(setForm: Dispatch<SetStateAction<CompanyForm>>, patch: Partial<CompanyForm>) {
  setForm((current) => ({ ...current, ...patch }))
}

function updateArray<Key extends keyof Pick<CompanyForm, "addresses" | "bankAccounts" | "emails" | "phones" | "socialLinks" | "taxIdentities">>(
  setForm: Dispatch<SetStateAction<CompanyForm>>,
  key: Key,
  index: number,
  patch: Partial<CompanyForm[Key][number]>,
) {
  setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
  }))
}

function updatePrimary<Key extends "addresses" | "bankAccounts" | "emails" | "phones" | "taxIdentities">(
  setForm: Dispatch<SetStateAction<CompanyForm>>,
  key: Key,
  index: number,
  checked: boolean,
  field: "isPrimary" | "isDefault" = "isPrimary",
) {
  setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => ({ ...item, [field]: itemIndex === index ? checked : checked ? false : item[field as keyof typeof item] })),
  }))
}

function removeArrayItem<Key extends keyof Pick<CompanyForm, "addresses" | "bankAccounts" | "emails" | "phones" | "socialLinks" | "taxIdentities">>(
  setForm: Dispatch<SetStateAction<CompanyForm>>,
  key: Key,
  index: number,
  fallback: CompanyForm[Key][number],
) {
  setForm((current) => {
    const nextRows = current[key].filter((_, itemIndex) => itemIndex !== index)
    return { ...current, [key]: nextRows.length ? nextRows : [fallback] }
  })
}

function normalizeRows<T>(rows: T[] | undefined, fallback: T[]) {
  return rows?.length ? rows : fallback
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function shortId(value: string) {
  if (!value) return ""
  return value.length > 12 ? `${value.slice(0, 8)}...` : value
}

function codeFromName(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "APP"
}

function sameId(left: unknown, right: string) {
  return Boolean(right) && String(left ?? "") === String(right)
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"))
    reader.readAsDataURL(file)
  })
}

function formatDate(value: string | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
