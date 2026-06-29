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
      `INSERT INTO audit_events (actor_type, actor_email, tenant_id, event_name, event_payload)
       VALUES (?, ?, ?, ?, ?)`,
      [
        event.actorType,
        event.actorEmail ?? null,
        event.tenantId ?? null,
        event.eventName,
        event.payload ? JSON.stringify(event.payload) : null
      ]
    );
  }
}
