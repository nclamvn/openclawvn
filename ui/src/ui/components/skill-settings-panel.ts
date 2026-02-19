import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import type { SkillCatalogEntry } from "../types";
import { renderSchemaForm, type SchemaFormProps } from "./schema-form";
import { renderSkillStatusBadge } from "./skill-status-badge";

export type SkillSettingsPanelProps = {
  open: boolean;
  skillId: string | null;
  skill: SkillCatalogEntry | null;
  schema: Record<string, unknown> | null;
  uiHints: Record<string, unknown> | null;
  currentConfig: Record<string, unknown> | null;
  loading: boolean;
  saving: boolean;
  formValues: Record<string, unknown>;
  envVars: Array<{ key: string; value: string }>;
  onFieldChange: (field: string, value: unknown) => void;
  onEnvChange: (index: number, key: string, value: string) => void;
  onEnvAdd: () => void;
  onEnvRemove: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
};

export function renderSkillSettingsPanel(props: SkillSettingsPanelProps): TemplateResult {
  if (!props.open || !props.skill) return html`${nothing}`;

  const labels = t().skills.catalog?.settings ?? {};

  return html`
    <div class="panel-overlay" @click=${(e: Event) => {
      if ((e.target as HTMLElement).classList.contains("panel-overlay")) props.onClose();
    }}>
      <div class="panel-slide" @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape") props.onClose();
      }}>
        <div class="panel-slide__header">
          <div class="panel-slide__title">
            ${labels.title?.replace("{name}", props.skill.name) ?? `Settings: ${props.skill.name}`}
          </div>
          <button class="btn btn-sm" @click=${props.onClose}>&times;</button>
        </div>

        <div class="panel-slide__meta">
          ${renderSkillStatusBadge(props.skill.status)}
          <span class="chip">${labels.type ?? "Type"}: ${props.skill.kind ?? "—"}</span>
          <span class="chip">${labels.source ?? "Source"}: ${props.skill.source}</span>
        </div>

        ${props.loading
          ? html`<div class="panel-slide__body"><div class="muted">${t().common.loading}</div></div>`
          : html`
              <div class="panel-slide__body">
                ${props.schema
                  ? html`
                      <div class="panel-slide__section">
                        <div class="panel-slide__section-title">${labels.config ?? "Configuration"}</div>
                        ${renderSchemaForm({
                          schema: props.schema,
                          uiHints: props.uiHints,
                          values: props.formValues,
                          onFieldChange: props.onFieldChange,
                          disabled: props.saving,
                        } as SchemaFormProps)}
                      </div>
                    `
                  : html`<div class="muted">${labels.noConfig ?? "No configuration available."}</div>`}

                ${renderEnvVarsSection(props, labels)}
              </div>

              <div class="panel-slide__footer">
                <button
                  class="btn primary"
                  ?disabled=${props.saving}
                  @click=${props.onSave}
                >
                  ${props.saving ? (labels.saving ?? "Saving...") : (labels.save ?? "Save")}
                </button>
                <button
                  class="btn"
                  ?disabled=${props.saving}
                  @click=${props.onClose}
                >
                  ${labels.cancel ?? "Cancel"}
                </button>
              </div>
            `}
      </div>
    </div>
  `;
}

function renderEnvVarsSection(
  props: SkillSettingsPanelProps,
  labels: Record<string, string>,
): TemplateResult {
  if (props.envVars.length === 0 && !props.schema) {
    return html`${nothing}`;
  }

  return html`
    <div class="panel-slide__section" style="margin-top: 16px;">
      <div class="panel-slide__section-title">${labels.envVars ?? "Environment variables"}</div>
      <div class="env-vars-editor">
        ${props.envVars.map(
          (env, i) => html`
            <div class="env-vars-editor__row">
              <input
                class="env-vars-editor__key"
                type="text"
                placeholder="KEY"
                .value=${env.key}
                ?disabled=${props.saving}
                @input=${(e: Event) =>
                  props.onEnvChange(i, (e.target as HTMLInputElement).value, env.value)}
              />
              <input
                class="env-vars-editor__value"
                type="password"
                placeholder="value"
                .value=${env.value}
                ?disabled=${props.saving}
                @input=${(e: Event) =>
                  props.onEnvChange(i, env.key, (e.target as HTMLInputElement).value)}
              />
              <button
                class="btn btn-sm btn-danger"
                ?disabled=${props.saving}
                @click=${() => props.onEnvRemove(i)}
              >
                &times;
              </button>
            </div>
          `,
        )}
        <button
          class="btn btn-sm"
          ?disabled=${props.saving}
          @click=${props.onEnvAdd}
        >
          + ${labels.addEnvVar ?? "Add variable"}
        </button>
      </div>
    </div>
  `;
}
