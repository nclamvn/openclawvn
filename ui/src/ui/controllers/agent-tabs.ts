// Agent tab management: types + pure functions

export type AgentPreset = "code" | "writer" | "research" | "translator" | "custom";

export type AgentTab = {
  sessionKey: string;
  label: string;
  preset: AgentPreset;
  unreadCount: number;
  pinned?: boolean;
};

export const AGENT_PRESETS: Record<AgentPreset, { labelKey: string; icon: string }> = {
  code: { labelKey: "agentTabs.presets.code", icon: "code" },
  writer: { labelKey: "agentTabs.presets.writer", icon: "penLine" },
  research: { labelKey: "agentTabs.presets.research", icon: "search" },
  translator: { labelKey: "agentTabs.presets.translator", icon: "globe" },
  custom: { labelKey: "agentTabs.presets.custom", icon: "sparkles" },
};

export function generateSessionKey(preset: AgentPreset): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${preset}-${suffix}`;
}

export function createTab(preset: AgentPreset, sessionKey?: string): AgentTab {
  const key = sessionKey ?? generateSessionKey(preset);
  const meta = AGENT_PRESETS[preset];
  // Use the preset name as default label (i18n resolved at render time)
  return {
    sessionKey: key,
    label: meta.labelKey,
    preset,
    unreadCount: 0,
  };
}

export function removeTab(tabs: AgentTab[], sessionKey: string): AgentTab[] {
  return tabs.filter((t) => t.sessionKey !== sessionKey);
}

export function switchTab(tabs: AgentTab[], sessionKey: string): AgentTab[] {
  return tabs.map((t) =>
    t.sessionKey === sessionKey ? { ...t, unreadCount: 0 } : t,
  );
}

export function incrementUnread(tabs: AgentTab[], sessionKey: string): AgentTab[] {
  return tabs.map((t) =>
    t.sessionKey === sessionKey ? { ...t, unreadCount: t.unreadCount + 1 } : t,
  );
}

export function renameTab(tabs: AgentTab[], sessionKey: string, label: string): AgentTab[] {
  return tabs.map((t) =>
    t.sessionKey === sessionKey ? { ...t, label } : t,
  );
}

export function ensureCurrentTab(tabs: AgentTab[], currentSessionKey: string): AgentTab[] {
  if (tabs.some((t) => t.sessionKey === currentSessionKey)) return tabs;
  return [...tabs, createTab("custom", currentSessionKey)];
}

export function pinTab(tabs: AgentTab[], sessionKey: string): AgentTab[] {
  const alreadyPinned = tabs.filter((t) => t.pinned);
  let result = tabs;
  // If already 2 pinned, unpin the first (oldest) one
  if (alreadyPinned.length >= 2) {
    result = result.map((t) =>
      t.sessionKey === alreadyPinned[0].sessionKey ? { ...t, pinned: undefined } : t,
    );
  }
  return result.map((t) =>
    t.sessionKey === sessionKey ? { ...t, pinned: true } : t,
  );
}

export function unpinTab(tabs: AgentTab[], sessionKey: string): AgentTab[] {
  return tabs.map((t) =>
    t.sessionKey === sessionKey ? { ...t, pinned: undefined } : t,
  );
}

export function getPinnedTabs(tabs: AgentTab[]): AgentTab[] {
  return tabs.filter((t) => t.pinned === true);
}

export function isSplitActive(tabs: AgentTab[]): boolean {
  return getPinnedTabs(tabs).length === 2;
}

/** Strip runtime-only fields before persisting. */
export function serializeTabsForStorage(tabs: AgentTab[]): AgentTab[] {
  return tabs.map((t) => {
    const serialized: AgentTab = { ...t, unreadCount: 0 };
    if (t.pinned) serialized.pinned = true;
    return serialized;
  });
}
