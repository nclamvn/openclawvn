import { render } from "lit";
import { describe, expect, it } from "vitest";

import type { PairedDevice, PendingDevice } from "../controllers/devices";
import {
  renderDeviceStatusBadge,
  resolveDeviceStatus,
  type DeviceStatus,
} from "./device-status-badge";

function createPaired(overrides: Partial<PairedDevice> = {}): PairedDevice {
  return {
    deviceId: "dev-1",
    displayName: "Test Device",
    roles: ["operator"],
    scopes: ["operator.admin"],
    tokens: [
      {
        role: "operator",
        scopes: ["operator.admin"],
        createdAtMs: Date.now() - 86_400_000,
      },
    ],
    createdAtMs: Date.now() - 86_400_000 * 7,
    approvedAtMs: Date.now() - 86_400_000 * 7,
    ...overrides,
  };
}

function createPending(overrides: Partial<PendingDevice> = {}): PendingDevice {
  return {
    requestId: "req-1",
    deviceId: "dev-2",
    displayName: "Pending Device",
    ts: Date.now(),
    ...overrides,
  };
}

describe("device-status-badge", () => {
  describe("resolveDeviceStatus", () => {
    it("returns 'pending' for pending devices", () => {
      expect(resolveDeviceStatus(createPending())).toBe("pending");
    });

    it("returns 'active' for paired device with valid tokens", () => {
      expect(resolveDeviceStatus(createPaired())).toBe("active");
    });

    it("returns 'active' for paired device with no tokens", () => {
      expect(resolveDeviceStatus(createPaired({ tokens: [] }))).toBe("active");
    });

    it("returns 'revoked' when all tokens are revoked", () => {
      const status = resolveDeviceStatus(
        createPaired({
          tokens: [
            {
              role: "operator",
              revokedAtMs: Date.now() - 1000,
              createdAtMs: Date.now() - 86_400_000,
            },
          ],
        }),
      );
      expect(status).toBe("revoked");
    });

    it("returns 'expired' when all active tokens are expired", () => {
      const status = resolveDeviceStatus(
        createPaired({
          tokens: [
            {
              role: "operator",
              createdAtMs: Date.now() - 86_400_000 * 60,
              expiresAtMs: Date.now() - 86_400_000,
            },
          ],
        }),
      );
      expect(status).toBe("expired");
    });

    it("returns 'expiring' when token expires within 7 days", () => {
      const status = resolveDeviceStatus(
        createPaired({
          tokens: [
            {
              role: "operator",
              createdAtMs: Date.now() - 86_400_000 * 25,
              expiresAtMs: Date.now() + 86_400_000 * 3, // 3 days from now
            },
          ],
        }),
      );
      expect(status).toBe("expiring");
    });

    it("returns 'active' when token expires after 7 days", () => {
      const status = resolveDeviceStatus(
        createPaired({
          tokens: [
            {
              role: "operator",
              createdAtMs: Date.now() - 86_400_000,
              expiresAtMs: Date.now() + 86_400_000 * 20, // 20 days from now
            },
          ],
        }),
      );
      expect(status).toBe("active");
    });
  });

  describe("renderDeviceStatusBadge", () => {
    function renderBadge(status: DeviceStatus): HTMLDivElement {
      const container = document.createElement("div");
      render(renderDeviceStatusBadge(status), container);
      return container;
    }

    it("renders active status", () => {
      const el = renderBadge("active");
      expect(el.querySelector(".device-status--active")).not.toBeNull();
      expect(el.querySelector(".device-status__dot")).not.toBeNull();
      expect(el.querySelector(".device-status__label")).not.toBeNull();
    });

    it("renders expiring status", () => {
      const el = renderBadge("expiring");
      expect(el.querySelector(".device-status--expiring")).not.toBeNull();
    });

    it("renders expired status", () => {
      const el = renderBadge("expired");
      expect(el.querySelector(".device-status--expired")).not.toBeNull();
    });

    it("renders revoked status", () => {
      const el = renderBadge("revoked");
      expect(el.querySelector(".device-status--revoked")).not.toBeNull();
    });

    it("renders pending status", () => {
      const el = renderBadge("pending");
      expect(el.querySelector(".device-status--pending")).not.toBeNull();
    });
  });
});
