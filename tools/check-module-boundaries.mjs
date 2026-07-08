import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const apps = ["core", "billing", "accounts"];
const requiredFolders = [
  "domain",
  "application",
  "infrastructure",
  "interface",
  "contracts",
  "events",
  "migrations",
  "seeders",
  "queues",
  "workers",
  "sync",
  "tests",
];

const missing = [];

for (const app of apps) {
  const modulesRoot = join(process.cwd(), "apps", app, "src", "modules");
  if (!existsSync(modulesRoot)) {
    missing.push(`${app}: missing src/modules`);
    continue;
  }

  const modules = readdirSync(modulesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const moduleDir of modules) {
    const modulePath = join(modulesRoot, moduleDir.name);
    for (const folder of requiredFolders) {
      const folderPath = join(modulePath, folder);
      if (!existsSync(folderPath)) {
        missing.push(`${app}/${moduleDir.name}: missing ${folder}/`);
        continue;
      }
      if (!existsSync(join(folderPath, "index.ts"))) {
        missing.push(`${app}/${moduleDir.name}: missing ${folder}/index.ts`);
      }
    }
  }
}

if (missing.length > 0) {
  console.error("Module boundary check failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Module boundary check passed.");
