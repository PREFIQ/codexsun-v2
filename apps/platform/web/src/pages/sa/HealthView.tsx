import { useQuery } from "@tanstack/react-query"
import { Button, Card, StatusBadge } from "@codexsun/ui"
import { apiGet } from "../../api"

type HealthData = {
  status: string; api: { status: string; uptime: number }; database: { status: string; name: string }; modules: Array<{ key: string; name: string; status: string }>
}

export function HealthView({ onBack }: { onBack: () => void }) {
  const { data } = useQuery<HealthData>({
    queryKey: ["admin", "health"],
    queryFn: () => apiGet<HealthData>("/admin/health", "sa")
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>System Health</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Card title="API Status">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
            <StatusBadge tone={data?.api?.status === "ok" ? "green" : "red"}>{data?.api?.status ?? "unknown"}</StatusBadge>
            <span style={{ fontSize: "0.85rem", color: "var(--cx-muted)" }}>Uptime: {Math.floor((data?.api?.uptime ?? 0) / 60)}m</span>
          </div>
        </Card>
        <Card title="Database Status">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
            <StatusBadge tone={data?.database?.status === "ok" ? "green" : "red"}>{data?.database?.status ?? "unknown"}</StatusBadge>
            <span style={{ fontSize: "0.85rem", color: "var(--cx-muted)" }}>{data?.database?.name}</span>
          </div>
        </Card>
        <Card title="Registered Modules" description={`${data?.modules?.length ?? 0} modules`}>
          {data?.modules ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.5rem" }}>
              {data.modules.map((m) => (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", borderRadius: "999px", padding: "0.1rem 0.5rem", border: "1px solid", borderColor: m.status === "registered" ? "green" : "orange", color: m.status === "registered" ? "green" : "orange" }}>{m.status}</span>
                  <span>{m.name}</span>
                  <span style={{ color: "var(--cx-muted)" }}>({m.key})</span>
                </div>
              ))}
            </div>
          ) : <p>Loading...</p>}
        </Card>
      </div>
    </div>
  )
}
