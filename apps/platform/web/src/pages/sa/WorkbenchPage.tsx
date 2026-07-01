import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button, Card, StatusBadge } from "@codexsun/ui"
import { apiGet } from "../../api"

type ToolDef = { toolKey: string; label: string; description: string; scope: string; requiresConfirmation: boolean; auditLevel: string }
type PromptTemplate = { templateKey: string; purpose: string; version: string; allowedAgents: string[] }
type AgentAudit = { auditId: string; agentKey: string; userEmail: string; action: string; toolKey: string; confirmationState: string; timestamp: string }
type ProviderSetting = { providerKey: string; label: string; modelLabel: string; enabled: boolean; isLocal: boolean }

type Tab = "tools" | "prompts" | "audit" | "providers"

export function WorkbenchPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("tools")

  const { data: tools } = useQuery<ToolDef[]>({ queryKey: ["agents", "tools"], queryFn: () => apiGet("/agents/tools", "sa") })
  const { data: templates } = useQuery<PromptTemplate[]>({ queryKey: ["agents", "prompts"], queryFn: () => apiGet("/agents/prompts", "sa") })
  const { data: audits } = useQuery<AgentAudit[]>({ queryKey: ["agents", "audit"], queryFn: () => apiGet("/agents/audit", "sa") })
  const { data: providers } = useQuery<ProviderSetting[]>({ queryKey: ["agents", "providers"], queryFn: () => apiGet("/agents/providers", "sa") })

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "tools", label: "Tool Registry" },
    { key: "prompts", label: "Prompt Templates" },
    { key: "audit", label: "Action Audit" },
    { key: "providers", label: "Provider Settings" }
  ]

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Developer Workbench" description="Agent tools, prompt templates, action audit, and provider settings"
        action={
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {tabs.map((t) => (
              <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "ghost"} onClick={() => setTab(t.key)}>{t.label}</Button>
            ))}
            <Button variant="secondary" onClick={onBack}>Back</Button>
          </div>
        }>
        {tab === "tools" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {tools?.map((t) => (
              <div key={t.toolKey} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "0.375rem" }}>
                <div>
                  <strong>{t.label}</strong>
                  <p style={{ fontSize: "0.8125rem", color: "var(--cx-muted)", margin: 0 }}>{t.description}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>Scope: {t.scope} | Confirmation: {t.requiresConfirmation ? "Yes" : "No"}</p>
                </div>
                <StatusBadge tone={t.auditLevel === "all" ? "amber" : "green"}>{t.auditLevel}</StatusBadge>
              </div>
            ))}
          </div>
        )}
        {tab === "prompts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {templates?.map((t) => (
              <div key={t.templateKey} style={{ padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "0.375rem" }}>
                <strong>{t.templateKey}</strong>
                <p style={{ fontSize: "0.8125rem", color: "var(--cx-muted)", margin: 0 }}>{t.purpose}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>Version: {t.version} | Agents: {t.allowedAgents.join(", ")}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "audit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {audits?.map((a) => (
              <div key={a.auditId} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem", borderBottom: "1px solid var(--cx-border)", fontSize: "0.8125rem" }}>
                <div>
                  <strong>{a.agentKey}</strong> - {a.action} <span style={{ color: "var(--cx-muted)" }}>({a.userEmail})</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <StatusBadge tone={a.confirmationState === "confirmed" ? "green" : a.confirmationState === "rejected" ? "red" : "neutral"}>{a.confirmationState}</StatusBadge>
                  <span style={{ color: "var(--cx-muted)", fontSize: "0.75rem" }}>{new Date(a.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(!audits || audits.length === 0) && <p>No audit records found.</p>}
          </div>
        )}
        {tab === "providers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {providers?.map((p) => (
              <div key={p.providerKey} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "0.375rem" }}>
                <div>
                  <strong>{p.label}</strong>
                  <p style={{ fontSize: "0.8125rem", color: "var(--cx-muted)", margin: 0 }}>{p.modelLabel}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge tone={p.enabled ? "green" : "neutral"}>{p.enabled ? "Enabled" : "Disabled"}</StatusBadge>
                  <StatusBadge tone={p.isLocal ? "blue" : "neutral"}>{p.isLocal ? "Local" : "Cloud"}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
