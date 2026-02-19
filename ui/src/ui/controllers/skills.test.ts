import { describe, expect, it, vi } from "vitest";

import {
  loadCatalog,
  getFilteredCatalog,
  setSkillsSearch,
  setSkillsFilterKind,
  toggleCatalogSkill,
  openSkillSettings,
  closeSkillSettings,
  updateSettingsField,
  updateSettingsEnvVar,
  addSettingsEnvVar,
  removeSettingsEnvVar,
  saveSkillSettings,
  type SkillsState,
} from "./skills";
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

function createState(overrides: Partial<SkillsState> = {}): SkillsState {
  return {
    client: null,
    connected: true,
    skillsLoading: false,
    skillsReport: null,
    skillsError: null,
    skillsBusyKey: null,
    skillEdits: {},
    skillMessages: {},
    skillsCatalog: [],
    skillsCatalogLoading: false,
    skillsCatalogError: null,
    skillsFilterKind: "all",
    skillsSearch: "",
    skillsSettingsOpen: false,
    skillsSettingsSkillId: null,
    skillsSettingsSchema: null,
    skillsSettingsUiHints: null,
    skillsSettingsCurrentConfig: null,
    skillsSettingsLoading: false,
    skillsSettingsSaving: false,
    skillsSettingsFormValues: {},
    skillsSettingsEnvVars: [],
    ...overrides,
  };
}

function mockClient(overrides: Partial<{ request: ReturnType<typeof vi.fn> }> = {}) {
  return {
    request: overrides.request ?? vi.fn().mockResolvedValue({}),
  } as unknown as SkillsState["client"];
}

// ─── loadCatalog ─────────────────────────────────────────

describe("loadCatalog", () => {
  it("does nothing when client is null", async () => {
    const state = createState();
    await loadCatalog(state);
    expect(state.skillsCatalog).toEqual([]);
  });

  it("loads catalog from gateway", async () => {
    const skills = [createCatalogEntry("s1"), createCatalogEntry("s2")];
    const client = mockClient({ request: vi.fn().mockResolvedValue({ skills }) });
    const state = createState({ client });
    await loadCatalog(state);
    expect(state.skillsCatalog).toEqual(skills);
    expect(state.skillsCatalogLoading).toBe(false);
  });

  it("sets error on failure", async () => {
    const client = mockClient({ request: vi.fn().mockRejectedValue(new Error("catalog fail")) });
    const state = createState({ client });
    await loadCatalog(state);
    expect(state.skillsCatalogError).toBe("catalog fail");
    expect(state.skillsCatalogLoading).toBe(false);
  });

  it("skips when already loading", async () => {
    const client = mockClient();
    const state = createState({ client, skillsCatalogLoading: true });
    await loadCatalog(state);
    expect(client!.request).not.toHaveBeenCalled();
  });

  it("handles empty response", async () => {
    const client = mockClient({ request: vi.fn().mockResolvedValue({}) });
    const state = createState({ client });
    await loadCatalog(state);
    expect(state.skillsCatalog).toEqual([]);
  });
});

// ─── getFilteredCatalog ──────────────────────────────────

describe("getFilteredCatalog", () => {
  it("returns all items when filter is 'all'", () => {
    const state = createState({
      skillsCatalog: [createCatalogEntry("s1"), createCatalogEntry("s2")],
      skillsFilterKind: "all",
    });
    expect(getFilteredCatalog(state)).toHaveLength(2);
  });

  it("filters by kind", () => {
    const state = createState({
      skillsCatalog: [
        createCatalogEntry("s1", { kind: "tool" }),
        createCatalogEntry("s2", { kind: "channel" }),
      ],
      skillsFilterKind: "tool",
    });
    const result = getFilteredCatalog(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });

  it("filters by installed", () => {
    const state = createState({
      skillsCatalog: [
        createCatalogEntry("s1", { installed: true }),
        createCatalogEntry("s2", { installed: false }),
      ],
      skillsFilterKind: "installed",
    });
    const result = getFilteredCatalog(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });

  it("filters by search keyword", () => {
    const state = createState({
      skillsCatalog: [
        createCatalogEntry("s1", { name: "Discord Bot" }),
        createCatalogEntry("s2", { name: "Telegram Channel" }),
      ],
      skillsSearch: "discord",
    });
    const result = getFilteredCatalog(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });

  it("combines kind and search filters", () => {
    const state = createState({
      skillsCatalog: [
        createCatalogEntry("s1", { kind: "channel", name: "Discord" }),
        createCatalogEntry("s2", { kind: "channel", name: "Telegram" }),
        createCatalogEntry("s3", { kind: "tool", name: "Discord Tool" }),
      ],
      skillsFilterKind: "channel",
      skillsSearch: "discord",
    });
    const result = getFilteredCatalog(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });
});

// ─── setSkillsSearch / setSkillsFilterKind ───────────────

describe("setSkillsSearch", () => {
  it("sets search keyword", () => {
    const state = createState();
    setSkillsSearch(state, "hello");
    expect(state.skillsSearch).toBe("hello");
  });
});

describe("setSkillsFilterKind", () => {
  it("sets filter kind", () => {
    const state = createState();
    setSkillsFilterKind(state, "channel");
    expect(state.skillsFilterKind).toBe("channel");
  });
});

// ─── toggleCatalogSkill ──────────────────────────────────

describe("toggleCatalogSkill", () => {
  it("calls skills.update and reloads catalog", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const state = createState({ client });
    await toggleCatalogSkill(state, "my-skill", true);
    expect(request).toHaveBeenCalledWith("skills.update", { skillKey: "my-skill", enabled: true });
    expect(state.skillsBusyKey).toBeNull();
  });

  it("sets error on failure", async () => {
    const client = mockClient({ request: vi.fn().mockRejectedValue(new Error("toggle fail")) });
    const state = createState({ client });
    await toggleCatalogSkill(state, "s1", false);
    expect(state.skillsCatalogError).toBe("toggle fail");
    expect(state.skillsBusyKey).toBeNull();
  });
});

// ─── openSkillSettings / closeSkillSettings ──────────────

describe("openSkillSettings", () => {
  it("opens panel and loads config schema", async () => {
    const configSchema = { properties: { key: { type: "string" } } };
    const uiHints = { key: { label: "Key" } };
    const currentConfig = { key: "value" };
    const request = vi.fn().mockResolvedValue({ configSchema, uiHints, currentConfig });
    const client = mockClient({ request });
    const state = createState({ client });
    await openSkillSettings(state, "my-skill");
    expect(request).toHaveBeenCalledWith("skills.configSchema", { skillId: "my-skill" });
    expect(state.skillsSettingsOpen).toBe(true);
    expect(state.skillsSettingsSkillId).toBe("my-skill");
    expect(state.skillsSettingsSchema).toEqual(configSchema);
    expect(state.skillsSettingsUiHints).toEqual(uiHints);
    expect(state.skillsSettingsFormValues).toEqual(currentConfig);
    expect(state.skillsSettingsLoading).toBe(false);
  });

  it("initializes env vars from config.env", async () => {
    const currentConfig = { env: { API_KEY: "abc", SECRET: "xyz" } };
    const request = vi.fn().mockResolvedValue({ currentConfig });
    const client = mockClient({ request });
    const state = createState({ client });
    await openSkillSettings(state, "s1");
    expect(state.skillsSettingsEnvVars).toEqual([
      { key: "API_KEY", value: "abc" },
      { key: "SECRET", value: "xyz" },
    ]);
  });

  it("sets error on failure", async () => {
    const client = mockClient({ request: vi.fn().mockRejectedValue(new Error("schema fail")) });
    const state = createState({ client });
    await openSkillSettings(state, "s1");
    expect(state.skillsCatalogError).toBe("schema fail");
    expect(state.skillsSettingsLoading).toBe(false);
  });
});

describe("closeSkillSettings", () => {
  it("resets all settings panel state", () => {
    const state = createState({
      skillsSettingsOpen: true,
      skillsSettingsSkillId: "s1",
      skillsSettingsSchema: { properties: {} },
      skillsSettingsFormValues: { foo: "bar" },
      skillsSettingsEnvVars: [{ key: "K", value: "V" }],
    });
    closeSkillSettings(state);
    expect(state.skillsSettingsOpen).toBe(false);
    expect(state.skillsSettingsSkillId).toBeNull();
    expect(state.skillsSettingsSchema).toBeNull();
    expect(state.skillsSettingsFormValues).toEqual({});
    expect(state.skillsSettingsEnvVars).toEqual([]);
  });
});

// ─── updateSettingsField ─────────────────────────────────

describe("updateSettingsField", () => {
  it("updates a form field", () => {
    const state = createState({ skillsSettingsFormValues: { a: 1 } });
    updateSettingsField(state, "b", 2);
    expect(state.skillsSettingsFormValues).toEqual({ a: 1, b: 2 });
  });
});

// ─── env var management ──────────────────────────────────

describe("env var management", () => {
  it("updateSettingsEnvVar updates at index", () => {
    const state = createState({
      skillsSettingsEnvVars: [{ key: "A", value: "1" }],
    });
    updateSettingsEnvVar(state, 0, "B", "2");
    expect(state.skillsSettingsEnvVars[0]).toEqual({ key: "B", value: "2" });
  });

  it("addSettingsEnvVar adds empty row", () => {
    const state = createState({ skillsSettingsEnvVars: [] });
    addSettingsEnvVar(state);
    expect(state.skillsSettingsEnvVars).toHaveLength(1);
    expect(state.skillsSettingsEnvVars[0]).toEqual({ key: "", value: "" });
  });

  it("removeSettingsEnvVar removes at index", () => {
    const state = createState({
      skillsSettingsEnvVars: [
        { key: "A", value: "1" },
        { key: "B", value: "2" },
      ],
    });
    removeSettingsEnvVar(state, 0);
    expect(state.skillsSettingsEnvVars).toHaveLength(1);
    expect(state.skillsSettingsEnvVars[0].key).toBe("B");
  });
});

// ─── saveSkillSettings ───────────────────────────────────

describe("saveSkillSettings", () => {
  it("sends env vars and closes panel", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const state = createState({
      client,
      skillsSettingsOpen: true,
      skillsSettingsSkillId: "my-skill",
      skillsSettingsEnvVars: [{ key: "API_KEY", value: "secret" }],
    });
    await saveSkillSettings(state);
    expect(request).toHaveBeenCalledWith("skills.update", {
      skillKey: "my-skill",
      env: { API_KEY: "secret" },
    });
    expect(state.skillsSettingsOpen).toBe(false);
    expect(state.skillsSettingsSaving).toBe(false);
  });

  it("skips empty env var keys", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const state = createState({
      client,
      skillsSettingsOpen: true,
      skillsSettingsSkillId: "s1",
      skillsSettingsEnvVars: [
        { key: "", value: "ignored" },
        { key: "VALID", value: "kept" },
      ],
    });
    await saveSkillSettings(state);
    expect(request).toHaveBeenCalledWith("skills.update", {
      skillKey: "s1",
      env: { VALID: "kept" },
    });
  });

  it("omits env when no vars", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const state = createState({
      client,
      skillsSettingsOpen: true,
      skillsSettingsSkillId: "s1",
      skillsSettingsEnvVars: [],
    });
    await saveSkillSettings(state);
    expect(request).toHaveBeenCalledWith("skills.update", {
      skillKey: "s1",
      env: undefined,
    });
  });

  it("does nothing without skillId", async () => {
    const client = mockClient();
    const state = createState({ client, skillsSettingsSkillId: null });
    await saveSkillSettings(state);
    expect(client!.request).not.toHaveBeenCalled();
  });
});
