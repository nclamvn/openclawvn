import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderAgentTabs, type AgentTabsProps } from "./agent-tabs";
import type { AgentTab } from "../controllers/agent-tabs";

function makeTabs(): AgentTab[] {
  return [
    { sessionKey: "code-abc", label: "Code", preset: "code", unreadCount: 0 },
    { sessionKey: "writer-def", label: "Writer", preset: "writer", unreadCount: 3 },
    { sessionKey: "research-ghi", label: "Research", preset: "research", unreadCount: 0 },
  ];
}

function createProps(overrides: Partial<AgentTabsProps> = {}): AgentTabsProps {
  return {
    tabs: makeTabs(),
    activeSessionKey: "code-abc",
    connected: true,
    presetPickerOpen: false,
    onTabSelect: vi.fn(),
    onTabClose: vi.fn(),
    onTabRename: vi.fn(),
    onNewTab: vi.fn(),
    onPresetSelect: vi.fn(),
    onPresetPickerClose: vi.fn(),
    ...overrides,
  };
}

function renderToContainer(props: AgentTabsProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderAgentTabs(props), container);
  return container;
}

describe("agent-tabs component", () => {
  it("renders correct number of tabs", () => {
    const container = renderToContainer(createProps());
    const tabs = container.querySelectorAll(".agent-tab");
    expect(tabs.length).toBe(3);
  });

  it("marks active tab with correct class", () => {
    const container = renderToContainer(createProps({ activeSessionKey: "writer-def" }));
    const activeTabs = container.querySelectorAll(".agent-tab--active");
    expect(activeTabs.length).toBe(1);
  });

  it("shows unread badge when count > 0", () => {
    const container = renderToContainer(createProps());
    const badges = container.querySelectorAll(".agent-tab__unread");
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toBe("3");
  });

  it("hides unread badge when count is 0", () => {
    const props = createProps({
      tabs: [{ sessionKey: "x", label: "X", preset: "code", unreadCount: 0 }],
    });
    const container = renderToContainer(props);
    const badges = container.querySelectorAll(".agent-tab__unread");
    expect(badges.length).toBe(0);
  });

  it("renders add button", () => {
    const container = renderToContainer(createProps());
    const addBtn = container.querySelector(".agent-tab__add");
    expect(addBtn).not.toBeNull();
  });

  it("calls onNewTab when add button clicked", () => {
    const onNewTab = vi.fn();
    const container = renderToContainer(createProps({ onNewTab }));
    const addBtn = container.querySelector(".agent-tab__add") as HTMLButtonElement;
    addBtn.click();
    expect(onNewTab).toHaveBeenCalledOnce();
  });

  it("calls onTabSelect when tab clicked", () => {
    const onTabSelect = vi.fn();
    const container = renderToContainer(createProps({ onTabSelect }));
    const tabs = container.querySelectorAll(".agent-tab");
    (tabs[1] as HTMLElement).click();
    expect(onTabSelect).toHaveBeenCalledWith("writer-def");
  });

  it("renders preset picker when open", () => {
    const container = renderToContainer(createProps({ presetPickerOpen: true }));
    const picker = container.querySelector(".agent-preset-picker");
    expect(picker).not.toBeNull();
    const items = container.querySelectorAll(".agent-preset-picker__item");
    expect(items.length).toBe(5); // 5 presets
  });

  it("hides preset picker when closed", () => {
    const container = renderToContainer(createProps({ presetPickerOpen: false }));
    const picker = container.querySelector(".agent-preset-picker");
    expect(picker).toBeNull();
  });

  it("calls onTabClose when close button clicked", () => {
    const onTabClose = vi.fn();
    const container = renderToContainer(createProps({ onTabClose }));
    const closeBtn = container.querySelector(".agent-tab__close") as HTMLButtonElement;
    closeBtn.click();
    expect(onTabClose).toHaveBeenCalledWith("code-abc");
  });

  it("does not render close button when only one tab", () => {
    const props = createProps({
      tabs: [{ sessionKey: "only", label: "Only", preset: "code", unreadCount: 0 }],
    });
    const container = renderToContainer(props);
    const closeBtns = container.querySelectorAll(".agent-tab__close");
    expect(closeBtns.length).toBe(0);
  });

  it("disables add button when disconnected", () => {
    const container = renderToContainer(createProps({ connected: false }));
    const addBtn = container.querySelector(".agent-tab__add") as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it("renders pin button on each tab when onTabPin provided", () => {
    const container = renderToContainer(createProps({ onTabPin: vi.fn(), onTabUnpin: vi.fn() }));
    const pinBtns = container.querySelectorAll(".agent-tab__pin");
    expect(pinBtns.length).toBe(3);
  });

  it("does not render pin button when onTabPin not provided", () => {
    const container = renderToContainer(createProps());
    const pinBtns = container.querySelectorAll(".agent-tab__pin");
    expect(pinBtns.length).toBe(0);
  });

  it("calls onTabPin when pin button clicked on unpinned tab", () => {
    const onTabPin = vi.fn();
    const container = renderToContainer(createProps({ onTabPin, onTabUnpin: vi.fn() }));
    const pinBtns = container.querySelectorAll(".agent-tab__pin");
    (pinBtns[0] as HTMLButtonElement).click();
    expect(onTabPin).toHaveBeenCalledWith("code-abc");
  });

  it("calls onTabUnpin when pin button clicked on pinned tab", () => {
    const onTabUnpin = vi.fn();
    const tabs = makeTabs();
    tabs[0].pinned = true;
    const container = renderToContainer(createProps({ tabs, onTabPin: vi.fn(), onTabUnpin }));
    const pinBtns = container.querySelectorAll(".agent-tab__pin");
    (pinBtns[0] as HTMLButtonElement).click();
    expect(onTabUnpin).toHaveBeenCalledWith("code-abc");
  });

  it("pinned tab has .agent-tab--pinned class", () => {
    const tabs = makeTabs();
    tabs[1].pinned = true;
    const container = renderToContainer(createProps({ tabs, onTabPin: vi.fn(), onTabUnpin: vi.fn() }));
    const pinnedTabs = container.querySelectorAll(".agent-tab--pinned");
    expect(pinnedTabs.length).toBe(1);
  });
});
