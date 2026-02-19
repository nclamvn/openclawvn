import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import type { SkillCatalogEntry, SkillCatalogKind } from "../types";
import { renderSkillStatusBadge } from "./skill-status-badge";

const KIND_ICONS: Record<string, string> = {
  channel: "\u{1F4E8}",
  tool: "\u{1F527}",
  service: "\u{2699}\u{FE0F}",
  memory: "\u{1F9E0}",
  skill: "\u{26A1}",
  provider: "\u{1F511}",
};

export type SkillCardProps = {
  skill: SkillCatalogEntry;
  busy: boolean;
  onSettingsClick: (skillId: string) => void;
  onToggleClick: (skillId: string, enabled: boolean) => void;
  onInstallClick: (skillId: string) => void;
};

export function renderSkillCard(props: SkillCardProps): TemplateResult {
  const { skill, busy } = props;
  const kindIcon = KIND_ICONS[skill.kind ?? ""] ?? "\u{1F4E6}";
  const kindLabel = skill.kind ? kindLabelText(skill.kind) : "";

  return html`
    <div class="skill-card">
      <div class="skill-card__header">
        <div class="skill-card__title">
          <span class="skill-card__kind-icon">${kindIcon}</span>
          <span class="skill-card__name">${skill.name}</span>
          ${kindLabel ? html`<span class="chip">${kindLabel}</span>` : nothing}
        </div>
        ${renderSkillStatusBadge(skill.status)}
      </div>
      ${skill.description
        ? html`<div class="skill-card__desc">${skill.description}</div>`
        : nothing}
      <div class="skill-card__actions">
        ${skill.installed
          ? html`
              <button
                class="btn btn-sm"
                ?disabled=${busy}
                @click=${() => props.onToggleClick(skill.id, !skill.enabled)}
              >
                ${skill.enabled
                  ? t().skills.catalog?.actions?.disable ?? "Disable"
                  : t().skills.catalog?.actions?.enable ?? "Enable"}
              </button>
              ${skill.hasConfig
                ? html`<button
                    class="btn btn-sm"
                    ?disabled=${busy}
                    @click=${() => props.onSettingsClick(skill.id)}
                  >
                    ${t().skills.catalog?.actions?.settings ?? "Settings"}
                  </button>`
                : nothing}
            `
          : html`
              <button
                class="btn btn-sm primary"
                ?disabled=${busy}
                @click=${() => props.onInstallClick(skill.id)}
              >
                ${t().skills.catalog?.actions?.install ?? "Install"}
              </button>
            `}
      </div>
    </div>
  `;
}

function kindLabelText(kind: SkillCatalogKind): string {
  const filters = t().skills.catalog?.filters;
  if (!filters) return kind;
  switch (kind) {
    case "channel": return filters.channel ?? "Channel";
    case "tool": return filters.tool ?? "Tool";
    case "service": return filters.service ?? "Service";
    case "memory": return filters.memory ?? "Memory";
    case "skill": return filters.skill ?? "Skill";
    case "provider": return filters.provider ?? "Auth";
    default: return kind;
  }
}
