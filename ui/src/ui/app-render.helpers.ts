import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";

import type { AppViewState } from "./app-view-state";
import { iconForTab, pathForTab, titleForTab, TAB_GROUPS, type Tab } from "./navigation";
import { icons } from "./icons";
import { loadChatHistory } from "./controllers/chat";
import { refreshChat } from "./app-chat";
import { syncUrlWithSessionKey } from "./app-settings";
import type { SessionsListResult } from "./types";
import type { ThemeMode } from "./theme";
import type { ThemeTransitionContext } from "./theme-transition";
import type { Language } from "./storage";
import { setLanguage, t } from "./i18n";
import { renderSessionSwitcher } from "./components/session-switcher";
import { renderMemoryIndicator } from "./components/memory-indicator";

// Get keyboard shortcut for a tab based on its group
function getTabShortcut(tab: Tab): string | null {
  for (const group of TAB_GROUPS) {
    const tabIndex = group.tabs.indexOf(tab);
    if (tabIndex === 0 && (group as { shortcut?: string }).shortcut) {
      return `${(group as { shortcut?: string }).shortcut}`;
    }
  }
  return null;
}

export function renderTab(state: AppViewState, tab: Tab, showShortcut = true) {
  const href = pathForTab(tab, state.basePath);
  const shortcut = showShortcut ? getTabShortcut(tab) : null;
  return html`
    <a
      href=${href}
      class="nav-item ${state.tab === tab ? "active" : ""}"
      @click=${(event: MouseEvent) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        state.setTab(tab);
      }}
      title=${titleForTab(tab)}
    >
      <span class="nav-item__icon" aria-hidden="true">${icons[iconForTab(tab)]}</span>
      <span class="nav-item__text">${titleForTab(tab)}</span>
      ${shortcut ? html`<span class="nav-item__shortcut">⌘${shortcut}</span>` : nothing}
    </a>
  `;
}

export function renderNavStatus(connected: boolean) {
  const translations = t();
  return html`
    <div class="nav-status">
      <span class="nav-status__dot ${connected ? 'ok' : 'offline'}"></span>
      <span class="nav-status__text">${connected ? translations.common.connected : translations.common.disconnected}</span>
    </div>
  `;
}

export function renderChatControls(state: AppViewState) {
  const mainSessionKey = resolveMainSessionKey(state.hello, state.sessionsResult);
  const sessionOptions = resolveSessionOptions(
    state.sessionKey,
    state.sessionsResult,
    mainSessionKey,
  );
  const disableThinkingToggle = state.onboarding;
  const showThinking = state.onboarding ? false : state.settings.chatShowThinking;
  // Refresh icon
  const refreshIcon = html`
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
    </svg>
  `;
  return html`
    <div class="chat-controls">
      <label class="field chat-controls__session">
        <select
          .value=${state.sessionKey}
          ?disabled=${!state.connected}
          @change=${(e: Event) => {
            const next = (e.target as HTMLSelectElement).value;
            state.sessionKey = next;
            state.chatMessage = "";
            state.chatStream = null;
            state.chatStreamStartedAt = null;
            state.chatRunId = null;
            state.resetToolStream();
            state.resetChatScroll();
            state.applySettings({
              ...state.settings,
              sessionKey: next,
              lastActiveSessionKey: next,
            });
            void state.loadAssistantIdentity();
            syncUrlWithSessionKey(state, next, true);
            void loadChatHistory(state);
          }}
        >
          ${repeat(
            sessionOptions,
            (entry) => entry.key,
            (entry) =>
              html`<option value=${entry.key}>
                ${entry.displayName ?? entry.key}
              </option>`,
          )}
        </select>
      </label>
      ${renderSessionSwitcher({
        open: state.sessionSwitcherOpen,
        currentSessionKey: state.sessionKey,
        sessions: state.sessionsResult,
        connected: state.connected,
        onToggle: () => {
          state.sessionSwitcherOpen = !state.sessionSwitcherOpen;
        },
        onSelect: (key) => {
          state.sessionKey = key;
          state.chatMessage = "";
          state.chatStream = null;
          state.chatStreamStartedAt = null;
          state.chatRunId = null;
          state.resetToolStream();
          state.resetChatScroll();
          state.applySettings({
            ...state.settings,
            sessionKey: key,
            lastActiveSessionKey: key,
          });
          void state.loadAssistantIdentity();
          syncUrlWithSessionKey(state, key, true);
          void loadChatHistory(state);
        },
        onNewSession: () => {
          state.sessionSwitcherOpen = false;
          const newKey = `session-${Date.now()}`;
          state.sessionKey = newKey;
          state.chatMessage = "";
          state.chatStream = null;
          state.chatStreamStartedAt = null;
          state.chatRunId = null;
          state.chatMessages = [];
          state.resetToolStream();
          state.resetChatScroll();
          state.applySettings({
            ...state.settings,
            sessionKey: newKey,
            lastActiveSessionKey: newKey,
          });
          void state.loadAssistantIdentity();
          syncUrlWithSessionKey(state, newKey, true);
        },
        onViewAll: () => {
          state.sessionSwitcherOpen = false;
          state.setTab("sessions");
        },
      })}
      <button
        class="btn btn--sm btn--icon"
        ?disabled=${state.chatLoading || !state.connected}
        @click=${() => {
          state.resetToolStream();
          void refreshChat(state as unknown as Parameters<typeof refreshChat>[0]);
        }}
        title=${t().chat.refreshData}
      >
        ${refreshIcon}
      </button>
      <span class="chat-controls__separator">|</span>
      ${renderMemoryIndicator({
        enabled: state.memoryIndicatorEnabled,
        facts: state.memoryIndicatorFacts,
        totalFacts: state.memoryIndicatorTotal,
        expanded: state.memoryIndicatorExpanded,
        connected: state.connected,
        showThinking,
        disableThinking: disableThinkingToggle,
        onToggle: () => {
          state.memoryIndicatorEnabled = !state.memoryIndicatorEnabled;
          state.memoryIndicatorExpanded = false;
          if (state.client && state.sessionKey) {
            void state.client.request("sessions.patch", {
              key: state.sessionKey,
              memoryEnabled: state.memoryIndicatorEnabled,
            });
          }
        },
        onThinkingToggle: () => {
          if (disableThinkingToggle) return;
          state.applySettings({
            ...state.settings,
            chatShowThinking: !state.settings.chatShowThinking,
          });
        },
        onExpand: () => {
          state.memoryIndicatorExpanded = !state.memoryIndicatorExpanded;
        },
      })}
    </div>
  `;
}

type SessionDefaultsSnapshot = {
  mainSessionKey?: string;
  mainKey?: string;
};

function resolveMainSessionKey(
  hello: AppViewState["hello"],
  sessions: SessionsListResult | null,
): string | null {
  const snapshot = hello?.snapshot as { sessionDefaults?: SessionDefaultsSnapshot } | undefined;
  const mainSessionKey = snapshot?.sessionDefaults?.mainSessionKey?.trim();
  if (mainSessionKey) return mainSessionKey;
  const mainKey = snapshot?.sessionDefaults?.mainKey?.trim();
  if (mainKey) return mainKey;
  if (sessions?.sessions?.some((row) => row.key === "main")) return "main";
  return null;
}

function resolveSessionDisplayName(key: string, row?: SessionsListResult["sessions"][number]) {
  const label = row?.label?.trim();
  if (label) return `${label} (${key})`;
  const displayName = row?.displayName?.trim();
  if (displayName) return displayName;
  return key;
}

function resolveSessionOptions(
  sessionKey: string,
  sessions: SessionsListResult | null,
  mainSessionKey?: string | null,
) {
  const seen = new Set<string>();
  const options: Array<{ key: string; displayName?: string }> = [];

  const resolvedMain = mainSessionKey && sessions?.sessions?.find((s) => s.key === mainSessionKey);
  const resolvedCurrent = sessions?.sessions?.find((s) => s.key === sessionKey);

  // Add main session key first
  if (mainSessionKey) {
    seen.add(mainSessionKey);
    options.push({
      key: mainSessionKey,
      displayName: resolveSessionDisplayName(mainSessionKey, resolvedMain),
    });
  }

  // Add current session key next
  if (!seen.has(sessionKey)) {
    seen.add(sessionKey);
    options.push({
      key: sessionKey,
      displayName: resolveSessionDisplayName(sessionKey, resolvedCurrent),
    });
  }

  // Add sessions from the result
  if (sessions?.sessions) {
    for (const s of sessions.sessions) {
      if (!seen.has(s.key)) {
        seen.add(s.key);
        options.push({
          key: s.key,
          displayName: resolveSessionDisplayName(s.key, s),
        });
      }
    }
  }

  return options;
}

const THEME_ORDER: ThemeMode[] = ["light", "dark"];

export function renderThemeToggle(state: AppViewState) {
  // Map system theme to resolved theme for display
  const effectiveTheme = state.theme === "system" ? state.themeResolved : state.theme;
  const themeIndex = effectiveTheme === "dark" ? 1 : 0;
  const language = state.settings.language || "vi";
  const langIndex = language === "vi" ? 0 : 1;

  const applyTheme = (next: ThemeMode) => (event: MouseEvent) => {
    const element = event.currentTarget as HTMLElement;
    const context: ThemeTransitionContext = { element };
    if (event.clientX || event.clientY) {
      context.pointerClientX = event.clientX;
      context.pointerClientY = event.clientY;
    }
    state.setTheme(next, context);
  };

  const applyLanguage = (lang: Language) => () => {
    setLanguage(lang);
    state.applySettings({
      ...state.settings,
      language: lang,
    });
  };

  return html`
    <div class="settings-toggle" style="--theme-index: ${themeIndex}; --lang-index: ${langIndex};">
      <div class="settings-toggle__track">
        <!-- Language group -->
        <div class="settings-toggle__group" role="group" aria-label="Language">
          <span class="settings-toggle__indicator settings-toggle__indicator--lang"></span>
          <button
            class="settings-toggle__button settings-toggle__button--lang ${language === "vi" ? "active" : ""}"
            @click=${applyLanguage("vi")}
            aria-pressed=${language === "vi"}
            title="Vietnamese"
          >
            VI
          </button>
          <button
            class="settings-toggle__button settings-toggle__button--lang ${language === "en" ? "active" : ""}"
            @click=${applyLanguage("en")}
            aria-pressed=${language === "en"}
            title="English"
          >
            EN
          </button>
        </div>
        <!-- Separator -->
        <span class="settings-toggle__separator"></span>
        <!-- Theme group -->
        <div class="settings-toggle__group" role="group" aria-label="Theme">
          <span class="settings-toggle__indicator settings-toggle__indicator--theme"></span>
          <button
            class="settings-toggle__button ${effectiveTheme === "light" ? "active" : ""}"
            @click=${applyTheme("light")}
            aria-pressed=${effectiveTheme === "light"}
            aria-label=${t().theme.light}
            title="Light"
          >
            ${renderSunIcon()}
          </button>
          <button
            class="settings-toggle__button ${effectiveTheme === "dark" ? "active" : ""}"
            @click=${applyTheme("dark")}
            aria-pressed=${effectiveTheme === "dark"}
            aria-label=${t().theme.dark}
            title="Dark"
          >
            ${renderMoonIcon()}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSunIcon() {
  return html`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  `;
}

function renderMoonIcon() {
  return html`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      ></path>
    </svg>
  `;
}

// Language toggle is now integrated into renderThemeToggle as a unified settings pill
