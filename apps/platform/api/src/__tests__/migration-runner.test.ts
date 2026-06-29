import { describe, it, expect, vi } from "vitest";
import { MigrationRunner } from "../db/migration-runner.js";
import type { CompatibleDbConnection } from "@codexsun/framework/db";

function createMockDb(): CompatibleDbConnection {
  const store = new Map<string, string[]>();
  return {
    async execute<TResult = unknown>(sql: string, values?: unknown[]) {
      if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
        const match = sql.match(/`(\w+)`/);
        if (match && match[1]) {
          store.set(match[1], []);
        }
        return [[] as TResult, undefined];
      }
      if (sql.includes("SELECT id FROM")) {
        const match = sql.match(/FROM `?(\w+)`?/);
        if (match && match[1]) {
          const rows = (store.get(match[1]) ?? []).map((id) => ({ id })) as TResult;
          return [rows, undefined];
        }
      }
      if (sql.includes("INSERT INTO")) {
        const match = sql.match(/INTO `?(\w+)`?/);
        const tableName = match?.[1];
        if (tableName && values) {
          const rows = store.get(tableName) ?? [];
          if (typeof values[0] === "string") {
            rows.push(values[0]);
          }
          store.set(tableName, rows);
        }
        return [[] as TResult, undefined];
      }
      return [[] as TResult, undefined];
    },
    async end() {}
  };
}

describe("MigrationRunner", () => {
  it("should initialize and track applied migrations", async () => {
    const db = createMockDb();
    const runner = new MigrationRunner(db, "test_migrations");
    await runner.initialize();

    expect(runner.listApplied()).toEqual([]);
    expect(runner.isApplied("001_test")).toBe(false);
  });

  it("should run a migration and mark it as applied", async () => {
    const db = createMockDb();
    const runner = new MigrationRunner(db, "test_migrations");
    await runner.initialize();

    const upFn = vi.fn();
    const result = await runner.run({
      id: "001_test",
      description: "Test migration",
      up: upFn
    });

    expect(result).toBe(true);
    expect(upFn).toHaveBeenCalledOnce();
    expect(runner.isApplied("001_test")).toBe(true);
    expect(runner.listApplied()).toEqual(["001_test"]);
  });

  it("should skip already applied migrations", async () => {
    const db = createMockDb();
    const runner = new MigrationRunner(db, "test_migrations");
    await runner.initialize();

    await runner.run({
      id: "001_test",
      description: "Test migration",
      up: vi.fn()
    });

    const upFn = vi.fn();
    const result = await runner.run({
      id: "001_test",
      description: "Test migration",
      up: upFn
    });

    expect(result).toBe(false);
    expect(upFn).not.toHaveBeenCalled();
  });

  it("should run multiple migrations and return count", async () => {
    const db = createMockDb();
    const runner = new MigrationRunner(db, "test_migrations");
    await runner.initialize();

    const count = await runner.runAll([
      { id: "001_first", description: "First", up: vi.fn() },
      { id: "002_second", description: "Second", up: vi.fn() }
    ]);

    expect(count).toBe(2);
    expect(runner.listApplied()).toEqual(["001_first", "002_second"]);
  });

  it("should list pending migrations", async () => {
    const db = createMockDb();
    const runner = new MigrationRunner(db, "test_migrations");
    await runner.initialize();

    await runner.run({ id: "001_applied", description: "Applied", up: vi.fn() });

    const migrations = [
      { id: "001_applied", description: "Applied", up: vi.fn() },
      { id: "002_pending", description: "Pending", up: vi.fn() },
      { id: "003_pending", description: "Pending", up: vi.fn() }
    ];

    const pending = runner.listPending(migrations);
    expect(pending).toHaveLength(2);
    expect(pending[0]!.id).toBe("002_pending");
    expect(pending[1]!.id).toBe("003_pending");
  });
});
