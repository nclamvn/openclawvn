/**
 * Checkpoint Storage
 * SQLite-based workflow state persistence
 */

import Database from "better-sqlite3";
import { resolve } from "path";
import { mkdirSync } from "fs";
import type { WorkflowCheckpoint } from "../types.js";

function getDbPath(): string {
  const dir = resolve(process.env.HOME || "~", ".bom");
  mkdirSync(dir, { recursive: true });
  return process.env.BOM_CHECKPOINT_DB || resolve(dir, "checkpoints.db");
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
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      steps TEXT NOT NULL,
      current_step_index INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      total_input_tokens INTEGER DEFAULT 0,
      total_output_tokens INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_user_id ON workflows(user_id);
    CREATE INDEX IF NOT EXISTS idx_status ON workflows(status);
  `);
}

export function save(checkpoint: WorkflowCheckpoint): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO workflows
    (id, user_id, name, steps, current_step_index, status, created_at, updated_at,
     total_input_tokens, total_output_tokens, total_cost, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      checkpoint.id,
      checkpoint.userId,
      JSON.stringify(checkpoint.steps),
      checkpoint.name,
      checkpoint.currentStepIndex,
      checkpoint.status,
      checkpoint.createdAt,
      checkpoint.updatedAt,
      checkpoint.totalTokens.input,
      checkpoint.totalTokens.output,
      checkpoint.totalCost,
      checkpoint.metadata ? JSON.stringify(checkpoint.metadata) : null,
    );
}

export function get(id: string): WorkflowCheckpoint | null {
  const row = getDb().prepare("SELECT * FROM workflows WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToCheckpoint(row) : null;
}

export function getByUser(
  userId: string,
  options: { status?: string; limit?: number } = {},
): WorkflowCheckpoint[] {
  let query = "SELECT * FROM workflows WHERE user_id = ?";
  const params: unknown[] = [userId];

  if (options.status) {
    query += " AND status = ?";
    params.push(options.status);
  }
  query += " ORDER BY updated_at DESC";
  if (options.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = getDb()
    .prepare(query)
    .all(...params) as Array<Record<string, unknown>>;
  return rows.map(rowToCheckpoint);
}

export function getResumable(userId: string): WorkflowCheckpoint[] {
  return getByUser(userId, { status: "running" });
}

export function deleteCheckpoint(id: string): void {
  getDb().prepare("DELETE FROM workflows WHERE id = ?").run(id);
}

export function deleteOld(olderThan: number): number {
  return getDb().prepare("DELETE FROM workflows WHERE updated_at < ?").run(olderThan).changes;
}

function rowToCheckpoint(row: Record<string, unknown>): WorkflowCheckpoint {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    steps: JSON.parse(row.steps as string),
    currentStepIndex: row.current_step_index as number,
    status: row.status as WorkflowCheckpoint["status"],
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    totalTokens: {
      input: row.total_input_tokens as number,
      output: row.total_output_tokens as number,
    },
    totalCost: row.total_cost as number,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  };
}

export function close(): void {
  if (db) {
    db.close();
    db = null;
  }
}
