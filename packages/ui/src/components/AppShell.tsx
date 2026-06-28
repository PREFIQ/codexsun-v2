import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  navItems: NavItem[];
  subtitle?: string;
  title: string;
};

export function AppShell({ actions, children, navItems, subtitle, title }: AppShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-5 bg-[#17201c] p-4 text-white md:min-h-screen md:gap-7 md:p-6">
        <a className="grid gap-0.5" href="/">
          <span className="text-base font-bold">CODEXSUN</span>
          <small className="text-[#a6b5ae]">Platform</small>
        </a>
        <nav className="flex gap-2 overflow-x-auto md:grid md:gap-1.5">
          {navItems.map((item) => (
            <a
              className="rounded-md px-3 py-2 text-sm font-semibold text-[#d8e2dd] hover:bg-white/10 hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <header className="flex min-h-[76px] flex-col items-start justify-between gap-3 border-b border-border bg-card/90 px-5 py-4 md:flex-row md:items-center md:px-7">
          <div>
            <h1 className="m-0 text-2xl font-semibold leading-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
        <div className="p-5 md:p-7">{children}</div>
      </main>
    </div>
  );
}
