#!/usr/bin/env node
/**
 * Creates Turso DB and writes credentials to .env.local
 * Requires: turso CLI + `turso auth login`
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DB_NAME = "the-only-task-tracker";
const ENV_PATH = path.join(process.cwd(), ".env.local");
const LOCAL_DB = path.join(process.cwd(), "data", "tracker.db");

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function sh(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function upsertEnv(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");

  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    content = content.trimEnd() + (content.endsWith("\n") || !content ? "" : "\n") + line + "\n";
  }

  fs.writeFileSync(ENV_PATH, content);
}

console.log("\nTurso setup\n");

if (!sh("turso auth whoami")) {
  console.error("Not logged in to Turso. Run first:\n");
  console.error("   turso auth login\n");
  process.exit(1);
}

const whoami = run("turso auth whoami");
console.log(`Account: ${whoami}`);

const exists = sh(`turso db show ${DB_NAME}`);

if (!exists) {
  if (fs.existsSync(LOCAL_DB)) {
    console.log(`Creating DB "${DB_NAME}" from local data/tracker.db...`);
    run(`turso db create ${DB_NAME} --from-file "${LOCAL_DB}"`);
  } else {
    console.log(`Creating DB "${DB_NAME}"...`);
    run(`turso db create ${DB_NAME}`);
  }
  console.log("Database created");
} else {
  console.log(`Database "${DB_NAME}" already exists`);
}

const url = run(`turso db show ${DB_NAME} --url`);
const token = run(`turso db tokens create ${DB_NAME}`);

upsertEnv("TURSO_DATABASE_URL", url);
upsertEnv("TURSO_AUTH_TOKEN", token);

console.log("\nSaved to .env.local:");
console.log(`  TURSO_DATABASE_URL=${url}`);
console.log(`  TURSO_AUTH_TOKEN=${token.slice(0, 12)}...`);
console.log("\nFor Vercel — add the same variables in Settings → Environment Variables\n");
