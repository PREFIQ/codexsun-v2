import { useQuery } from "@tanstack/react-query"
import { Button, Card } from "@codexsun/ui"
import { apiGet } from "../../api"

type MatrixData = {
  matrix: Array<{ permission: string; roles: Record<string, boolean> }>
  allPermissions: string[]
}

export function PermissionMatrix({ onBack }: { onBack: () => void }) {
  const { data } = useQuery<MatrixData>({
    queryKey: ["admin", "permissions", "matrix"],
    queryFn: () => apiGet<MatrixData>("/admin/permissions/matrix", "sa")
  })

  const matrix = data?.matrix ?? []
  const first = matrix[0]
  const roles = first ? Object.keys(first.roles) : []

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Permission Matrix</h2>
      </div>
      <Card title="Role-Permission Matrix" description="Read-only view of system role permissions">
        {matrix.length > 0 ? (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid var(--cx-border)" }}>Permission</th>
                  {roles.map((role) => (
                    <th key={role} style={{ textAlign: "center", padding: "0.5rem", borderBottom: "1px solid var(--cx-border)" }}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.permission}>
                    <td style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid var(--cx-border)", fontFamily: "monospace", fontSize: "0.75rem" }}>{row.permission}</td>
                    {roles.map((role) => (
                      <td key={role} style={{ textAlign: "center", padding: "0.4rem 0.5rem", borderBottom: "1px solid var(--cx-border)" }}>
                        {row.roles[role] ? <span style={{ color: "green" }}>&#10003;</span> : <span style={{ color: "var(--cx-muted)" }}>&mdash;</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No permissions data available.</p>}
      </Card>
    </div>
  )
}
