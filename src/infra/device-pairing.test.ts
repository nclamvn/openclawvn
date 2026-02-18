import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  approveDevicePairing,
  getPairedDevice,
  renewDeviceToken,
  requestDevicePairing,
  rotateDeviceToken,
  verifyDeviceToken,
} from "./device-pairing.js";

describe("device pairing tokens", () => {
  test("preserves existing token scopes when rotating without scopes", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-device-pairing-"));
    const request = await requestDevicePairing(
      {
        deviceId: "device-1",
        publicKey: "public-key-1",
        role: "operator",
        scopes: ["operator.admin"],
      },
      baseDir,
    );
    await approveDevicePairing(request.request.requestId, baseDir);

    await rotateDeviceToken({
      deviceId: "device-1",
      role: "operator",
      scopes: ["operator.read"],
      baseDir,
    });
    let paired = await getPairedDevice("device-1", baseDir);
    expect(paired?.tokens?.operator?.scopes).toEqual(["operator.read"]);
    expect(paired?.scopes).toEqual(["operator.read"]);

    await rotateDeviceToken({
      deviceId: "device-1",
      role: "operator",
      baseDir,
    });
    paired = await getPairedDevice("device-1", baseDir);
    expect(paired?.tokens?.operator?.scopes).toEqual(["operator.read"]);
  });
});

describe("device token lifecycle", () => {
  async function setupPairedDevice(baseDir: string) {
    const req = await requestDevicePairing(
      {
        deviceId: "dev-ttl",
        publicKey: "pubkey-ttl",
        role: "operator",
        scopes: ["operator.admin"],
      },
      baseDir,
    );
    await approveDevicePairing(req.request.requestId, baseDir);
    return getPairedDevice("dev-ttl", baseDir);
  }

  test("new token gets expiresAtMs (default 30 days)", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-token-ttl-"));
    const paired = await setupPairedDevice(baseDir);
    const token = paired?.tokens?.operator;
    expect(token).toBeDefined();
    expect(token?.expiresAtMs).toBeTypeOf("number");
    // Should be ~30 days from now.
    const thirtyDays = 30 * 86_400_000;
    const diff = (token?.expiresAtMs ?? 0) - Date.now();
    expect(diff).toBeGreaterThan(thirtyDays - 60_000);
    expect(diff).toBeLessThan(thirtyDays + 60_000);
  });

  test("token expiry check: valid token passes", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-token-ttl-"));
    const paired = await setupPairedDevice(baseDir);
    const token = paired?.tokens?.operator?.token ?? "";
    const result = await verifyDeviceToken({
      deviceId: "dev-ttl",
      token,
      role: "operator",
      scopes: ["operator.admin"],
      baseDir,
    });
    expect(result.ok).toBe(true);
  });

  test("token expiry check: expired token rejected", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-token-ttl-"));
    const paired = await setupPairedDevice(baseDir);
    // Manually expire the token.
    const device = paired!;
    device.tokens!.operator.expiresAtMs = Date.now() - 1000;
    // Write directly using internal helpers is not easy, so use renewDeviceToken
    // to set TTL to 0 (which sets null = never expires), then re-set.
    // Instead, let's just verify via the verify function by setting expiresAtMs in the past.
    // We'll use the fs approach:
    const pairedPath = join(baseDir, "devices", "paired.json");
    const raw = await import("node:fs/promises").then((m) => m.readFile(pairedPath, "utf8"));
    const data = JSON.parse(raw) as Record<string, unknown>;
    const dev = data["dev-ttl"] as Record<string, unknown>;
    const tokens = dev.tokens as Record<string, Record<string, unknown>>;
    tokens.operator.expiresAtMs = Date.now() - 1000;
    await import("node:fs/promises").then((m) =>
      m.writeFile(pairedPath, JSON.stringify(data, null, 2)),
    );

    const result = await verifyDeviceToken({
      deviceId: "dev-ttl",
      token: paired?.tokens?.operator?.token ?? "",
      role: "operator",
      scopes: ["operator.admin"],
      baseDir,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("token-expired");
  });

  test("existing devices without expiresAtMs treated as never expires", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-token-ttl-"));
    const paired = await setupPairedDevice(baseDir);
    // Remove expiresAtMs to simulate legacy device.
    const pairedPath = join(baseDir, "devices", "paired.json");
    const raw = await import("node:fs/promises").then((m) => m.readFile(pairedPath, "utf8"));
    const data = JSON.parse(raw) as Record<string, unknown>;
    const dev = data["dev-ttl"] as Record<string, unknown>;
    const tokens = dev.tokens as Record<string, Record<string, unknown>>;
    delete tokens.operator.expiresAtMs;
    await import("node:fs/promises").then((m) =>
      m.writeFile(pairedPath, JSON.stringify(data, null, 2)),
    );

    const result = await verifyDeviceToken({
      deviceId: "dev-ttl",
      token: paired?.tokens?.operator?.token ?? "",
      role: "operator",
      scopes: ["operator.admin"],
      baseDir,
    });
    expect(result.ok).toBe(true);
  });

  test("renewToken extends expiry without rotating token value", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-token-ttl-"));
    const paired = await setupPairedDevice(baseDir);
    const originalToken = paired?.tokens?.operator?.token;
    const originalExpiry = paired?.tokens?.operator?.expiresAtMs;

    const renewed = await renewDeviceToken({
      deviceId: "dev-ttl",
      role: "operator",
      ttlDays: 90,
      baseDir,
    });
    expect(renewed).not.toBe(null);
    expect(renewed?.token).toBe(originalToken); // Same token value.
    expect(renewed?.expiresAtMs).toBeGreaterThan(originalExpiry ?? 0);
  });

  test("rotateToken gets fresh expiry", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "openclaw-token-ttl-"));
    await setupPairedDevice(baseDir);

    const rotated = await rotateDeviceToken({
      deviceId: "dev-ttl",
      role: "operator",
      baseDir,
    });
    expect(rotated?.expiresAtMs).toBeTypeOf("number");
    expect(rotated?.rotatedAtMs).toBeTypeOf("number");
  });
});
