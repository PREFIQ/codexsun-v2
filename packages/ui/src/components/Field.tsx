import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ error, id, label, ...props }: FieldProps) {
  const inputId = id ?? props.name;

  return (
    <label className="cx-field" htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} {...props} />
      {error ? <small>{error}</small> : null}
    </label>
  );
}
