import { html, nothing } from "lit";

import { formatAgo } from "../format";
import { formatSessionTokens } from "../presenter";
import { pathForTab } from "../navigation";
import type { GatewaySessionRow, SessionsListResult } from "../types";
import { t } from "../i18n";
import { icons } from "../icons";
import { renderSessionCard } from "../components/session-card";

export type SessionsProps = {
  loading: boolean;
  result: SessionsListResult | null;
  error: string | null;
  activeMinutes: string;
  limit: string;
  includeGlobal: boolean;
  includeUnknown: boolean;
  basePath: string;
  viewMode: "table" | "cards";
  currentSessionKey: string;
  onFiltersChange: (next: {
    activeMinutes: string;
    limit: string;
    includeGlobal: boolean;
    includeUnknown: boolean;
  }) => void;
  onRefresh: () => void;
  onViewModeChange: (mode: "table" | "cards") => void;
  onResume: (key: string) => void;
  onPatch: (
    key: string,
    patch: {
      label?: string | null;
      thinkingLevel?: string | null;
      verboseLevel?: string | null;
      reasoningLevel?: string | null;
    },
  ) => void;
  onDelete: (key: string) => void;
};

const THINK_LEVELS = ["", "off", "minimal", "low", "medium", "high"] as const;
const BINARY_THINK_LEVELS = ["", "off", "on"] as const;
function getVerboseLevels() {
  return [
    { value: "", label: t().sessions.options.inherit },
    { value: "off", label: t().sessions.options.offExplicit },
    { value: "on", label: t().sessions.options.on },
  ];
}
const REASONING_LEVELS = ["", "off", "on", "stream"] as const;

function normalizeProviderId(provider?: string | null): string {
  if (!provider) return "";
  const normalized = provider.trim().toLowerCase();
  if (normalized === "z.ai" || normalized === "z-ai") return "zai";
  return normalized;
}

function isBinaryThinkingProvider(provider?: string | null): boolean {
  return normalizeProviderId(provider) === "zai";
}

function resolveThinkLevelOptions(provider?: string | null): readonly string[] {
  return isBinaryThinkingProvider(provider) ? BINARY_THINK_LEVELS : THINK_LEVELS;
}

function resolveThinkLevelDisplay(value: string, isBinary: boolean): string {
  if (!isBinary) return value;
  if (!value || value === "off") return value;
  return "on";
}

function resolveThinkLevelPatchValue(value: string, isBinary: boolean): string | null {
  if (!value) return null;
  if (!isBinary) return value;
  if (value === "on") return "low";
  return value;
}

export function renderSessions(props: SessionsProps) {
  const rows = props.result?.sessions ?? [];
  const isCards = props.viewMode === "cards";
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t().sessions.title}</div>
          <div class="card-sub">${t().sessions.description}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <div class="sessions-view-toggle">
            <button
              class="sessions-view-toggle__btn ${!isCards ? "sessions-view-toggle__btn--active" : ""}"
              type="button"
              title=${t().sessions.viewTable}
              @click=${() => props.onViewModeChange("table")}
            >
              ${icons.layoutList}
            </button>
            <button
              class="sessions-view-toggle__btn ${isCards ? "sessions-view-toggle__btn--active" : ""}"
              type="button"
              title=${t().sessions.viewCards}
              @click=${() => props.onViewModeChange("cards")}
            >
              ${icons.layoutGrid}
            </button>
          </div>
          <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? t().common.loading : t().common.refresh}
          </button>
        </div>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field">
          <span>${t().sessions.filters.activeWithin}</span>
          <input
            .value=${props.activeMinutes}
            @input=${(e: Event) =>
              props.onFiltersChange({
                activeMinutes: (e.target as HTMLInputElement).value,
                limit: props.limit,
                includeGlobal: props.includeGlobal,
                includeUnknown: props.includeUnknown,
              })}
          />
        </label>
        <label class="field">
          <span>${t().sessions.filters.limit}</span>
          <input
            .value=${props.limit}
            @input=${(e: Event) =>
              props.onFiltersChange({
                activeMinutes: props.activeMinutes,
                limit: (e.target as HTMLInputElement).value,
                includeGlobal: props.includeGlobal,
                includeUnknown: props.includeUnknown,
              })}
          />
        </label>
        <label class="field checkbox">
          <span>${t().sessions.filters.includeGlobal}</span>
          <input
            type="checkbox"
            .checked=${props.includeGlobal}
            @change=${(e: Event) =>
              props.onFiltersChange({
                activeMinutes: props.activeMinutes,
                limit: props.limit,
                includeGlobal: (e.target as HTMLInputElement).checked,
                includeUnknown: props.includeUnknown,
              })}
          />
        </label>
        <label class="field checkbox">
          <span>${t().sessions.filters.includeUnknown}</span>
          <input
            type="checkbox"
            .checked=${props.includeUnknown}
            @change=${(e: Event) =>
              props.onFiltersChange({
                activeMinutes: props.activeMinutes,
                limit: props.limit,
                includeGlobal: props.includeGlobal,
                includeUnknown: (e.target as HTMLInputElement).checked,
              })}
          />
        </label>
      </div>

      ${
        props.error
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
          : nothing
      }

      <div class="muted" style="margin-top: 12px;">
        ${props.result ? `${t().sessions.store} ${props.result.path}` : ""}
      </div>

      ${isCards ? renderCardsView(rows, props) : renderTableView(rows, props)}
    </section>
  `;
}

function renderCardsView(rows: GatewaySessionRow[], props: SessionsProps) {
  if (rows.length === 0) {
    return html`<div class="muted" style="margin-top: 16px;">${t().sessions.empty}</div>`;
  }
  return html`
    <div class="session-cards-grid" style="margin-top: 16px;">
      ${rows.map((row) =>
        renderSessionCard({
          session: row,
          currentSessionKey: props.currentSessionKey,
          basePath: props.basePath,
          onResume: props.onResume,
          onRename: (key, label) => props.onPatch(key, { label }),
          onDelete: props.onDelete,
        }),
      )}
    </div>
  `;
}

function renderTableView(rows: GatewaySessionRow[], props: SessionsProps) {
  return html`
    <div class="table" style="margin-top: 16px;">
      <div class="table-head">
        <div>${t().sessions.table.key}</div>
        <div>${t().sessions.table.label}</div>
        <div>${t().sessions.table.kind}</div>
        <div>${t().sessions.table.updated}</div>
        <div>${t().sessions.table.tokens}</div>
        <div>${t().sessions.table.thinking}</div>
        <div>${t().sessions.table.verbose}</div>
        <div>${t().sessions.table.reasoning}</div>
        <div>${t().common.actions}</div>
      </div>
      ${
        rows.length === 0
          ? html`<div class="muted">${t().sessions.empty}</div>`
          : rows.map((row) =>
              renderRow(row, props.basePath, props.onPatch, props.onDelete, props.loading),
            )
      }
    </div>
  `;
}

function renderRow(
  row: GatewaySessionRow,
  basePath: string,
  onPatch: SessionsProps["onPatch"],
  onDelete: SessionsProps["onDelete"],
  disabled: boolean,
) {
  const updated = row.updatedAt ? formatAgo(row.updatedAt) : "n/a";
  const rawThinking = row.thinkingLevel ?? "";
  const isBinaryThinking = isBinaryThinkingProvider(row.modelProvider);
  const thinking = resolveThinkLevelDisplay(rawThinking, isBinaryThinking);
  const thinkLevels = resolveThinkLevelOptions(row.modelProvider);
  const verbose = row.verboseLevel ?? "";
  const reasoning = row.reasoningLevel ?? "";
  const displayName = row.displayName ?? row.key;
  const canLink = row.kind !== "global";
  const chatUrl = canLink
    ? `${pathForTab("chat", basePath)}?session=${encodeURIComponent(row.key)}`
    : null;
  const verboseLevels = getVerboseLevels();

  return html`
    <div class="table-row">
      <div class="mono">${
        canLink ? html`<a href=${chatUrl} class="session-link">${displayName}</a>` : displayName
      }</div>
      <div>
        <input
          .value=${row.label ?? ""}
          ?disabled=${disabled}
          placeholder="(${t().common.optional})"
          @change=${(e: Event) => {
            const value = (e.target as HTMLInputElement).value.trim();
            onPatch(row.key, { label: value || null });
          }}
        />
      </div>
      <div>${row.kind}</div>
      <div>${updated}</div>
      <div>${formatSessionTokens(row)}</div>
      <div>
        <select
          .value=${thinking}
          ?disabled=${disabled}
          @change=${(e: Event) => {
            const value = (e.target as HTMLSelectElement).value;
            onPatch(row.key, {
              thinkingLevel: resolveThinkLevelPatchValue(value, isBinaryThinking),
            });
          }}
        >
          ${thinkLevels.map((level) => html`<option value=${level}>${level || t().sessions.options.inherit}</option>`)}
        </select>
      </div>
      <div>
        <select
          .value=${verbose}
          ?disabled=${disabled}
          @change=${(e: Event) => {
            const value = (e.target as HTMLSelectElement).value;
            onPatch(row.key, { verboseLevel: value || null });
          }}
        >
          ${verboseLevels.map(
            (level) => html`<option value=${level.value}>${level.label}</option>`,
          )}
        </select>
      </div>
      <div>
        <select
          .value=${reasoning}
          ?disabled=${disabled}
          @change=${(e: Event) => {
            const value = (e.target as HTMLSelectElement).value;
            onPatch(row.key, { reasoningLevel: value || null });
          }}
        >
          ${REASONING_LEVELS.map(
            (level) => html`<option value=${level}>${level || t().sessions.options.inherit}</option>`,
          )}
        </select>
      </div>
      <div>
        <button class="btn danger" ?disabled=${disabled} @click=${() => onDelete(row.key)}>
          ${t().common.delete}
        </button>
      </div>
    </div>
  `;
}
