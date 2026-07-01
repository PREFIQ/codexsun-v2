import { useQuery } from "@tanstack/react-query"
import { Button, Card } from "@codexsun/ui"
import { apiGet } from "../../api"

type SettingSection = {
  title: string
  items: Array<{ label: string; key: string; value: unknown; masked?: boolean }>
}

export function PlatformSettings({ onBack }: { onBack: () => void }) {
  const { data: sections } = useQuery<SettingSection[]>({
    queryKey: ["settings", "platform"],
    queryFn: () => apiGet<SettingSection[]>("/settings/platform", "sa")
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Platform Settings" description="Global platform configuration and runtime info"
        action={<Button variant="secondary" onClick={onBack}>Back</Button>}>
        {sections && sections.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
            {sections.map((section) => (
              <div key={section.title}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.375rem" }}>{section.title}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {section.items.map((item) => (
                    <div key={item.key} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--cx-muted)" }}>{item.label}</span>
                      <span>{item.masked ? "••••••••" : String(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : <p>Loading...</p>}
      </Card>
    </div>
  )
}
