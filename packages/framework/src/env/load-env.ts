import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import dotenv from "dotenv";
import type { z } from "zod";

export function loadEnv<TSchema extends z.ZodTypeAny>(schema: TSchema): z.infer<TSchema> {
  loadNearestEnvFile();
  return schema.parse(process.env);
}

function loadNearestEnvFile() {
  const envPath = findNearestEnvFile(process.cwd());

  if (envPath) {
    dotenv.config({ path: envPath, quiet: true });
  }
}

function findNearestEnvFile(startPath: string) {
  let currentPath = resolve(startPath);
  const rootPath = parse(currentPath).root;

  while (true) {
    const envPath = join(currentPath, ".env");

    if (existsSync(envPath)) {
      return envPath;
    }

    if (isWorkspaceRoot(currentPath) || currentPath === rootPath) {
      return undefined;
    }

    currentPath = dirname(currentPath);
  }
}

function isWorkspaceRoot(path: string) {
  const packageJsonPath = join(path, "package.json");

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { workspaces?: unknown };
    return Array.isArray(packageJson.workspaces);
  } catch {
    return false;
  }
}
