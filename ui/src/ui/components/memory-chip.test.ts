import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderMemoryChip, confidenceDots, type MemoryChipProps } from "./memory-chip";
import { t } from "../i18n";
import type { UserFact } from "../types";

function createFact(overrides: Partial<UserFact> = {}): UserFact {
  return {
    id: "f1",
    category: "identity",
    content: "Likes TypeScript",
    confidence: 0.85,
    source: { sessionId: "sess-1", extractedAt: "2026-01-01T00:00:00Z" },
    verified: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createProps(overrides: Partial<MemoryChipProps> = {}): MemoryChipProps {
  return {
    fact: createFact(),
    editing: false,
    editDraft: "",
    onEdit: () => undefined,
    onEditDraftChange: () => undefined,
    onSave: () => undefined,
    onCancel: () => undefined,
    onDelete: () => undefined,
    onVerify: () => undefined,
    ...overrides,
  };
}

describe("memory-chip", () => {
  it("renders fact content", () => {
    const container = document.createElement("div");
    render(renderMemoryChip(createProps()), container);
    expect(container.textContent).toContain("Likes TypeScript");
  });

  it("renders category label", () => {
    const container = document.createElement("div");
    render(renderMemoryChip(createProps()), container);
    expect(container.textContent).toContain(t().memory.categories.identity);
  });

  it("shows unverified badge when not verified", () => {
    const container = document.createElement("div");
    render(renderMemoryChip(createProps({ fact: createFact({ verified: false }) })), container);
    expect(container.textContent).toContain(t().memory.unverified);
  });

  it("shows verified badge when verified", () => {
    const container = document.createElement("div");
    render(renderMemoryChip(createProps({ fact: createFact({ verified: true }) })), container);
    expect(container.textContent).toContain(t().memory.verified);
  });

  it("shows textarea in edit mode", () => {
    const container = document.createElement("div");
    render(
      renderMemoryChip(
        createProps({ editing: true, editDraft: "draft text" }),
      ),
      container,
    );
    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    expect(textarea?.value).toBe("draft text");
  });

  it("shows save/cancel buttons in edit mode", () => {
    const container = document.createElement("div");
    render(renderMemoryChip(createProps({ editing: true })), container);
    expect(container.textContent).toContain(t().memory.save);
    expect(container.textContent).toContain(t().memory.cancel);
  });

  it("shows edit/delete buttons in view mode", () => {
    const container = document.createElement("div");
    render(renderMemoryChip(createProps()), container);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("calls onEdit when edit button clicked", () => {
    const container = document.createElement("div");
    const onEdit = vi.fn();
    render(renderMemoryChip(createProps({ onEdit })), container);
    const editBtn = container.querySelector(`button[title="${t().common.edit}"]`) as HTMLButtonElement;
    editBtn?.click();
    expect(onEdit).toHaveBeenCalledWith("f1");
  });

  it("calls onDelete when delete button clicked", () => {
    const container = document.createElement("div");
    const onDelete = vi.fn();
    render(renderMemoryChip(createProps({ onDelete })), container);
    const deleteBtn = container.querySelector(`button[title="${t().common.delete}"]`) as HTMLButtonElement;
    deleteBtn?.click();
    expect(onDelete).toHaveBeenCalledWith("f1");
  });

  it("calls onSave with draft when save clicked", () => {
    const container = document.createElement("div");
    const onSave = vi.fn();
    render(
      renderMemoryChip(createProps({ editing: true, editDraft: "updated", onSave })),
      container,
    );
    const buttons = container.querySelectorAll("button");
    const saveBtn = Array.from(buttons).find((btn) => btn.textContent?.includes(t().memory.save));
    saveBtn?.click();
    expect(onSave).toHaveBeenCalledWith("f1", "updated");
  });

  it("calls onCancel when cancel clicked", () => {
    const container = document.createElement("div");
    const onCancel = vi.fn();
    render(renderMemoryChip(createProps({ editing: true, onCancel })), container);
    const buttons = container.querySelectorAll("button");
    const cancelBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(t().memory.cancel),
    );
    cancelBtn?.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onVerify when verify button clicked", () => {
    const container = document.createElement("div");
    const onVerify = vi.fn();
    render(renderMemoryChip(createProps({ onVerify })), container);
    // The first icon button is the verify button
    const iconBtns = container.querySelectorAll(".btn--icon");
    const verifyBtn = iconBtns[0] as HTMLButtonElement;
    verifyBtn?.click();
    expect(onVerify).toHaveBeenCalledWith("f1", true);
  });

  it("renders different categories", () => {
    const container = document.createElement("div");
    render(
      renderMemoryChip(createProps({ fact: createFact({ category: "project" }) })),
      container,
    );
    expect(container.textContent).toContain(t().memory.categories.project);
  });
});

describe("confidenceDots", () => {
  it("returns 4 filled for >= 0.9", () => {
    const container = document.createElement("div");
    render(confidenceDots(0.95), container);
    expect(container.textContent).toContain("\u25CF\u25CF\u25CF\u25CF");
  });

  it("returns 3 filled for >= 0.7", () => {
    const container = document.createElement("div");
    render(confidenceDots(0.75), container);
    expect(container.textContent).toContain("\u25CF\u25CF\u25CF\u25CB");
  });

  it("returns 2 filled for >= 0.5", () => {
    const container = document.createElement("div");
    render(confidenceDots(0.5), container);
    expect(container.textContent).toContain("\u25CF\u25CF\u25CB\u25CB");
  });

  it("returns 1 filled for < 0.5", () => {
    const container = document.createElement("div");
    render(confidenceDots(0.3), container);
    expect(container.textContent).toContain("\u25CF\u25CB\u25CB\u25CB");
  });
});
