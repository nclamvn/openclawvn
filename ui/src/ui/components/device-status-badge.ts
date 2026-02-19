import { html, type TemplateResult } from "lit";

import type { DeviceTokenSummary, PairedDevice, PendingDevice } from "../controllers/devices";
import { t } from "../i18n";

export type DeviceStatus = "active" | "expiring" | "expired" | "revoked" | "pending";

const EXPIRING_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function resolveDeviceStatus(
  device: PairedDevice | PendingDevice,
): DeviceStatus {
  if ("requestId" in device) return "pending";
  const tokens = Array.isArray(device.tokens) ? device.tokens : [];
  if (tokens.length === 0) return "active";
  const activeTokens = tokens.filter((tok) => !tok.revokedAtMs);
  if (activeTokens.length === 0) return "revoked";
  const now = Date.now();
  const hasExpired = activeTokens.some(
    (tok) => tok.expiresAtMs && tok.expiresAtMs < now,
  );
  if (hasExpired && activeTokens.every((tok) => tok.expiresAtMs && tok.expiresAtMs < now)) {
    return "expired";
  }
  const hasExpiring = activeTokens.some(
    (tok) =>
      tok.expiresAtMs &&
      tok.expiresAtMs > now &&
      tok.expiresAtMs - now < EXPIRING_THRESHOLD_MS,
  );
  if (hasExpiring) return "expiring";
  return "active";
}

const STATUS_CLASSES: Record<DeviceStatus, string> = {
  active: "device-status--active",
  expiring: "device-status--expiring",
  expired: "device-status--expired",
  revoked: "device-status--revoked",
  pending: "device-status--pending",
};

export function renderDeviceStatusBadge(status: DeviceStatus): TemplateResult {
  const labels = t().devices.status;
  const label = labels[status] ?? status;
  return html`
    <span class="device-status ${STATUS_CLASSES[status]}">
      <span class="device-status__dot"></span>
      <span class="device-status__label">${label}</span>
    </span>
  `;
}
