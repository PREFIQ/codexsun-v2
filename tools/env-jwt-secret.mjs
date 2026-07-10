#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const exampleEnvPath = resolve(root, ".env.example");
const ensureOnly = process.argv.includes("--ensure");

let content = "";

if (existsSync(envPath)) {
  content = readFileSync(envPath, "utf8");
} else if (existsSync(exampleEnvPath)) {
  content = readFileSync(exampleEnvPath, "utf8");
  writeFileSync(envPath, content);
  console.log(".env created from .env.example");
} else {
  writeFileSync(envPath, "");
  console.log(".env created");
}

const jwtSecretMatch = content.match(/^\s*JWT_SECRET\s*=\s*(.*?)\s*$/m);
const existingSecret = jwtSecretMatch?.[1]?.trim() ?? "";

if (ensureOnly && existingSecret) {
  console.log("JWT_SECRET already exists in .env");
  process.exit(0);
}

const secret = randomBytes(32).toString("hex");
const updated = jwtSecretMatch
  ? content.replace(/^\s*JWT_SECRET\s*=.*$/m, `JWT_SECRET=${secret}`)
  : `${content}${content.endsWith("\n") || content.length === 0 ? "" : "\n"}JWT_SECRET=${secret}\n`;

writeFileSync(envPath, updated);
console.log(`JWT_SECRET ${ensureOnly ? "generated" : "rotated"} and written to .env`);

if (!ensureOnly) {
  console.log(`  ${secret}`);
}
