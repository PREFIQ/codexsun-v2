#!/usr/bin/env node

import { readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const appsRoot = resolve(import.meta.dirname, "..", "apps");

function removeAppTurboDirs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const path = join(dir, entry.name);
    if (entry.name === ".turbo") {
      rmSync(path, { force: true, recursive: true });
      continue;
    }

    if (statSync(path).isDirectory()) {
      removeAppTurboDirs(path);
    }
  }
}

removeAppTurboDirs(appsRoot);

console.log(`Cleaned app-local Turbo folders under ${appsRoot}`);
