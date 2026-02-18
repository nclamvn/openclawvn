/**
 * Cache Storage Backend
 * SQLite-based persistent cache
 */

import Database from "better-sqlite3";
import { resolve } from "path";
import { mkdirSync } from "fs";
import type { CacheEntry, CacheStats } from "../types.js";

// ── DATABASE SETUP ──────────────────────────────────────────

function getDbPath(): string {
  const dir = resolve(process.env.HOME || "~", ".bom");
  mkdirSync(dir, { recursive: true });
  return process.env.BOM_CACHE_DB || resolve(dir, "cache.db");
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS cache_entries (
      id TEXT PRIMARY KEY,
      prompt_hash TEXT NOT NULL,
      prompt_embedding BLOB,
      response TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      hit_count INTEGER DEFAULT 0,
      metadata TEXT,
      UNIQUE(prompt_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_prompt_hash ON cache_entries(prompt_hash);
    CREATE INDEX IF NOT EXISTS idx_expires_at ON cache_entries(expires_at);

    CREATE TABLE IF NOT EXISTS cache_stats (
      id INTEGER PRIMARY KEY,
      total_hits INTEGER DEFAULT 0,
      total_misses INTEGER DEFAULT 0,
      tokens_saved INTEGER DEFAULT 0,
      cost_saved REAL DEFAULT 0,
      last_updated INTEGER
    );
    INSERT OR IGNORE INTO cache_stats (id, total_hits, total_misses, tokens_saved, cost_saved, last_updated)
    VALUES (1, 0, 0, 0, 0, ${Date.now()});
  `);
}

// ── OPERATIONS ──────────────────────────────────────────────

export function setEntry(entry: CacheEntry): void {
  const database = getDb();
  database
    .prepare(
      `INSERT OR REPLACE INTO cache_entries
    (id, prompt_hash, prompt_embedding, response, model, input_tokens, output_tokens, cost, created_at, expires_at, hit_count, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      entry.id,
      entry.promptHash,
      entry.promptEmbedding ? Buffer.from(new Float32Array(entry.promptEmbedding).buffer) : null,
      entry.response,
      entry.model,
      entry.tokens.input,
      entry.tokens.output,
      entry.cost,
      entry.createdAt,
      entry.expiresAt,
      entry.hitCount,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    );
}

export function getByHash(hash: string): CacheEntry | null {
  const database = getDb();
  const row = database
    .prepare("SELECT * FROM cache_entries WHERE prompt_hash = ? AND expires_at > ?")
    .get(hash, Date.now()) as Record<string, unknown> | undefined;

  if (!row) return null;

  database.prepare("UPDATE cache_entries SET hit_count = hit_count + 1 WHERE id = ?").run(row.id);

  return rowToEntry(row);
}

export function getAllEmbeddings(): Array<{ id: string; embedding: number[] }> {
  const database = getDb();
  const rows = database
    .prepare(
      "SELECT id, prompt_embedding FROM cache_entries WHERE prompt_embedding IS NOT NULL AND expires_at > ?",
    )
    .all(Date.now()) as Array<Record<string, unknown>>;

  return rows
    .filter((row) => row.prompt_embedding != null)
    .map((row) => ({
      id: row.id as string,
      embedding: Array.from(new Float32Array((row.prompt_embedding as Buffer).buffer)),
    }));
}

export function getById(id: string): CacheEntry | null {
  const database = getDb();
  const row = database.prepare("SELECT * FROM cache_entries WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToEntry(row) : null;
}

export function deleteEntry(id: string): void {
  getDb().prepare("DELETE FROM cache_entries WHERE id = ?").run(id);
}

export function deleteExpired(): number {
  return getDb().prepare("DELETE FROM cache_entries WHERE expires_at < ?").run(Date.now()).changes;
}

export function getStats(): CacheStats {
  const database = getDb();
  const countRow = database
    .prepare("SELECT COUNT(*) as count FROM cache_entries WHERE expires_at > ?")
    .get(Date.now()) as Record<string, number>;
  const statsRow = database.prepare("SELECT * FROM cache_stats WHERE id = 1").get() as
    | Record<string, number>
    | undefined;

  const totalHits = statsRow?.total_hits || 0;
  const totalMisses = statsRow?.total_misses || 0;

  return {
    totalEntries: countRow?.count || 0,
    totalHits,
    totalMisses,
    hitRate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0,
    tokensSaved: statsRow?.tokens_saved || 0,
    costSaved: statsRow?.cost_saved || 0,
  };
}

export function recordHit(tokensSaved: number, costSaved: number): void {
  getDb()
    .prepare(
      "UPDATE cache_stats SET total_hits = total_hits + 1, tokens_saved = tokens_saved + ?, cost_saved = cost_saved + ?, last_updated = ? WHERE id = 1",
    )
    .run(tokensSaved, costSaved, Date.now());
}

export function recordMiss(): void {
  getDb()
    .prepare(
      "UPDATE cache_stats SET total_misses = total_misses + 1, last_updated = ? WHERE id = 1",
    )
    .run(Date.now());
}

export function clearAll(): void {
  const database = getDb();
  database.exec("DELETE FROM cache_entries");
  database.exec(
    "UPDATE cache_stats SET total_hits = 0, total_misses = 0, tokens_saved = 0, cost_saved = 0",
  );
}

function rowToEntry(row: Record<string, unknown>): CacheEntry {
  return {
    id: row.id as string,
    promptHash: row.prompt_hash as string,
    promptEmbedding:
      row.prompt_embedding != null
        ? Array.from(new Float32Array((row.prompt_embedding as Buffer).buffer))
        : undefined,
    response: row.response as string,
    model: row.model as string,
    tokens: {
      input: row.input_tokens as number,
      output: row.output_tokens as number,
    },
    cost: row.cost as number,
    createdAt: row.created_at as number,
    expiresAt: row.expires_at as number,
    hitCount: row.hit_count as number,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  };
}

export function close(): void {
  if (db) {
    db.close();
    db = null;
  }
}
