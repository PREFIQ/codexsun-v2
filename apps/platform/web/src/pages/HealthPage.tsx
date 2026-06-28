import { Button, Card, StatusBadge } from "@codexsun/ui";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../api";

type HealthResponse = {
  success: boolean;
  data?: {
    checks: {
      "platform-api"?: {
        details?: {
          database?: {
            masterDatabase: string;
            ready: boolean;
            tenantTestDatabase: string;
          };
        };
        status: "degraded" | "down" | "ok";
      };
    };
    status: "degraded" | "down" | "ok";
  };
};

export function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | undefined>();
  const [loading, setLoading] = useState(false);

  async function loadHealth() {
    setLoading(true);
    try {
      setHealth(await apiGet<HealthResponse>("/health"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  const database = health?.data?.checks["platform-api"]?.details?.database;

  return (
    <main className="simple-page">
      <Card
        action={
          <Button disabled={loading} icon={<RefreshCw size={16} />} onClick={loadHealth}>
            Refresh
          </Button>
        }
        description="Live API and database bootstrap status."
        title="Platform Status"
      >
        <div className="status-list">
          <span>API</span>
          <strong>platform-api</strong>
          <span>Status</span>
          <StatusBadge tone={health?.data?.status === "ok" ? "green" : "amber"}>
            {health?.data?.status ?? "loading"}
          </StatusBadge>
          <span>Master DB</span>
          <strong>{database?.masterDatabase ?? "Unknown"}</strong>
          <span>Tenant Test DB</span>
          <strong>{database?.tenantTestDatabase ?? "Unknown"}</strong>
        </div>
      </Card>
    </main>
  );
}
