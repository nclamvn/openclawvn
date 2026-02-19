import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderMemory, type MemoryViewProps } from "./memory-view";
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

function createProps(overrides: Partial<MemoryViewProps> = {}): MemoryViewProps {
  return {
    loading: false,
    facts: [],
    error: null,
    filter: "all",
    search: "",
    editingId: null,
    editDraft: "",
    extracting: false,
    extractStatus: "idle",
    sessionKey: "main",
    connected: true,
    onRefresh: () => undefined,
    onSearch: () => undefined,
    onFilterChange: () => undefined,
    onEdit: () => undefined,
    onEditDraftChange: () => undefined,
    onSave: () => undefined,
    onCancel: () => undefined,
    onDelete: () => undefined,
    onVerify: () => undefined,
    onExtract: () => undefined,
    ...overrides,
  };
}

describe("memory view", () => {
  it("renders title", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps()), container);
    expect(container.textContent).toContain(t().memory.title);
  });

  it("shows empty state when no facts", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps()), container);
    expect(container.textContent).toContain(t().memory.empty);
  });

  it("renders facts when present", () => {
    const container = document.createElement("div");
    render(
      renderMemory(createProps({ facts: [createFact("f1"), createFact("f2")] })),
      container,
    );
    expect(container.textContent).toContain("Fact f1");
    expect(container.textContent).toContain("Fact f2");
  });

  it("filters facts by category", () => {
    const container = document.createElement("div");
    render(
      renderMemory(
        createProps({
          filter: "identity",
          facts: [
            createFact("f1", { category: "identity" }),
            createFact("f2", { category: "project" }),
          ],
        }),
      ),
      container,
    );
    expect(container.textContent).toContain("Fact f1");
    expect(container.textContent).not.toContain("Fact f2");
  });

  it("shows all facts when filter is 'all'", () => {
    const container = document.createElement("div");
    render(
      renderMemory(
        createProps({
          filter: "all",
          facts: [
            createFact("f1", { category: "identity" }),
            createFact("f2", { category: "project" }),
          ],
        }),
      ),
      container,
    );
    expect(container.textContent).toContain("Fact f1");
    expect(container.textContent).toContain("Fact f2");
  });

  it("shows error callout", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps({ error: "Something went wrong" })), container);
    expect(container.textContent).toContain("Something went wrong");
  });

  it("shows loading state", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps({ loading: true })), container);
    expect(container.textContent).toContain(t().common.loading);
  });

  it("renders search input", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps()), container);
    const input = container.querySelector(".memory-search__input") as HTMLInputElement;
    expect(input).not.toBeNull();
  });

  it("renders category filter tabs", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps()), container);
    const tabs = container.querySelectorAll(".memory-filter-tab");
    expect(tabs.length).toBe(7);
  });

  it("calls onFilterChange when tab clicked", () => {
    const container = document.createElement("div");
    const onFilterChange = vi.fn();
    render(renderMemory(createProps({ onFilterChange })), container);
    const tabs = container.querySelectorAll(".memory-filter-tab");
    (tabs[1] as HTMLButtonElement).click();
    expect(onFilterChange).toHaveBeenCalledWith("identity");
  });

  it("calls onExtract when extract button clicked", () => {
    const container = document.createElement("div");
    const onExtract = vi.fn();
    render(renderMemory(createProps({ onExtract })), container);
    const buttons = container.querySelectorAll("button.btn");
    const extractBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(t().memory.extractButton),
    );
    (extractBtn as HTMLButtonElement)?.click();
    expect(onExtract).toHaveBeenCalledWith("main");
  });

  it("shows extracting label during extraction", () => {
    const container = document.createElement("div");
    render(
      renderMemory(createProps({ extracting: true, extractStatus: "extracting" })),
      container,
    );
    expect(container.textContent).toContain(t().memory.extracting);
  });

  it("shows privacy note", () => {
    const container = document.createElement("div");
    render(renderMemory(createProps()), container);
    expect(container.textContent).toContain(t().memory.privacy);
  });
});
