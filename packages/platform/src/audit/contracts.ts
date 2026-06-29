export type AuditEvent = {
  actorEmail?: string;
  actorType: "staff" | "super_admin" | "system" | "tenant";
  correlationId?: string;
  eventName: string;
  payload?: Record<string, unknown>;
  requestId?: string;
  tenantId?: string;
};
