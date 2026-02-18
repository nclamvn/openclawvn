import { listAuditEntries, type AuditAction } from "../../infra/audit-log.js";
import type { GatewayRequestHandlers } from "./types.js";

export const auditHandlers: GatewayRequestHandlers = {
  "audit.list": async ({ params, respond }) => {
    const limit = typeof params.limit === "number" ? Math.min(params.limit, 500) : 100;
    const offset = typeof params.offset === "number" ? Math.max(params.offset, 0) : 0;
    const action = typeof params.action === "string" ? (params.action as AuditAction) : undefined;
    const deviceId = typeof params.deviceId === "string" ? params.deviceId : undefined;
    const since = typeof params.since === "number" ? params.since : undefined;
    const until = typeof params.until === "number" ? params.until : undefined;

    const result = listAuditEntries({ limit, offset, action, deviceId, since, until });
    respond(true, result, undefined);
  },
};
