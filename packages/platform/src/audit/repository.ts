import type { AuditEvent } from "./contracts.js";

export interface AuditRepository {
  write(event: AuditEvent): Promise<void>;
}

export class MasterDbAuditRepository implements AuditRepository {
  constructor(
    private readonly db: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    }
  ) {}

  async write(event: AuditEvent): Promise<void> {
    await this.db.execute(
      `INSERT INTO audit_events (actor_type, actor_email, correlation_id, event_name, event_payload, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event.actorType,
        event.actorEmail ?? null,
        event.correlationId ?? null,
        event.eventName,
        event.payload ? JSON.stringify(event.payload) : null,
        event.tenantId ?? null
      ]
    );
  }
}
