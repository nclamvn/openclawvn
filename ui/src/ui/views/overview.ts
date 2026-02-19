import { html } from "lit";

import type { GatewayHelloOk } from "../gateway";
import { formatAgo, formatDurationMs } from "../format";
import { formatNextRun } from "../presenter";
import type { UiSettings } from "../storage";
import { t } from "../i18n";

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  password: string;
  lastError: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
};

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | { uptimeMs?: number; policy?: { tickIntervalMs?: number } }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationMs(snapshot.uptimeMs) : "n/a";
  const tick = snapshot?.policy?.tickIntervalMs ? `${snapshot.policy.tickIntervalMs}ms` : "n/a";
  const authHint = (() => {
    if (props.connected || !props.lastError) return null;
    const lower = props.lastError.toLowerCase();
    const authFailed = lower.includes("unauthorized") || lower.includes("connect failed");
    if (!authFailed) return null;
    const hasToken = Boolean(props.settings.token.trim());
    const hasPassword = Boolean(props.password.trim());
    if (!hasToken && !hasPassword) {
      return html`
        <div class="muted" style="margin-top: 8px">
          ${t().overview.gatewayAccess.authRequired}
          <div style="margin-top: 6px">
            <span class="mono">openclaw dashboard --no-open</span> → URL with token<br />
            <span class="mono">openclaw doctor --generate-gateway-token</span> → set token
          </div>
          <div style="margin-top: 6px">
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target="_blank"
              rel="noreferrer"
              >Docs: Control UI Auth</a
            >
          </div>
        </div>
      `;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t().overview.gatewayAccess.authFailed}
        <span class="mono">openclaw dashboard --no-open</span>${t().overview.gatewayAccess.orUpdateToken}
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/dashboard"
            target="_blank"
            rel="noreferrer"
            >Docs: Control UI Auth</a
          >
        </div>
      </div>
    `;
  })();
  const insecureContextHint = (() => {
    if (props.connected || !props.lastError) return null;
    const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
    if (isSecureContext !== false) return null;
    const lower = props.lastError.toLowerCase();
    if (!lower.includes("secure context") && !lower.includes("device identity required")) {
      return null;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t().overview.gatewayAccess.httpWarning}
        <span class="mono">http://127.0.0.1:18789</span> ${t().overview.gatewayAccess.onGatewayHost}
        <div style="margin-top: 6px">
          ${t().overview.gatewayAccess.httpFallback}
          <span class="mono">gateway.controlUi.allowInsecureAuth: true</span> ${t().overview.gatewayAccess.tokenOnly}
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/gateway/tailscale"
            target="_blank"
            rel="noreferrer"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#insecure-http"
            target="_blank"
            rel="noreferrer"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `;
  })();

  const insecureMode = props.hello?.insecureMode;
  const showInsecureBanner =
    props.connected &&
    insecureMode &&
    (insecureMode.allowInsecureAuth || insecureMode.disableDeviceAuth);

  return html`
    ${
      showInsecureBanner
        ? html`
          <div class="callout danger" style="margin-bottom: 16px;">
            <strong>${t().overview.gatewayAccess.insecureBanner}</strong>
            <div class="muted" style="margin-top: 4px;">${t().overview.gatewayAccess.insecureDetail}</div>
          </div>
        `
        : ""
    }
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">${t().overview.gatewayAccess.title}</div>
        <div class="card-sub">${t().overview.gatewayAccess.description}</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>${t().overview.gatewayAccess.websocketUrl}</span>
            <input
              .value=${props.settings.gatewayUrl}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onSettingsChange({ ...props.settings, gatewayUrl: v });
              }}
              placeholder="ws://100.x.y.z:18789"
            />
          </label>
          <label class="field">
            <span>${t().overview.gatewayAccess.gatewayToken}</span>
            <input
              .value=${props.settings.token}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onSettingsChange({ ...props.settings, token: v });
              }}
              placeholder="OPENCLAW_GATEWAY_TOKEN"
            />
          </label>
          <label class="field">
            <span>${t().overview.gatewayAccess.password}</span>
            <input
              type="password"
              .value=${props.password}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onPasswordChange(v);
              }}
              placeholder="${t().overview.gatewayAccess.passwordPlaceholder}"
            />
          </label>
          <label class="field">
            <span>${t().overview.gatewayAccess.defaultSessionKey}</span>
            <input
              .value=${props.settings.sessionKey}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onSessionKeyChange(v);
              }}
            />
          </label>
        </div>
        <div class="row" style="margin-top: 14px;">
          <button class="btn" @click=${() => props.onConnect()}>${t().common.connect}</button>
          <button class="btn" @click=${() => props.onRefresh()}>${t().common.refresh}</button>
          <span class="muted">${t().overview.gatewayAccess.clickConnect}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${t().overview.snapshot.title}</div>
        <div class="card-sub">${t().overview.snapshot.description}</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">${t().common.status}</div>
            <div class="stat-value ${props.connected ? "ok" : "warn"}">
              ${props.connected ? t().common.connected : t().common.disconnected}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">${t().overview.snapshot.uptime}</div>
            <div class="stat-value">${uptime}</div>
          </div>
          <div class="stat">
            <div class="stat-label">${t().overview.snapshot.tickInterval}</div>
            <div class="stat-value">${tick}</div>
          </div>
          <div class="stat">
            <div class="stat-label">${t().overview.snapshot.lastChannelsRefresh}</div>
            <div class="stat-value">
              ${props.lastChannelsRefresh ? formatAgo(props.lastChannelsRefresh) : "N/A"}
            </div>
          </div>
        </div>
        ${
          props.lastError
            ? html`<div class="callout danger" style="margin-top: 14px;">
              <div>${props.lastError}</div>
              ${authHint ?? ""}
              ${insecureContextHint ?? ""}
            </div>`
            : html`
                <div class="callout" style="margin-top: 14px">
                  ${t().overview.snapshot.useChannels}
                </div>
              `
        }
      </div>
    </section>

    <section class="grid grid-cols-3" style="margin-top: 18px;">
      <div class="card stat-card">
        <div class="stat-label">${t().overview.stats.instances}</div>
        <div class="stat-value">${props.presenceCount}</div>
        <div class="muted">${t().overview.stats.instancesDesc}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">${t().overview.stats.sessions}</div>
        <div class="stat-value">${props.sessionsCount ?? "n/a"}</div>
        <div class="muted">${t().overview.stats.sessionsDesc}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">${t().overview.stats.cron}</div>
        <div class="stat-value">
          ${props.cronEnabled == null ? "n/a" : props.cronEnabled ? t().common.enabled : t().common.disabled}
        </div>
        <div class="muted">${t().overview.stats.nextWake} ${formatNextRun(props.cronNext)}</div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">${t().overview.notes.title}</div>
      <div class="card-sub">${t().overview.notes.description}</div>
      <div class="note-grid" style="margin-top: 14px;">
        <div>
          <div class="note-title">${t().overview.notes.tailscale}</div>
          <div class="muted">
            ${t().overview.notes.tailscaleDesc}
          </div>
        </div>
        <div>
          <div class="note-title">${t().overview.notes.sessionHygiene}</div>
          <div class="muted">${t().overview.notes.sessionHygieneDesc}</div>
        </div>
        <div>
          <div class="note-title">${t().overview.notes.cronReminders}</div>
          <div class="muted">${t().overview.notes.cronRemindersDesc}</div>
        </div>
      </div>
    </section>
  `;
}
