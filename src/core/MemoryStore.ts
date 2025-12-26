
import db from "../config/db";
import { MemoryRule } from "../types";

export interface MemoryStore {
  findRules(vendor: string): MemoryRule[];
  saveRule(rule: Omit<MemoryRule, "id">): MemoryRule;
  decayConfidences(): void;
  listAll(): MemoryRule[];
}

class SQLiteMemoryStore implements MemoryStore {
  findRules(vendor: string): MemoryRule[] {
    return db.prepare(`
      SELECT * FROM memories
      WHERE vendor = ?
      ORDER BY confidence DESC, weight DESC
    `).all(vendor) as MemoryRule[];
  }

  saveRule(rule: Omit<MemoryRule, "id">): MemoryRule {
    const existing = db.prepare(`
      SELECT * FROM memories WHERE vendor=? AND field=? AND type=? AND value=?
    `).get(rule.vendor, rule.field, rule.type, rule.value) as MemoryRule | undefined;

    if (existing) {
      const confidence = Math.min(1.0, existing.confidence + 0.1);
      db.prepare(`
        UPDATE memories
        SET confidence=?, weight=weight+1, updated_at=datetime('now')
        WHERE id=?
      `).run(confidence, existing.id);

      return { ...existing, confidence, weight: existing.weight + 1 };
    }

    const res = db.prepare(`
      INSERT INTO memories (vendor, field, type, value, confidence, weight)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(rule.vendor, rule.field, rule.type, rule.value, rule.confidence, rule.weight);

    return { id: Number(res.lastInsertRowid), ...rule };
  }

  decayConfidences(): void {
    db.prepare(`
      UPDATE memories
      SET confidence = MAX(0.3, confidence - 0.02),
          updated_at = datetime('now')
    `).run();
  }

  listAll(): MemoryRule[] {
    return db.prepare(`SELECT * FROM memories ORDER BY vendor, confidence DESC`).all() as MemoryRule[];
  }
}

export const DefaultMemoryStore = new SQLiteMemoryStore();
