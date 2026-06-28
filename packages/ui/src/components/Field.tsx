import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ className, error, id, label, ...props }: FieldProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2" htmlFor={inputId}>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        className={cn(
          "min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        id={inputId}
        {...props}
      />
      {error ? <small className="text-sm text-destructive">{error}</small> : null}
    </label>
  );
}
