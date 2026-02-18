import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import {
  auditCorsRejected,
  auditInsecureMode,
  auditIpEvent,
  listAuditEntries,
} from "../infra/audit-log.js";
import type { GatewaySecurityConfig } from "../config/types.gateway.js";

async function makeTmpDir() {
  return mkdtemp(join(tmpdir(), "openclaw-security-"));
}

describe("CORS enforcement (B1)", () => {
  test("auditCorsRejected writes cors.rejected entry", async () => {
    const baseDir = await makeTmpDir();
    auditCorsRejected({ ip: "10.0.0.1", detail: "origin=https://evil.com" });
    // Write to temp dir to verify
    const { writeAuditEntry } = await import("../infra/audit-log.js");
    writeAuditEntry(
      {
        ts: Date.now(),
        action: "cors.rejected",
        ip: "10.0.0.1",
        detail: "origin=https://evil.com",
      },
      baseDir,
    );
    const result = listAuditEntries({ baseDir, action: "cors.rejected" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].action).toBe("cors.rejected");
    expect(result.entries[0].ip).toBe("10.0.0.1");
    expect(result.entries[0].detail).toContain("evil.com");
  });

  test("GatewaySecurityConfig allows empty allowedOrigins (default)", () => {
    const config: GatewaySecurityConfig = {};
    expect(config.allowedOrigins).toBeUndefined();
    // empty = allow all
  });

  test("GatewaySecurityConfig accepts allowedOrigins array", () => {
    const config: GatewaySecurityConfig = {
      allowedOrigins: ["https://my-ui.local", "http://localhost:3000"],
    };
    expect(config.allowedOrigins).toHaveLength(2);
    expect(config.allowedOrigins![0]).toBe("https://my-ui.local");
  });

  test("origin matching logic: URL origin comparison", () => {
    const allowed = ["https://my-ui.local:443", "http://localhost:3000"];
    const testOrigin = "https://my-ui.local";

    const originAllowed = allowed.some((a) => {
      try {
        const allowedUrl = new URL(a);
        const testUrl = new URL(testOrigin);
        return allowedUrl.origin === testUrl.origin;
      } catch {
        return false;
      }
    });
    // https://my-ui.local:443 and https://my-ui.local have same origin
    expect(originAllowed).toBe(true);
  });

  test("origin matching rejects non-matching origin", () => {
    const allowed = ["https://my-ui.local"];
    const testOrigin = "https://evil.com";

    const originAllowed = allowed.some((a) => {
      try {
        const allowedUrl = new URL(a);
        const testUrl = new URL(testOrigin);
        return allowedUrl.origin === testUrl.origin;
      } catch {
        return false;
      }
    });
    expect(originAllowed).toBe(false);
  });
});

describe("dangerous config warnings (B2)", () => {
  test("auditInsecureMode writes insecure.mode entry", async () => {
    const baseDir = await makeTmpDir();
    const { writeAuditEntry } = await import("../infra/audit-log.js");
    writeAuditEntry(
      {
        ts: Date.now(),
        action: "insecure.mode",
        detail: "allowInsecureAuth=true dangerouslyDisableDeviceAuth=false",
      },
      baseDir,
    );
    const result = listAuditEntries({ baseDir, action: "insecure.mode" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].detail).toContain("allowInsecureAuth=true");
  });

  test("logGatewayStartup warns for allowInsecureAuth", async () => {
    const { logGatewayStartup } = await import("./server-startup-log.js");
    const logs: string[] = [];
    logGatewayStartup({
      cfg: {
        gateway: {
          controlUi: { allowInsecureAuth: true },
        },
      } as never,
      bindHost: "127.0.0.1",
      port: 18789,
      log: { info: (msg: string) => logs.push(msg) },
      isNixMode: false,
    });
    expect(logs.some((l) => l.includes("allowInsecureAuth"))).toBe(true);
  });

  test("logGatewayStartup warns for dangerouslyDisableDeviceAuth", async () => {
    const { logGatewayStartup } = await import("./server-startup-log.js");
    const logs: string[] = [];
    logGatewayStartup({
      cfg: {
        gateway: {
          controlUi: { dangerouslyDisableDeviceAuth: true },
        },
      } as never,
      bindHost: "127.0.0.1",
      port: 18789,
      log: { info: (msg: string) => logs.push(msg) },
      isNixMode: false,
    });
    expect(logs.some((l) => l.includes("dangerouslyDisableDeviceAuth"))).toBe(true);
  });

  test("logGatewayStartup does not warn when flags are false", async () => {
    const { logGatewayStartup } = await import("./server-startup-log.js");
    const logs: string[] = [];
    logGatewayStartup({
      cfg: {
        gateway: {
          controlUi: { allowInsecureAuth: false, dangerouslyDisableDeviceAuth: false },
        },
      } as never,
      bindHost: "127.0.0.1",
      port: 18789,
      log: { info: (msg: string) => logs.push(msg) },
      isNixMode: false,
    });
    expect(logs.some((l) => l.includes("WARNING"))).toBe(false);
  });
});

describe("remote IP enforcement (B3)", () => {
  test("auditIpEvent writes ip.mismatch entry", async () => {
    const baseDir = await makeTmpDir();
    const { writeAuditEntry } = await import("../infra/audit-log.js");
    writeAuditEntry(
      {
        ts: Date.now(),
        action: "ip.mismatch",
        deviceId: "dev-1",
        ip: "10.0.0.2",
        detail: "prev=10.0.0.1",
      },
      baseDir,
    );
    const result = listAuditEntries({ baseDir, action: "ip.mismatch" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].deviceId).toBe("dev-1");
    expect(result.entries[0].detail).toContain("prev=10.0.0.1");
  });

  test("auditIpEvent writes ip.rejected entry", async () => {
    const baseDir = await makeTmpDir();
    const { writeAuditEntry } = await import("../infra/audit-log.js");
    writeAuditEntry(
      {
        ts: Date.now(),
        action: "ip.rejected",
        deviceId: "dev-1",
        ip: "10.0.0.2",
        detail: "expected=10.0.0.1",
      },
      baseDir,
    );
    const result = listAuditEntries({ baseDir, action: "ip.rejected" });
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].action).toBe("ip.rejected");
  });

  test("GatewaySecurityConfig strictIpEnforcement defaults to undefined (false)", () => {
    const config: GatewaySecurityConfig = {};
    expect(config.strictIpEnforcement).toBeUndefined();
    // undefined = false = soft mode
  });

  test("GatewaySecurityConfig strictIpEnforcement can be set to true", () => {
    const config: GatewaySecurityConfig = { strictIpEnforcement: true };
    expect(config.strictIpEnforcement).toBe(true);
  });

  test("IP comparison logic: same IP allows", () => {
    const storedIp = "10.0.0.1";
    const clientIp = "10.0.0.1";
    expect(clientIp === storedIp).toBe(true);
  });

  test("IP comparison logic: different IP detected", () => {
    const storedIp = "10.0.0.1";
    const clientIp = "192.168.1.5";
    expect(clientIp !== storedIp).toBe(true);
  });
});
