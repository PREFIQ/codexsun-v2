import { Button, Card, StatusBadge } from "@codexsun/ui"

export function Subscriptions({ onBack }: { onBack: () => void }) {
  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Subscriptions" description="Tenant subscription plans and billing management"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <p style={{ color: "var(--cx-muted)", margin: "1rem 0" }}>
          Subscription management is reserved for future implementation. The <code>SubscriptionService</code> scaffold exists in the platform package; full plan definitions, billing integration, and tenant plan assignment will be built here.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Free Tier</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Basic tenant access</span></div>
            <StatusBadge tone="green">Active</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Professional</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Advanced features & modules</span></div>
            <StatusBadge tone="amber">Future</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Enterprise</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Full platform access with SLA</span></div>
            <StatusBadge tone="amber">Future</StatusBadge>
          </div>
        </div>
      </Card>
    </div>
  )
}
