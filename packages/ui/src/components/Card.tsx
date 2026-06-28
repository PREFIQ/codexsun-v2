import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function Card({ action, children, className = "", description, title, ...props }: CardProps) {
  return (
    <section className={`cx-card ${className}`.trim()} {...props}>
      {title || description || action ? (
        <header className="cx-card-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      ) : null}
      <div className="cx-card-body">{children}</div>
    </section>
  );
}
