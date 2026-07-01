import { Button, Card, StatusBadge } from "@codexsun/ui"

export function Industries({ onBack }: { onBack: () => void }) {
  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Industries" description="Industry vertical definitions and tenant industry assignments"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <p style={{ color: "var(--cx-muted)", margin: "1rem 0" }}>
          Industry verticals enable module scoping and industry-specific templates. The <code>ModuleScope</code> type already includes <code>"industry"</code> as a valid scope. This page will manage industry definitions and assign them to tenants.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Retail</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>B2C and B2B retail operations</span></div>
            <StatusBadge tone="amber">Planned</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Manufacturing</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Production and inventory management</span></div>
            <StatusBadge tone="amber">Planned</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Logistics</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Transport and supply chain</span></div>
            <StatusBadge tone="amber">Planned</StatusBadge>
          </div>
        </div>
      </Card>
    </div>
  )
}
