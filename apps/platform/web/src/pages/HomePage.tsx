import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  LockKeyhole,
  Menu,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  X,
  type LucideIcon
} from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, cn } from "@codexsun/ui";

type Feature = {
  description: string;
  icon: LucideIcon;
  title: string;
};

type DeskLink = {
  description: string;
  href: "/login" | "/admin/login" | "/sa/login";
  icon: LucideIcon;
  title: string;
};

const features: Feature[] = [
  {
    description: "Master database first, tenant database next, with clear ownership across setup, login, and runtime.",
    icon: Database,
    title: "Tenant-aware foundation"
  },
  {
    description: "Billing, reports, receipts, payments, and common data begin from one operational workspace.",
    icon: ReceiptText,
    title: "Desk-first operations"
  },
  {
    description: "JWT-secured sessions, separated user desks, and a route structure ready for stronger policy gates.",
    icon: ShieldCheck,
    title: "Secure by default"
  },
  {
    description: "A shared UI package keeps public pages, auth screens, and application desks visually aligned.",
    icon: Sparkles,
    title: "Reusable design system"
  }
];

const deskLinks: DeskLink[] = [
  {
    description: "Tenant workspace for daily billing, reports, and business activity.",
    href: "/login",
    icon: Store,
    title: "Tenant Login"
  },
  {
    description: "Staff administration for setup, support, and workspace operations.",
    href: "/admin/login",
    icon: Building2,
    title: "Staff Admin"
  },
  {
    description: "Platform-level control for tenants, domains, modules, and master data.",
    href: "/sa/login",
    icon: LockKeyhole,
    title: "Super Admin"
  }
];

const metrics = [
  ["Master DB", "codexsun_master_db"],
  ["Runtime", "API + Web shell"],
  ["UI", "@codexsun/ui"],
  ["Mode", "Multi-tenant"]
];

function PublicHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    ["Platform", "#platform"],
    ["Desks", "#desks"],
    ["Foundation", "#foundation"],
    ["Status", "/status"]
  ] as const;

  function goTo(target: string) {
    setOpen(false);
    if (target.startsWith("#")) {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate({ to: target });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          className="flex items-center gap-3 text-left"
          onClick={() => navigate({ to: "/" })}
          type="button"
        >
          <img alt="Codexsun" className="size-8" src="/logo/logo.svg" />
          <span className="grid leading-tight">
            <span className="text-sm font-semibold text-foreground">Codexsun</span>
            <span className="text-xs text-muted-foreground">Platform</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, target]) => (
            <button
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              key={label}
              onClick={() => goTo(target)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button onClick={() => navigate({ to: "/login" })} variant="outline">
            Sign in
          </Button>
          <Button onClick={() => navigate({ to: "/sa/login" })}>
            Open desk
            <ArrowRight />
          </Button>
        </div>

        <Button
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
          size="icon"
          variant="outline"
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="grid gap-2">
            {links.map(([label, target]) => (
              <button
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                key={label}
                onClick={() => goTo(target)}
                type="button"
              >
                {label}
              </button>
            ))}
            <Button className="mt-2" onClick={() => navigate({ to: "/login" })}>
              Sign in
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AppPreview() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-lg">
      <div className="flex h-11 items-center justify-between border-b border-border bg-muted/40 px-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-500" />
        </div>
        <Badge className="bg-background text-foreground" variant="outline">
          Live platform shell
        </Badge>
      </div>
      <div className="grid gap-0 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-muted/25 p-4 lg:block">
          <div className="mb-6 flex items-center gap-3">
            <img alt="Codexsun" className="size-8" src="/logo/logo.svg" />
            <div>
              <div className="text-sm font-semibold">Acme Inc</div>
              <div className="text-xs text-muted-foreground">Enterprise</div>
            </div>
          </div>
          <div className="grid gap-2">
            {["Billing", "Tenants", "Domains", "Reports", "Compliance"].map((item, index) => (
              <div
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  index === 0 ? "bg-accent font-medium text-foreground" : "text-muted-foreground"
                )}
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Super Admin Control</div>
              <h2 className="mt-1 text-2xl font-semibold">Billing Desk</h2>
            </div>
            <Badge className="h-8 bg-emerald-50 text-emerald-700" variant="outline">
              Signed in as SUNDAR
            </Badge>
          </div>
          <img
            alt="Codexsun dashboard preview"
            className="w-full rounded-md border border-border bg-background"
            src="/images/hero_dashboard_ui.svg"
          />
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <section className="border-b border-border bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--muted)_55%,transparent)_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-5 w-fit bg-background text-foreground" variant="outline">
              Multi-tenant SaaS foundation
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Codexsun brings every business desk into one calm platform.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A lightweight public entry, auth flow, platform API, master database, tenant database, and shared UI system built to grow into billing, reporting, and operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate({ to: "/login" })} size="lg">
                Enter tenant desk
                <ArrowRight />
              </Button>
              <Button onClick={() => navigate({ to: "/status" })} size="lg" variant="outline">
                View platform status
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metrics.map(([label, value]) => (
                <div className="rounded-md border border-border bg-background/80 p-3 shadow-sm" key={label}>
                  <div className="text-xs font-medium text-muted-foreground">{label}</div>
                  <div className="mt-1 truncate text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 22 }}
            transition={{ delay: 0.1, duration: 0.55 }}
          >
            <AppPreview />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" id="platform">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge className="mb-4" variant="secondary">
              Platform shape
            </Badge>
            <h2 className="text-3xl font-semibold tracking-normal">Built from the foundation outward.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The public page now presents what the product already has: API health, role desks, a reusable UI package, and a database path ready for tenant-aware modules.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card className="rounded-lg p-5 shadow-sm" key={feature.title}>
                <feature.icon className="mb-4 size-5 text-primary" />
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/35" id="desks">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge className="mb-4 bg-background" variant="outline">
                Desk access
              </Badge>
              <h2 className="text-3xl font-semibold tracking-normal">Choose the right entrance.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Each desk keeps the same visual language, while permissions and menu data can stay dynamic behind the scenes.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {deskLinks.map((desk) => (
              <Card className="rounded-lg p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={desk.title}>
                <desk.icon className="mb-5 size-6 text-primary" />
                <h3 className="text-lg font-semibold">{desk.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{desk.description}</p>
                <Button className="mt-5 w-full justify-between" onClick={() => navigate({ to: desk.href })} variant="outline">
                  Open
                  <ArrowRight />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" id="foundation">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Ready for the next modules</h2>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                "Master database bootstraps before tenant runtime.",
                "Platform API exposes health and auth contracts.",
                "Shared UI package provides the design surface.",
                "Role dashboards use the same shell with dynamic menu data."
              ].map((item) => (
                <div className="flex gap-3 text-sm text-muted-foreground" key={item}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-foreground p-6 text-background shadow-sm">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5" />
              <h2 className="text-xl font-semibold">Operational direction</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-background/75">
              Codexsun is moving toward a full platform framework: billing desk, tenant management, reports, common data, auth, and health-first runtime checks.
            </p>
            <Button className="mt-6 bg-background text-foreground hover:bg-background/90" onClick={() => navigate({ to: "/sa/login" })}>
              Open super admin
              <ArrowRight />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/35">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img alt="Codexsun" className="size-7" src="/logo/logo.svg" />
            <span>Codexsun Platform</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="hover:text-foreground" onClick={() => navigate({ to: "/status" })} type="button">
              Status
            </button>
            <button className="hover:text-foreground" onClick={() => navigate({ params: { saPage: "design-system" }, to: "/sa/$saPage" })} type="button">
              Design system
            </button>
            <span>v1.0.2</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
