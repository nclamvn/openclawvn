// Device authentication payload builder
// Must match the format expected by Gateway's signature validation

import type { GatewayClientName, GatewayClientMode } from "./client-info.js";

export interface DeviceAuthPayloadInput {
  deviceId: string;
  clientId: GatewayClientName;
  clientMode?: GatewayClientMode;
  role?: string;
  scopes?: string[];
  signedAtMs?: number;
  token?: string | null;
  nonce?: string | null;
  version?: "v1" | "v2";
}

/**
 * Build device auth payload as a pipe-delimited string.
 * Format: version|deviceId|clientId|clientMode|role|scopes|signedAtMs|token[|nonce]
 * This MUST match the Gateway's expected format for signature validation.
 */
export function buildDeviceAuthPayload(input: DeviceAuthPayloadInput): string {
  const version = input.version ?? (input.nonce ? "v2" : "v1");
  const scopes = (input.scopes ?? []).join(",");
  const token = input.token ?? "";
  const signedAtMs = input.signedAtMs ?? Date.now();

  const base = [
    version,
    input.deviceId,
    input.clientId,
    input.clientMode ?? "",
    input.role ?? "",
    scopes,
    String(signedAtMs),
    token,
  ];

  if (version === "v2") {
    base.push(input.nonce ?? "");
  }

  return base.join("|");
}
