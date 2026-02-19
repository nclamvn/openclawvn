import { html, nothing, type TemplateResult } from "lit";
import type { GatewaySessionRow, SessionsListResult } from "../types";
import { formatAgo } from "../format";
import { t } from "../i18n";
import { icons } from "../icons";

export type SessionSwitcherProps = {
  open: boolean;
  currentSessionKey: string;
  sessions: SessionsListResult | null;
  connected: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
  onNewSession: () => void;
  onViewAll: () => void;
};

export function renderSessionSwitcher(props: SessionSwitcherProps): TemplateResult {
  const sessions = props.sessions?.sessions ?? [];
  // Show up to 5 recent sessions, excluding global
  const recent = sessions
    .filter((s) => s.kind !== "global")
    .slice(0, 5);

  return html`
    <div class="session-switcher ${props.open ? "session-switcher--open" : ""}">
      <button
        class="btn btn--sm session-switcher__trigger"
        type="button"
        ?disabled=${!props.connected}
        @click=${props.onToggle}
        title=${t().sessions.switcher.recentSessions}
      >
        ${icons.chevronDown}
      </button>
      ${props.open
        ? html`
            <div class="session-switcher__panel">
              <div class="session-switcher__header">
                ${t().sessions.switcher.recentSessions}
              </div>
              <div class="session-switcher__list">
                ${recent.length === 0
                  ? html`<div class="session-switcher__empty">${t().sessions.switcher.noSessions}</div>`
                  : recent.map((s) => renderSwitcherItem(s, props))}
              </div>
              <div class="session-switcher__footer">
                <button
                  class="session-switcher__action"
                  type="button"
                  @click=${props.onNewSession}
                >
                  ${icons.plus}
                  ${t().sessions.switcher.newSession}
                </button>
                <button
                  class="session-switcher__action"
                  type="button"
                  @click=${props.onViewAll}
                >
                  ${t().sessions.switcher.viewAll}
                </button>
              </div>
            </div>
            <div class="session-switcher__backdrop" @click=${props.onToggle}></div>
          `
        : nothing}
    </div>
  `;
}

function renderSwitcherItem(
  session: GatewaySessionRow,
  props: SessionSwitcherProps,
): TemplateResult {
  const isCurrent = session.key === props.currentSessionKey;
  const title = session.label || session.displayName || session.key;
  const updated = formatAgo(session.updatedAt);

  return html`
    <button
      class="session-switcher__item ${isCurrent ? "session-switcher__item--current" : ""}"
      type="button"
      @click=${() => {
        if (!isCurrent) props.onSelect(session.key);
        props.onToggle();
      }}
    >
      <div class="session-switcher__item-title">${title}</div>
      <div class="session-switcher__item-meta">
        <span>${updated}</span>
        ${isCurrent
          ? html`<span class="session-switcher__current-badge">${t().sessions.switcher.current}</span>`
          : nothing}
      </div>
    </button>
  `;
}
