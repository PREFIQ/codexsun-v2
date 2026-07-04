import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ArrowLeft, Database, HardDrive, Image, Shield } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { apiGet } from "../../api";

type MediaSettingsSummary = {
  storageRoot: string;
  totals: {
    active: number;
    publicAssets: number;
    sizeBytes: number;
    total: number;
  };
  tenants: Array<{
    id: string;
    media: {
      defaultCategory: string;
      defaultFolder: string;
      defaultVisibility: string;
      maxUploadMb: number;
      publicAssetsEnabled: boolean;
    };
    slug: string;
    tenantCode: string;
    tenantName: string;
  }>;
};

export function MediaSettings({ onBack }: { onBack: () => void }) {
  const summaryQuery = useQuery({
    queryKey: ["admin", "media-settings"],
    queryFn: () => apiGet<MediaSettingsSummary>("/admin/media/settings", "sa"),
  });
  const summary = summaryQuery.data;

  return (
    <WorkspacePage
      title="Media Settings"
      description="Review storage root, tenant media policy, and platform media asset usage."
      technicalName="page.sa.media.settings"
      actions={
        <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Image className="size-5" />} label="Assets" value={String(summary?.totals.total ?? 0)} />
        <Metric icon={<Shield className="size-5" />} label="Active" value={String(summary?.totals.active ?? 0)} />
        <Metric icon={<HardDrive className="size-5" />} label="Storage" value={formatBytes(summary?.totals.sizeBytes ?? 0)} />
        <Metric icon={<Database className="size-5" />} label="Root" value={summary?.storageRoot ?? "storage"} />
      </div>
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell>Tenant</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Slug</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Folder</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Category</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Visibility</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Limit</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Public</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {(summary?.tenants ?? []).map((tenant) => (
                <tr key={tenant.id} className="border-b border-border/70 last:border-b-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{tenant.tenantName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{tenant.tenantCode}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tenant.slug}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tenant.media.defaultFolder}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tenant.media.defaultCategory}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tenant.media.defaultVisibility}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tenant.media.maxUploadMb} MB</td>
                  <td className="px-4 py-2.5">
                    <WorkspaceStatusBadge
                      label={tenant.media.publicAssetsEnabled ? "enabled" : "disabled"}
                      tone={tenant.media.publicAssetsEnabled ? "success" : "neutral"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!summaryQuery.isLoading && !summary?.tenants.length ? <WorkspaceTableEmptyState>No tenant media settings found.</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
    </WorkspacePage>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/95 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</div>
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
