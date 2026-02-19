import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { t } from "../i18n";
import type { GatewaySessionRow, SessionsListResult } from "../types";
import { renderSessions, type SessionsProps } from "./sessions";

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

function createResult(count = 2): SessionsListResult {
  const sessions: GatewaySessionRow[] = [];
  for (let i = 0; i < count; i++) {
    sessions.push(createSession(`s-${i}`));
  }
  return { count, path: "/tmp/sessions", sessions };
}

function createProps(overrides: Partial<SessionsProps> = {}): SessionsProps {
  return {
    loading: false,
    result: createResult(),
    error: null,
    activeMinutes: "60",
    limit: "50",
    includeGlobal: false,
    includeUnknown: false,
    basePath: "/",
    viewMode: "table",
    currentSessionKey: "s-0",
    onFiltersChange: vi.fn(),
    onRefresh: vi.fn(),
    onViewModeChange: vi.fn(),
    onResume: vi.fn(),
    onPatch: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

function renderToContainer(props: SessionsProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderSessions(props), container);
  return container;
}

describe("sessions view", () => {
  it("renders table view by default", () => {
    const container = renderToContainer(createProps());
    expect(container.querySelector(".table")).not.toBeNull();
    expect(container.querySelector(".session-cards-grid")).toBeNull();
  });

  it("renders cards view when viewMode is cards", () => {
    const container = renderToContainer(createProps({ viewMode: "cards" }));
    expect(container.querySelector(".session-cards-grid")).not.toBeNull();
    expect(container.querySelector(".table")).toBeNull();
  });

  it("renders view toggle buttons", () => {
    const container = renderToContainer(createProps());
    const toggleBtns = container.querySelectorAll(".sessions-view-toggle__btn");
    expect(toggleBtns.length).toBe(2);
  });

  it("marks table toggle active in table mode", () => {
    const container = renderToContainer(createProps({ viewMode: "table" }));
    const toggleBtns = container.querySelectorAll(".sessions-view-toggle__btn");
    expect(toggleBtns[0]?.classList.contains("sessions-view-toggle__btn--active")).toBe(true);
    expect(toggleBtns[1]?.classList.contains("sessions-view-toggle__btn--active")).toBe(false);
  });

  it("marks cards toggle active in cards mode", () => {
    const container = renderToContainer(createProps({ viewMode: "cards" }));
    const toggleBtns = container.querySelectorAll(".sessions-view-toggle__btn");
    expect(toggleBtns[0]?.classList.contains("sessions-view-toggle__btn--active")).toBe(false);
    expect(toggleBtns[1]?.classList.contains("sessions-view-toggle__btn--active")).toBe(true);
  });

  it("calls onViewModeChange when toggle clicked", () => {
    const onViewModeChange = vi.fn();
    const container = renderToContainer(createProps({ onViewModeChange }));
    const toggleBtns = container.querySelectorAll<HTMLButtonElement>(".sessions-view-toggle__btn");
    // Click cards button
    toggleBtns[1]?.click();
    expect(onViewModeChange).toHaveBeenCalledWith("cards");
  });

  it("shows session cards in cards mode", () => {
    const container = renderToContainer(createProps({ viewMode: "cards" }));
    const cards = container.querySelectorAll(".session-card");
    expect(cards.length).toBe(2);
  });

  it("shows empty message in table mode when no sessions", () => {
    const container = renderToContainer(
      createProps({ result: createResult(0) }),
    );
    expect(container.textContent).toContain(t().sessions.empty);
  });

  it("shows empty message in cards mode when no sessions", () => {
    const container = renderToContainer(
      createProps({ viewMode: "cards", result: createResult(0) }),
    );
    expect(container.textContent).toContain(t().sessions.empty);
  });

  it("shows error callout", () => {
    const container = renderToContainer(
      createProps({ error: "Connection failed" }),
    );
    const callout = container.querySelector(".callout.danger");
    expect(callout?.textContent).toContain("Connection failed");
  });

  it("shows loading text on refresh button", () => {
    const container = renderToContainer(createProps({ loading: true }));
    const btn = container.querySelector<HTMLButtonElement>(".btn[disabled]");
    expect(btn?.textContent?.trim()).toBe(t().common.loading);
  });

  it("shows store path", () => {
    const container = renderToContainer(createProps());
    expect(container.textContent).toContain("/tmp/sessions");
  });
});
