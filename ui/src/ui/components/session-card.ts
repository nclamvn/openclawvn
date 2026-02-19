import { html, nothing, type TemplateResult } from "lit";
import type { GatewaySessionRow } from "../types";
import { formatAgo } from "../format";
import { t } from "../i18n";
import { icons } from "../icons";

export type SessionCardProps = {
  session: GatewaySessionRow;
  currentSessionKey: string;
  basePath: string;
  onResume: (key: string) => void;
  onRename: (key: string, label: string) => void;
  onDelete: (key: string) => void;
};

export function renderSessionCard(props: SessionCardProps): TemplateResult {
  const { session, currentSessionKey } = props;
  const isCurrent = session.key === currentSessionKey;
  const title = session.label || session.displayName || session.key;
  const updated = formatAgo(session.updatedAt);
  const totalTokens = session.totalTokens ?? 0;
  const model = session.model || null;
  const kind = session.kind;

  return html`
    <div class="session-card ${isCurrent ? "session-card--current" : ""}">
      <div class="session-card__header">
        <div class="session-card__title" title=${session.key}>
          ${title}
        </div>
        <div class="session-card__time">${updated}</div>
      </div>

      <div class="session-card__meta">
        ${model
          ? html`<span class="session-card__model">${model}</span>`
          : nothing}
        ${kind !== "unknown"
          ? html`<span class="session-card__kind">${kind}</span>`
          : nothing}
        ${totalTokens > 0
          ? html`<span class="session-card__tokens">${totalTokens.toLocaleString()} tokens</span>`
          : nothing}
        ${session.deviceDisplayName || session.deviceId
          ? html`<span class="session-card__device" title=${session.deviceId ?? ""}>${session.deviceDisplayName || session.deviceId}</span>`
          : nothing}
      </div>

      <div class="session-card__key">${session.key}</div>

      <div class="session-card__actions">
        ${isCurrent
          ? html`<span class="session-card__current-badge">${t().sessions.switcher.current}</span>`
          : kind !== "global"
            ? html`
                <button
                  class="btn btn--sm session-card__resume"
                  type="button"
                  @click=${() => props.onResume(session.key)}
                >
                  ${t().sessions.card.resume}
                </button>
              `
            : nothing}
        <div class="session-card__menu">
          <button
            class="btn btn--sm btn--icon session-card__menu-trigger"
            type="button"
            @click=${(e: Event) => {
              const menu = (e.currentTarget as HTMLElement)
                .nextElementSibling as HTMLElement | null;
              if (menu) menu.classList.toggle("open");
            }}
          >
            ${icons.moreVertical}
          </button>
          <div class="session-card__dropdown">
            <button
              class="session-card__dropdown-item"
              type="button"
              @click=${(e: Event) => {
                const dropdown = (e.currentTarget as HTMLElement)
                  .parentElement as HTMLElement;
                dropdown.classList.remove("open");
                const titleEl = (e.currentTarget as HTMLElement)
                  .closest(".session-card")
                  ?.querySelector(".session-card__title") as HTMLElement | null;
                if (titleEl) {
                  titleEl.setAttribute("contenteditable", "true");
                  titleEl.focus();
                  const handleBlur = () => {
                    titleEl.removeAttribute("contenteditable");
                    titleEl.removeEventListener("blur", handleBlur);
                    titleEl.removeEventListener("keydown", handleKey);
                    const newLabel = titleEl.textContent?.trim() || "";
                    if (newLabel && newLabel !== title) {
                      props.onRename(session.key, newLabel);
                    }
                  };
                  const handleKey = (ev: Event) => {
                    if ((ev as KeyboardEvent).key === "Enter") {
                      ev.preventDefault();
                      titleEl.blur();
                    } else if ((ev as KeyboardEvent).key === "Escape") {
                      titleEl.textContent = title;
                      titleEl.blur();
                    }
                  };
                  titleEl.addEventListener("blur", handleBlur);
                  titleEl.addEventListener("keydown", handleKey);
                }
              }}
            >
              ${t().sessions.card.rename}
            </button>
            <button
              class="session-card__dropdown-item session-card__dropdown-item--danger"
              type="button"
              @click=${() => props.onDelete(session.key)}
            >
              ${t().sessions.card.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
