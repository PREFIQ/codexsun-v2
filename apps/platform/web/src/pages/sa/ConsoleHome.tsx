import { useQuery } from "@tanstack/react-query"
import { ArrowRightIcon, ReceiptTextIcon, UserRoundIcon } from "lucide-react"
import { Badge } from "@codexsun/ui/components/badge"
import { apiGet } from "../../api"

type ConsoleData = {
  tenants: { total: number; active: number; suspended: number }
  enabledModules: number
  recentAudits: number
  migrations: number
  dbStatus: { masterDatabase: string; ready: boolean }
}

export function ConsoleHome({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { data } = useQuery<ConsoleData>({
    queryKey: ["admin", "console"],
    queryFn: () => apiGet<ConsoleData>("/admin/console", "sa")
  })

  const stats = [
    { label: "Total Tenants", value: data?.tenants.total ?? 0, page: "tenants" },
    { label: "Active Tenants", value: data?.tenants.active ?? 0, page: "tenants" },
    { label: "Suspended Tenants", value: data?.tenants.suspended ?? 0, page: "tenants" },
    { label: "Enabled Modules", value: data?.enabledModules ?? 0, page: "modules" },
    { label: "Recent Audits (24h)", value: data?.recentAudits ?? 0, page: "audit" },
    { label: "Migrations", value: data?.migrations ?? 0, page: "migrations" },
  ]

  return (
    <section className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-100/75 via-teal-50/55 to-transparent" />
        <div className="absolute right-24 top-1/2 hidden size-36 -translate-y-1/2 rounded-full bg-emerald-200/25 blur-2xl lg:block" />
        <div className="relative flex min-h-34 flex-col justify-between gap-5 px-5 py-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ReceiptTextIcon className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Super Admin Control</p>
              <h1 className="mt-1 text-3xl font-semibold leading-none tracking-normal text-foreground">Overview</h1>
              <p className="mt-3 max-w-4xl text-sm text-muted-foreground">
                Platform tenants, domains, subscriptions, modules, compliance, access, and operational controls.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit shrink-0 gap-2 rounded-full bg-background/95 px-4 py-2 shadow-sm">
            <UserRoundIcon className="size-4" />
            Signed in as SUNDAR
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onNavigate(s.page)}
              className="rounded-md border border-border/70 bg-card/95 p-5 text-left shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="text-3xl font-semibold tabular-nums text-foreground">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </button>
          ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {[
          { label: "Tenant Registry", page: "tenants" },
          { label: "Module Activation", page: "modules" },
          { label: "Audit Viewer", page: "audit" },
          { label: "Migration Status", page: "migrations" },
          { label: "System Health", page: "health" },
          { label: "Platform Users", page: "users" },
          { label: "Roles & Permissions", page: "roles" },
          { label: "Active Sessions", page: "sessions" },
        ].map((link) => (
          <button
            key={link.page}
            type="button"
            onClick={() => onNavigate(link.page)}
            className="flex items-center justify-between rounded-md border border-border/70 bg-card/95 px-4 py-3 text-sm shadow-sm transition-colors hover:bg-muted/30"
          >
            <span>{link.label}</span>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  )
}
