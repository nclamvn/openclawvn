import { html, nothing } from "lit";

import type {
  AlertLevel,
  EldercareCall,
  EldercareCheck,
  EldercareRoomData,
  EldercareDailySummary,
  EldercareSosEvent,
} from "../controllers/eldercare";
import { t } from "../i18n";

export type EldercareDashboardProps = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  haConnected: boolean;
  room: EldercareRoomData;
  summary: EldercareDailySummary;
  lastCheck: EldercareCheck | null;
  sosActive: boolean;
  onRefresh: () => void;
};

function levelClass(level: AlertLevel): string {
  switch (level) {
    case "emergency":
      return "ec-level--emergency";
    case "warning":
      return "ec-level--warning";
    case "attention":
      return "ec-level--attention";
    default:
      return "ec-level--normal";
  }
}

function levelLabel(level: AlertLevel): string {
  const labels = t().eldercare.levels;
  return labels[level] ?? level;
}

function formatTemp(val: number | null): string {
  return val != null ? `${val.toFixed(1)}°C` : "—";
}

function formatHumidity(val: number | null): string {
  return val != null ? `${val.toFixed(0)}%` : "—";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function renderEldercareDashboard(props: EldercareDashboardProps) {
  const tr = t().eldercare;

  return html`
    <div class="ec-dashboard">
      <!-- SOS Banner (if active) -->
      ${props.sosActive
        ? html`
            <div class="ec-sos-banner">
              <div class="ec-sos-banner__icon">🚨</div>
              <div class="ec-sos-banner__text">${tr.sosActive}</div>
            </div>
          `
        : nothing}

      <!-- Header actions -->
      <div class="ec-actions">
        <button
          class="btn btn--ghost btn--sm"
          @click=${props.onRefresh}
          ?disabled=${props.loading || !props.connected}
        >
          ${props.loading ? tr.refreshing : t().common.refresh}
        </button>
        ${props.error
          ? html`<span class="ec-error">${props.error}</span>`
          : nothing}
        ${!props.connected
          ? html`<span class="ec-badge ec-badge--offline">${t().common.disconnected}</span>`
          : nothing}
      </div>

      <!-- Status cards grid -->
      <div class="ec-grid">
        <!-- Grandma Status Card -->
        <div class="ec-card ${props.sosActive ? "ec-card--danger" : ""}">
          <div class="ec-card__header">
            <span class="ec-card__icon">👵</span>
            <span class="ec-card__title">${tr.grandmaStatus}</span>
          </div>
          <div class="ec-card__body">
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.presence}</span>
              <span class="ec-stat-value ${props.room.presence ? "ec-text--ok" : "ec-text--muted"}">
                ${props.room.presence == null ? "—" : props.room.presence ? tr.inRoom : tr.noMotion}
              </span>
            </div>
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.currentLevel}</span>
              <span class="ec-stat-value">
                ${props.lastCheck
                  ? html`<span class="ec-level-badge ${levelClass(props.lastCheck.level)}">
                      ${levelLabel(props.lastCheck.level)}
                    </span>`
                  : html`<span class="ec-level-badge ec-level--normal">${levelLabel("normal")}</span>`}
              </span>
            </div>
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.checksToday}</span>
              <span class="ec-stat-value">${props.summary.checksToday}</span>
            </div>
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.alertsToday}</span>
              <span class="ec-stat-value ${props.summary.alertsToday > 0 ? "ec-text--warn" : ""}">
                ${props.summary.alertsToday}
              </span>
            </div>
          </div>
        </div>

        <!-- Room Environment Card -->
        <div class="ec-card">
          <div class="ec-card__header">
            <span class="ec-card__icon">🌡️</span>
            <span class="ec-card__title">${tr.roomEnvironment}</span>
            ${!props.haConnected
              ? html`<span class="ec-badge ec-badge--warn">${tr.haOffline}</span>`
              : nothing}
          </div>
          <div class="ec-card__body">
            <div class="ec-sensor-grid">
              <div class="ec-sensor">
                <div class="ec-sensor__value">${formatTemp(props.room.temperature)}</div>
                <div class="ec-sensor__label">${tr.temperature}</div>
              </div>
              <div class="ec-sensor">
                <div class="ec-sensor__value">${formatHumidity(props.room.humidity)}</div>
                <div class="ec-sensor__label">${tr.humidity}</div>
              </div>
              <div class="ec-sensor">
                <div class="ec-sensor__value">
                  ${props.room.motionMinutes != null ? `${props.room.motionMinutes}m` : "—"}
                </div>
                <div class="ec-sensor__label">${tr.motion}</div>
              </div>
            </div>
            ${props.room.temperature != null && (props.room.temperature < 20 || props.room.temperature > 35)
              ? html`<div class="ec-env-warn">${tr.tempOutOfRange}</div>`
              : nothing}
            ${props.room.humidity != null && (props.room.humidity < 40 || props.room.humidity > 80)
              ? html`<div class="ec-env-warn">${tr.humidityOutOfRange}</div>`
              : nothing}
          </div>
        </div>

        <!-- Family Calls Card -->
        <div class="ec-card">
          <div class="ec-card__header">
            <span class="ec-card__icon">📞</span>
            <span class="ec-card__title">${tr.familyCalls}</span>
          </div>
          <div class="ec-card__body">
            ${props.summary.callsToday.length > 0
              ? html`
                  <div class="ec-calls-list">
                    ${props.summary.callsToday.map(
                      (call) => html`
                        <div class="ec-call-item">
                          <span class="ec-call-caller">${call.caller}</span>
                          <span class="ec-call-time">${formatTime(call.timestamp)}</span>
                        </div>
                      `,
                    )}
                  </div>
                `
              : html`
                  <div class="ec-empty-state">
                    <div class="ec-empty-state__text">${tr.noCalls}</div>
                  </div>
                `}
          </div>
        </div>

        <!-- Companion Activity Card -->
        <div class="ec-card">
          <div class="ec-card__header">
            <span class="ec-card__icon">🎵</span>
            <span class="ec-card__title">${tr.companionActivity}</span>
          </div>
          <div class="ec-card__body">
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.musicSessions}</span>
              <span class="ec-stat-value">${props.summary.musicPlayed}</span>
            </div>
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.reminders}</span>
              <span class="ec-stat-value">${props.summary.remindersDelivered}</span>
            </div>
            <div class="ec-stat-row">
              <span class="ec-stat-label">${tr.storyActive}</span>
              <span class="ec-stat-value">
                ${props.summary.storyActive ? tr.yes : tr.no}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- SOS Events Section (if any today) -->
      ${props.summary.sosEvents.length > 0
        ? html`
            <div class="ec-section">
              <h3 class="ec-section__title">🚨 ${tr.sosEventsToday}</h3>
              <div class="ec-sos-list">
                ${props.summary.sosEvents.map(
                  (ev) => html`
                    <div class="ec-sos-item ${ev.resolved ? "" : "ec-sos-item--active"}">
                      <div class="ec-sos-item__time">${formatTime(ev.timestamp)}</div>
                      <div class="ec-sos-item__source">${ev.source}</div>
                      <div class="ec-sos-item__level">Level ${ev.escalationLevel}</div>
                      <div class="ec-sos-item__status">
                        ${ev.resolved
                          ? html`<span class="ec-text--ok">${tr.resolved} ${ev.resolvedBy ? `(${ev.resolvedBy})` : ""}</span>`
                          : html`<span class="ec-text--danger">${tr.sosActiveShort}</span>`}
                      </div>
                    </div>
                  `,
                )}
              </div>
            </div>
          `
        : nothing}

      <!-- Last Daily Report -->
      ${props.summary.lastReport
        ? html`
            <div class="ec-section">
              <h3 class="ec-section__title">📊 ${tr.lastReport} (${props.summary.lastReportDate ?? ""})</h3>
              <div class="ec-report-card">
                <pre class="ec-report-text">${props.summary.lastReport}</pre>
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}
