import { describe, expect, it } from "vitest";

import {
  createTab,
  removeTab,
  switchTab,
  incrementUnread,
  renameTab,
  ensureCurrentTab,
  generateSessionKey,
  serializeTabsForStorage,
  pinTab,
  unpinTab,
  getPinnedTabs,
  isSplitActive,
  type AgentTab,
} from "./agent-tabs";

function makeTabs(): AgentTab[] {
  return [
    { sessionKey: "code-abc", label: "Code", preset: "code", unreadCount: 0 },
    { sessionKey: "writer-def", label: "Writer", preset: "writer", unreadCount: 3 },
    { sessionKey: "research-ghi", label: "Research", preset: "research", unreadCount: 0 },
  ];
}

describe("agent-tabs controller", () => {
  describe("generateSessionKey", () => {
    it("produces unique keys with preset prefix", () => {
      const a = generateSessionKey("code");
      const b = generateSessionKey("code");
      expect(a).toMatch(/^code-/);
      expect(b).toMatch(/^code-/);
      expect(a).not.toBe(b);
    });
  });

  describe("createTab", () => {
    it("creates tab with generated session key", () => {
      const tab = createTab("writer");
      expect(tab.sessionKey).toMatch(/^writer-/);
      expect(tab.preset).toBe("writer");
      expect(tab.unreadCount).toBe(0);
      expect(tab.label).toBe("agentTabs.presets.writer");
    });

    it("uses provided session key when given", () => {
      const tab = createTab("code", "my-session");
      expect(tab.sessionKey).toBe("my-session");
      expect(tab.preset).toBe("code");
    });
  });

  describe("removeTab", () => {
    it("removes tab by sessionKey", () => {
      const tabs = makeTabs();
      const result = removeTab(tabs, "writer-def");
      expect(result).toHaveLength(2);
      expect(result.find((t) => t.sessionKey === "writer-def")).toBeUndefined();
    });

    it("returns same array when key not found", () => {
      const tabs = makeTabs();
      const result = removeTab(tabs, "nonexistent");
      expect(result).toHaveLength(3);
    });
  });

  describe("switchTab", () => {
    it("clears unread count for target tab", () => {
      const tabs = makeTabs();
      const result = switchTab(tabs, "writer-def");
      const writer = result.find((t) => t.sessionKey === "writer-def");
      expect(writer?.unreadCount).toBe(0);
    });

    it("leaves other tabs unchanged", () => {
      const tabs = makeTabs();
      const result = switchTab(tabs, "writer-def");
      const code = result.find((t) => t.sessionKey === "code-abc");
      expect(code?.unreadCount).toBe(0);
    });
  });

  describe("incrementUnread", () => {
    it("increments only the target tab", () => {
      const tabs = makeTabs();
      const result = incrementUnread(tabs, "code-abc");
      expect(result.find((t) => t.sessionKey === "code-abc")?.unreadCount).toBe(1);
      expect(result.find((t) => t.sessionKey === "writer-def")?.unreadCount).toBe(3);
    });

    it("handles multiple increments", () => {
      let tabs = makeTabs();
      tabs = incrementUnread(tabs, "code-abc");
      tabs = incrementUnread(tabs, "code-abc");
      expect(tabs.find((t) => t.sessionKey === "code-abc")?.unreadCount).toBe(2);
    });
  });

  describe("renameTab", () => {
    it("updates label for target tab", () => {
      const tabs = makeTabs();
      const result = renameTab(tabs, "code-abc", "My Project");
      expect(result.find((t) => t.sessionKey === "code-abc")?.label).toBe("My Project");
    });

    it("does not affect other tabs", () => {
      const tabs = makeTabs();
      const result = renameTab(tabs, "code-abc", "My Project");
      expect(result.find((t) => t.sessionKey === "writer-def")?.label).toBe("Writer");
    });
  });

  describe("ensureCurrentTab", () => {
    it("returns tabs unchanged when current session exists", () => {
      const tabs = makeTabs();
      const result = ensureCurrentTab(tabs, "code-abc");
      expect(result).toHaveLength(3);
    });

    it("adds default tab when current session is missing", () => {
      const tabs = makeTabs();
      const result = ensureCurrentTab(tabs, "new-session");
      expect(result).toHaveLength(4);
      const added = result.find((t) => t.sessionKey === "new-session");
      expect(added).toBeDefined();
      expect(added?.preset).toBe("custom");
    });
  });

  describe("serializeTabsForStorage", () => {
    it("strips unreadCount from all tabs", () => {
      const tabs = makeTabs();
      const result = serializeTabsForStorage(tabs);
      for (const tab of result) {
        expect(tab.unreadCount).toBe(0);
      }
    });

    it("preserves other fields", () => {
      const tabs = makeTabs();
      const result = serializeTabsForStorage(tabs);
      expect(result[0].sessionKey).toBe("code-abc");
      expect(result[0].label).toBe("Code");
      expect(result[0].preset).toBe("code");
    });

    it("preserves pinned field", () => {
      const tabs = makeTabs();
      tabs[0].pinned = true;
      tabs[1].pinned = true;
      const result = serializeTabsForStorage(tabs);
      expect(result[0].pinned).toBe(true);
      expect(result[1].pinned).toBe(true);
      expect(result[2].pinned).toBeUndefined();
    });
  });

  describe("pinTab", () => {
    it("sets pinned=true on target tab", () => {
      const tabs = makeTabs();
      const result = pinTab(tabs, "code-abc");
      const target = result.find((t) => t.sessionKey === "code-abc");
      expect(target?.pinned).toBe(true);
    });

    it("does not affect other tabs", () => {
      const tabs = makeTabs();
      const result = pinTab(tabs, "code-abc");
      const other = result.find((t) => t.sessionKey === "writer-def");
      expect(other?.pinned).toBeUndefined();
    });

    it("auto-unpins oldest when already 2 pinned (max 2 enforced)", () => {
      let tabs = makeTabs();
      tabs = pinTab(tabs, "code-abc");
      tabs = pinTab(tabs, "writer-def");
      // Now pin a third — should unpin code-abc (first pinned)
      tabs = pinTab(tabs, "research-ghi");
      const pinned = getPinnedTabs(tabs);
      expect(pinned).toHaveLength(2);
      expect(pinned.find((t) => t.sessionKey === "code-abc")).toBeUndefined();
      expect(pinned.find((t) => t.sessionKey === "writer-def")).toBeDefined();
      expect(pinned.find((t) => t.sessionKey === "research-ghi")).toBeDefined();
    });
  });

  describe("unpinTab", () => {
    it("removes pinned from target tab", () => {
      let tabs = makeTabs();
      tabs = pinTab(tabs, "code-abc");
      tabs = unpinTab(tabs, "code-abc");
      const target = tabs.find((t) => t.sessionKey === "code-abc");
      expect(target?.pinned).toBeUndefined();
    });
  });

  describe("getPinnedTabs", () => {
    it("filters to only pinned tabs", () => {
      let tabs = makeTabs();
      tabs = pinTab(tabs, "code-abc");
      tabs = pinTab(tabs, "writer-def");
      const pinned = getPinnedTabs(tabs);
      expect(pinned).toHaveLength(2);
      expect(pinned[0].sessionKey).toBe("code-abc");
      expect(pinned[1].sessionKey).toBe("writer-def");
    });

    it("returns empty when none pinned", () => {
      const tabs = makeTabs();
      expect(getPinnedTabs(tabs)).toHaveLength(0);
    });
  });

  describe("isSplitActive", () => {
    it("returns true when exactly 2 pinned", () => {
      let tabs = makeTabs();
      tabs = pinTab(tabs, "code-abc");
      tabs = pinTab(tabs, "writer-def");
      expect(isSplitActive(tabs)).toBe(true);
    });

    it("returns false when less than 2 pinned", () => {
      let tabs = makeTabs();
      tabs = pinTab(tabs, "code-abc");
      expect(isSplitActive(tabs)).toBe(false);
    });

    it("returns false when none pinned", () => {
      const tabs = makeTabs();
      expect(isSplitActive(tabs)).toBe(false);
    });
  });
});
