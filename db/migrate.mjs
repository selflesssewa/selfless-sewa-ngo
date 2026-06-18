// Run once: node db/migrate.mjs
// Applies db/schema.sql to the database in DATABASE_URL.
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Client } = pkg;

const __dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dir, "schema.sql"), "utf8");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected. Running schema...");
await client.query(sql);
console.log("Schema applied.");
await client.end();
