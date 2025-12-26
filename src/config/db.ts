
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../memory.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor TEXT NOT NULL,
    field TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    confidence REAL NOT NULL,
    weight INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(vendor, field, type, value)
  );
`);

export default db;
