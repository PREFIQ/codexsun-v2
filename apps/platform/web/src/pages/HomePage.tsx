import { Button, Card, StatusBadge } from "@codexsun/ui";
import { ArrowRight, ShieldCheck, Stethoscope, UserRoundCog } from "lucide-react";

export function HomePage() {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <a className="public-brand" href="/">
          CODEXSUN
        </a>
        <div>
          <a href="/status">Status</a>
          <a href="/login">Tenant Login</a>
          <a href="/sa/login">Super Admin</a>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <StatusBadge tone="green">Foundation active</StatusBadge>
          <h1>Business operations platform, starting clean.</h1>
          <p>
            CODEXSUN is being built as a tenant-safe, modular platform for industry-aware
            billing, accounting, operations, integrations, offline sync, and AI assistance.
          </p>
          <div className="hero-actions">
            <a href="/login">
              <Button icon={<ArrowRight size={17} />}>Open Tenant Login</Button>
            </a>
            <a href="/status">
              <Button icon={<Stethoscope size={17} />} variant="secondary">
                API Status
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="public-grid">
        <Card title="Tenant First" description="Every future workflow starts with tenant safety.">
          <ShieldCheck size={26} />
          <p>Master DB first, tenant DB next, with explicit test tenant seeding in this scaffold.</p>
        </Card>
        <Card title="Three Desks" description="Separate routes for platform owner, staff, and tenant users.">
          <UserRoundCog size={26} />
          <p>Super Admin, Staff Admin, and Tenant desks have separate login pages and shells.</p>
        </Card>
      </section>
    </main>
  );
}
