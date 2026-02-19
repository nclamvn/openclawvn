import { html, nothing, type TemplateResult } from "lit";

import type { GatewayBrowserClient } from "../gateway";
import { formatAgo } from "../format";
import { t } from "../i18n";

export type AuditEntry = {
  ts: number;
  action: string;
  deviceId?: string;
  ip?: string;
  role?: string;
  method?: string;
  detail?: string;
};

export type AuditTimelineProps = {
  deviceId: string;
  entries: AuditEntry[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export type AuditTimelineState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  auditEntries: AuditEntry[];
  auditLoading: boolean;
  auditHasMore: boolean;
  auditOffset: number;
};

const AUDIT_LIMIT = 10;

export async function loadAuditTimeline(
  state: AuditTimelineState,
  deviceId: string,
  opts?: { append?: boolean },
) {
  if (!state.client || !state.connected) return;
  if (state.auditLoading) return;
  state.auditLoading = true;
  try {
    const offset = opts?.append ? state.auditOffset : 0;
    const res = (await state.client.request("audit.list", {
      deviceId,
      limit: AUDIT_LIMIT,
      offset,
    })) as { entries?: AuditEntry[]; total?: number; hasMore?: boolean } | null;
    const entries = Array.isArray(res?.entries) ? res!.entries : [];
    if (opts?.append) {
      state.auditEntries = [...state.auditEntries, ...entries];
    } else {
      state.auditEntries = entries;
    }
    state.auditOffset = (opts?.append ? state.auditOffset : 0) + entries.length;
    state.auditHasMore = res?.hasMore === true;
  } catch {
    // Silently fail — timeline is supplementary
  } finally {
    state.auditLoading = false;
  }
}

const EVENT_ICONS: Record<string, string> = {
  "auth.success": "\u{1F7E2}",
  "auth.failure": "\u{26A0}\uFE0F",
  "auth.rate-limited": "\u{1F6AB}",
  "device.paired": "\u{1F389}",
  "device.rejected": "\u{274C}",
  "token.rotate": "\u{1F504}",
  "token.revoke": "\u{1F512}",
  "token.renew": "\u{1F511}",
  "token.expired": "\u{23F0}",
  "cors.rejected": "\u{1F6AB}",
  "ip.mismatch": "\u{1F310}",
  "ip.rejected": "\u{1F6D1}",
  "scope.violation": "\u{26D4}",
};

function eventIcon(action: string): string {
  return EVENT_ICONS[action] ?? "\u{2022}";
}

function eventLabel(action: string): string {
  const events = t().devices.events;
  const key = action.replace(/\./g, "_") as keyof typeof events;
  return (events[key] as string) ?? action;
}

export function renderAuditTimeline(props: AuditTimelineProps): TemplateResult {
  const { entries, loading, hasMore } = props;

  return html`
    <div class="audit-timeline">
      <div class="muted" style="margin-bottom: 8px; font-weight: 500;">
        ${t().devices.activity}
      </div>
      ${
        entries.length === 0 && !loading
          ? html`<div class="muted">${t().devices.noActivity}</div>`
          : nothing
      }
      ${entries.map(
        (entry) => html`
          <div class="audit-timeline__entry">
            <span class="audit-timeline__icon">${eventIcon(entry.action)}</span>
            <span class="audit-timeline__label">${eventLabel(entry.action)}</span>
            <span class="audit-timeline__time muted">${formatAgo(entry.ts)}</span>
          </div>
        `,
      )}
      ${
        loading
          ? html`<div class="muted">${t().common.loading}</div>`
          : hasMore
            ? html`
              <button
                class="btn btn--sm"
                style="margin-top: 6px;"
                @click=${props.onLoadMore}
              >
                ${t().devices.viewMore}
              </button>
            `
            : nothing
      }
    </div>
  `;
}
