import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function Card({ action, children, className = "", description, title, ...props }: CardProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)} {...props}>
      {title || description || action ? (
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            {title ? <h2 className="m-0 text-lg font-semibold leading-tight">{title}</h2> : null}
            {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
