export type AuditEvent = {
  actorEmail?: string;
  actorType: "staff" | "super_admin" | "system" | "tenant";
  eventName: string;
  payload?: Record<string, unknown>;
  tenantId?: string;
};
