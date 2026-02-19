import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import { icons } from "../icons";
import type { MemoryCategory, UserFact } from "../types";
import { renderMemoryChip } from "../components/memory-chip";

const ALL_CATEGORIES: Array<MemoryCategory | "all"> = [
  "all",
  "identity",
  "preference",
  "project",
  "relationship",
  "skill",
  "fact",
];

export type MemoryViewProps = {
  loading: boolean;
  facts: UserFact[];
  error: string | null;
  filter: MemoryCategory | "all";
  search: string;
  editingId: string | null;
  editDraft: string;
  extracting: boolean;
  extractStatus: "idle" | "extracting" | "extracted";
  sessionKey: string;
  connected: boolean;
  onRefresh: () => void;
  onSearch: (keyword: string) => void;
  onFilterChange: (category: MemoryCategory | "all") => void;
  onEdit: (id: string) => void;
  onEditDraftChange: (draft: string) => void;
  onSave: (id: string, content: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onVerify: (id: string, verified: boolean) => void;
  onExtract: (sessionKey: string) => void;
};

export function renderMemory(props: MemoryViewProps): TemplateResult {
  const filtered =
    props.filter === "all"
      ? props.facts
      : props.facts.filter((f) => f.category === props.filter);

  const extractLabel =
    props.extractStatus === "extracting"
      ? t().memory.extracting
      : props.extractStatus === "extracted"
        ? t().memory.extracted
        : t().memory.extractButton;

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t().memory.title}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button
            class="btn"
            ?disabled=${props.extracting || !props.connected}
            @click=${() => props.onExtract(props.sessionKey)}
          >
            ${props.extractStatus === "extracting" ? icons.loader : icons.brain}
            ${extractLabel}
          </button>
          <button
            class="btn"
            ?disabled=${props.loading}
            @click=${props.onRefresh}
          >
            ${props.loading ? t().common.loading : t().common.refresh}
          </button>
        </div>
      </div>

      <div class="memory-search" style="margin-top: 14px;">
        <input
          class="memory-search__input"
          type="text"
          placeholder=${t().memory.search}
          .value=${props.search}
          @input=${(e: Event) => {
            const value = (e.target as HTMLInputElement).value;
            props.onSearch(value);
          }}
        />
      </div>

      <div class="memory-filters" style="margin-top: 10px;">
        ${ALL_CATEGORIES.map(
          (cat) => html`
            <button
              class="memory-filter-tab ${props.filter === cat ? "memory-filter-tab--active" : ""}"
              @click=${() => props.onFilterChange(cat)}
            >
              ${t().memory.categories[cat]}
            </button>
          `,
        )}
      </div>

      ${props.error
        ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
        : nothing}

      ${props.loading && filtered.length === 0
        ? html`<div class="muted" style="margin-top: 16px;">${t().common.loading}</div>`
        : filtered.length === 0
          ? html`<div class="muted" style="margin-top: 16px;">${t().memory.empty}</div>`
          : html`
              <div class="memory-grid" style="margin-top: 16px;">
                ${filtered.map((fact) =>
                  renderMemoryChip({
                    fact,
                    editing: props.editingId === fact.id,
                    editDraft: props.editingId === fact.id ? props.editDraft : fact.content,
                    onEdit: props.onEdit,
                    onEditDraftChange: props.onEditDraftChange,
                    onSave: props.onSave,
                    onCancel: props.onCancel,
                    onDelete: props.onDelete,
                    onVerify: props.onVerify,
                  }),
                )}
              </div>
            `}

      <div class="memory-privacy" style="margin-top: 16px;">
        ${t().memory.privacy}
      </div>
    </section>
  `;
}
