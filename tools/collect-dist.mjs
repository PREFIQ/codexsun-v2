#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rootDist = join(root, "dist");

const outputs = [
  ["apps/accounts/dist", "apps/accounts"],
  ["apps/billing/dist", "apps/billing"],
  ["apps/core/dist", "apps/core"],
  ["apps/platform/api/dist", "apps/platform/api"],
  ["packages/framework/dist", "packages/framework"],
  ["packages/platform/dist", "packages/platform"],
  ["packages/ui/dist", "packages/ui"]
];

mkdirSync(rootDist, { recursive: true });

for (const [source, target] of outputs) {
  const from = join(root, source);
  const to = join(rootDist, target);

  if (!existsSync(from)) {
    continue;
  }

  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

console.log(`Collected build output in ${rootDist}`);
