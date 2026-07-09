import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const APP_URL =
  process.env.APP_URL?.replace(/\/$/, "") ||
  "https://the-only-task-tracker.vercel.app";

const ENV_PATH = path.join(process.cwd(), ".env.local");

const KEYS = {
  ACCESS_TOKEN_OWNER: () => randomBytes(24).toString("hex"),
  ACCESS_TOKEN_BOSS: () => randomBytes(24).toString("hex"),
  AGENT_API_TOKEN: () => randomBytes(32).toString("hex"),
};

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function writeEnvFile(filePath, values) {
  const existing = readEnvFile(filePath);
  const merged = { ...existing, ...values };
  const lines = Object.entries(merged).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

const existing = readEnvFile(ENV_PATH);
const tokens = {};
const created = [];

for (const [key, generate] of Object.entries(KEYS)) {
  if (existing[key]) {
    tokens[key] = existing[key];
  } else {
    tokens[key] = generate();
    created.push(key);
  }
}

if (created.length > 0) {
  writeEnvFile(ENV_PATH, Object.fromEntries(created.map((k) => [k, tokens[k]])));
}

console.log("\nTokens:\n");
for (const key of Object.keys(KEYS)) {
  console.log(`${key}=${tokens[key]}`);
}

console.log(`\nAccess links (${APP_URL}):\n`);
console.log(`  Oleksii: ${APP_URL}/access/${tokens.ACCESS_TOKEN_OWNER}`);
console.log(`  William: ${APP_URL}/access/${tokens.ACCESS_TOKEN_BOSS}`);
console.log(`\nAgent API: Authorization: Bearer ${tokens.AGENT_API_TOKEN}`);

if (created.length > 0) {
  console.log(`\nCreated missing token(s) in .env.local: ${created.join(", ")}`);
} else {
  console.log("\nAll tokens already set — nothing changed.");
}

console.log("");
