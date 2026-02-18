/**
 * Metrics Collection
 * Track all request metrics for analysis
 */

import Database from "better-sqlite3";
import { resolve } from "path";
import { mkdirSync } from "fs";
import type { RequestMetrics, UserStats } from "../types.js";

function getDbPath(): string {
  const dir = resolve(process.env.HOME || "~", ".bom");
  mkdirSync(dir, { recursive: true });
  return process.env.BOM_METRICS_DB || resolve(dir, "metrics.db");
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
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      task_type TEXT,
      model TEXT NOT NULL,
      model_tier TEXT,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      latency_ms INTEGER,
      cache_hit INTEGER DEFAULT 0,
      checkpoint_used INTEGER DEFAULT 0,
      tokens_saved INTEGER DEFAULT 0,
      cost_saved REAL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_user_timestamp ON requests(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON requests(timestamp);
  `);
}

/** Record a request */
export function recordRequest(metrics: RequestMetrics): void {
  getDb()
    .prepare(
      `INSERT INTO requests
    (id, user_id, timestamp, task_type, model, model_tier, input_tokens, output_tokens,
     cost, latency_ms, cache_hit, checkpoint_used, tokens_saved, cost_saved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      metrics.id,
      metrics.userId,
      metrics.timestamp,
      metrics.taskType,
      metrics.model,
      metrics.modelTier,
      metrics.tokens.input,
      metrics.tokens.output,
      metrics.cost,
      metrics.latencyMs,
      metrics.cacheHit ? 1 : 0,
      metrics.checkpointUsed ? 1 : 0,
      metrics.tokensSaved,
      metrics.costSaved,
    );
}

function sinceFromPeriod(period: "day" | "week" | "month" | "all"): number {
  const now = Date.now();
  switch (period) {
    case "day":
      return now - 24 * 60 * 60 * 1000;
    case "week":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "month":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "all":
      return 0;
  }
}

/** Get user statistics for a period */
export function getUserStats(
  userId: string,
  period: "day" | "week" | "month" | "all" = "day",
): UserStats {
  const database = getDb();
  const since = sinceFromPeriod(period);

  const stats = database
    .prepare(
      `SELECT
      COUNT(*) as total_requests,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(cost) as total_cost,
      SUM(cost_saved) as total_saved,
      AVG(latency_ms) as avg_latency,
      SUM(cache_hit) as cache_hits
    FROM requests WHERE user_id = ? AND timestamp >= ?`,
    )
    .get(userId, since) as Record<string, number>;

  const modelUsage = database
    .prepare(
      "SELECT model, COUNT(*) as count FROM requests WHERE user_id = ? AND timestamp >= ? GROUP BY model",
    )
    .all(userId, since) as Array<{ model: string; count: number }>;

  const taskUsage = database
    .prepare(
      "SELECT task_type, COUNT(*) as count FROM requests WHERE user_id = ? AND timestamp >= ? GROUP BY task_type",
    )
    .all(userId, since) as Array<{ task_type: string; count: number }>;

  return {
    userId,
    period,
    totalRequests: stats.total_requests || 0,
    totalTokens: {
      input: stats.total_input || 0,
      output: stats.total_output || 0,
    },
    totalCost: stats.total_cost || 0,
    totalSaved: stats.total_saved || 0,
    cacheHitRate: stats.total_requests > 0 ? (stats.cache_hits || 0) / stats.total_requests : 0,
    avgLatencyMs: stats.avg_latency || 0,
    modelUsage: Object.fromEntries(modelUsage.map((r) => [r.model, r.count])),
    taskTypeUsage: Object.fromEntries(taskUsage.map((r) => [r.task_type, r.count])),
  };
}

/** Get recent requests */
export function getRecentRequests(userId: string, limit: number = 20): RequestMetrics[] {
  const rows = getDb()
    .prepare("SELECT * FROM requests WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?")
    .all(userId, limit) as Array<Record<string, unknown>>;
  return rows.map(rowToMetrics);
}

/** Get total spend for period */
export function getTotalSpend(userId: string, since: number): number {
  const result = getDb()
    .prepare("SELECT SUM(cost) as total FROM requests WHERE user_id = ? AND timestamp >= ?")
    .get(userId, since) as { total: number | null };
  return result?.total || 0;
}

/** Get total savings for period */
export function getTotalSavings(userId: string, since: number): number {
  const result = getDb()
    .prepare("SELECT SUM(cost_saved) as total FROM requests WHERE user_id = ? AND timestamp >= ?")
    .get(userId, since) as { total: number | null };
  return result?.total || 0;
}

function rowToMetrics(row: Record<string, unknown>): RequestMetrics {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    timestamp: row.timestamp as number,
    taskType: row.task_type as RequestMetrics["taskType"],
    model: row.model as string,
    modelTier: row.model_tier as RequestMetrics["modelTier"],
    tokens: {
      input: row.input_tokens as number,
      output: row.output_tokens as number,
    },
    cost: row.cost as number,
    latencyMs: row.latency_ms as number,
    cacheHit: row.cache_hit === 1,
    checkpointUsed: row.checkpoint_used === 1,
    tokensSaved: row.tokens_saved as number,
    costSaved: row.cost_saved as number,
  };
}

export function close(): void {
  if (db) {
    db.close();
    db = null;
  }
}
