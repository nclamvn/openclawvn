import { html, nothing } from "lit";

import { clampText } from "../format";
import { renderSkillIcon } from "../icons";
import type { SkillCatalogEntry, SkillCatalogKind, SkillStatusEntry, SkillStatusReport } from "../types";
import type { SkillMessageMap } from "../controllers/skills";
import { renderSkillCard } from "../components/skill-card";
import { renderSkillSettingsPanel, type SkillSettingsPanelProps } from "../components/skill-settings-panel";
import { t } from "../i18n";

// ─── Legacy skills.status view props ─────────────────────

export type SkillsProps = {
  loading: boolean;
  report: SkillStatusReport | null;
  error: string | null;
  filter: string;
  edits: Record<string, string>;
  busyKey: string | null;
  messages: SkillMessageMap;
  onFilterChange: (next: string) => void;
  onRefresh: () => void;
  onToggle: (skillKey: string, enabled: boolean) => void;
  onEdit: (skillKey: string, value: string) => void;
  onSaveKey: (skillKey: string) => void;
  onInstall: (skillKey: string, name: string, installId: string) => void;
  // Catalog props
  catalog: SkillCatalogEntry[];
  catalogLoading: boolean;
  catalogError: string | null;
  filterKind: SkillCatalogKind | "all" | "installed";
  search: string;
  onSearch: (keyword: string) => void;
  onFilterKindChange: (kind: SkillCatalogKind | "all" | "installed") => void;
  onCatalogRefresh: () => void;
  onCatalogToggle: (skillId: string, enabled: boolean) => void;
  onCatalogSettings: (skillId: string) => void;
  onCatalogInstall: (skillId: string) => void;
  // Settings panel
  settingsPanel: SkillSettingsPanelProps;
};

const KIND_FILTERS: Array<SkillCatalogKind | "all" | "installed"> = [
  "all",
  "installed",
  "channel",
  "tool",
  "service",
  "memory",
  "provider",
];

export function renderSkills(props: SkillsProps) {
  const skills = props.report?.skills ?? [];
  const filter = props.filter.trim().toLowerCase();
  const filtered = filter
    ? skills.filter((skill) =>
        [skill.name, skill.description, skill.source].join(" ").toLowerCase().includes(filter),
      )
    : skills;

  const catalogLabels = t().skills.catalog ?? {};
  const filterLabels = catalogLabels.filters ?? {};

  return html`
    <!-- Catalog Section -->
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${catalogLabels.title ?? t().skills.title}</div>
          <div class="card-sub">${catalogLabels.hint ?? t().skills.description}</div>
        </div>
        <button class="btn" ?disabled=${props.catalogLoading} @click=${props.onCatalogRefresh}>
          ${props.catalogLoading ? t().common.loading : t().common.refresh}
        </button>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <input
          class="filter-input"
          type="text"
          placeholder=${catalogLabels.search ?? t().skills.filter.search}
          .value=${props.search}
          @input=${(e: Event) => props.onSearch((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="skill-filter-tabs" style="margin-top: 10px;">
        ${KIND_FILTERS.map(
          (kind) => html`
            <button
              class="skill-filter-tab ${props.filterKind === kind ? "skill-filter-tab--active" : ""}"
              @click=${() => props.onFilterKindChange(kind)}
            >
              ${filterLabel(kind, filterLabels)}
            </button>
          `,
        )}
      </div>

      ${props.catalogError
        ? html`<div class="callout danger" style="margin-top: 12px;">${props.catalogError}</div>`
        : nothing}

      ${props.catalogLoading && props.catalog.length === 0
        ? html`<div class="muted" style="margin-top: 16px;">${t().common.loading}</div>`
        : props.catalog.length === 0
          ? html`<div class="muted" style="margin-top: 16px;">${catalogLabels.empty ?? t().skills.empty}</div>`
          : html`
              <div class="skill-catalog-grid" style="margin-top: 16px;">
                ${props.catalog.map((skill) =>
                  renderSkillCard({
                    skill,
                    busy: props.busyKey === skill.id,
                    onSettingsClick: props.onCatalogSettings,
                    onToggleClick: props.onCatalogToggle,
                    onInstallClick: props.onCatalogInstall,
                  }),
                )}
              </div>
            `}

      <div class="muted" style="margin-top: 16px; font-size: 11px;">
        ${catalogLabels.hint ?? ""}
      </div>
    </section>

    <!-- Legacy Workspace Skills Section -->
    ${filtered.length > 0
      ? html`
          <section class="card" style="margin-top: 16px;">
            <div class="row" style="justify-content: space-between;">
              <div>
                <div class="card-title">${t().skills.title}</div>
                <div class="card-sub">${t().skills.description}</div>
              </div>
              <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
                ${props.loading ? t().common.loading : t().common.refresh}
              </button>
            </div>

            <div class="filters" style="margin-top: 14px;">
              <label class="field" style="flex: 1;">
                <span>${t().common.filter}</span>
                <input
                  .value=${props.filter}
                  @input=${(e: Event) => props.onFilterChange((e.target as HTMLInputElement).value)}
                  placeholder="${t().skills.filter.search}"
                />
              </label>
              <div class="muted">${filtered.length} ${t().skills.filter.shown}</div>
            </div>

            ${props.error
              ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
              : nothing}

            <div class="list" style="margin-top: 16px;">
              ${filtered.map((skill) => renderSkill(skill, props))}
            </div>
          </section>
        `
      : nothing}

    <!-- Settings Panel Overlay -->
    ${renderSkillSettingsPanel(props.settingsPanel)}
  `;
}

function filterLabel(kind: SkillCatalogKind | "all" | "installed", labels: Record<string, string>): string {
  switch (kind) {
    case "all": return labels.all ?? "All";
    case "installed": return labels.installed ?? "Installed";
    case "channel": return labels.channel ?? "Channels";
    case "tool": return labels.tool ?? "Tools";
    case "service": return labels.service ?? "Services";
    case "memory": return labels.memory ?? "Memory";
    case "provider": return labels.provider ?? "Auth";
    case "skill": return labels.skill ?? "Skills";
    default: return kind;
  }
}

function renderSkill(skill: SkillStatusEntry, props: SkillsProps) {
  const busy = props.busyKey === skill.skillKey;
  const apiKey = props.edits[skill.skillKey] ?? "";
  const message = props.messages[skill.skillKey] ?? null;
  const canInstall = skill.install.length > 0 && skill.missing.bins.length > 0;
  const missing = [
    ...skill.missing.bins.map((b) => `bin:${b}`),
    ...skill.missing.env.map((e) => `env:${e}`),
    ...skill.missing.config.map((c) => `config:${c}`),
    ...skill.missing.os.map((o) => `os:${o}`),
  ];
  const reasons: string[] = [];
  if (skill.disabled) reasons.push(t().skills.status.disabled);
  if (skill.blockedByAllowlist) reasons.push(t().skills.status.blockedByAllowlist);
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          ${renderSkillIcon(skill.emoji)} ${skill.name}
        </div>
        <div class="list-sub">${clampText(skill.description, 140)}</div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${skill.source}</span>
          <span class="chip ${skill.eligible ? "chip-ok" : "chip-warn"}">
            ${skill.eligible ? t().skills.status.eligible : t().skills.status.blocked}
          </span>
          ${
            skill.disabled
              ? html`
                  <span class="chip chip-warn">${t().skills.status.disabled}</span>
                `
              : nothing
          }
        </div>
        ${
          missing.length > 0
            ? html`
              <div class="muted" style="margin-top: 6px;">
                ${t().skills.status.missing} ${missing.join(", ")}
              </div>
            `
            : nothing
        }
        ${
          reasons.length > 0
            ? html`
              <div class="muted" style="margin-top: 6px;">
                ${t().skills.status.reason} ${reasons.join(", ")}
              </div>
            `
            : nothing
        }
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; flex-wrap: wrap;">
          <button
            class="btn"
            ?disabled=${busy}
            @click=${() => props.onToggle(skill.skillKey, skill.disabled)}
          >
            ${skill.disabled ? t().common.enable : t().common.disable}
          </button>
          ${
            canInstall
              ? html`<button
                class="btn"
                ?disabled=${busy}
                @click=${() => props.onInstall(skill.skillKey, skill.name, skill.install[0].id)}
              >
                ${busy ? t().skills.status.installing : skill.install[0].label}
              </button>`
              : nothing
          }
        </div>
        ${
          message
            ? html`<div
              class="muted"
              style="margin-top: 8px; color: ${
                message.kind === "error"
                  ? "var(--danger-color, #d14343)"
                  : "var(--success-color, #0a7f5a)"
              };"
            >
              ${message.message}
            </div>`
            : nothing
        }
        ${
          skill.primaryEnv
            ? html`
              <div class="field" style="margin-top: 10px;">
                <span>${t().skills.apiKey}</span>
                <input
                  type="password"
                  .value=${apiKey}
                  @input=${(e: Event) =>
                    props.onEdit(skill.skillKey, (e.target as HTMLInputElement).value)}
                />
              </div>
              <button
                class="btn primary"
                style="margin-top: 8px;"
                ?disabled=${busy}
                @click=${() => props.onSaveKey(skill.skillKey)}
              >
                ${t().skills.saveKey}
              </button>
            `
            : nothing
        }
      </div>
    </div>
  `;
}
