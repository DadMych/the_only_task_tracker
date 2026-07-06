import { randomBytes } from "crypto";

const owner = randomBytes(24).toString("hex");
const boss = randomBytes(24).toString("hex");

console.log("\nAccess tokens generated:\n");
console.log(`ACCESS_TOKEN_OWNER=${owner}`);
console.log(`ACCESS_TOKEN_BOSS=${boss}`);
console.log("\nAccess links (after starting dev server):\n");
console.log(`  Oleksii: http://localhost:3000/access/${owner}`);
console.log(`  William: http://localhost:3000/access/${boss}`);
console.log("\nCopy the lines into .env.local\n");
