import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderMemoryIndicator, type MemoryIndicatorProps } from "./memory-indicator";
import { t } from "../i18n";
import type { UserFact } from "../types";

function createFact(id: string, overrides: Partial<UserFact> = {}): UserFact {
  return {
    id,
    category: "fact",
    content: `Fact ${id}`,
    confidence: 0.85,
    source: { sessionId: "sess-1", extractedAt: "2026-01-01T00:00:00Z" },
    verified: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createProps(overrides: Partial<MemoryIndicatorProps> = {}): MemoryIndicatorProps {
  return {
    enabled: true,
    facts: [createFact("f1"), createFact("f2")],
    totalFacts: 5,
    expanded: false,
    connected: true,
    showThinking: false,
    disableThinking: false,
    onToggle: () => undefined,
    onThinkingToggle: () => undefined,
    onExpand: () => undefined,
    ...overrides,
  };
}

describe("memory-indicator", () => {
  it("renders off state when disabled", () => {
    const container = document.createElement("div");
    render(renderMemoryIndicator(createProps({ enabled: false })), container);
    expect(container.textContent).toContain(t().memory.indicatorOff);
  });

  it("renders empty state when no facts", () => {
    const container = document.createElement("div");
    render(
      renderMemoryIndicator(createProps({ facts: [], totalFacts: 0 })),
      container,
    );
    expect(container.textContent).toContain(t().memory.indicatorNone);
  });

  it("renders active state with count badge", () => {
    const container = document.createElement("div");
    render(renderMemoryIndicator(createProps()), container);
    const badge = container.querySelector(".memory-indicator__badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent?.trim()).toBe("2");
  });

  it("shows expanded panel when expanded", () => {
    const container = document.createElement("div");
    render(
      renderMemoryIndicator(createProps({ expanded: true })),
      container,
    );
    const panel = container.querySelector(".memory-indicator__panel");
    expect(panel).not.toBeNull();
    expect(container.textContent).toContain("Fact f1");
    expect(container.textContent).toContain("Fact f2");
  });

  it("does not show panel when collapsed", () => {
    const container = document.createElement("div");
    render(
      renderMemoryIndicator(createProps({ expanded: false })),
      container,
    );
    const panel = container.querySelector(".memory-indicator__panel");
    expect(panel).toBeNull();
  });

  it("renders single brain icon", () => {
    const container = document.createElement("div");
    render(renderMemoryIndicator(createProps()), container);
    const brainBtn = container.querySelector(".memory-indicator__brain");
    expect(brainBtn).not.toBeNull();
  });

  it("calls onThinkingToggle when brain icon clicked", () => {
    const container = document.createElement("div");
    const onThinkingToggle = vi.fn();
    render(renderMemoryIndicator(createProps({ onThinkingToggle })), container);
    const brainBtn = container.querySelector(".memory-indicator__brain") as HTMLButtonElement;
    brainBtn?.click();
    expect(onThinkingToggle).toHaveBeenCalled();
  });

  it("calls onToggle when label button clicked (off state)", () => {
    const container = document.createElement("div");
    const onToggle = vi.fn();
    render(renderMemoryIndicator(createProps({ enabled: false, onToggle })), container);
    const labelBtn = container.querySelector(".memory-indicator__label-btn") as HTMLButtonElement;
    labelBtn?.click();
    expect(onToggle).toHaveBeenCalled();
  });

  it("calls onExpand when badge clicked", () => {
    const container = document.createElement("div");
    const onExpand = vi.fn();
    render(renderMemoryIndicator(createProps({ onExpand })), container);
    const badge = container.querySelector(".memory-indicator__badge") as HTMLButtonElement;
    badge?.click();
    expect(onExpand).toHaveBeenCalled();
  });

  it("disables label button when not connected", () => {
    const container = document.createElement("div");
    render(
      renderMemoryIndicator(createProps({ enabled: false, connected: false })),
      container,
    );
    const labelBtn = container.querySelector(".memory-indicator__label-btn") as HTMLButtonElement;
    expect(labelBtn?.disabled).toBe(true);
  });

  it("marks brain icon active when thinking is shown", () => {
    const container = document.createElement("div");
    render(renderMemoryIndicator(createProps({ showThinking: true })), container);
    const brainBtn = container.querySelector(".memory-indicator__brain");
    expect(brainBtn?.classList.contains("active")).toBe(true);
  });

  it("shows category in expanded panel items", () => {
    const container = document.createElement("div");
    render(
      renderMemoryIndicator(
        createProps({
          expanded: true,
          facts: [createFact("f1", { category: "identity" })],
        }),
      ),
      container,
    );
    expect(container.textContent).toContain("identity");
  });

  it("renders panel header with title", () => {
    const container = document.createElement("div");
    render(
      renderMemoryIndicator(createProps({ expanded: true })),
      container,
    );
    const header = container.querySelector(".memory-indicator__panel-header");
    expect(header).not.toBeNull();
    expect(header?.textContent).toContain(t().memory.title);
  });
});
