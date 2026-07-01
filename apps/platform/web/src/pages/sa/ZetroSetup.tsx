import { Button, Card, StatusBadge } from "@codexsun/ui"

export function ZetroSetup({ onBack }: { onBack: () => void }) {
  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="ZETRO Setup" description="AI business assistant configuration and deployment"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <p style={{ color: "var(--cx-muted)", margin: "1rem 0" }}>
          ZETRO is the AI-powered business assistant for tenant teams. This page will manage AI provider configuration, knowledge base setup, assistant personas, and tenant-level ZETRO deployment.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>AI Provider</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>LLM provider connected via Workbench</span></div>
            <StatusBadge tone="amber">Configure</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Knowledge Base</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Tenant-specific data sources</span></div>
            <StatusBadge tone="amber">Pending</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Assistant Persona</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Custom assistant behavior per tenant</span></div>
            <StatusBadge tone="amber">Pending</StatusBadge>
          </div>
        </div>
      </Card>
    </div>
  )
}
