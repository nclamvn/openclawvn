import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import { icons } from "../icons";
import { renderTerminalOutput } from "../components/terminal-output";
import type {
  DeployRecord,
  DeployPlatform,
  DeployStatus,
  ProjectInfo,
} from "../controllers/deploys";

export type DeployViewProps = {
  loading: boolean;
  history: DeployRecord[];
  error: string | null;
  connected: boolean;
  projects: ProjectInfo[];
  // Form state
  selectedProject: string | null;
  selectedPlatform: DeployPlatform | null;
  selectedTarget: "production" | "staging" | "preview";
  selectedBranch: string;
  running: boolean;
  status: DeployStatus | null;
  logLines: string[];
  // Callbacks
  onRefresh: () => void;
  onDeploy: () => void;
  onProjectChange: (projectId: string) => void;
  onPlatformChange: (platform: DeployPlatform) => void;
  onTargetChange: (target: "production" | "staging" | "preview") => void;
  onBranchChange: (branch: string) => void;
  onCopyLog: () => void;
};

const PLATFORMS: DeployPlatform[] = ["fly", "railway", "vercel", "docker", "custom"];
const TARGETS = ["production", "staging", "preview"] as const;

function statusBadge(status: DeployStatus): TemplateResult {
  const label = t().deploy.status[status] ?? status;
  return html`<span class="deploy-status deploy-status--${status}">${label}</span>`;
}

function renderDeployForm(props: DeployViewProps): TemplateResult {
  return html`
    <div class="deploy-form">
      <div class="deploy-form__field">
        <label class="deploy-form__label">${t().deploy.selectProject}</label>
        <select
          class="deploy-form__select"
          .value=${props.selectedProject ?? ""}
          @change=${(e: Event) => props.onProjectChange((e.target as HTMLSelectElement).value)}
          ?disabled=${props.running}
          aria-label="${t().deploy.selectProject}"
        >
          <option value="">${t().deploy.selectProject}</option>
          ${props.projects.map(
            (p) => html`<option value=${p.id}>${p.name}</option>`,
          )}
        </select>
      </div>

      <div class="deploy-form__field">
        <label class="deploy-form__label">${t().deploy.platform}</label>
        <select
          class="deploy-form__select"
          .value=${props.selectedPlatform ?? ""}
          @change=${(e: Event) => props.onPlatformChange((e.target as HTMLSelectElement).value as DeployPlatform)}
          ?disabled=${props.running}
          aria-label="${t().deploy.selectPlatform}"
        >
          <option value="">${t().deploy.selectPlatform}</option>
          ${PLATFORMS.map(
            (p) => html`<option value=${p}>${t().deploy.platforms[p]}</option>`,
          )}
        </select>
      </div>

      <div class="deploy-form__field">
        <label class="deploy-form__label">${t().deploy.target}</label>
        <div class="deploy-form__targets">
          ${TARGETS.map(
            (target) => html`
              <button
                class="btn btn--sm ${props.selectedTarget === target ? "btn--active" : ""}"
                @click=${() => props.onTargetChange(target)}
                ?disabled=${props.running}
              >
                ${t().deploy.targets[target]}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="deploy-form__field">
        <label class="deploy-form__label">${t().deploy.branch}</label>
        <input
          class="deploy-form__input"
          type="text"
          placeholder="main"
          .value=${props.selectedBranch}
          @input=${(e: Event) => props.onBranchChange((e.target as HTMLInputElement).value)}
          ?disabled=${props.running}
        />
      </div>

      <button
        class="btn btn--primary"
        ?disabled=${props.running || !props.selectedProject || !props.selectedPlatform || !props.connected}
        @click=${props.onDeploy}
        aria-label="${props.running ? t().deploy.deploying : t().deploy.start}"
      >
        ${props.running ? icons.loader : icons.rocket}
        ${props.running ? t().deploy.deploying : t().deploy.start}
      </button>
    </div>
  `;
}

function renderDeployHistory(props: DeployViewProps): TemplateResult {
  if (props.history.length === 0) {
    return html`
      <div class="deploy-history__empty muted">${t().deploy.history.empty}</div>
    `;
  }

  return html`
    <div class="deploy-history">
      ${props.history.map(
        (record) => html`
          <div class="deploy-history__item">
            <div class="deploy-history__meta">
              ${statusBadge(record.status)}
              <span class="deploy-history__project">${record.projectName}</span>
              <span class="muted">${record.platform} / ${record.target}</span>
            </div>
            <div class="deploy-history__time muted">${record.startedAt}</div>
          </div>
        `,
      )}
    </div>
  `;
}

export function renderDeploy(props: DeployViewProps): TemplateResult {
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t().deploy.title}</div>
          <div class="muted" style="margin-top: 2px;">${t().deploy.description}</div>
        </div>
        <button
          class="btn"
          ?disabled=${props.loading}
          @click=${props.onRefresh}
          aria-label="${t().common.refresh}"
        >
          ${props.loading ? t().common.loading : t().common.refresh}
        </button>
      </div>

      ${props.error
        ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
        : nothing}

      <div style="margin-top: 16px;">
        ${renderDeployForm(props)}
      </div>

      ${props.status != null || props.logLines.length > 0
        ? html`
            <div style="margin-top: 16px;">
              ${props.status ? html`<div style="margin-bottom: 8px;">${statusBadge(props.status)}</div>` : nothing}
              ${renderTerminalOutput({
                lines: props.logLines,
                loading: props.running,
                onCopy: props.onCopyLog,
              })}
            </div>
          `
        : nothing}
    </section>

    <section class="card" style="margin-top: 16px;">
      <div class="card-title">${t().deploy.history.title}</div>
      <div style="margin-top: 12px;">
        ${props.loading
          ? html`<div class="muted">${t().common.loading}</div>`
          : renderDeployHistory(props)}
      </div>
    </section>
  `;
}
