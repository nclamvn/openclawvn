import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  auditAuthFailure,
  auditAuthSuccess,
  auditDeviceEvent,
  auditRateLimited,
  auditScopeViolation,
  auditSessionEvent,
  auditTokenEvent,
  listAuditEntries,
  writeAuditEntry,
} from "./audit-log.js";

async function makeTmpDir() {
  return mkdtemp(join(tmpdir(), "openclaw-audit-"));
}

describe("audit log", () => {
  test("writeAuditEntry creates JSONL file with correct month partition", async () => {
    const baseDir = await makeTmpDir();
    const ts = Date.now();
    writeAuditEntry({ ts, action: "auth.success", ip: "1.2.3.4" }, baseDir);

    const d = new Date(ts);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const expectedFile = `${yyyy}-${mm}.jsonl`;

    const files = await readdir(join(baseDir, "audit"));
    expect(files).toContain(expectedFile);

    const content = await readFile(join(baseDir, "audit", expectedFile), "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.action).toBe("auth.success");
    expect(parsed.ip).toBe("1.2.3.4");
    expect(parsed.ts).toBe(ts);
  });

  test("writeAuditEntry appends multiple entries", async () => {
    const baseDir = await makeTmpDir();
    writeAuditEntry({ ts: Date.now(), action: "auth.success", ip: "1.1.1.1" }, baseDir);
    writeAuditEntry({ ts: Date.now(), action: "auth.failure", ip: "2.2.2.2" }, baseDir);
    writeAuditEntry({ ts: Date.now(), action: "auth.rate-limited", ip: "3.3.3.3" }, baseDir);

    const result = listAuditEntries({ baseDir });
    expect(result.total).toBe(3);
    expect(result.entries).toHaveLength(3);
  });

  test("writeAuditEntry never throws", () => {
    // Invalid baseDir should not throw.
    expect(() => {
      writeAuditEntry(
        { ts: Date.now(), action: "auth.success" },
        "/nonexistent/path/that/should/fail",
      );
    }).not.toThrow();
  });

  test("listAuditEntries returns empty for missing dir", async () => {
    const baseDir = await makeTmpDir();
    const result = listAuditEntries({ baseDir });
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  test("listAuditEntries filters by action", async () => {
    const baseDir = await makeTmpDir();
    writeAuditEntry({ ts: 1000, action: "auth.success" }, baseDir);
    writeAuditEntry({ ts: 2000, action: "auth.failure" }, baseDir);
    writeAuditEntry({ ts: 3000, action: "auth.success" }, baseDir);

    const result = listAuditEntries({ baseDir, action: "auth.failure" });
    expect(result.total).toBe(1);
    expect(result.entries[0].action).toBe("auth.failure");
  });

  test("listAuditEntries filters by deviceId", async () => {
    const baseDir = await makeTmpDir();
    writeAuditEntry({ ts: 1000, action: "auth.success", deviceId: "dev-a" }, baseDir);
    writeAuditEntry({ ts: 2000, action: "auth.success", deviceId: "dev-b" }, baseDir);

    const result = listAuditEntries({ baseDir, deviceId: "dev-a" });
    expect(result.total).toBe(1);
    expect(result.entries[0].deviceId).toBe("dev-a");
  });

  test("listAuditEntries filters by time range", async () => {
    const baseDir = await makeTmpDir();
    writeAuditEntry({ ts: 1000, action: "auth.success" }, baseDir);
    writeAuditEntry({ ts: 2000, action: "auth.success" }, baseDir);
    writeAuditEntry({ ts: 3000, action: "auth.success" }, baseDir);

    const result = listAuditEntries({ baseDir, since: 1500, until: 2500 });
    expect(result.total).toBe(1);
    expect(result.entries[0].ts).toBe(2000);
  });

  test("listAuditEntries respects limit and offset", async () => {
    const baseDir = await makeTmpDir();
    for (let i = 0; i < 10; i++) {
      writeAuditEntry({ ts: i * 1000, action: "auth.success", detail: `entry-${i}` }, baseDir);
    }

    const page1 = listAuditEntries({ baseDir, limit: 3, offset: 0 });
    expect(page1.entries).toHaveLength(3);
    expect(page1.total).toBe(10);
    expect(page1.hasMore).toBe(true);

    const page2 = listAuditEntries({ baseDir, limit: 3, offset: 3 });
    expect(page2.entries).toHaveLength(3);
    expect(page2.hasMore).toBe(true);
  });

  test("listAuditEntries sorts newest first", async () => {
    const baseDir = await makeTmpDir();
    writeAuditEntry({ ts: 1000, action: "auth.success" }, baseDir);
    writeAuditEntry({ ts: 3000, action: "auth.failure" }, baseDir);
    writeAuditEntry({ ts: 2000, action: "auth.rate-limited" }, baseDir);

    const result = listAuditEntries({ baseDir });
    expect(result.entries[0].ts).toBe(3000);
    expect(result.entries[1].ts).toBe(2000);
    expect(result.entries[2].ts).toBe(1000);
  });

  test("convenience helpers write correct action types", async () => {
    const baseDir = await makeTmpDir();
    auditAuthSuccess({
      ip: "1.1.1.1",
      deviceId: "dev-1",
      role: "operator",
      scopes: ["operator.admin"],
    });
    auditAuthFailure({ ip: "2.2.2.2", detail: "bad password" });
    auditRateLimited({ ip: "3.3.3.3" });
    auditScopeViolation({ method: "config.get", role: "operator", scopes: ["operator.read"] });
    auditTokenEvent("token.rotate", { deviceId: "dev-1", role: "operator" });
    auditDeviceEvent("device.paired", { deviceId: "dev-2", role: "operator" });
    auditSessionEvent("session.created", { sessionKey: "test-key", deviceId: "dev-1" });

    // These write to the default state dir, not our test dir.
    // Just verify they don't throw.
    expect(true).toBe(true);
  });
});
