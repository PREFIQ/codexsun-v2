import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  Check,
  ChevronDown,
  Component,
  Copy,
  Eye,
  LayoutTemplate,
  ListChecks,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  Checkbox,
  DESIGN_SYSTEM_DEFAULT_STORAGE_KEY,
  DESIGN_SYSTEM_NAME,
  DESIGN_SYSTEM_VARIANT_MARKER,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Kbd,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  designSystemVariants,
  getDesignSystemVariant,
  isDesignSystemVariantId
} from "@codexsun/ui";
import type { DesignSystemVariantId } from "@codexsun/ui";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableSkeletonRows
} from "@codexsun/ui/workspace/table";
import { WorkspaceFormField, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert";
import { cn } from "@codexsun/ui/lib/utils";
import { apiDelete, apiGet, apiPost, apiPut } from "../api";

type RegistryKind = "components" | "controls" | "templates";
type DesignPage = "theme" | "components" | "controls" | "templates";

type DesignSystemRecord = {
  active: boolean;
  category: string;
  componentKey: string;
  controlType: string;
  defaultProps: Record<string, unknown>;
  description: string;
  id: string;
  kind: "component" | "control" | "template";
  name: string;
  templateScreen: string;
  updatedAt: string;
  usageNotes: string;
  variant: string;
};

type DesignSystemResult = {
  components: DesignSystemRecord[];
  controls: DesignSystemRecord[];
  templates: DesignSystemRecord[];
  totals: {
    active: number;
    components: number;
    controls: number;
    templates: number;
  };
};

type FormState = Omit<DesignSystemRecord, "defaultProps" | "id" | "kind" | "updatedAt"> & {
  defaultProps: string;
  id?: string;
};

type CatalogItem = {
  category: string;
  componentKey: string;
  description: string;
  name: string;
  variants: string[];
};

const pages: Array<{ icon: typeof Palette; id: DesignPage; label: string }> = [
  { icon: Palette, id: "theme", label: "Theme" },
  { icon: Component, id: "components", label: "Components" },
  { icon: SlidersHorizontal, id: "controls", label: "Controls" },
  { icon: LayoutTemplate, id: "templates", label: "Templates" }
];

const componentCatalogRows: Array<[string, string, string, string[]]> = [
  ["accordion", "Disclosure", "Stacked expandable content sections.", ["single", "multiple", "disabled"]],
  ["alert", "Feedback", "Inline feedback, warnings, and status messages.", ["default", "destructive"]],
  ["alert-dialog", "Overlay", "Blocking confirmation and destructive-action dialogs.", ["default", "destructive"]],
  ["aspect-ratio", "Media", "Stable visual ratio container for images and previews.", ["16:9", "4:3", "1:1"]],
  ["avatar", "Identity", "User, tenant, or entity identity image/fallback.", ["image", "fallback", "group"]],
  ["badge", "Feedback", "Compact status, category, and metadata labels.", ["default", "secondary", "outline"]],
  ["breadcrumb", "Navigation", "Hierarchical location trail.", ["page", "module", "record"]],
  ["button", "Action", "Primary, secondary, outline, ghost, destructive, and icon actions.", ["default", "secondary", "outline", "ghost", "icon"]],
  ["button-group", "Action", "Grouped related command buttons.", ["segmented", "toolbar"]],
  ["calendar", "Date", "Calendar date picking surface.", ["single", "range"]],
  ["card", "Surfaces", "Reusable bounded surfaces for repeated items and dialogs.", ["plain", "header", "action"]],
  ["carousel", "Media", "Sequential media or item browsing.", ["single", "loop"]],
  ["chart", "Data", "Chart container and visual data helpers.", ["area", "bar", "line"]],
  ["checkbox", "Control", "Boolean or multi-select control.", ["checked", "unchecked", "disabled"]],
  ["collapsible", "Disclosure", "Single-section show/hide behavior.", ["open", "closed"]],
  ["command", "Navigation", "Command palette and searchable action picker.", ["search", "empty", "grouped"]],
  ["context-menu", "Menu", "Right-click contextual command menu.", ["actions", "danger"]],
  ["dialog", "Overlay", "Modal task and edit surface.", ["form", "confirm"]],
  ["drawer", "Overlay", "Edge panel for focused workflows.", ["left", "right", "bottom"]],
  ["dropdown-menu", "Menu", "Button-triggered menu actions.", ["single", "checked", "danger"]],
  ["empty", "Feedback", "No-data or no-results state.", ["empty", "action"]],
  ["field", "Form", "Field wrapper and label pattern.", ["required", "error", "helper"]],
  ["global-loader", "Feedback", "App-level loading state.", ["page", "query"]],
  ["hover-card", "Overlay", "Hover-triggered detail preview.", ["profile", "record"]],
  ["input", "Form", "Single-line text input.", ["default", "disabled", "invalid"]],
  ["input-group", "Form", "Input with prefix, suffix, or grouped action.", ["prefix", "suffix", "button"]],
  ["input-otp", "Form", "One-time-passcode segmented input.", ["six-digit", "disabled"]],
  ["item", "List", "Reusable list item layout.", ["plain", "action", "selected"]],
  ["kbd", "Typography", "Keyboard shortcut display.", ["single", "combo"]],
  ["label", "Form", "Accessible field label.", ["default", "required"]],
  ["menubar", "Menu", "Application menubar pattern.", ["root", "submenu"]],
  ["navigation-menu", "Navigation", "Top-level navigation menu.", ["links", "mega"]],
  ["pagination", "Navigation", "Paged list navigation.", ["compact", "full"]],
  ["popover", "Overlay", "Anchored non-modal panel.", ["form", "picker"]],
  ["progress", "Feedback", "Progress and completion indicator.", ["low", "medium", "complete"]],
  ["radio-group", "Control", "Mutually exclusive option set.", ["default", "disabled"]],
  ["resizable", "Layout", "Resizable split-pane layout.", ["horizontal", "vertical"]],
  ["scroll-area", "Layout", "Styled constrained scroll region.", ["vertical", "horizontal"]],
  ["select", "Control", "Controlled option picker for finite values.", ["placeholder", "selected", "disabled"]],
  ["separator", "Layout", "Visual divider.", ["horizontal", "vertical"]],
  ["sheet", "Overlay", "Side sheet workflow surface.", ["left", "right", "bottom"]],
  ["sidebar", "Navigation", "Application side navigation shell.", ["expanded", "collapsed"]],
  ["skeleton", "Feedback", "Loading placeholder.", ["line", "card", "table"]],
  ["slider", "Control", "Range and numeric adjustment control.", ["single", "disabled"]],
  ["sonner", "Feedback", "Toast notification renderer.", ["success", "error", "info"]],
  ["spinner", "Feedback", "Inline loading spinner.", ["sm", "default"]],
  ["status-badge", "Feedback", "Tone-aware status label.", ["green", "blue", "red"]],
  ["switch", "Control", "Binary setting toggle.", ["on", "off", "disabled"]],
  ["table", "Data", "Structured rows and columns.", ["simple", "interactive", "empty"]],
  ["tabs", "Navigation", "Tabbed content switcher.", ["underline", "contained"]],
  ["textarea", "Form", "Multi-line text input.", ["default", "disabled", "invalid"]],
  ["toast", "Feedback", "Toast notification model.", ["success", "warning", "error"]],
  ["toggle", "Control", "Pressed/unpressed control button.", ["pressed", "outline"]],
  ["toggle-group", "Control", "Single or multiple toggle group.", ["single", "multiple"]],
  ["tooltip", "Overlay", "Hover/focus help label.", ["top", "bottom"]]
];

const componentCatalog: CatalogItem[] = componentCatalogRows.map(([componentKey, category, description, variants]) => ({
  category,
  componentKey,
  description,
  name: titleFromKey(componentKey),
  variants
}));

const controlCatalog = componentCatalog.filter((item) => ["Action", "Choice", "Control", "Date", "Form", "Navigation", "Numeric"].includes(item.category) || ["button", "checkbox", "input", "radio-group", "select", "slider", "switch", "tabs", "textarea", "toggle", "toggle-group"].includes(item.componentKey));

function readStoredVariant(): DesignSystemVariantId {
  const stored = window.localStorage.getItem(DESIGN_SYSTEM_DEFAULT_STORAGE_KEY);
  return stored && isDesignSystemVariantId(stored) ? stored : "default";
}

export function DesignSystemPage() {
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState<DesignPage>("theme");
  const [activeVariantId, setActiveVariantId] = useState<DesignSystemVariantId>(readStoredVariant);
  const [defaultVariantId, setDefaultVariantId] = useState<DesignSystemVariantId>(readStoredVariant);
  const [searchValue, setSearchValue] = useState("");
  const [selectedControlKey, setSelectedControlKey] = useState("button");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<RegistryKind>("components");
  const [dialogRecord, setDialogRecord] = useState<DesignSystemRecord | null>(null);
  const [dialogDraft, setDialogDraft] = useState<Partial<DesignSystemRecord> | null>(null);

  const resultQuery = useQuery<DesignSystemResult>({
    queryKey: ["admin", "design-system", "result"],
    queryFn: () => apiGet<DesignSystemResult>("/admin/design-system/result", "sa")
  });

  const activeVariant = useMemo(() => getDesignSystemVariant(activeVariantId), [activeVariantId]);
  const result = resultQuery.data;
  const activeKind: RegistryKind = activePage === "controls" ? "controls" : activePage === "templates" ? "templates" : "components";
  const registryRecords = result?.[activeKind] ?? [];
  const selectedControl = useMemo(() => controlCatalog.find((item) => item.componentKey === selectedControlKey) ?? controlCatalog[0], [selectedControlKey]);
  const selectedControlRecord = useMemo(() => findRecord(result?.controls, selectedControl?.componentKey), [result?.controls, selectedControl?.componentKey]);

  const saveMutation = useMutation({
    mutationFn: (form: FormState) => {
      const payload = payloadFromForm(form);
      return form.id
        ? apiPut<DesignSystemRecord>(`/admin/design-system/${dialogKind}/${form.id}`, payload, "sa")
        : apiPost<DesignSystemRecord>(`/admin/design-system/${dialogKind}`, payload, "sa");
    },
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "design-system"] });
      toast.success("Design system record saved", { description: record.name });
      closeDialog();
    },
    onError: (error) => showError("Save failed", error)
  });

  const lifecycleMutation = useMutation({
    mutationFn: ({ action, kind, record }: { action: "deactivate" | "restore"; kind: RegistryKind; record: DesignSystemRecord }) =>
      apiPost<DesignSystemRecord>(`/admin/design-system/${kind}/${record.id}/${action}`, {}, "sa"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "design-system"] });
    },
    onError: (error) => showError("Lifecycle failed", error)
  });

  const deleteMutation = useMutation({
    mutationFn: ({ kind, record }: { kind: RegistryKind; record: DesignSystemRecord }) =>
      apiDelete<{ deleted: boolean; id: string; name: string }>(`/admin/design-system/${kind}/${record.id}`, "sa"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "design-system"] });
    },
    onError: (error) => showError("Delete failed", error)
  });

  function setVariant(value: string) {
    if (!isDesignSystemVariantId(value)) return;
    setActiveVariantId(value);
    document.documentElement.setAttribute("data-design-system", DESIGN_SYSTEM_NAME);
    document.documentElement.setAttribute(DESIGN_SYSTEM_VARIANT_MARKER, value);
  }

  function saveDefaultVariant() {
    window.localStorage.setItem(DESIGN_SYSTEM_DEFAULT_STORAGE_KEY, activeVariantId);
    setDefaultVariantId(activeVariantId);
  }

  function openRecord(kind: RegistryKind, record: DesignSystemRecord | null, draft?: Partial<DesignSystemRecord>) {
    setDialogKind(kind);
    setDialogRecord(record);
    setDialogDraft(draft ?? null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDialogRecord(null);
    setDialogDraft(null);
  }

  return (
    <WorkspacePage
      title="Design System"
      description="Theme, components, controls, variants, and template screen registry."
      technicalName={`page.design-system.${activePage}`}
      actions={
        <>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => void resultQuery.refetch()}>
            <RefreshCw className={cn("size-4", resultQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => openRecord(activeKind, null)}>
            <Plus className="size-4" />
            New {singularLabel(activeKind)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Components" value={result?.totals.components ?? 0} />
          <Metric label="Controls" value={result?.totals.controls ?? 0} />
          <Metric label="Templates" value={result?.totals.templates ?? 0} />
          <Metric label="Active" value={result?.totals.active ?? 0} />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border/70 pb-2">
          {pages.map((page) => (
            <Button key={page.id} type="button" variant={activePage === page.id ? "secondary" : "ghost"} className="h-9 rounded-md" onClick={() => setActivePage(page.id)}>
              <page.icon className="size-4" />
              {page.label}
            </Button>
          ))}
        </div>

        {activePage === "theme" ? (
          <ThemePage
            activeVariant={activeVariant}
            activeVariantId={activeVariantId}
            defaultVariantId={defaultVariantId}
            onSaveDefault={saveDefaultVariant}
            onSelectVariant={setVariant}
          />
        ) : null}

        {activePage === "components" ? (
          <ComponentCatalogPage
            loading={resultQuery.isFetching}
            records={result?.components ?? []}
            searchValue={searchValue}
            onDelete={(record) => deleteMutation.mutate({ kind: "components", record })}
            onEdit={(record) => openRecord("components", record)}
            onLifecycle={(record) => lifecycleMutation.mutate({ action: record.active ? "deactivate" : "restore", kind: "components", record })}
            onSearchChange={setSearchValue}
            onCreate={(item) => openRecord("components", null, draftFromCatalog("component", item))}
          />
        ) : null}

        {activePage === "controls" ? (
          <ControlBuilderPage
            records={result?.controls ?? []}
            selectedControl={selectedControl}
            selectedRecord={selectedControlRecord}
            searchValue={searchValue}
            onDelete={(record) => deleteMutation.mutate({ kind: "controls", record })}
            onEdit={(record) => openRecord("controls", record)}
            onLifecycle={(record) => lifecycleMutation.mutate({ action: record.active ? "deactivate" : "restore", kind: "controls", record })}
            onSearchChange={setSearchValue}
            onSelectControl={setSelectedControlKey}
            onCreate={(item) => openRecord("controls", null, draftFromCatalog("control", item))}
          />
        ) : null}

        {activePage === "templates" ? (
          <TemplateRegistryPage
            loading={resultQuery.isFetching}
            records={registryRecords}
            searchValue={searchValue}
            onDelete={(record) => deleteMutation.mutate({ kind: "templates", record })}
            onEdit={(record) => openRecord("templates", record)}
            onLifecycle={(record) => lifecycleMutation.mutate({ action: record.active ? "deactivate" : "restore", kind: "templates", record })}
            onSearchChange={setSearchValue}
            onCreate={(template) => openRecord("templates", null, draftFromTemplate(template))}
          />
        ) : null}
      </div>

      <RegistryDialog
        activeKind={dialogKind}
        draft={dialogDraft}
        loading={saveMutation.isPending}
        open={dialogOpen}
        record={dialogRecord}
        onClose={closeDialog}
        onSubmit={(form) => saveMutation.mutate(form)}
      />
    </WorkspacePage>
  );
}

function ThemePage({ activeVariant, activeVariantId, defaultVariantId, onSaveDefault, onSelectVariant }: {
  activeVariant: ReturnType<typeof getDesignSystemVariant>;
  activeVariantId: DesignSystemVariantId;
  defaultVariantId: DesignSystemVariantId;
  onSaveDefault: () => void;
  onSelectVariant: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <WorkspaceTablePanel>
        <div className="border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Palette className="size-4" /> Theme variants</div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {designSystemVariants.map((variant) => (
            <button
              className="rounded-md border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/30 data-[active=true]:border-ring"
              data-active={variant.id === activeVariantId}
              key={variant.id}
              onClick={() => onSelectVariant(variant.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{variant.name}</div>
                {defaultVariantId === variant.id ? <Badge><Check className="size-3" /> Default</Badge> : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{variant.density}</div>
              <div className="mt-3 flex gap-1">{variant.palette.map((color) => <span key={color} className="h-6 flex-1 rounded-sm border border-border/40" style={{ backgroundColor: color }} />)}</div>
            </button>
          ))}
        </div>
      </WorkspaceTablePanel>

      <div className="space-y-4">
        <Card className="rounded-md shadow-sm" title="Theme control" description={activeVariant.marker}>
          <div className="space-y-3">
            <Select value={activeVariantId} onValueChange={onSelectVariant}>
              <SelectTrigger aria-label="Design variant"><SelectValue /></SelectTrigger>
              <SelectContent>{designSystemVariants.map((variant) => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="outline" className="w-full rounded-md" onClick={onSaveDefault}>
              <Save className="size-4" />
              Set default
            </Button>
          </div>
        </Card>
        <Card className="rounded-md shadow-sm" title="Token preview" description={activeVariant.description}>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">{activeVariant.palette.map((color) => <span key={color} className="h-10 rounded-md border border-border" style={{ backgroundColor: color }} />)}</div>
            <div className="flex flex-wrap gap-2"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button></div>
            <Progress value={72} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ComponentCatalogPage({ loading, onCreate, onDelete, onEdit, onLifecycle, onSearchChange, records, searchValue }: {
  loading: boolean;
  onCreate: (item: CatalogItem) => void;
  onDelete: (record: DesignSystemRecord) => void;
  onEdit: (record: DesignSystemRecord) => void;
  onLifecycle: (record: DesignSystemRecord) => void;
  onSearchChange: (value: string) => void;
  records: DesignSystemRecord[];
  searchValue: string;
}) {
  const filtered = filterCatalog(componentCatalog, searchValue);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <WorkspaceTablePanel>
        <CatalogHeader count={filtered.length} searchValue={searchValue} title="Component catalog" onSearchChange={onSearchChange} />
        <CatalogTable
          catalog={filtered}
          loading={loading}
          records={records}
          onCreate={onCreate}
          onDelete={onDelete}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      </WorkspaceTablePanel>
      <ComponentBehaviorPanel />
    </div>
  );
}

function ControlBuilderPage({ onCreate, onDelete, onEdit, onLifecycle, onSearchChange, onSelectControl, records, searchValue, selectedControl, selectedRecord }: {
  onCreate: (item: CatalogItem) => void;
  onDelete: (record: DesignSystemRecord) => void;
  onEdit: (record: DesignSystemRecord) => void;
  onLifecycle: (record: DesignSystemRecord) => void;
  onSearchChange: (value: string) => void;
  onSelectControl: (key: string) => void;
  records: DesignSystemRecord[];
  searchValue: string;
  selectedControl: CatalogItem | undefined;
  selectedRecord: DesignSystemRecord | undefined;
}) {
  const filtered = filterCatalog(controlCatalog, searchValue);
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <WorkspaceTablePanel>
        <CatalogHeader count={filtered.length} searchValue={searchValue} title="Control list" onSearchChange={onSearchChange} />
        <div className="divide-y divide-border/70">
          {filtered.map((control) => {
            const record = findRecord(records, control.componentKey);
            return (
              <button key={control.componentKey} type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/20" onClick={() => onSelectControl(control.componentKey)}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{control.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{control.variants.join(", ")}</span>
                </span>
                <WorkspaceStatusBadge label={record?.active === false ? "inactive" : record ? "editable" : "seed"} tone={record?.active === false ? "danger" : "success"} />
              </button>
            );
          })}
        </div>
      </WorkspaceTablePanel>
      <WorkspaceTablePanel>
        <div className="border-b border-border/70 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold">{selectedControl?.name ?? "Control"}</div>
              <div className="text-xs text-muted-foreground">{selectedControl?.description}</div>
            </div>
            <div className="flex gap-2">
              {selectedRecord ? (
                <Button type="button" variant="outline" className="h-8 rounded-md" onClick={() => onEdit(selectedRecord)}>
                  <Settings2 className="size-4" />
                  Edit
                </Button>
              ) : selectedControl ? (
                <Button type="button" className="h-8 rounded-md" onClick={() => onCreate(selectedControl)}>
                  <Plus className="size-4" />
                  Add
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <ControlPreview controlKey={selectedControl?.componentKey ?? "button"} />
          <VariantEditor
            catalog={selectedControl}
            record={selectedRecord}
            onCreate={selectedControl ? () => onCreate(selectedControl) : undefined}
            onDelete={selectedRecord ? () => onDelete(selectedRecord) : undefined}
            onEdit={selectedRecord ? () => onEdit(selectedRecord) : undefined}
            onLifecycle={selectedRecord ? () => onLifecycle(selectedRecord) : undefined}
          />
        </div>
      </WorkspaceTablePanel>
    </div>
  );
}

function TemplateRegistryPage({ loading, onCreate, onDelete, onEdit, onLifecycle, onSearchChange, records, searchValue }: {
  loading: boolean;
  onCreate: (template: string) => void;
  onDelete: (record: DesignSystemRecord) => void;
  onEdit: (record: DesignSystemRecord) => void;
  onLifecycle: (record: DesignSystemRecord) => void;
  onSearchChange: (value: string) => void;
  records: DesignSystemRecord[];
  searchValue: string;
}) {
  const filtered = filterRecords(records, searchValue);
  const templateOptions = ["Common List", "Master List", "Entry List", "Control Builder", "Theme Builder"];
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <WorkspaceTablePanel>
        <RegistryHeader count={filtered.length} searchValue={searchValue} title="Template screens" onSearchChange={onSearchChange} />
        <RegistryTable
          activeKind="templates"
          loading={loading}
          records={filtered}
          onDelete={onDelete}
          onEdit={onEdit}
          onLifecycle={onLifecycle}
        />
      </WorkspaceTablePanel>
      <Card className="rounded-md shadow-sm" title="Screen templates" description="Reusable screen contracts">
        <div className="grid gap-2">
          {templateOptions.map((template) => (
            <Button key={template} type="button" variant="outline" className="justify-between rounded-md" onClick={() => onCreate(template)}>
              {template}
              <Plus className="size-4" />
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CatalogTable({ catalog, loading, onCreate, onDelete, onEdit, onLifecycle, records }: {
  catalog: CatalogItem[];
  loading: boolean;
  onCreate: (item: CatalogItem) => void;
  onDelete: (record: DesignSystemRecord) => void;
  onEdit: (record: DesignSystemRecord) => void;
  onLifecycle: (record: DesignSystemRecord) => void;
  records: DesignSystemRecord[];
}) {
  if (!catalog.length && loading) return <WorkspaceTableSkeletonRows columns={6} />;
  if (!catalog.length) return <WorkspaceTableEmptyState>No records found.</WorkspaceTableEmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr>
            <Header>Name</Header>
            <Header>Category</Header>
            <Header>Variants</Header>
            <Header>Registry</Header>
            <Header className="text-right">Actions</Header>
          </tr>
        </thead>
        <tbody>
          {catalog.map((item) => {
            const record = findRecord(records, item.componentKey);
            return (
              <tr key={item.componentKey} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="mt-1 max-w-lg truncate text-xs text-muted-foreground">{item.description}</div>
                </td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{item.variants.map((variant) => <Badge key={variant} variant="outline">{variant}</Badge>)}</div></td>
                <td className="px-4 py-3">
                  <WorkspaceStatusBadge label={record ? (record.active ? "editable" : "inactive") : "seed"} tone={record?.active === false ? "danger" : "success"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {record ? (
                      <>
                        <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => onEdit(record)}>Edit</Button>
                        <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => onLifecycle(record)}>{record.active ? "Archive" : "Restore"}</Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-md" title="Delete" onClick={() => onDelete(record)}><Trash2 className="size-4" /></Button>
                      </>
                    ) : (
                      <Button type="button" size="sm" className="rounded-md" onClick={() => onCreate(item)}><Plus className="size-4" /> Add</Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RegistryTable({ activeKind, loading, onDelete, onEdit, onLifecycle, records }: {
  activeKind: RegistryKind;
  loading: boolean;
  onDelete: (record: DesignSystemRecord) => void;
  onEdit: (record: DesignSystemRecord) => void;
  onLifecycle: (record: DesignSystemRecord) => void;
  records: DesignSystemRecord[];
}) {
  if (!records.length && loading) return <WorkspaceTableSkeletonRows columns={6} />;
  if (!records.length) return <WorkspaceTableEmptyState>No design system records found.</WorkspaceTableEmptyState>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] border-collapse text-sm">
        <thead>
          <tr>
            <Header>Name</Header>
            <Header>Key</Header>
            <Header>Category</Header>
            <Header>{activeKind === "templates" ? "Template" : "Control"}</Header>
            <Header>Status</Header>
            <Header className="text-right">Actions</Header>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <button type="button" className="text-left font-medium text-foreground hover:underline" onClick={() => onEdit(record)}>{record.name}</button>
                <div className="mt-1 max-w-md truncate text-xs text-muted-foreground">{record.description || record.usageNotes || "-"}</div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.componentKey}</td>
              <td className="px-4 py-3">{record.category}</td>
              <td className="px-4 py-3">{activeKind === "templates" ? record.templateScreen || "-" : record.controlType || "-"}</td>
              <td className="px-4 py-3"><WorkspaceStatusBadge label={record.active ? "active" : "inactive"} tone={record.active ? "success" : "danger"} /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => onLifecycle(record)}>{record.active ? "Archive" : "Restore"}</Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-md" title="Delete" onClick={() => onDelete(record)}><Trash2 className="size-4" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComponentBehaviorPanel() {
  return (
    <div className="space-y-4">
      <Card className="rounded-md shadow-sm" title="Live behaviors" description="Representative component states">
        <div className="space-y-4">
          <Accordion type="single" collapsible className="rounded-md border border-border px-3">
            <AccordionItem value="details">
              <AccordionTrigger>Accordion</AccordionTrigger>
              <AccordionContent>Expanded content preserves spacing and animation.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Alert><ListChecks className="size-4" /><AlertTitle>Alert</AlertTitle><AlertDescription>Inline feedback state.</AlertDescription></Alert>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink>Platform</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Design System</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
          <div className="flex flex-wrap gap-2"><Badge>Badge</Badge><StatusBadge tone="green">Status</StatusBadge><Kbd>Ctrl</Kbd><Kbd>S</Kbd></div>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Menu <ChevronDown className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Duplicate</DropdownMenuItem><DropdownMenuItem>Archive</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <Popover><PopoverTrigger asChild><Button variant="outline">Popover</Button></PopoverTrigger><PopoverContent className="w-64"><div className="text-sm">Anchored overlay content.</div></PopoverContent></Popover>
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon"><Eye className="size-4" /></Button></TooltipTrigger><TooltipContent>Preview</TooltipContent></Tooltip></TooltipProvider>
        </div>
      </Card>
      <Card className="rounded-md shadow-sm" title="Loading and data" description="Table, skeleton, progress, and spinner">
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Progress value={64} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Loading state</div>
          <div className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border p-3 text-sm"><span>Component rows</span><Badge>52</Badge><span>Active registry</span><Badge variant="outline">Editable</Badge></div>
        </div>
      </Card>
    </div>
  );
}

function ControlPreview({ controlKey }: { controlKey: string }) {
  return (
    <Card className="rounded-md shadow-sm" title="Preview" description={titleFromKey(controlKey)}>
      <div className="space-y-4">
        {controlKey.includes("button") ? <div className="flex flex-wrap gap-2"><Button>Save</Button><Button variant="secondary">Draft</Button><Button variant="outline" size="icon"><Copy className="size-4" /></Button></div> : null}
        {controlKey.includes("input") ? <div className="grid gap-2"><Label>Text input</Label><Input defaultValue="Reusable field" /></div> : null}
        {controlKey.includes("textarea") ? <Textarea defaultValue="Multi-line content" /> : null}
        {controlKey.includes("select") ? <Select defaultValue="active"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select> : null}
        {controlKey.includes("checkbox") ? <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Enabled</label> : null}
        {controlKey.includes("switch") ? <label className="flex items-center gap-2 text-sm"><Switch defaultChecked /> Active</label> : null}
        {controlKey.includes("radio") ? <RadioGroup defaultValue="one"><label className="flex items-center gap-2 text-sm"><RadioGroupItem value="one" /> One</label><label className="flex items-center gap-2 text-sm"><RadioGroupItem value="two" /> Two</label></RadioGroup> : null}
        {controlKey.includes("slider") ? <Slider defaultValue={[48]} max={100} step={1} /> : null}
        {controlKey.includes("tabs") ? <Tabs defaultValue="one"><TabsList><TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Two</TabsTrigger></TabsList><TabsContent value="one">First panel</TabsContent><TabsContent value="two">Second panel</TabsContent></Tabs> : null}
        {controlKey.includes("toggle") ? <ToggleGroup type="single" defaultValue="bold"><ToggleGroupItem value="bold"><Bold className="size-4" /></ToggleGroupItem><ToggleGroupItem value="copy"><Copy className="size-4" /></ToggleGroupItem></ToggleGroup> : null}
        {!["button", "input", "textarea", "select", "checkbox", "switch", "radio", "slider", "tabs", "toggle"].some((key) => controlKey.includes(key)) ? <Button variant="outline">Control preview</Button> : null}
      </div>
    </Card>
  );
}

function VariantEditor({ catalog, onCreate, onDelete, onEdit, onLifecycle, record }: {
  catalog: CatalogItem | undefined;
  onCreate: (() => void) | undefined;
  onDelete: (() => void) | undefined;
  onEdit: (() => void) | undefined;
  onLifecycle: (() => void) | undefined;
  record: DesignSystemRecord | undefined;
}) {
  return (
    <Card className="rounded-md shadow-sm" title="Variants" description={record?.componentKey ?? catalog?.componentKey ?? "control"}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">{(catalog?.variants ?? []).map((variant) => <Badge key={variant} variant="outline">{variant}</Badge>)}</div>
        <Separator />
        <div className="grid gap-2 text-sm">
          <Row label="Category" value={record?.category ?? catalog?.category ?? "-"} />
          <Row label="Type" value={record?.controlType ?? catalog?.name ?? "-"} />
          <Row label="Variant" value={record?.variant ?? "default"} />
          <Row label="Status" value={record ? (record.active ? "active" : "inactive") : "seed"} />
        </div>
        <div className="flex flex-wrap gap-2">
          {record ? <Button type="button" variant="outline" className="rounded-md" onClick={onEdit}><Settings2 className="size-4" /> Edit</Button> : <Button type="button" className="rounded-md" onClick={onCreate}><Plus className="size-4" /> Add</Button>}
          {record ? <Button type="button" variant="outline" className="rounded-md" onClick={onLifecycle}>{record.active ? "Archive" : "Restore"}</Button> : null}
          {record ? <Button type="button" variant="outline" size="icon" className="rounded-md" onClick={onDelete}><Trash2 className="size-4" /></Button> : null}
        </div>
      </div>
    </Card>
  );
}

function RegistryDialog({ activeKind, draft, loading, onClose, onSubmit, open, record }: {
  activeKind: RegistryKind;
  draft: Partial<DesignSystemRecord> | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
  open: boolean;
  record: DesignSystemRecord | null;
}) {
  const [form, setForm] = useState<FormState>(() => formFromRecord(record, activeKind, draft));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(formFromRecord(record, activeKind, draft));
    setError("");
  }, [activeKind, draft, record, open]);

  function update(patch: Partial<FormState>) {
    setError("");
    setForm((current) => ({ ...current, ...patch }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      JSON.parse(form.defaultProps || "{}");
      onSubmit(form);
    } catch {
      setError("Default props must be valid JSON.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{record ? "Edit" : "New"} {singularLabel(activeKind)}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
            <WorkspaceFormGrid columns={2}>
              <WorkspaceFormField label="Name" required><Input value={form.name} onChange={(event) => update({ name: event.target.value })} /></WorkspaceFormField>
              <WorkspaceFormField label="Key" required><Input value={form.componentKey} onChange={(event) => update({ componentKey: slugKey(event.target.value) })} /></WorkspaceFormField>
              <WorkspaceFormField label="Category"><Input value={form.category} onChange={(event) => update({ category: event.target.value })} /></WorkspaceFormField>
              <WorkspaceFormField label="Variant">
                <Select value={form.variant} onValueChange={(variant) => update({ variant })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{designSystemVariants.map((variant) => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}</SelectContent>
                </Select>
              </WorkspaceFormField>
              <WorkspaceFormField label="Control type"><Input value={form.controlType} onChange={(event) => update({ controlType: event.target.value })} /></WorkspaceFormField>
              <WorkspaceFormField label="Template screen"><Input value={form.templateScreen} onChange={(event) => update({ templateScreen: event.target.value })} /></WorkspaceFormField>
              <WorkspaceFormField className="md:col-span-2" label="Description"><Textarea value={form.description} onChange={(event) => update({ description: event.target.value })} /></WorkspaceFormField>
              <WorkspaceFormField className="md:col-span-2" label="Default props JSON"><Textarea className="min-h-28 font-mono" value={form.defaultProps} onChange={(event) => update({ defaultProps: event.target.value })} /></WorkspaceFormField>
              <WorkspaceFormField className="md:col-span-2" label="Usage notes"><Textarea value={form.usageNotes} onChange={(event) => update({ usageNotes: event.target.value })} /></WorkspaceFormField>
            </WorkspaceFormGrid>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={form.active} onCheckedChange={(active) => update({ active })} /> Active</label>
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="rounded-md" disabled={loading}><Save className="size-4" /> Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CatalogHeader({ count, onSearchChange, searchValue, title }: { count: number; onSearchChange: (value: string) => void; searchValue: string; title: string }) {
  return <RegistryHeader count={count} onSearchChange={onSearchChange} searchValue={searchValue} title={title} />;
}

function RegistryHeader({ count, onSearchChange, searchValue, title }: { count: number; onSearchChange: (value: string) => void; searchValue: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{count} records</div>
      </div>
      <Input className="h-9 max-w-xs" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border border-border bg-card p-4 shadow-sm"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}

function Header({ children, className }: { children: string; className?: string }) {
  return <WorkspaceTableHeaderCell className={className}>{children}</WorkspaceTableHeaderCell>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="truncate font-medium">{value}</span></div>;
}

function findRecord(records: DesignSystemRecord[] | undefined, componentKey: string | undefined) {
  if (!componentKey) return undefined;
  return records?.find((record) => record.componentKey === componentKey || record.componentKey === `${componentKey}-control`);
}

function filterCatalog(catalog: CatalogItem[], search: string) {
  const term = search.trim().toLowerCase();
  return catalog.filter((item) => !term || [item.name, item.componentKey, item.category, item.description, ...item.variants].some((value) => value.toLowerCase().includes(term)));
}

function filterRecords(records: DesignSystemRecord[], search: string) {
  const term = search.trim().toLowerCase();
  return records.filter((record) => !term || [record.name, record.componentKey, record.category, record.controlType, record.templateScreen, record.variant].some((value) => value.toLowerCase().includes(term)));
}

function formFromRecord(record: DesignSystemRecord | null, kind: RegistryKind, draft?: Partial<DesignSystemRecord> | null): FormState {
  return {
    active: record?.active ?? draft?.active ?? true,
    category: record?.category ?? draft?.category ?? (kind === "components" ? "Foundations" : kind === "controls" ? "Controls" : "Templates"),
    componentKey: record?.componentKey ?? draft?.componentKey ?? "",
    controlType: record?.controlType ?? draft?.controlType ?? (kind === "controls" ? "Control" : ""),
    defaultProps: JSON.stringify(record?.defaultProps ?? draft?.defaultProps ?? {}, null, 2),
    description: record?.description ?? draft?.description ?? "",
    ...(record ? { id: record.id } : {}),
    name: record?.name ?? draft?.name ?? "",
    templateScreen: record?.templateScreen ?? draft?.templateScreen ?? (kind === "templates" ? "Common List" : ""),
    usageNotes: record?.usageNotes ?? draft?.usageNotes ?? "",
    variant: record?.variant ?? draft?.variant ?? "default"
  };
}

function payloadFromForm(form: FormState) {
  return { ...form, defaultProps: JSON.parse(form.defaultProps || "{}") as Record<string, unknown> };
}

function draftFromCatalog(kind: "component" | "control", item: CatalogItem): Partial<DesignSystemRecord> {
  return {
    active: true,
    category: item.category,
    componentKey: kind === "control" && !item.componentKey.endsWith("-control") ? `${item.componentKey}-control` : item.componentKey,
    controlType: kind === "control" ? item.name : "",
    defaultProps: { variants: item.variants },
    description: item.description,
    kind,
    name: item.name,
    usageNotes: `${item.name} variants: ${item.variants.join(", ")}.`,
    variant: "default"
  };
}

function draftFromTemplate(template: string): Partial<DesignSystemRecord> {
  return {
    active: true,
    category: "Templates",
    componentKey: slugKey(`${template}-template`),
    defaultProps: {},
    description: `${template} reusable screen template.`,
    kind: "template",
    name: `${template} template`,
    templateScreen: template,
    usageNotes: "Reusable template screen contract.",
    variant: "default"
  };
}

function singularLabel(kind: RegistryKind) {
  if (kind === "components") return "component";
  if (kind === "controls") return "control";
  return "template";
}

function slugKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function titleFromKey(value: string) {
  return value.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function showError(title: string, error: unknown) {
  toast.error(title, { description: error instanceof Error ? error.message : "Please try again." });
}
