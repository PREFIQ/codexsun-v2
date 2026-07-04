import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChevronRight,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Image,
  LayoutGrid,
  Plus,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Progress } from "@codexsun/ui/components/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codexsun/ui/components/select";
import { Textarea } from "@codexsun/ui/components/textarea";
import { getTreeExpandedState, Tree, useTree, type RenderTreeNodePayload, type TreeNodeData } from "@codexsun/ui/components/tree";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { cn } from "@codexsun/ui/lib/utils";
import { apiGet, apiPost, getTenantId, getToken } from "../../api";

type MediaAsset = {
  assetId: string;
  altText: string;
  caption: string;
  category: string;
  createdAt: string;
  extension: string;
  fileName: string;
  folder: string;
  isActive: boolean;
  mimeType: string;
  originalName: string;
  publicUrl?: string | null;
  sizeBytes: number;
  storagePath: string;
  tenantSlug?: string;
  updatedAt: string;
  visibility: "private" | "tenant" | "public" | string;
};

type MediaForm = {
  altText: string;
  caption: string;
  category: string;
  file: File | null;
  folder: string;
  visibility: string;
};

const initialForm: MediaForm = {
  altText: "",
  caption: "",
  category: "files",
  file: null,
  folder: "media",
  visibility: "private",
};

export function MediaAssetsPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MediaForm>(initialForm);
  const [previewUrl, setPreviewUrl] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedTreeKey, setSelectedTreeKey] = useState("all");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const assetsQuery = useQuery({
    queryKey: ["tenant", "media-assets"],
    queryFn: () => apiGet<MediaAsset[]>("/media/assets", "tenant"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.file) throw new Error("Choose a file before uploading");
      setUploadProgress(12);
      const dataUrl = await readFileAsDataUrl(form.file);
      setUploadProgress(56);
      const asset = await apiPost<MediaAsset>("/media/assets", {
        altText: form.altText,
        caption: form.caption,
        category: form.category,
        dataUrl,
        fileName: form.file.name,
        folder: form.folder,
        mimeType: form.file.type || "application/octet-stream",
        originalName: form.file.name,
        visibility: form.visibility,
      }, "tenant");
      setUploadProgress(100);
      return asset;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "media-assets"] });
      toast.success("Media asset uploaded");
      resetUploader();
      setOpen(false);
    },
    onError: (error) => {
      setUploadProgress(0);
      toast.error("Media upload failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (asset: MediaAsset) => apiPost(asset.isActive ? `/media/assets/${asset.assetId}/archive` : `/media/assets/${asset.assetId}/restore`, {}, "tenant"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "media-assets"] });
    },
  });

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const treeData = useMemo(() => buildTreeData(assets), [assets]);
  const treeItems = useMemo(() => flattenTree(treeData), [treeData]);
  const defaultExpandedValues = useMemo(() => expandedStorageValues(assets), [assets]);
  const mediaTree = useTree({
    initialExpandedState: getTreeExpandedState(treeData, defaultExpandedValues),
  });
  const categoryOptions = useMemo(() => uniqueOptions(["files", "images", "documents", ...assets.map((asset) => asset.category)]), [assets]);
  const folderOptions = useMemo(() => uniqueOptions(["media", ...assets.map((asset) => asset.folder)]), [assets]);
  const filtered = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    const selectedMeta = treeItems.find((item) => item.value === selectedTreeKey);
    return assets.filter((asset) => {
      if (statusFilter !== "all" && (asset.isActive ? "active" : "archived") !== statusFilter) return false;
      if (selectedMeta?.assetId && asset.assetId !== selectedMeta.assetId) return false;
      if (selectedMeta?.category && asset.category !== selectedMeta.category) return false;
      if (selectedMeta?.visibility && asset.visibility !== selectedMeta.visibility) return false;
      if (selectedMeta?.folder && !isSameOrChildFolder(asset.folder, selectedMeta.folder)) return false;
      if (!term) return true;
      return [asset.originalName, asset.category, asset.folder, asset.visibility, asset.altText, asset.caption, asset.mimeType]
        .some((value) => String(value ?? "").toLowerCase().includes(term));
    });
  }, [assets, searchValue, selectedTreeKey, statusFilter, treeItems]);
  const selectedTitle = treeItems.find((item) => item.value === selectedTreeKey)?.labelText ?? "All media";

  useEffect(() => {
    const defaultExpandedState = getTreeExpandedState(treeData, defaultExpandedValues);
    mediaTree.setExpandedState((current) => {
      const missingDefault = Object.keys(defaultExpandedState).some((key) => !current[key]);
      return missingDefault ? { ...defaultExpandedState, ...current } : current;
    });
  }, [defaultExpandedValues, treeData]);

  function chooseFile(file: File | null) {
    setForm((current) => ({ ...current, file, altText: current.altText || file?.name.replace(/\.[^.]+$/, "") || "" }));
    setPreviewUrl("");
    if (file?.type.startsWith("image/")) {
      void readFileAsDataUrl(file).then(setPreviewUrl);
    }
    setUploadProgress(0);
  }

  function resetUploader() {
    setForm(initialForm);
    setPreviewUrl("");
    setUploadProgress(0);
    setIsDragging(false);
    setNewFolderName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function createFolderOption() {
    const folder = normalizeFolderName(newFolderName);
    if (!folder) return;
    setForm((current) => ({ ...current, folder }));
    setNewFolderName("");
  }

  return (
    <WorkspacePage
      title="Media Assets"
      description="Browse folders, preview files, and upload tenant-scoped media assets."
      technicalName="page.tenant.media.assets"
      actions={
        <>
          <Button type="button" variant="outline" className="h-9 rounded-md" disabled={assetsQuery.isFetching} onClick={() => void assetsQuery.refetch()}>
            <RefreshCw className={assetsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setOpen(true)}>
            <Upload className="size-4" />
            Upload
          </Button>
        </>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ]}
        filterValue={statusFilter}
        onFilterValueChange={setStatusFilter}
        onSearchValueChange={setSearchValue}
        searchPlaceholder="Search files, folders, category, visibility, or caption"
        searchValue={searchValue}
      />

      <div className="grid min-h-[560px] gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-md border border-border/70 bg-card/95 shadow-sm">
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderOpen className="size-4" />
              Library
            </div>
          </div>
          <div className="p-2">
            <Tree
              data={treeData}
              levelOffset={18}
              selectOnClick={false}
              selectedValue={selectedTreeKey}
              tree={mediaTree}
              withLines
              onNodeSelect={(value) => {
                if (value !== "root:folders" && value !== "root:categories") {
                  setSelectedTreeKey(value);
                }
              }}
              renderNode={(payload) => <MediaTreeNode {...payload} />}
            />
          </div>
        </aside>

        <section className="rounded-md border border-border/70 bg-card/95 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">{selectedTitle}</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} assets shown from {assets.length} total</p>
            </div>
            <WorkspaceStatusBadge label={`${formatBytes(totalBytes(filtered))}`} tone="neutral" />
          </div>

          {filtered.length ? (
            <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((asset) => (
                <article key={asset.assetId} className="group overflow-hidden rounded-md border border-border/70 bg-background shadow-sm transition-colors hover:bg-muted/25">
                  <div className="relative grid aspect-[5/3] place-items-center border-b border-border/70 bg-muted/45">
                    {asset.mimeType.startsWith("image/") ? (
                      <MediaImagePreview asset={asset} />
                    ) : (
                      <AssetIcon asset={asset} />
                    )}
                    <div className="absolute left-2 top-2">
                      <WorkspaceStatusBadge label={asset.visibility} tone={asset.visibility === "public" ? "success" : "neutral"} />
                    </div>
                  </div>
                  <div className="space-y-2 p-2.5">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{asset.originalName}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{asset.caption || asset.mimeType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <Info label="Folder" value={asset.folder} />
                      <Info label="Size" value={formatBytes(asset.sizeBytes)} />
                      <Info label="Type" value={asset.extension.toUpperCase()} />
                      <Info label="Status" value={asset.isActive ? "Active" : "Archived"} />
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-md px-2.5"
                        onClick={() => statusMutation.mutate(asset)}
                      >
                        <Archive className="size-3.5" />
                        {asset.isActive ? "Archive" : "Restore"}
                      </Button>
                      <span className="truncate text-xs text-muted-foreground">{formatDate(asset.updatedAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[460px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid size-14 place-items-center rounded-md bg-muted">
                  <Image className="size-7 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{assetsQuery.isLoading ? "Loading media..." : "No media assets found"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Upload a file or change the folder/filter selection.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetUploader(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload media asset</DialogTitle>
            <DialogDescription>Select a file, confirm its folder and visibility, then upload it into the tenant media library.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <button
                type="button"
                className={cn(
                  "grid min-h-56 w-full place-items-center rounded-md border border-dashed p-6 text-center transition-colors",
                  isDragging ? "border-foreground bg-muted" : "border-border bg-muted/30 hover:bg-muted/45",
                )}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  chooseFile(event.dataTransfer.files?.[0] ?? null);
                }}
              >
                {previewUrl ? (
                  <img alt="Selected upload preview" className="max-h-52 rounded-md object-contain" decoding="async" src={previewUrl} />
                ) : (
                  <div>
                    <div className="mx-auto grid size-14 place-items-center rounded-md bg-background shadow-sm">
                      <Upload className="size-7 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-semibold">Drop file here or browse</p>
                    <p className="mt-1 text-xs text-muted-foreground">Images, PDFs, documents, and reusable tenant files</p>
                  </div>
                )}
              </button>
              <input
                ref={inputRef}
                className="hidden"
                type="file"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />

              {form.file ? (
                <div className="rounded-md border border-border/70 bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{form.file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{form.file.type || "application/octet-stream"} - {formatBytes(form.file.size)}</p>
                    </div>
                    <Button type="button" size="icon" variant="outline" className="size-8 rounded-md" onClick={() => chooseFile(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  {createMutation.isPending || uploadProgress > 0 ? (
                    <div className="mt-3 space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-muted-foreground">{uploadProgress >= 100 ? "Upload complete" : `Uploading ${uploadProgress}%`}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-md border border-border/70 bg-background p-4">
              <SelectField
                label="Category"
                options={categoryOptions}
                value={form.category}
                onChange={(category) => setForm((current) => ({ ...current, category }))}
              />
              <div className="space-y-2">
                <SelectField
                  label="Folder"
                  options={folderOptions}
                  value={form.folder}
                  onChange={(folder) => setForm((current) => ({ ...current, folder }))}
                />
                <div className="flex gap-2">
                  <Input
                    className="h-10 rounded-md"
                    placeholder="Create folder"
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        createFolderOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-md"
                    disabled={!newFolderName.trim()}
                    onClick={createFolderOption}
                  >
                    <Plus className="size-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(visibility) => setForm((current) => ({ ...current, visibility }))}>
                  <SelectTrigger className="h-11 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Alt text" value={form.altText} onChange={(altText) => setForm((current) => ({ ...current, altText }))} />
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea className="min-h-24 rounded-md" value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" disabled={!form.file || createMutation.isPending} onClick={() => createMutation.mutate()}>
              <Upload className="size-4" />
              {createMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspacePage>
  );
}

function AssetIcon({ asset }: { asset: MediaAsset }) {
  if (asset.mimeType.startsWith("image/")) return <FileImage className="size-16 text-muted-foreground" />;
  if (asset.mimeType.includes("pdf") || asset.mimeType.includes("text")) return <FileText className="size-16 text-muted-foreground" />;
  return <File className="size-16 text-muted-foreground" />;
}

function MediaImagePreview({ asset }: { asset: MediaAsset }) {
  const src = mediaImageUrl(asset);
  if (!src) return <FileImage className="size-16 text-muted-foreground" />;
  return <img alt={asset.altText || asset.originalName} className="size-full object-cover" decoding="async" loading="lazy" src={src} />;
}

function mediaImageUrl(asset: MediaAsset) {
  const apiBaseUrl = String(import.meta.env.VITE_PLATFORM_API_URL ?? "").replace(/\/$/, "");
  if (asset.publicUrl?.startsWith("/storage/")) return `${apiBaseUrl}${asset.publicUrl}`;
  const token = getToken("tenant");
  const tenantId = getTenantId();
  if (!token || !tenantId) return "";
  const params = new URLSearchParams({ tenantId, token });
  return `${apiBaseUrl}/media/assets/${asset.assetId}/content?${params.toString()}`;
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input className="h-11 rounded-md" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const normalizedOptions = uniqueOptions([value, ...options]);
  const selectedValue = value || normalizedOptions[0] || "media";
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={selectedValue} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {titleFromValue(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/45 px-2 py-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="truncate font-medium text-foreground">{value}</div>
    </div>
  );
}

function MediaTreeNode({ elementProps, expanded, hasChildren, node, selected, tree }: RenderTreeNodePayload) {
  const meta = nodeMeta(node);
  return (
    <button
      type="button"
      {...elementProps}
      className={cn(elementProps.className, "h-7 rounded-sm px-1.5 text-sm", selected && "font-medium")}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {hasChildren ? (
          <ChevronRight
            className={cn("size-3 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")}
            onClick={(event) => {
              event.stopPropagation();
              tree.toggleExpanded(node.value);
            }}
          />
        ) : (
          <span className="size-3 shrink-0" />
        )}
        <MediaTreeIcon expanded={expanded} kind={meta.kind} />
        <span className="truncate">{meta.labelText}</span>
      </span>
      {meta.count !== undefined ? (
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px]", selected ? "bg-background/15" : "bg-muted text-muted-foreground")}>{meta.count}</span>
      ) : null}
    </button>
  );
}

function buildTreeData(assets: MediaAsset[]): TreeNodeData[] {
  const categories = countBy(assets, (asset) => asset.category);
  const storageChildren = buildStorageTree(assets);
  const categoryItems = Object.entries(categories)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, count]) => mediaTreeNode({
      count,
      kind: "category",
      labelText: category,
      value: `category:${category}`,
      category,
    }));
  return [
    mediaTreeNode({ count: assets.length, kind: "all", labelText: "All media", value: "all" }),
    mediaTreeNode({ count: assets.length, kind: "folder-root", labelText: "Folders", value: "root:folders", children: storageChildren }),
    mediaTreeNode({ count: categoryItems.reduce((sum, item) => sum + (nodeMeta(item).count ?? 0), 0), kind: "category-root", labelText: "Categories", value: "root:categories", children: categoryItems }),
  ];
}

function buildStorageTree(assets: MediaAsset[]) {
  const storageRoot = createFolderBranch("storage");
  for (const asset of assets) {
    const tenant = asset.tenantSlug || tenantFromStoragePath(asset.storagePath) || "tenant";
    const parts = [tenant, asset.visibility, ...folderParts(asset.folder)];
    addFolderBranch(storageRoot, parts, asset);
  }
  return folderBranchChildren(storageRoot, "", 0);
}

type FolderBranch = {
  assets: MediaAsset[];
  children: Map<string, FolderBranch>;
  directAssets: MediaAsset[];
  label: string;
};

function createFolderBranch(label: string): FolderBranch {
  return { assets: [], children: new Map(), directAssets: [], label };
}

function addFolderBranch(root: FolderBranch, parts: string[], asset: MediaAsset) {
  let current = root;
  current.assets.push(asset);
  for (const part of parts) {
    const child = current.children.get(part) ?? createFolderBranch(part);
    child.assets.push(asset);
    current.children.set(part, child);
    current = child;
  }
  current.directAssets.push(asset);
}

function folderBranchChildren(branch: FolderBranch, pathPrefix: string, level: number): TreeNodeData[] {
  const folders = Array.from(branch.children.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((child) => {
      const path = pathPrefix ? `${pathPrefix}/${child.label}` : child.label;
      const visibility = level >= 1 ? path.split("/")[1] : undefined;
      const folder = level >= 2 ? path.split("/").slice(2).join("/") : undefined;
      const children = [
        ...folderBranchChildren(child, path, level + 1),
        ...fileNodes(child.directAssets, path),
      ];
      return mediaTreeNode({
        children,
        count: child.assets.length,
        kind: storageNodeKind(level),
        labelText: child.label,
        value: storageNodeValue(path, level),
        ...(folder ? { folder } : {}),
        ...(visibility ? { visibility } : {}),
      });
    });
  return folders;
}

function storageNodeKind(level: number): MediaTreeMeta["kind"] {
  if (level === 0) return "tenant";
  if (level === 1) return "visibility";
  return "folder";
}

function storageNodeValue(path: string, level: number) {
  if (level === 0) return `tenant:${path}`;
  if (level === 1) return `visibility:${path}`;
  return `folder:${path}`;
}

function fileNodes(assets: MediaAsset[], pathPrefix: string) {
  return assets
    .slice()
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
    .map((asset) => mediaTreeNode({
      assetId: asset.assetId,
      count: 1,
      kind: "file",
      labelText: asset.fileName || asset.originalName,
      value: `file:${pathPrefix}/${asset.fileName}`,
    }));
}

function mediaTreeNode({
  assetId,
  category,
  children,
  count,
  folder,
  kind,
  labelText,
  value,
  visibility,
}: {
  assetId?: string;
  category?: string;
  children?: TreeNodeData[];
  count: number;
  folder?: string;
  kind: MediaTreeMeta["kind"];
  labelText: string;
  value: string;
  visibility?: string;
}): TreeNodeData {
  const meta: Record<string, unknown> = { count, kind, labelText };
  if (assetId) meta.assetId = assetId;
  if (category) meta.category = category;
  if (folder) meta.folder = folder;
  if (visibility) meta.visibility = visibility;
  const node: TreeNodeData = {
    label: labelText,
    meta,
    value,
  };
  if (children?.length) node.children = children;
  return node;
}

function flattenTree(data: TreeNodeData[]) {
  const items: Array<MediaTreeMeta & { value: string }> = [];
  function walk(nodes: TreeNodeData[]) {
    for (const node of nodes) {
      items.push({ ...nodeMeta(node), value: node.value });
      if (node.children?.length) walk(node.children);
    }
  }
  walk(data);
  return items;
}

type MediaTreeMeta = {
  assetId?: string | undefined;
  category?: string | undefined;
  count?: number | undefined;
  folder?: string | undefined;
  kind: "all" | "category" | "category-root" | "file" | "folder" | "folder-root" | "storage" | "tenant" | "visibility";
  labelText: string;
  visibility?: string | undefined;
};

function nodeMeta(node: TreeNodeData): MediaTreeMeta {
  const meta = node.meta ?? {};
  const assetId = typeof meta.assetId === "string" ? meta.assetId : undefined;
  const category = typeof meta.category === "string" ? meta.category : undefined;
  const labelText = typeof meta.labelText === "string" ? meta.labelText : String(node.label);
  const kind = isMediaTreeKind(meta.kind) ? meta.kind : "folder";
  const folder = typeof meta.folder === "string" ? meta.folder : undefined;
  const count = typeof meta.count === "number" ? meta.count : undefined;
  const visibility = typeof meta.visibility === "string" ? meta.visibility : undefined;
  return { assetId, category, count, folder, kind, labelText, visibility };
}

function isMediaTreeKind(value: unknown): value is MediaTreeMeta["kind"] {
  return value === "all"
    || value === "category"
    || value === "category-root"
    || value === "file"
    || value === "folder"
    || value === "folder-root"
    || value === "storage"
    || value === "tenant"
    || value === "visibility";
}

function MediaTreeIcon({ expanded, kind }: { expanded: boolean; kind: MediaTreeMeta["kind"] }) {
  if (kind === "all") return <LayoutGrid className="size-4 shrink-0" />;
  if (kind === "category" || kind === "category-root") return <FileImage className="size-4 shrink-0" />;
  if (kind === "file") return <File className="size-4 shrink-0" />;
  return expanded ? <FolderOpen className="size-4 shrink-0" /> : <Folder className="size-4 shrink-0" />;
}

function expandedStorageValues(assets: MediaAsset[]) {
  const values = new Set(["root:folders", "root:categories"]);
  for (const asset of assets) {
    const tenant = asset.tenantSlug || tenantFromStoragePath(asset.storagePath) || "tenant";
    values.add(`tenant:${tenant}`);
    values.add(`visibility:${tenant}/${asset.visibility}`);
    const parts = folderParts(asset.folder);
    let folderPath = "";
    for (const part of parts.slice(0, -1)) {
      folderPath = folderPath ? `${folderPath}/${part}` : part;
      values.add(`folder:${tenant}/${asset.visibility}/${folderPath}`);
    }
  }
  return Array.from(values);
}

function folderParts(folder: string) {
  return normalizeFolderName(folder).split("/").filter(Boolean);
}

function isSameOrChildFolder(folder: string, selectedFolder: string) {
  const normalizedFolder = normalizeFolderName(folder);
  const normalizedSelected = normalizeFolderName(selectedFolder);
  return normalizedFolder === normalizedSelected || normalizedFolder.startsWith(`${normalizedSelected}/`);
}

function tenantFromStoragePath(storagePath: string) {
  const normalized = storagePath.replace(/\\/g, "/");
  const match = normalized.match(/\/storage\/app\/([^/]+)\//) ?? normalized.match(/\/storage\/([^/]+)\//) ?? normalized.match(/\/media\/([^/]+)\//);
  return match?.[1];
}

function countBy<T>(items: T[], read: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = read(item) || "media";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeFolderName(value)).filter(Boolean)));
}

function normalizeFolderName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._/-]+/g, "-").replace(/\/+/g, "/").replace(/^[-/]+|[-/]+$/g, "");
}

function titleFromValue(value: string) {
  return value.split(/[/-]/g).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ") || value;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function totalBytes(assets: MediaAsset[]) {
  return assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}
