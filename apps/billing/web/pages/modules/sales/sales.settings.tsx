import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspacePage } from "@codexsun/ui/workspace";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { cn } from "@codexsun/ui/lib/utils";
import {
  type LetterheadSettings,
  type SalesSettingId,
  type SettingsToggle,
  numberValue,
  salesLayoutSettings,
  titleCase,
} from "./sales.workspace";
import { useSalesSettingsState } from "./sales.hooks";

export function SalesSettingsPage() {
  const { publish: publishSettings, setSettings, settings } = useSalesSettingsState();

  function publish() {
    publishSettings();
    toast.success("Sales settings published");
  }

  function toggle(id: SalesSettingId, enabled: boolean) {
    setSettings((current) => {
      return { ...current, layout: { ...current.layout, [id]: enabled } };
    });
  }

  function toggleSetting(section: "customise" | "features" | "printing", id: string, enabled: boolean) {
    setSettings((current) => {
      const next = section === "printing"
        ? { ...current, printing: { ...current.printing, settings: current.printing.settings.map((item) => item.id === id ? { ...item, enabled } : item) } }
        : { ...current, [section]: current[section].map((item) => item.id === id ? { ...item, enabled } : item) };
      return next;
    });
  }

  function updateLetterhead(key: keyof LetterheadSettings, value: string | number) {
    setSettings((current) => {
      return { ...current, letterhead: { ...current.letterhead, [key]: value } };
    });
  }

  return (
    <WorkspacePage
      title="Sales Settings"
      description="Configure sales layout, customisation, and print controls for CODEXSUN."
      actions={<Button type="button" className="h-9 rounded-md" onClick={publish}><Save className="size-4" />Publish live</Button>}
    >
      <Tabs defaultValue="layout" className="space-y-4">
        <TabsList className="h-auto w-full justify-start rounded-md border border-border/70 bg-card px-3 py-0.5 shadow-sm">
          {["Layout", "Printing", "Customise", "Features"].map((label) => (
            <TabsTrigger key={label} value={label.toLowerCase()} className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="layout" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-7">
            <h2 className="text-base font-semibold">Sales Layout</h2>
            <p className="mt-1 text-sm text-muted-foreground">Toggle fields used by sales entry and print screens.</p>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-2 rounded-md border border-border/70 bg-background px-4 py-3">
              <span className="text-sm font-medium">GST API mode</span>
              <WorkspaceSelect
                options={[
                  { label: "E-invoice + E-way", value: "einvoice_eway" },
                  { label: "E-way only", value: "eway_only" },
                ]}
                value={settings.gstApiMode}
                onValueChange={(gstApiMode) => setSettings((current) => ({ ...current, gstApiMode: gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway" }))}
              />
            </label>
            {salesLayoutSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background px-4 py-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{setting.label}</span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">Industry</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch checked={settings.layout[setting.id]} onCheckedChange={(checked) => toggle(setting.id, checked)} />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="printing" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-7">
            <h2 className="text-base font-semibold">Sales Printing</h2>
            <p className="mt-1 text-sm text-muted-foreground">Control presentation options for sales invoice printing.</p>
          </div>
          <div className="grid gap-3">
            {settings.printing.settings.map((setting) => (
              <SettingsSwitchRow key={setting.id} setting={setting} onToggle={(enabled) => toggleSetting("printing", setting.id, enabled)} />
            ))}
            <label className="grid gap-2 rounded-md border border-border/70 bg-background px-4 py-3">
              <span className="text-sm font-medium">Custom terms</span>
              <Textarea className="min-h-24 rounded-md" value={settings.printing.customTerms} onChange={(event) => {
                const customTerms = event.target.value;
                setSettings((current) => {
                  return { ...current, printing: { ...current.printing, customTerms } };
                });
              }} />
            </label>
            <LetterheadDesigner settings={settings.letterhead} onChange={updateLetterhead} />
          </div>
        </TabsContent>
        <TabsContent value="customise" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-7">
            <h2 className="text-base font-semibold">Billing Layout</h2>
            <p className="mt-1 text-sm text-muted-foreground">Industry-specific invoice, tax, address, and print presentation choices.</p>
          </div>
          <div className="grid gap-3">
            {settings.customise.map((setting) => (
              <SettingsSwitchRow key={setting.id} setting={setting} onToggle={(enabled) => toggleSetting("customise", setting.id, enabled)} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="features" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid gap-3">
            {settings.features.map((setting) => (
              <SettingsSwitchRow key={setting.id} setting={setting} onToggle={(enabled) => toggleSetting("features", setting.id, enabled)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}

function SettingsSwitchRow({ onToggle, setting }: { onToggle: (enabled: boolean) => void; setting: SettingsToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background px-4 py-3 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{setting.label}</span>
          <span className={cn(
            "rounded-md border px-2 py-0.5 text-[11px]",
            setting.scope === "industry" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-sky-700",
          )}>
            {titleCase(setting.scope)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
      </div>
      <Switch checked={setting.enabled} onCheckedChange={onToggle} />
    </div>
  );
}

function LetterheadDesigner({ onChange, settings }: { onChange: (key: keyof LetterheadSettings, value: string | number) => void; settings: LetterheadSettings }) {
  return (
    <div className="grid gap-3 rounded-md border border-border/70 bg-background px-4 py-3">
      <div className="flex min-h-40 items-center justify-center rounded-md border bg-white text-black shadow-sm" style={{ borderColor: settings.borderColor }}>
        <div className="text-center" style={{ color: settings.companyNameColor, fontFamily: settings.companyNameFontFamily, fontSize: settings.companyNameFontSize }}>
          CODEXSUN
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">Letterhead Designer</p>
        <p className="text-xs text-muted-foreground">Used by sales, purchase, receipt, payment, stock documents, and statements.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DesignerField label="Company font" value={settings.companyNameFontFamily} onChange={(value) => onChange("companyNameFontFamily", value)} />
        <DesignerField label="Address font" value={settings.addressFontFamily} onChange={(value) => onChange("addressFontFamily", value)} />
        <DesignerField label="Company size" type="number" value={String(settings.companyNameFontSize)} onChange={(value) => onChange("companyNameFontSize", numberValue(value))} />
        <DesignerField label="Address size" type="number" value={String(settings.addressFontSize)} onChange={(value) => onChange("addressFontSize", numberValue(value))} />
        <DesignerField label="Contact size" type="number" value={String(settings.contactFontSize)} onChange={(value) => onChange("contactFontSize", numberValue(value))} />
        <DesignerField label="Tax size" type="number" value={String(settings.taxFontSize)} onChange={(value) => onChange("taxFontSize", numberValue(value))} />
        <DesignerField label="Header height mm" type="number" value={String(settings.heightMm)} onChange={(value) => onChange("heightMm", numberValue(value))} />
        <DesignerField label="Logo height mm" type="number" value={String(settings.logoHeightMm)} onChange={(value) => onChange("logoHeightMm", numberValue(value))} />
        <DesignerField label="Logo width mm" type="number" value={String(settings.logoWidthMm)} onChange={(value) => onChange("logoWidthMm", numberValue(value))} />
        <DesignerField label="Logo left mm" type="number" value={String(settings.logoLeftMm)} onChange={(value) => onChange("logoLeftMm", numberValue(value))} />
        <DesignerField label="Logo top mm" type="number" value={String(settings.logoTopMm)} onChange={(value) => onChange("logoTopMm", numberValue(value))} />
        <DesignerField label="Company color" type="color" value={settings.companyNameColor} onChange={(value) => onChange("companyNameColor", value)} />
        <DesignerField label="Address color" type="color" value={settings.addressColor} onChange={(value) => onChange("addressColor", value)} />
        <DesignerField label="Border color" type="color" value={settings.borderColor} onChange={(value) => onChange("borderColor", value)} />
      </div>
    </div>
  );
}

function DesignerField({ label, onChange, type = "text", value }: { label: string; onChange: (value: string) => void; type?: "color" | "number" | "text"; value: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input className="h-9 rounded-md" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
