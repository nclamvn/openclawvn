import fs from "node:fs";
import path from "node:path";

import { resolveStateDir } from "../config/paths.js";

// --- Types ---

export type AuditAction =
  | "auth.success"
  | "auth.failure"
  | "auth.rate-limited"
  | "token.rotate"
  | "token.revoke"
  | "token.renew"
  | "token.expired"
  | "device.paired"
  | "device.rejected"
  | "scope.violation"
  | "session.created"
  | "session.deleted"
  | "session.reset"
  | "cors.rejected"
  | "insecure.mode"
  | "ip.mismatch"
  | "ip.rejected";

export type AuditEntry = {
  ts: number;
  action: AuditAction;
  deviceId?: string;
  ip?: string;
  role?: string;
  scopes?: string[];
  method?: string;
  sessionKey?: string;
  detail?: string;
};

// --- Paths ---

function resolveAuditDir(baseDir?: string): string {
  const root = baseDir ?? resolveStateDir();
  return path.join(root, "audit");
}

function resolveAuditFilePath(baseDir?: string, nowMs?: number): string {
  const dir = resolveAuditDir(baseDir);
  const d = new Date(nowMs ?? Date.now());
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return path.join(dir, `${yyyy}-${mm}.jsonl`);
}

// --- Write (fire-and-forget, never throws) ---

export function writeAuditEntry(entry: AuditEntry, baseDir?: string): void {
  try {
    const filePath = resolveAuditFilePath(baseDir, entry.ts);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(filePath, line, "utf8");
  } catch {
    // Fire-and-forget: never throw from audit logging.
  }
}

// --- Read ---

export type AuditListParams = {
  baseDir?: string;
  limit?: number;
  offset?: number;
  action?: AuditAction;
  deviceId?: string;
  since?: number;
  until?: number;
};

export type AuditListResult = {
  entries: AuditEntry[];
  total: number;
  hasMore: boolean;
};

export function listAuditEntries(params: AuditListParams = {}): AuditListResult {
  const { limit = 100, offset = 0, action, deviceId, since, until } = params;
  const dir = resolveAuditDir(params.baseDir);

  if (!fs.existsSync(dir)) {
    return { entries: [], total: 0, hasMore: false };
  }

  // Collect all .jsonl files, sorted newest first.
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .reverse();

  const allEntries: AuditEntry[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AuditEntry;
        if (action && entry.action !== action) continue;
        if (deviceId && entry.deviceId !== deviceId) continue;
        if (since && entry.ts < since) continue;
        if (until && entry.ts > until) continue;
        allEntries.push(entry);
      } catch {
        // Skip malformed lines.
      }
    }
  }

  // Sort newest first.
  allEntries.sort((a, b) => b.ts - a.ts);

  const total = allEntries.length;
  const sliced = allEntries.slice(offset, offset + limit);
  return {
    entries: sliced,
    total,
    hasMore: offset + sliced.length < total,
  };
}

// --- Convenience helpers ---

export function auditAuthSuccess(params: {
  deviceId?: string;
  ip?: string;
  role?: string;
  scopes?: string[];
}): void {
  writeAuditEntry({ ts: Date.now(), action: "auth.success", ...params });
}

export function auditAuthFailure(params: { ip?: string; detail?: string }): void {
  writeAuditEntry({ ts: Date.now(), action: "auth.failure", ...params });
}

export function auditRateLimited(params: { ip?: string; detail?: string }): void {
  writeAuditEntry({ ts: Date.now(), action: "auth.rate-limited", ...params });
}

export function auditScopeViolation(params: {
  deviceId?: string;
  ip?: string;
  role?: string;
  scopes?: string[];
  method?: string;
}): void {
  writeAuditEntry({ ts: Date.now(), action: "scope.violation", ...params });
}

export function auditTokenEvent(
  action: "token.rotate" | "token.revoke" | "token.renew" | "token.expired",
  params: { deviceId?: string; role?: string; detail?: string },
): void {
  writeAuditEntry({ ts: Date.now(), action, ...params });
}

export function auditDeviceEvent(
  action: "device.paired" | "device.rejected",
  params: { deviceId?: string; role?: string; detail?: string },
): void {
  writeAuditEntry({ ts: Date.now(), action, ...params });
}

export function auditSessionEvent(
  action: "session.created" | "session.deleted" | "session.reset",
  params: { sessionKey?: string; deviceId?: string; detail?: string },
): void {
  writeAuditEntry({ ts: Date.now(), action, ...params });
}

export function auditCorsRejected(params: { ip?: string; detail?: string }): void {
  writeAuditEntry({ ts: Date.now(), action: "cors.rejected", ...params });
}

export function auditInsecureMode(params: { detail?: string }): void {
  writeAuditEntry({ ts: Date.now(), action: "insecure.mode", ...params });
}

export function auditIpEvent(
  action: "ip.mismatch" | "ip.rejected",
  params: { deviceId?: string; ip?: string; detail?: string },
): void {
  writeAuditEntry({ ts: Date.now(), action, ...params });
}
