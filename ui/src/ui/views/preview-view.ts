import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import { icons } from "../icons";
import type { PreviewRecord, ProjectInfo } from "../controllers/deploys";

export type PreviewViewProps = {
  loading: boolean;
  previews: PreviewRecord[];
  error: string | null;
  connected: boolean;
  projects: ProjectInfo[];
  creating: boolean;
  deleting: string | null;
  promoting: string | null;
  selectedProject: string | null;
  branch: string;
  iframeUrl: string | null;
  // Callbacks
  onRefresh: () => void;
  onCreate: () => void;
  onDelete: (previewId: string) => void;
  onPromote: (previewId: string) => void;
  onProjectChange: (projectId: string) => void;
  onBranchChange: (branch: string) => void;
  onOpenPreview: (url: string) => void;
  onCopyUrl: (url: string) => void;
};

function renderPreviewCard(
  preview: PreviewRecord,
  props: PreviewViewProps,
): TemplateResult {
  const isDeleting = props.deleting === preview.id;
  const isPromoting = props.promoting === preview.id;

  return html`
    <div class="preview-card ${preview.status !== "active" ? "preview-card--inactive" : ""}">
      <div class="preview-card__header">
        <span class="preview-card__project">${preview.projectName}</span>
        <span class="preview-card__status preview-card__status--${preview.status}">
          ${preview.status}
        </span>
      </div>
      <div class="preview-card__body">
        <div class="preview-card__row">
          <span class="muted">${t().preview.card.branch}</span>
          <span>${preview.branch}</span>
        </div>
        <div class="preview-card__row">
          <span class="muted">${t().preview.card.created}</span>
          <span>${preview.createdAt}</span>
        </div>
        ${preview.expiresAt
          ? html`
              <div class="preview-card__row">
                <span class="muted">${t().preview.card.expires}</span>
                <span>${preview.expiresAt}</span>
              </div>
            `
          : nothing}
        <div class="preview-card__url">
          <a href=${preview.url} target="_blank" rel="noopener" class="preview-card__link">
            ${preview.url}
          </a>
        </div>
      </div>
      <div class="preview-card__actions">
        <button
          class="btn btn--sm"
          @click=${() => props.onOpenPreview(preview.url)}
          ?disabled=${preview.status !== "active"}
          aria-label="${t().preview.open} ${preview.projectName}"
        >
          ${icons.globe} ${t().preview.open}
        </button>
        <button
          class="btn btn--sm"
          @click=${() => props.onCopyUrl(preview.url)}
          aria-label="${t().preview.copyUrl} ${preview.projectName}"
        >
          ${t().preview.copyUrl}
        </button>
        <button
          class="btn btn--sm btn--accent"
          @click=${() => props.onPromote(preview.id)}
          ?disabled=${isPromoting || preview.status !== "active"}
          aria-label="${t().preview.promote} ${preview.projectName}"
        >
          ${isPromoting ? icons.loader : icons.rocket}
          ${isPromoting ? t().preview.promoting : t().preview.promote}
        </button>
        <button
          class="btn btn--sm btn--danger"
          @click=${() => props.onDelete(preview.id)}
          ?disabled=${isDeleting}
          aria-label="${t().preview.delete} ${preview.projectName}"
        >
          ${isDeleting ? t().preview.deleting : t().preview.delete}
        </button>
      </div>
    </div>
  `;
}

function renderCreateForm(props: PreviewViewProps): TemplateResult {
  return html`
    <div class="preview-form">
      <div class="preview-form__field">
        <label class="preview-form__label">${t().preview.form.project}</label>
        <select
          class="preview-form__select"
          .value=${props.selectedProject ?? ""}
          @change=${(e: Event) =>
            props.onProjectChange((e.target as HTMLSelectElement).value)}
          ?disabled=${props.creating}
          aria-label="${t().preview.form.project}"
        >
          <option value="">${t().deploy.selectProject}</option>
          ${props.projects.map(
            (p) => html`<option value=${p.id}>${p.name}</option>`,
          )}
        </select>
      </div>
      <div class="preview-form__field">
        <label class="preview-form__label">${t().preview.form.branch}</label>
        <input
          class="preview-form__input"
          type="text"
          placeholder=${t().preview.form.branchPlaceholder}
          .value=${props.branch}
          @input=${(e: Event) =>
            props.onBranchChange((e.target as HTMLInputElement).value)}
          ?disabled=${props.creating}
        />
      </div>
      <button
        class="btn btn--primary"
        ?disabled=${props.creating || !props.selectedProject || !props.connected}
        @click=${props.onCreate}
      >
        ${props.creating ? icons.loader : icons.globe}
        ${props.creating ? t().preview.creating : t().preview.create}
      </button>
    </div>
  `;
}

export function renderPreview(props: PreviewViewProps): TemplateResult {
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t().preview.title}</div>
          <div class="muted" style="margin-top: 2px;">${t().preview.description}</div>
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
        ${renderCreateForm(props)}
      </div>
    </section>

    <section class="card" style="margin-top: 16px;">
      ${props.loading && props.previews.length === 0
        ? html`<div class="muted">${t().common.loading}</div>`
        : props.previews.length === 0
          ? html`<div class="muted">${t().preview.empty}</div>`
          : html`
              <div class="preview-grid">
                ${props.previews.map((p) => renderPreviewCard(p, props))}
              </div>
            `}
    </section>

    ${props.iframeUrl
      ? html`
          <section class="card" style="margin-top: 16px;">
            <div class="row" style="justify-content: space-between; margin-bottom: 8px;">
              <div class="card-title">${t().preview.iframe.title}</div>
              <a
                href=${props.iframeUrl}
                target="_blank"
                rel="noopener"
                class="btn btn--sm"
              >
                ${icons.globe} ${t().preview.iframe.openExternal}
              </a>
            </div>
            <div class="preview-iframe-container">
              <iframe
                src=${props.iframeUrl}
                class="preview-iframe"
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
                title="${t().preview.iframe.title}"
                referrerpolicy="no-referrer"
              ></iframe>
            </div>
          </section>
        `
      : nothing}
  `;
}
