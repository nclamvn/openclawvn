import { html, nothing, type TemplateResult } from "lit";
import { icons } from "../icons";
import { t } from "../i18n";
import { type AgentPreset, type AgentTab, AGENT_PRESETS } from "../controllers/agent-tabs";
import type { IconName } from "../icons";

export type AgentTabsProps = {
  tabs: AgentTab[];
  activeSessionKey: string;
  connected: boolean;
  presetPickerOpen: boolean;
  onTabSelect: (sessionKey: string) => void;
  onTabClose: (sessionKey: string) => void;
  onTabRename: (sessionKey: string, label: string) => void;
  onNewTab: () => void;
  onPresetSelect: (preset: AgentPreset) => void;
  onPresetPickerClose: () => void;
  onTabPin?: (sessionKey: string) => void;
  onTabUnpin?: (sessionKey: string) => void;
};

function resolveTabLabel(tab: AgentTab): string {
  // If the label is an i18n key path (agentTabs.presets.xxx), resolve it
  const presets = t().agentTabs.presets as Record<string, string>;
  if (tab.label.startsWith("agentTabs.presets.")) {
    const key = tab.label.split(".").pop() ?? "";
    return presets[key] ?? tab.label;
  }
  return tab.label;
}

function handleTabDblClick(e: Event, sessionKey: string, props: AgentTabsProps) {
  const target = e.currentTarget as HTMLElement;
  const labelEl = target.querySelector(".agent-tab__label") as HTMLElement | null;
  if (!labelEl) return;

  labelEl.contentEditable = "true";
  labelEl.focus();

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(labelEl);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);

  const commit = () => {
    labelEl.contentEditable = "false";
    const newLabel = labelEl.textContent?.trim();
    if (newLabel && newLabel !== resolveTabLabel({ sessionKey, label: "", preset: "custom", unreadCount: 0 })) {
      props.onTabRename(sessionKey, newLabel);
    }
    labelEl.removeEventListener("blur", commit);
    labelEl.removeEventListener("keydown", onKeyDown);
  };

  const onKeyDown = (ke: KeyboardEvent) => {
    if (ke.key === "Enter") {
      ke.preventDefault();
      labelEl.blur();
    }
    if (ke.key === "Escape") {
      labelEl.contentEditable = "false";
      labelEl.removeEventListener("blur", commit);
      labelEl.removeEventListener("keydown", onKeyDown);
    }
  };

  labelEl.addEventListener("blur", commit);
  labelEl.addEventListener("keydown", onKeyDown);
}

function renderPresetPicker(props: AgentTabsProps): TemplateResult {
  if (!props.presetPickerOpen) return html`${nothing}`;

  const presetKeys = Object.keys(AGENT_PRESETS) as AgentPreset[];

  return html`
    <div class="agent-preset-picker">
      <div class="agent-preset-picker__header">
        <span>${t().agentTabs.presets.title}</span>
        <button
          class="agent-preset-picker__close"
          type="button"
          @click=${props.onPresetPickerClose}
        >
          ${icons.x}
        </button>
      </div>
      <div class="agent-preset-picker__list">
        ${presetKeys.map((preset) => {
          const meta = AGENT_PRESETS[preset];
          const iconName = meta.icon as IconName;
          const presets = t().agentTabs.presets as Record<string, string>;
          const label = presets[preset] ?? preset;
          return html`
            <button
              class="agent-preset-picker__item"
              type="button"
              @click=${() => props.onPresetSelect(preset)}
            >
              <span class="agent-preset-picker__icon">${icons[iconName]}</span>
              <span>${label}</span>
            </button>
          `;
        })}
      </div>
    </div>
  `;
}

export function renderAgentTabs(props: AgentTabsProps): TemplateResult {
  return html`
    <div class="agent-tabs" role="tablist">
      ${props.tabs.map((tab) => {
        const isActive = tab.sessionKey === props.activeSessionKey;
        const label = resolveTabLabel(tab);
        const iconName = AGENT_PRESETS[tab.preset]?.icon as IconName;
        return html`
          <div
            class="agent-tab ${isActive ? "agent-tab--active" : ""} ${tab.pinned ? "agent-tab--pinned" : ""}"
            role="tab"
            aria-selected=${isActive ? "true" : "false"}
            @click=${() => props.onTabSelect(tab.sessionKey)}
            @dblclick=${(e: Event) => handleTabDblClick(e, tab.sessionKey, props)}
          >
            <span class="agent-tab__icon">${icons[iconName]}</span>
            <span class="agent-tab__label">${label}</span>
            ${tab.unreadCount > 0
              ? html`<span class="agent-tab__unread" aria-label="${tab.unreadCount} ${t().agentTabs.unread}">${tab.unreadCount}</span>`
              : nothing}
            ${(props.onTabPin || props.onTabUnpin)
              ? html`
                <button
                  class="agent-tab__pin"
                  type="button"
                  aria-label="${tab.pinned ? t().agentTabs.unpin : t().agentTabs.pin}"
                  title="${tab.pinned ? t().agentTabs.unpin : t().agentTabs.pin}"
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    if (tab.pinned) {
                      props.onTabUnpin?.(tab.sessionKey);
                    } else {
                      props.onTabPin?.(tab.sessionKey);
                    }
                  }}
                >
                  ${icons.pin}
                </button>
              `
              : nothing}
            ${props.tabs.length > 1
              ? html`
                <button
                  class="agent-tab__close"
                  type="button"
                  aria-label="${t().agentTabs.closeTab}"
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    props.onTabClose(tab.sessionKey);
                  }}
                >
                  ${icons.x}
                </button>
              `
              : nothing}
          </div>
        `;
      })}
      <div class="agent-tab__add-wrapper">
        <button
          class="agent-tab__add"
          type="button"
          title="${t().agentTabs.newTab}"
          ?disabled=${!props.connected}
          @click=${props.onNewTab}
        >
          ${icons.plus}
        </button>
        ${renderPresetPicker(props)}
      </div>
    </div>
  `;
}
