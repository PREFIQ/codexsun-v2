#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "node:net";

const root = resolve(import.meta.dirname, "..");
const app = process.argv[2];
const cliFlags = new Set(process.argv.slice(3));

const apps = {
  "platform-api": {
    cwd: "apps/platform/api",
    envKey: "PLATFORM_API_PORT",
    hostKey: "PLATFORM_API_HOST",
    fallbackPort: 5510,
    fallbackHost: "127.0.0.1",
    command: process.execPath,
    args: [nodePackageBin("tsx", "dist/cli.mjs", "apps/platform/api"), "watch", "src/server.ts"]
  },
  "platform-web": {
    cwd: "apps/platform/web",
    envKey: "PLATFORM_WEB_PORT",
    hostKey: "PLATFORM_WEB_HOST",
    fallbackPort: 5520,
    fallbackHost: "127.0.0.1",
    command: process.execPath,
    args: [nodePackageBin("vite", "bin/vite.js", "apps/platform/web"), "--host", "127.0.0.1", "--strictPort"]
  }
};

if (!app || !apps[app]) {
  console.log(`Usage: node tools/preflight.mjs <${Object.keys(apps).join("|")}>`);
  process.exit(1);
}

const config = apps[app];
const env = loadDotEnv();
const port = Number(process.env[config.envKey] || env[config.envKey]) || config.fallbackPort;
const host = process.env[config.hostKey] || env[config.hostKey] || config.fallbackHost;
const skipDatabase = cliFlags.has("--skip-db") || flagEnabled("CODEXSUN_DEV_SKIP_DB", env);

await freePort(port, host);

if (app === "platform-api") {
  ensurePlatformApiDependencies();
}

if (app === "platform-api" && skipDatabase) {
  console.log("  skip Database preflight skipped by flag");
}

if (app === "platform-api" && !skipDatabase) {
  runPlatformApiDatabasePreflight(env);
}

const child = spawn(config.command, [...config.args, ...(app === "platform-web" ? ["--port", String(port)] : [])], {
  cwd: resolve(root, config.cwd),
  env: {
    ...process.env,
    ...env,
    [config.envKey]: String(port),
    ...(skipDatabase ? { CODEXSUN_DEV_SKIP_DB: "1" } : {})
  },
  stdio: "inherit"
});

child.on("exit", (code) => process.exit(code ?? 0));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopChild(child, signal);
  });
}

function loadDotEnv() {
  const envPath = resolve(root, ".env");

  if (!existsSync(envPath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map((match) => [match[1].trim(), parseEnvValue(match[2])])
  );
}

function parseEnvValue(value) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return "";
  }

  const quote = trimmed[0];

  if ((quote === "\"" || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  return trimmed.replace(/\s+#.*$/, "").trim();
}

function flagEnabled(name, env) {
  const value = String(process.env[name] ?? env[name] ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function ensurePlatformApiDependencies() {
  console.log("  - Checking API package builds");
  ensureWorkspacePackageBuild("@codexsun/core", "apps/core");
  ensureWorkspacePackageBuild("@codexsun/framework", "packages/framework");
  ensureWorkspacePackageBuild("@codexsun/platform", "packages/platform");
}

function ensureWorkspacePackageBuild(workspaceName, packagePath) {
  const absolutePackagePath = resolve(root, packagePath);
  const srcPath = join(absolutePackagePath, "src");
  const distPath = join(absolutePackagePath, "dist");
  const packageJsonPath = join(absolutePackagePath, "package.json");
  const tsconfigPath = join(absolutePackagePath, "tsconfig.json");

  if (!existsSync(distPath)) {
    buildWorkspacePackage(workspaceName, "dist missing");
    return;
  }

  const sourceTime = newestMtime([srcPath, packageJsonPath, tsconfigPath]);
  const distTime = newestMtime([distPath]);

  if (sourceTime > distTime) {
    buildWorkspacePackage(workspaceName, "source changed");
    return;
  }

  console.log(`  ok ${workspaceName} build is current`);
}

function buildWorkspacePackage(workspaceName, reason) {
  const startedAt = Date.now();
  console.log(`  build ${workspaceName} (${reason})`);
  runNpm(["run", "build", "-w", workspaceName]);
  console.log(`  ok ${workspaceName} built in ${Date.now() - startedAt}ms`);
}

function newestMtime(paths) {
  let newest = 0;
  for (const path of paths) {
    if (!existsSync(path)) {
      continue;
    }
    const stat = statSync(path);
    newest = Math.max(newest, stat.mtimeMs);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".turbo" || entry.name === "dist") {
          continue;
        }
        newest = Math.max(newest, newestMtime([join(path, entry.name)]));
      }
    }
  }
  return newest;
}

function runNpm(args) {
  if (process.env.npm_execpath) {
    execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
      cwd: root,
      stdio: "inherit"
    });
    return;
  }

  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", ["npm", ...args].join(" ")], {
      cwd: root,
      stdio: "inherit"
    });
    return;
  }

  execFileSync("npm", args, {
    cwd: root,
    stdio: "inherit"
  });
}

async function freePort(port, host) {
  console.log(`\n  > ${app} preflight`);
  console.log(`  - Checking ${host}:${port}`);

  if (await probePort(port, host)) {
    await waitForPortRelease();
    console.log(`  ok ${host}:${port} is ready\n`);
    return;
  }

  const pids = getPidsOnPort(port);

  if (!pids.length) {
    console.log(`  ok Port ${port} is ready (no blocking process found)\n`);
    return;
  }

  console.log(`  ! ${host}:${port} is already in use by PID ${pids.join(", ")}`);

  if (process.env.CODEXSUN_DEV_PORT_POLICY === "abort") {
    console.error("  x Port policy is abort. Stop the existing process or change CODEXSUN_DEV_PORT_POLICY.\n");
    process.exit(1);
  }

  for (const pid of pids) {
    killPid(pid);
    console.log(`  ok Stopped PID ${pid}`);
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await probePort(port, host)) {
      await waitForPortRelease();
      console.log(`  ok ${host}:${port} is ready\n`);
      return;
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  console.error(`  x Port ${port} was not released after stopping PID ${pids.join(", ")}.\n`);
  process.exit(1);
}

function probePort(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close((error) => resolve(!error));
    });
    server.listen(port, host);
  });
}

function waitForPortRelease() {
  return new Promise((resolveWait) => setTimeout(resolveWait, 100));
}

function getPidsOnPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execFileSync("netstat", ["-ano", "-p", "tcp"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      });

      return Array.from(
        new Set(
          out
            .split(/\r?\n/)
            .map((line) => line.trim().split(/\s+/))
            .filter((parts) => parts.length >= 5 && parts[3] === "LISTENING" && portFromAddress(parts[1]) === port)
            .map((parts) => Number(parts[4]))
            .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid)
        )
      );
    }

    const out = execFileSync("lsof", ["-ti", `:${port}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });

    return Array.from(
      new Set(
        out
          .split(/\s+/)
          .map(Number)
          .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid)
      )
    );
  } catch {
    return [];
  }
}

function portFromAddress(address) {
  const match = String(address).match(/:(\d+)$/);
  return match ? Number(match[1]) : null;
}

function killPid(pid) {
  if (process.platform === "win32") {
    execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    return;
  }

  process.kill(pid, "SIGTERM");
}

function runPlatformApiDatabasePreflight(env) {
  const startedAt = Date.now();
  console.log("  - Checking database and migrations");
  try {
    execFileSync(
      process.execPath,
      [nodePackageBin("tsx", "dist/cli.mjs", "apps/platform/api"), "src/db/preflight.ts"],
      {
        cwd: resolve(root, "apps/platform/api"),
        env: {
          ...process.env,
          ...env
        },
        stdio: "inherit"
      }
    );
    console.log(`  ok Platform API preflight passed in ${Date.now() - startedAt}ms\n`);
  } catch {
    console.error("  x Platform API preflight failed. Fix the database or migration issue above, then retry.\n");
    process.exit(1);
  }
}

function stopChild(childProcess, signal) {
  if (childProcess.killed || !childProcess.pid) {
    return;
  }

  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/PID", String(childProcess.pid), "/T", "/F"], {
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch {
      childProcess.kill(signal);
    }
    return;
  }

  childProcess.kill(signal);
}

function nodePackageBin(packageName, binPath, workspacePath) {
  const workspaceBin = resolve(root, workspacePath, "node_modules", packageName, binPath);

  if (existsSync(workspaceBin)) {
    return workspaceBin;
  }

  return resolve(root, "node_modules", packageName, binPath);
}
