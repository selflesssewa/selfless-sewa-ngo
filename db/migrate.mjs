// Run: npm run db:migrate   (loads .env.local via --env-file)
// Applies db/schema.sql to the database. Prefers the direct (unpooled)
// connection for DDL, falling back to the pooled URL.
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Client } = pkg;

const __dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dir, "schema.sql"), "utf8");

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL(_UNPOOLED) set. Did .env.local load?");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected. Running schema...");
await client.query(sql);
console.log("Schema applied.");
await client.end();
