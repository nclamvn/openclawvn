import { html, type TemplateResult } from "lit";

import { t } from "../i18n";
import type { SkillCatalogStatus } from "../types";

const STATUS_CLASSES: Record<SkillCatalogStatus, string> = {
  active: "skill-status--active",
  disabled: "skill-status--disabled",
  needsConfig: "skill-status--needs-config",
  error: "skill-status--error",
  notInstalled: "skill-status--not-installed",
};

export function renderSkillStatusBadge(status: SkillCatalogStatus): TemplateResult {
  const cls = STATUS_CLASSES[status] ?? "skill-status--disabled";
  const label = statusLabel(status);
  return html`<span class="skill-status ${cls}"><span class="skill-status__dot"></span>${label}</span>`;
}

function statusLabel(status: SkillCatalogStatus): string {
  const labels = t().skills.catalog?.status;
  if (!labels) return status;
  switch (status) {
    case "active": return labels.active ?? "Active";
    case "disabled": return labels.disabled ?? "Disabled";
    case "needsConfig": return labels.needsConfig ?? "Needs config";
    case "error": return labels.error ?? "Error";
    case "notInstalled": return labels.notInstalled ?? "Not installed";
    default: return status;
  }
}
