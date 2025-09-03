import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from '@/db/schema';
import fs from "fs";
import path from "path";

// Get database path from environment or use default
const DATABASE_PATH = process.env.DATABASE_PATH || "./local.db";

// Ensure database directory exists
const dbDir = path.dirname(path.resolve(DATABASE_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database instance
const sqlite = new Database(DATABASE_PATH);

// Enable WAL mode for better concurrency
sqlite.pragma("journal_mode = WAL");

// Enable foreign keys
sqlite.pragma("foreign_keys = ON");

// Create drizzle database instance with schema
export const db = drizzle(sqlite, { schema });

export type Database = typeof db;