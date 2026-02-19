import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";
import { icons } from "../icons";
import type { UserFact } from "../types";

export type MemoryIndicatorProps = {
  enabled: boolean;
  facts: UserFact[];
  totalFacts: number;
  expanded: boolean;
  connected: boolean;
  showThinking: boolean;
  disableThinking: boolean;
  onToggle: () => void;
  onThinkingToggle: () => void;
  onExpand: () => void;
};

export function renderMemoryIndicator(props: MemoryIndicatorProps): TemplateResult {
  const {
    enabled, facts, totalFacts, expanded, connected,
    showThinking, disableThinking,
    onToggle, onThinkingToggle, onExpand,
  } = props;
  const count = facts.length;
  const mem = t().memory;

  // Single brain icon: click = toggle thinking, visual state reflects both
  const brainActive = showThinking || (enabled && totalFacts > 0);
  const brainTitle = disableThinking
    ? t().chat.disabledDuringSetup
    : t().chat.toggleThinking;

  const brainBtn = html`
    <button
      class="btn btn--sm btn--icon memory-indicator__brain ${brainActive ? "active" : ""}"
      ?disabled=${disableThinking}
      @click=${onThinkingToggle}
      aria-pressed=${showThinking}
      title=${brainTitle}
    >
      ${icons.brain}
    </button>
  `;

  // Memory label/badge: click = toggle memory or expand facts
  if (!enabled) {
    return html`
      <span class="memory-indicator memory-indicator--off">
        ${brainBtn}
        <button
          class="memory-indicator__label-btn"
          ?disabled=${!connected}
          @click=${onToggle}
          title=${mem.indicatorToggle}
        >
          ${mem.indicatorOff}
        </button>
      </span>
    `;
  }

  if (totalFacts === 0) {
    return html`
      <span class="memory-indicator memory-indicator--empty">
        ${brainBtn}
        <button
          class="memory-indicator__label-btn"
          ?disabled=${!connected}
          @click=${onToggle}
          title=${mem.indicatorToggle}
        >
          ${mem.indicatorNone}
        </button>
      </span>
    `;
  }

  return html`
    <span class="memory-indicator memory-indicator--active">
      ${brainBtn}
      <button
        class="memory-indicator__badge"
        @click=${onExpand}
        title="${count} ${mem.indicatorActive}"
      >
        ${count}
      </button>
      ${expanded ? renderExpandedPanel(facts) : nothing}
    </span>
  `;
}

function renderExpandedPanel(facts: UserFact[]): TemplateResult {
  return html`
    <div class="memory-indicator__panel">
      <div class="memory-indicator__panel-header">
        ${icons.brain}
        <span>${t().memory.title}</span>
      </div>
      <ul class="memory-indicator__panel-list">
        ${facts.map(
          (fact) => html`
            <li class="memory-indicator__panel-item">
              <span class="memory-indicator__panel-category">${fact.category}</span>
              <span class="memory-indicator__panel-content">${fact.content}</span>
            </li>
          `,
        )}
      </ul>
    </div>
  `;
}
