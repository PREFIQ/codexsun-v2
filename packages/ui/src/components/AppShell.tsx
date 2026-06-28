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
    <div className="cx-shell">
      <aside className="cx-sidebar">
        <a className="cx-brand" href="/">
          <span>CODEXSUN</span>
          <small>Platform</small>
        </a>
        <nav>
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="cx-main">
        <header className="cx-topbar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="cx-topbar-actions">{actions}</div> : null}
        </header>
        <div className="cx-content">{children}</div>
      </main>
    </div>
  );
}
