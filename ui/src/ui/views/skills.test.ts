import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderSkills, type SkillsProps } from "./skills";
import { t } from "../i18n";
import type { SkillCatalogEntry } from "../types";

function createCatalogEntry(id: string, overrides: Partial<SkillCatalogEntry> = {}): SkillCatalogEntry {
  return {
    id,
    name: `Skill ${id}`,
    kind: "tool",
    description: `Description for ${id}`,
    version: "1.0.0",
    installed: true,
    enabled: true,
    hasConfig: false,
    source: "bundled",
    status: "active",
    ...overrides,
  };
}

function createProps(overrides: Partial<SkillsProps> = {}): SkillsProps {
  return {
    loading: false,
    report: null,
    error: null,
    filter: "",
    edits: {},
    busyKey: null,
    messages: {},
    onFilterChange: () => undefined,
    onRefresh: () => undefined,
    onToggle: () => undefined,
    onEdit: () => undefined,
    onSaveKey: () => undefined,
    onInstall: () => undefined,
    // Catalog
    catalog: [],
    catalogLoading: false,
    catalogError: null,
    filterKind: "all",
    search: "",
    onSearch: () => undefined,
    onFilterKindChange: () => undefined,
    onCatalogRefresh: () => undefined,
    onCatalogToggle: () => undefined,
    onCatalogSettings: () => undefined,
    onCatalogInstall: () => undefined,
    // Settings panel
    settingsPanel: {
      open: false,
      skillId: null,
      skill: null,
      schema: null,
      uiHints: null,
      currentConfig: null,
      loading: false,
      saving: false,
      formValues: {},
      envVars: [],
      onFieldChange: () => undefined,
      onEnvChange: () => undefined,
      onEnvAdd: () => undefined,
      onEnvRemove: () => undefined,
      onSave: () => undefined,
      onClose: () => undefined,
    },
    ...overrides,
  };
}

describe("skills view", () => {
  it("renders catalog section title", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps()), container);
    const catalogLabels = t().skills.catalog ?? {};
    const title = catalogLabels.title ?? t().skills.title;
    expect(container.textContent).toContain(title);
  });

  it("shows empty state when no catalog skills", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps()), container);
    const catalogLabels = t().skills.catalog ?? {};
    expect(container.textContent).toContain(catalogLabels.empty ?? t().skills.empty);
  });

  it("renders catalog skill cards", () => {
    const container = document.createElement("div");
    render(
      renderSkills(createProps({
        catalog: [createCatalogEntry("s1"), createCatalogEntry("s2")],
      })),
      container,
    );
    expect(container.textContent).toContain("Skill s1");
    expect(container.textContent).toContain("Skill s2");
  });

  it("shows catalog loading state", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps({ catalogLoading: true })), container);
    expect(container.textContent).toContain(t().common.loading);
  });

  it("shows catalog error", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps({ catalogError: "Catalog failed" })), container);
    expect(container.textContent).toContain("Catalog failed");
  });

  it("renders filter tabs", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps()), container);
    const tabs = container.querySelectorAll(".skill-filter-tab");
    expect(tabs.length).toBe(7); // all, installed, channel, tool, service, memory, provider
  });

  it("marks active filter tab", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps({ filterKind: "tool" })), container);
    const activeTab = container.querySelector(".skill-filter-tab--active");
    expect(activeTab).not.toBeNull();
    const filterLabels = t().skills.catalog?.filters ?? {};
    expect(activeTab?.textContent).toContain(filterLabels.tool ?? "Tools");
  });

  it("calls onFilterKindChange when filter tab clicked", () => {
    const onFilterKindChange = vi.fn();
    const container = document.createElement("div");
    render(renderSkills(createProps({ onFilterKindChange })), container);
    const tabs = container.querySelectorAll(".skill-filter-tab");
    // Click "installed" tab (index 1)
    (tabs[1] as HTMLButtonElement).click();
    expect(onFilterKindChange).toHaveBeenCalledWith("installed");
  });

  it("renders search input", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps()), container);
    const input = container.querySelector(".filter-input") as HTMLInputElement;
    expect(input).not.toBeNull();
  });

  it("calls onCatalogRefresh when refresh button clicked", () => {
    const onCatalogRefresh = vi.fn();
    const container = document.createElement("div");
    render(renderSkills(createProps({ onCatalogRefresh })), container);
    // First button in the first card row is refresh
    const buttons = container.querySelectorAll(".btn");
    const refreshBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(t().common.refresh),
    );
    (refreshBtn as HTMLButtonElement)?.click();
    expect(onCatalogRefresh).toHaveBeenCalled();
  });

  it("hides legacy skills section when no workspace skills", () => {
    const container = document.createElement("div");
    render(renderSkills(createProps({ report: { skills: [] } })), container);
    // Should only have one card (catalog section)
    const cards = container.querySelectorAll(".card");
    expect(cards.length).toBe(1);
  });

  it("shows legacy skills section when workspace skills exist", () => {
    const container = document.createElement("div");
    render(
      renderSkills(createProps({
        report: {
          skills: [
            {
              skillKey: "sk1",
              name: "Legacy Skill",
              description: "A legacy skill",
              source: "workspace",
              emoji: "",
              eligible: true,
              disabled: false,
              blockedByAllowlist: false,
              missing: { bins: [], env: [], config: [], os: [] },
              install: [],
              primaryEnv: null,
            },
          ],
        },
      })),
      container,
    );
    expect(container.textContent).toContain("Legacy Skill");
    const cards = container.querySelectorAll(".card");
    expect(cards.length).toBe(2); // catalog + legacy
  });
});
