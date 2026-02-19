import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { t } from "../i18n";
import type { GatewaySessionRow, SessionsListResult } from "../types";
import { renderSessionSwitcher, type SessionSwitcherProps } from "./session-switcher";

function createSession(
  key: string,
  overrides: Partial<GatewaySessionRow> = {},
): GatewaySessionRow {
  return {
    key,
    kind: "direct",
    updatedAt: Date.now() - 60_000,
    label: `Session ${key}`,
    ...overrides,
  };
}

function createSessions(count: number): SessionsListResult {
  const sessions: GatewaySessionRow[] = [];
  for (let i = 0; i < count; i++) {
    sessions.push(createSession(`session-${i}`));
  }
  return { count, path: "/tmp/sessions", sessions };
}

function createProps(overrides: Partial<SessionSwitcherProps> = {}): SessionSwitcherProps {
  return {
    open: false,
    currentSessionKey: "session-0",
    sessions: createSessions(3),
    connected: true,
    onToggle: vi.fn(),
    onSelect: vi.fn(),
    onNewSession: vi.fn(),
    onViewAll: vi.fn(),
    ...overrides,
  };
}

function renderToContainer(props: SessionSwitcherProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderSessionSwitcher(props), container);
  return container;
}

describe("session-switcher", () => {
  it("renders trigger button", () => {
    const container = renderToContainer(createProps());
    const trigger = container.querySelector(".session-switcher__trigger");
    expect(trigger).not.toBeNull();
  });

  it("disables trigger when disconnected", () => {
    const container = renderToContainer(createProps({ connected: false }));
    const trigger = container.querySelector<HTMLButtonElement>(".session-switcher__trigger");
    expect(trigger?.disabled).toBe(true);
  });

  it("does not show panel when closed", () => {
    const container = renderToContainer(createProps({ open: false }));
    const panel = container.querySelector(".session-switcher__panel");
    expect(panel).toBeNull();
  });

  it("shows panel when open", () => {
    const container = renderToContainer(createProps({ open: true }));
    const panel = container.querySelector(".session-switcher__panel");
    expect(panel).not.toBeNull();
  });

  it("shows recent sessions header", () => {
    const container = renderToContainer(createProps({ open: true }));
    const header = container.querySelector(".session-switcher__header");
    expect(header?.textContent?.trim()).toBe(t().sessions.switcher.recentSessions);
  });

  it("lists session items when open", () => {
    const container = renderToContainer(createProps({ open: true }));
    const items = container.querySelectorAll(".session-switcher__item");
    expect(items.length).toBe(3);
  });

  it("shows empty message when no sessions", () => {
    const container = renderToContainer(
      createProps({ open: true, sessions: createSessions(0) }),
    );
    const empty = container.querySelector(".session-switcher__empty");
    expect(empty?.textContent?.trim()).toBe(t().sessions.switcher.noSessions);
  });

  it("shows empty message when sessions is null", () => {
    const container = renderToContainer(
      createProps({ open: true, sessions: null }),
    );
    const empty = container.querySelector(".session-switcher__empty");
    expect(empty?.textContent?.trim()).toBe(t().sessions.switcher.noSessions);
  });

  it("marks current session item", () => {
    const container = renderToContainer(
      createProps({ open: true, currentSessionKey: "session-1" }),
    );
    const items = container.querySelectorAll(".session-switcher__item");
    const currentItem = container.querySelector(".session-switcher__item--current");
    expect(currentItem).not.toBeNull();
    // Second item should be current (session-1)
    expect(items[1]?.classList.contains("session-switcher__item--current")).toBe(true);
  });

  it("shows current badge on current session", () => {
    const container = renderToContainer(
      createProps({ open: true, currentSessionKey: "session-0" }),
    );
    const badge = container.querySelector(".session-switcher__current-badge");
    expect(badge?.textContent?.trim()).toBe(t().sessions.switcher.current);
  });

  it("calls onSelect when clicking a non-current session", () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    const container = renderToContainer(
      createProps({ open: true, currentSessionKey: "session-0", onSelect, onToggle }),
    );
    const items = container.querySelectorAll<HTMLButtonElement>(".session-switcher__item");
    // Click session-1 (not current)
    items[1]?.click();
    expect(onSelect).toHaveBeenCalledWith("session-1");
    expect(onToggle).toHaveBeenCalled();
  });

  it("does not call onSelect when clicking current session", () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    const container = renderToContainer(
      createProps({ open: true, currentSessionKey: "session-0", onSelect, onToggle }),
    );
    const items = container.querySelectorAll<HTMLButtonElement>(".session-switcher__item");
    items[0]?.click();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled(); // Still closes
  });

  it("calls onToggle when trigger clicked", () => {
    const onToggle = vi.fn();
    const container = renderToContainer(createProps({ onToggle }));
    const trigger = container.querySelector<HTMLButtonElement>(".session-switcher__trigger");
    trigger?.click();
    expect(onToggle).toHaveBeenCalled();
  });

  it("calls onNewSession when new session button clicked", () => {
    const onNewSession = vi.fn();
    const container = renderToContainer(createProps({ open: true, onNewSession }));
    const actions = container.querySelectorAll<HTMLButtonElement>(".session-switcher__action");
    // First action is "New session"
    actions[0]?.click();
    expect(onNewSession).toHaveBeenCalled();
  });

  it("calls onViewAll when view all button clicked", () => {
    const onViewAll = vi.fn();
    const container = renderToContainer(createProps({ open: true, onViewAll }));
    const actions = container.querySelectorAll<HTMLButtonElement>(".session-switcher__action");
    // Second action is "View all"
    actions[1]?.click();
    expect(onViewAll).toHaveBeenCalled();
  });

  it("renders backdrop when open", () => {
    const container = renderToContainer(createProps({ open: true }));
    const backdrop = container.querySelector(".session-switcher__backdrop");
    expect(backdrop).not.toBeNull();
  });

  it("calls onToggle when backdrop clicked", () => {
    const onToggle = vi.fn();
    const container = renderToContainer(createProps({ open: true, onToggle }));
    const backdrop = container.querySelector<HTMLElement>(".session-switcher__backdrop");
    backdrop?.click();
    expect(onToggle).toHaveBeenCalled();
  });

  it("limits to 5 recent sessions", () => {
    const container = renderToContainer(
      createProps({ open: true, sessions: createSessions(10) }),
    );
    const items = container.querySelectorAll(".session-switcher__item");
    expect(items.length).toBe(5);
  });

  it("excludes global sessions", () => {
    const sessions: SessionsListResult = {
      count: 3,
      path: "/tmp/sessions",
      sessions: [
        createSession("s1"),
        createSession("global-1", { kind: "global" }),
        createSession("s2"),
      ],
    };
    const container = renderToContainer(
      createProps({ open: true, sessions }),
    );
    const items = container.querySelectorAll(".session-switcher__item");
    expect(items.length).toBe(2);
  });

  it("adds open class when open", () => {
    const container = renderToContainer(createProps({ open: true }));
    const switcher = container.querySelector(".session-switcher");
    expect(switcher?.classList.contains("session-switcher--open")).toBe(true);
  });

  it("does not add open class when closed", () => {
    const container = renderToContainer(createProps({ open: false }));
    const switcher = container.querySelector(".session-switcher");
    expect(switcher?.classList.contains("session-switcher--open")).toBe(false);
  });
});
