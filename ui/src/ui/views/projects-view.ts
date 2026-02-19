import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import { icons } from "../icons";
import type { ProjectInfo, DeployPlatform } from "../controllers/deploys";

export type ProjectsViewProps = {
  loading: boolean;
  projects: ProjectInfo[];
  error: string | null;
  scanning: boolean;
  scanStatus: "idle" | "scanning" | "scanned";
  connected: boolean;
  onRefresh: () => void;
  onScan: (projectId: string) => void;
};

const PLATFORM_LABELS: Record<DeployPlatform, string> = {
  fly: "Fly.io",
  railway: "Railway",
  vercel: "Vercel",
  docker: "Docker",
  custom: "Custom",
};

function healthIcon(health: ProjectInfo["health"]): TemplateResult {
  switch (health) {
    case "healthy":
      return html`<span class="health-dot health-dot--ok" title="${t().projects.health.healthy}"></span>`;
    case "warning":
      return html`<span class="health-dot health-dot--warn" title="${t().projects.health.warning}"></span>`;
    case "error":
      return html`<span class="health-dot health-dot--error" title="${t().projects.health.error}"></span>`;
    default:
      return html`<span class="health-dot health-dot--unknown" title="${t().projects.health.unknown}"></span>`;
  }
}

function renderProjectCard(project: ProjectInfo, props: ProjectsViewProps): TemplateResult {
  const platformLabel = project.platform
    ? PLATFORM_LABELS[project.platform] ?? project.platform
    : "—";

  return html`
    <div class="project-card">
      <div class="project-card__header">
        <div class="project-card__title">
          ${healthIcon(project.health)}
          <span>${project.name}</span>
        </div>
        <button
          class="btn btn--sm"
          ?disabled=${props.scanning}
          @click=${() => props.onScan(project.id)}
          aria-label="${t().projects.rescan} ${project.name}"
        >
          ${icons.loader} ${t().projects.rescan}
        </button>
      </div>
      <div class="project-card__body">
        <div class="project-card__row">
          <span class="muted">${t().projects.card.platform}</span>
          <span>${platformLabel}</span>
        </div>
        <div class="project-card__row">
          <span class="muted">${t().projects.card.branch}</span>
          <span>${project.branch || "main"}</span>
        </div>
        <div class="project-card__row">
          <span class="muted">${t().projects.card.lastDeploy}</span>
          <span>${project.lastDeployAt ?? t().projects.card.never}</span>
        </div>
        ${project.envMissing.length > 0
          ? html`
              <div class="project-card__env-warning">
                ${icons.alertTriangle}
                <span>${t().projects.env.missing}: ${project.envMissing.join(", ")}</span>
              </div>
            `
          : project.envValid
            ? html`
                <div class="project-card__env-ok">
                  ${icons.check}
                  <span>${t().projects.env.valid}</span>
                </div>
              `
            : nothing}
      </div>
    </div>
  `;
}

export function renderProjects(props: ProjectsViewProps): TemplateResult {
  const scanLabel =
    props.scanStatus === "scanning"
      ? t().projects.scanning
      : props.scanStatus === "scanned"
        ? t().projects.scanned
        : t().projects.scan;

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t().projects.title}</div>
          <div class="muted" style="margin-top: 2px;">${t().projects.description}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button
            class="btn"
            ?disabled=${props.loading}
            @click=${props.onRefresh}
            aria-label="${t().common.refresh}"
          >
            ${props.loading ? t().common.loading : t().common.refresh}
          </button>
        </div>
      </div>

      ${props.error
        ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
        : nothing}

      ${props.loading && props.projects.length === 0
        ? html`<div class="muted" style="margin-top: 16px;">${t().common.loading}</div>`
        : props.projects.length === 0
          ? html`<div class="muted" style="margin-top: 16px;">${t().projects.empty}</div>`
          : html`
              <div class="projects-grid" style="margin-top: 16px;">
                ${props.projects.map((p) => renderProjectCard(p, props))}
              </div>
            `}
    </section>
  `;
}
