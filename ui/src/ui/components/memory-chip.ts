import { html, nothing, type TemplateResult } from "lit";

import { formatAgo } from "../format";
import { t } from "../i18n";
import { icons } from "../icons";
import type { MemoryCategory, UserFact } from "../types";

export type MemoryChipProps = {
  fact: UserFact;
  editing: boolean;
  editDraft: string;
  onEdit: (id: string) => void;
  onEditDraftChange: (draft: string) => void;
  onSave: (id: string, content: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onVerify: (id: string, verified: boolean) => void;
};

const CATEGORY_EMOJI: Record<MemoryCategory, string> = {
  identity: "\u{1F464}",
  preference: "\u{2764}\u{FE0F}",
  project: "\u{1F4C1}",
  relationship: "\u{1F91D}",
  skill: "\u{1F527}",
  fact: "\u{1F4CB}",
};

export function confidenceDots(confidence: number): TemplateResult {
  const filled = confidence >= 0.9 ? 4 : confidence >= 0.7 ? 3 : confidence >= 0.5 ? 2 : 1;
  const dots = Array.from({ length: 4 }, (_, i) =>
    i < filled ? "\u25CF" : "\u25CB",
  ).join("");
  return html`<span class="memory-chip__confidence" title="Confidence: ${Math.round(confidence * 100)}%">${dots}</span>`;
}

export function renderMemoryChip(props: MemoryChipProps): TemplateResult {
  const { fact, editing, editDraft } = props;
  const emoji = CATEGORY_EMOJI[fact.category] ?? "\u{1F4CB}";
  const categoryLabel = t().memory.categories[fact.category] ?? fact.category;
  const updatedAgo = formatAgo(new Date(fact.updatedAt).getTime());

  return html`
    <div class="memory-chip ${editing ? "memory-chip--editing" : ""}">
      <div class="memory-chip__header">
        <span class="memory-chip__category">
          <span class="memory-chip__emoji">${emoji}</span>
          ${categoryLabel}
        </span>
        ${confidenceDots(fact.confidence)}
      </div>

      <div class="memory-chip__body">
        ${editing
          ? html`<textarea
              class="memory-chip__textarea"
              .value=${editDraft}
              @input=${(e: Event) =>
                props.onEditDraftChange((e.target as HTMLTextAreaElement).value)}
            ></textarea>`
          : html`<div class="memory-chip__content">${fact.content}</div>`}
      </div>

      <div class="memory-chip__footer">
        <div class="memory-chip__meta">
          <span class="memory-chip__badge ${fact.verified ? "memory-chip__badge--verified" : ""}">
            ${fact.verified ? t().memory.verified : t().memory.unverified}
          </span>
          <span class="memory-chip__time">${updatedAgo}</span>
        </div>
        <div class="memory-chip__actions">
          ${editing
            ? html`
                <button
                  class="btn btn--sm"
                  @click=${() => props.onSave(fact.id, editDraft)}
                >${t().memory.save}</button>
                <button
                  class="btn btn--sm btn--ghost"
                  @click=${props.onCancel}
                >${t().memory.cancel}</button>
              `
            : html`
                <button
                  class="btn btn--sm btn--icon"
                  title=${fact.verified ? t().memory.unverified : t().memory.verified}
                  @click=${() => props.onVerify(fact.id, !fact.verified)}
                >${icons.check}</button>
                <button
                  class="btn btn--sm btn--icon"
                  title=${t().common.edit}
                  @click=${() => props.onEdit(fact.id)}
                >${icons.edit}</button>
                <button
                  class="btn btn--sm btn--icon danger"
                  title=${t().common.delete}
                  @click=${() => props.onDelete(fact.id)}
                >${icons.x}</button>
              `}
        </div>
      </div>
    </div>
  `;
}
