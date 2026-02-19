const KEY = "openclaw.control.settings.v1";

import type { ThemeMode } from "./theme";
import { setLanguage as setI18nLanguage } from "./i18n";
import type { AgentTab } from "./controllers/agent-tabs";

export type Language = "vi" | "en";

export type UiSettings = {
  gatewayUrl: string;
  token: string;
  sessionKey: string;
  lastActiveSessionKey: string;
  theme: ThemeMode;
  language: Language;
  chatFocusMode: boolean;
  chatShowThinking: boolean;
  splitRatio: number; // Sidebar split ratio (0.4 to 0.7, default 0.6)
  navCollapsed: boolean; // Collapsible sidebar state
  navGroupsCollapsed: Record<string, boolean>; // Which nav groups are collapsed
  sessionsViewMode: "table" | "cards";
  agentTabs: AgentTab[]; // Persisted without unreadCount (starts at 0)
};

export function loadSettings(): UiSettings {
  const defaultUrl = (() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    // In dev mode (Vite on localhost with non-gateway port), use the default gateway port
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const isGatewayPort = location.port === "18789" || location.port === "";
    if (isLocal && !isGatewayPort) {
      return "ws://127.0.0.1:18789";
    }
    return `${proto}://${location.host}`;
  })();

  const defaults: UiSettings = {
    gatewayUrl: defaultUrl,
    token: "",
    sessionKey: "main",
    lastActiveSessionKey: "main",
    theme: "system",
    language: "vi",
    chatFocusMode: false,
    chatShowThinking: true,
    splitRatio: 0.5, // 50/50 split like Claude.ai
    navCollapsed: false,
    navGroupsCollapsed: {},
    sessionsViewMode: "table",
    agentTabs: [],
  };

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      setI18nLanguage(defaults.language);
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<UiSettings>;
    const settings: UiSettings = {
      gatewayUrl: (() => {
        const saved =
          typeof parsed.gatewayUrl === "string" && parsed.gatewayUrl.trim()
            ? parsed.gatewayUrl.trim()
            : defaults.gatewayUrl;
        // Migrate stale dev-server URLs: if saved URL matches current browser
        // host (e.g. ws://localhost:3334 when browsing localhost:3334), it was
        // set by the old default logic and should be replaced with the gateway URL
        const devUrl = `ws://${location.host}`;
        const devUrlSecure = `wss://${location.host}`;
        if (saved === devUrl || saved === devUrlSecure) {
          return defaults.gatewayUrl;
        }
        return saved;
      })(),
      token: typeof parsed.token === "string" ? parsed.token : defaults.token,
      sessionKey:
        typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()
          ? parsed.sessionKey.trim()
          : defaults.sessionKey,
      lastActiveSessionKey:
        typeof parsed.lastActiveSessionKey === "string" && parsed.lastActiveSessionKey.trim()
          ? parsed.lastActiveSessionKey.trim()
          : (typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()) ||
            defaults.lastActiveSessionKey,
      theme:
        parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
          ? parsed.theme
          : defaults.theme,
      language:
        parsed.language === "vi" || parsed.language === "en"
          ? parsed.language
          : defaults.language,
      chatFocusMode:
        typeof parsed.chatFocusMode === "boolean" ? parsed.chatFocusMode : defaults.chatFocusMode,
      chatShowThinking:
        typeof parsed.chatShowThinking === "boolean"
          ? parsed.chatShowThinking
          : defaults.chatShowThinking,
      splitRatio:
        typeof parsed.splitRatio === "number" &&
        parsed.splitRatio >= 0.4 &&
        parsed.splitRatio <= 0.7
          ? parsed.splitRatio
          : defaults.splitRatio,
      navCollapsed:
        typeof parsed.navCollapsed === "boolean" ? parsed.navCollapsed : defaults.navCollapsed,
      navGroupsCollapsed:
        typeof parsed.navGroupsCollapsed === "object" && parsed.navGroupsCollapsed !== null
          ? parsed.navGroupsCollapsed
          : defaults.navGroupsCollapsed,
      sessionsViewMode:
        parsed.sessionsViewMode === "table" || parsed.sessionsViewMode === "cards"
          ? parsed.sessionsViewMode
          : defaults.sessionsViewMode,
      agentTabs:
        Array.isArray(parsed.agentTabs)
          ? (parsed.agentTabs as AgentTab[]).map((t) => ({
              sessionKey: typeof t.sessionKey === "string" ? t.sessionKey : "",
              label: typeof t.label === "string" ? t.label : "",
              preset: typeof t.preset === "string" ? t.preset : "custom",
              unreadCount: 0, // always reset on load
              ...(t.pinned ? { pinned: true as const } : {}),
            } as AgentTab)).filter((t) => t.sessionKey)
          : defaults.agentTabs,
    };
    setI18nLanguage(settings.language);
    return settings;
  } catch {
    setI18nLanguage(defaults.language);
    return defaults;
  }
}

export function saveSettings(next: UiSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
