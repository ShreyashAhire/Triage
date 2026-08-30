import { readFile } from "node:fs/promises";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
const migration = await readFile(new URL("../db/migrations/001_initial.sql", import.meta.url), "utf8");
await sql.unsafe(migration);
await sql.end();
console.log("Postgres schema is ready.");
