import { auditDeviceEvent, auditTokenEvent } from "../../infra/audit-log.js";
import {
  approveDevicePairing,
  listDevicePairing,
  type DeviceAuthToken,
  rejectDevicePairing,
  renewDeviceToken,
  revokeDeviceToken,
  rotateDeviceToken,
  summarizeDeviceTokens,
} from "../../infra/device-pairing.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateDevicePairApproveParams,
  validateDevicePairListParams,
  validateDevicePairRejectParams,
  validateDeviceTokenRevokeParams,
  validateDeviceTokenRotateParams,
} from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

function redactPairedDevice(
  device: { tokens?: Record<string, DeviceAuthToken> } & Record<string, unknown>,
) {
  const { tokens, ...rest } = device;
  return {
    ...rest,
    tokens: summarizeDeviceTokens(tokens),
  };
}

export const deviceHandlers: GatewayRequestHandlers = {
  "device.pair.list": async ({ params, respond }) => {
    if (!validateDevicePairListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid device.pair.list params: ${formatValidationErrors(
            validateDevicePairListParams.errors,
          )}`,
        ),
      );
      return;
    }
    const list = await listDevicePairing();
    respond(
      true,
      {
        pending: list.pending,
        paired: list.paired.map((device) => redactPairedDevice(device)),
      },
      undefined,
    );
  },
  "device.pair.approve": async ({ params, respond, context }) => {
    if (!validateDevicePairApproveParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid device.pair.approve params: ${formatValidationErrors(
            validateDevicePairApproveParams.errors,
          )}`,
        ),
      );
      return;
    }
    const { requestId } = params as { requestId: string };
    const approved = await approveDevicePairing(requestId);
    if (!approved) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
      return;
    }
    context.logGateway.info(
      `device pairing approved device=${approved.device.deviceId} role=${approved.device.role ?? "unknown"}`,
    );
    context.broadcast(
      "device.pair.resolved",
      {
        requestId,
        deviceId: approved.device.deviceId,
        decision: "approved",
        ts: Date.now(),
      },
      { dropIfSlow: true },
    );
    auditDeviceEvent("device.paired", {
      deviceId: approved.device.deviceId,
      role: approved.device.role ?? "unknown",
    });
    respond(true, { requestId, device: redactPairedDevice(approved.device) }, undefined);
  },
  "device.pair.reject": async ({ params, respond, context }) => {
    if (!validateDevicePairRejectParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid device.pair.reject params: ${formatValidationErrors(
            validateDevicePairRejectParams.errors,
          )}`,
        ),
      );
      return;
    }
    const { requestId } = params as { requestId: string };
    const rejected = await rejectDevicePairing(requestId);
    if (!rejected) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
      return;
    }
    context.broadcast(
      "device.pair.resolved",
      {
        requestId,
        deviceId: rejected.deviceId,
        decision: "rejected",
        ts: Date.now(),
      },
      { dropIfSlow: true },
    );
    auditDeviceEvent("device.rejected", { deviceId: rejected.deviceId });
    respond(true, rejected, undefined);
  },
  "device.token.rotate": async ({ params, respond, context }) => {
    if (!validateDeviceTokenRotateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid device.token.rotate params: ${formatValidationErrors(
            validateDeviceTokenRotateParams.errors,
          )}`,
        ),
      );
      return;
    }
    const { deviceId, role, scopes } = params as {
      deviceId: string;
      role: string;
      scopes?: string[];
    };
    const entry = await rotateDeviceToken({ deviceId, role, scopes });
    if (!entry) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown deviceId/role"));
      return;
    }
    context.logGateway.info(
      `device token rotated device=${deviceId} role=${entry.role} scopes=${entry.scopes.join(",")}`,
    );
    auditTokenEvent("token.rotate", { deviceId, role: entry.role });
    respond(
      true,
      {
        deviceId,
        role: entry.role,
        token: entry.token,
        scopes: entry.scopes,
        rotatedAtMs: entry.rotatedAtMs ?? entry.createdAtMs,
      },
      undefined,
    );
  },
  "device.token.revoke": async ({ params, respond, context }) => {
    if (!validateDeviceTokenRevokeParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid device.token.revoke params: ${formatValidationErrors(
            validateDeviceTokenRevokeParams.errors,
          )}`,
        ),
      );
      return;
    }
    const { deviceId, role } = params as { deviceId: string; role: string };
    const entry = await revokeDeviceToken({ deviceId, role });
    if (!entry) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown deviceId/role"));
      return;
    }
    context.logGateway.info(`device token revoked device=${deviceId} role=${entry.role}`);
    auditTokenEvent("token.revoke", { deviceId, role: entry.role });
    respond(
      true,
      { deviceId, role: entry.role, revokedAtMs: entry.revokedAtMs ?? Date.now() },
      undefined,
    );
  },
  "device.token.renew": async ({ params, respond, context }) => {
    const deviceId = typeof params.deviceId === "string" ? params.deviceId.trim() : "";
    const role = typeof params.role === "string" ? params.role.trim() : "";
    if (!deviceId || !role) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "deviceId and role required"),
      );
      return;
    }
    const ttlDays = typeof params.ttlDays === "number" ? params.ttlDays : undefined;
    const entry = await renewDeviceToken({ deviceId, role, ttlDays });
    if (!entry) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "unknown deviceId/role or token revoked"),
      );
      return;
    }
    context.logGateway.info(
      `device token renewed device=${deviceId} role=${entry.role} expiresAtMs=${entry.expiresAtMs ?? "never"}`,
    );
    auditTokenEvent("token.renew", { deviceId, role: entry.role });
    respond(
      true,
      {
        deviceId,
        role: entry.role,
        expiresAtMs: entry.expiresAtMs,
      },
      undefined,
    );
  },
};
