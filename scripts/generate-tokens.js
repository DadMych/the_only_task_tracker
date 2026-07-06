import { randomBytes } from "crypto";

const APP_URL =
  process.env.APP_URL?.replace(/\/$/, "") ||
  "https://the-only-task-tracker.vercel.app";

const owner = randomBytes(24).toString("hex");
const boss = randomBytes(24).toString("hex");

console.log("\nAccess tokens generated:\n");
console.log(`ACCESS_TOKEN_OWNER=${owner}`);
console.log(`ACCESS_TOKEN_BOSS=${boss}`);
console.log(`\nAccess links (${APP_URL}):\n`);
console.log(`  Oleksii: ${APP_URL}/access/${owner}`);
console.log(`  William: ${APP_URL}/access/${boss}`);
console.log("\nCopy the lines into .env.local\n");
