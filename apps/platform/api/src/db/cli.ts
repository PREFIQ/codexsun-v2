import { runPlatformDatabaseCommandFromCli, type DatabaseCommand, type DatabaseCommandScope } from "./database-manager.js";

const command = parseCommand(process.argv[2]);
const confirm = process.argv.includes("--confirm") || process.argv.includes("--force");
const scope = parseScope(readFlag("scope") ?? "master");
const databaseName = readFlag("database");
const allTenants = process.argv.includes("--all-tenants");

try {
  const result = await runPlatformDatabaseCommandFromCli(command, { allTenants, confirm, databaseName, scope });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function parseCommand(value: string | undefined): DatabaseCommand {
  if (value === "drop" || value === "migrate" || value === "migrate:fresh" || value === "migrate:rollback") return value;
  console.error("Usage: tsx src/db/cli.ts <drop|migrate|migrate:fresh|migrate:rollback> [--scope=master|tenant] [--database=name|--all-tenants] [--confirm]");
  process.exit(1);
}

function parseScope(value: string): DatabaseCommandScope {
  if (value === "master" || value === "tenant") return value;
  console.error("scope must be master or tenant");
  process.exit(1);
}

function readFlag(name: string) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}
