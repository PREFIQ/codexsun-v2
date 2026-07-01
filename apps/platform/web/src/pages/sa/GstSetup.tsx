import { Button, Card, StatusBadge } from "@codexsun/ui"

export function GstSetup({ onBack }: { onBack: () => void }) {
  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="GST Setup" description="Goods and Services Tax configuration for Indian compliance"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <p style={{ color: "var(--cx-muted)", margin: "1rem 0" }}>
          GST configuration includes state-wise GST rates, HSN/SAC code management, e-invoice/e-way bill API integration, and return filing setup. Core types already include <code>TaxIdentityBlock</code>, <code>hsnCode</code>, and <code>gstStateCode</code>.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>Tax Categories</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>GST rate slabs (0%, 5%, 12%, 18%, 28%)</span></div>
            <StatusBadge tone="green">Configured</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>HSN / SAC Codes</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Product/service classification</span></div>
            <StatusBadge tone="amber">Pending</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>E-Invoice API</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>IRN generation and QR code</span></div>
            <StatusBadge tone="amber">Pending</StatusBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--cx-border)", borderRadius: "8px" }}>
            <div><strong>E-Way Bill</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Movement of goods tracking</span></div>
            <StatusBadge tone="amber">Pending</StatusBadge>
          </div>
        </div>
      </Card>
    </div>
  )
}
