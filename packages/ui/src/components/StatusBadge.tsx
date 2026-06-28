type StatusTone = "green" | "blue" | "amber" | "red" | "neutral";

export function StatusBadge({ children, tone = "neutral" }: { children: string; tone?: StatusTone }) {
  return <span className={`cx-status cx-status-${tone}`}>{children}</span>;
}
