import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderSkillCard, type SkillCardProps } from "./skill-card";
import { t } from "../i18n";
import type { SkillCatalogEntry } from "../types";

function createSkill(overrides: Partial<SkillCatalogEntry> = {}): SkillCatalogEntry {
  return {
    id: "test-skill",
    name: "Test Skill",
    kind: "tool",
    description: "A test skill description",
    version: "1.0.0",
    installed: true,
    enabled: true,
    hasConfig: false,
    source: "bundled",
    status: "active",
    ...overrides,
  };
}

function createProps(overrides: Partial<SkillCardProps> = {}): SkillCardProps {
  return {
    skill: createSkill(),
    busy: false,
    onSettingsClick: () => undefined,
    onToggleClick: () => undefined,
    onInstallClick: () => undefined,
    ...overrides,
  };
}

describe("skill-card", () => {
  it("renders skill name", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps()), container);
    expect(container.textContent).toContain("Test Skill");
  });

  it("renders skill description", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps()), container);
    expect(container.textContent).toContain("A test skill description");
  });

  it("renders kind icon", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps()), container);
    const kindIcon = container.querySelector(".skill-card__kind-icon");
    expect(kindIcon).not.toBeNull();
    // Tool icon is wrench emoji
    expect(kindIcon?.textContent).toContain("\u{1F527}");
  });

  it("shows disable button for installed+enabled skill", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ skill: createSkill({ installed: true, enabled: true }) })), container);
    const labels = t().skills.catalog?.actions;
    expect(container.textContent).toContain(labels?.disable ?? "Disable");
  });

  it("shows enable button for installed+disabled skill", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ skill: createSkill({ installed: true, enabled: false }) })), container);
    const labels = t().skills.catalog?.actions;
    expect(container.textContent).toContain(labels?.enable ?? "Enable");
  });

  it("shows install button for not-installed skill", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ skill: createSkill({ installed: false }) })), container);
    const labels = t().skills.catalog?.actions;
    expect(container.textContent).toContain(labels?.install ?? "Install");
  });

  it("shows settings button when hasConfig is true", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ skill: createSkill({ hasConfig: true }) })), container);
    const labels = t().skills.catalog?.actions;
    expect(container.textContent).toContain(labels?.settings ?? "Settings");
  });

  it("hides settings button when hasConfig is false", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ skill: createSkill({ hasConfig: false }) })), container);
    const labels = t().skills.catalog?.actions;
    const settingsLabel = labels?.settings ?? "Settings";
    const buttons = Array.from(container.querySelectorAll("button"));
    const hasSettingsBtn = buttons.some((btn) => btn.textContent?.includes(settingsLabel));
    expect(hasSettingsBtn).toBe(false);
  });

  it("calls onToggleClick when toggle button clicked", () => {
    const onToggleClick = vi.fn();
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ onToggleClick, skill: createSkill({ enabled: true }) })), container);
    const labels = t().skills.catalog?.actions;
    const disableLabel = labels?.disable ?? "Disable";
    const buttons = Array.from(container.querySelectorAll("button"));
    const toggleBtn = buttons.find((btn) => btn.textContent?.includes(disableLabel));
    toggleBtn?.click();
    expect(onToggleClick).toHaveBeenCalledWith("test-skill", false);
  });

  it("calls onSettingsClick when settings button clicked", () => {
    const onSettingsClick = vi.fn();
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ onSettingsClick, skill: createSkill({ hasConfig: true }) })), container);
    const labels = t().skills.catalog?.actions;
    const settingsLabel = labels?.settings ?? "Settings";
    const buttons = Array.from(container.querySelectorAll("button"));
    const settingsBtn = buttons.find((btn) => btn.textContent?.includes(settingsLabel));
    settingsBtn?.click();
    expect(onSettingsClick).toHaveBeenCalledWith("test-skill");
  });

  it("calls onInstallClick when install button clicked", () => {
    const onInstallClick = vi.fn();
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ onInstallClick, skill: createSkill({ installed: false }) })), container);
    const labels = t().skills.catalog?.actions;
    const installLabel = labels?.install ?? "Install";
    const buttons = Array.from(container.querySelectorAll("button"));
    const installBtn = buttons.find((btn) => btn.textContent?.includes(installLabel));
    installBtn?.click();
    expect(onInstallClick).toHaveBeenCalledWith("test-skill");
  });

  it("disables buttons when busy", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ busy: true })), container);
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it("renders status badge", () => {
    const container = document.createElement("div");
    render(renderSkillCard(createProps({ skill: createSkill({ status: "active" }) })), container);
    const badge = container.querySelector(".skill-status");
    expect(badge).not.toBeNull();
  });
});
