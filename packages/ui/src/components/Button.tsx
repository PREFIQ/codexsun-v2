import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: ButtonVariant;
};

export function Button({ children, className = "", icon, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={`cx-button cx-button-${variant} ${className}`.trim()} {...props}>
      {icon ? <span className="cx-button-icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
