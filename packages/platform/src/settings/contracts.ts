export type SettingScope = "platform" | "staff" | "tenant";

export type SettingRecord<TValue = unknown> = {
  key: string;
  scope: SettingScope;
  tenantId?: string;
  value: TValue;
};
