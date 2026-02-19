import type { GatewayBrowserClient } from "../gateway";
import type { SkillCatalogEntry, SkillCatalogKind, SkillStatusReport } from "../types";

export type SkillsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  skillsLoading: boolean;
  skillsReport: SkillStatusReport | null;
  skillsError: string | null;
  skillsBusyKey: string | null;
  skillEdits: Record<string, string>;
  skillMessages: SkillMessageMap;
  // Catalog state
  skillsCatalog: SkillCatalogEntry[];
  skillsCatalogLoading: boolean;
  skillsCatalogError: string | null;
  skillsFilterKind: SkillCatalogKind | "all" | "installed";
  skillsSearch: string;
  // Settings panel state
  skillsSettingsOpen: boolean;
  skillsSettingsSkillId: string | null;
  skillsSettingsSchema: Record<string, unknown> | null;
  skillsSettingsUiHints: Record<string, unknown> | null;
  skillsSettingsCurrentConfig: Record<string, unknown> | null;
  skillsSettingsLoading: boolean;
  skillsSettingsSaving: boolean;
  skillsSettingsFormValues: Record<string, unknown>;
  skillsSettingsEnvVars: Array<{ key: string; value: string }>;
};

export type SkillMessage = {
  kind: "success" | "error";
  message: string;
};

export type SkillMessageMap = Record<string, SkillMessage>;

type LoadSkillsOptions = {
  clearMessages?: boolean;
};

function setSkillMessage(state: SkillsState, key: string, message?: SkillMessage) {
  if (!key.trim()) return;
  const next = { ...state.skillMessages };
  if (message) next[key] = message;
  else delete next[key];
  state.skillMessages = next;
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

// ─── Existing skills.status functions (preserved) ────────

export async function loadSkills(state: SkillsState, options?: LoadSkillsOptions) {
  if (options?.clearMessages && Object.keys(state.skillMessages).length > 0) {
    state.skillMessages = {};
  }
  if (!state.client || !state.connected) return;
  if (state.skillsLoading) return;
  state.skillsLoading = true;
  state.skillsError = null;
  try {
    const res = (await state.client.request("skills.status", {})) as SkillStatusReport | undefined;
    if (res) state.skillsReport = res;
  } catch (err) {
    state.skillsError = getErrorMessage(err);
  } finally {
    state.skillsLoading = false;
  }
}

export function updateSkillEdit(state: SkillsState, skillKey: string, value: string) {
  state.skillEdits = { ...state.skillEdits, [skillKey]: value };
}

export async function updateSkillEnabled(state: SkillsState, skillKey: string, enabled: boolean) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillKey;
  state.skillsError = null;
  try {
    await state.client.request("skills.update", { skillKey, enabled });
    await loadSkills(state);
    await loadCatalog(state);
    setSkillMessage(state, skillKey, {
      kind: "success",
      message: enabled ? "Skill enabled" : "Skill disabled",
    });
  } catch (err) {
    const message = getErrorMessage(err);
    state.skillsError = message;
    setSkillMessage(state, skillKey, {
      kind: "error",
      message,
    });
  } finally {
    state.skillsBusyKey = null;
  }
}

export async function saveSkillApiKey(state: SkillsState, skillKey: string) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillKey;
  state.skillsError = null;
  try {
    const apiKey = state.skillEdits[skillKey] ?? "";
    await state.client.request("skills.update", { skillKey, apiKey });
    await loadSkills(state);
    setSkillMessage(state, skillKey, {
      kind: "success",
      message: "API key saved",
    });
  } catch (err) {
    const message = getErrorMessage(err);
    state.skillsError = message;
    setSkillMessage(state, skillKey, {
      kind: "error",
      message,
    });
  } finally {
    state.skillsBusyKey = null;
  }
}

export async function installSkill(
  state: SkillsState,
  skillKey: string,
  name: string,
  installId: string,
) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillKey;
  state.skillsError = null;
  try {
    const result = (await state.client.request("skills.install", {
      name,
      installId,
      timeoutMs: 120000,
    })) as { ok?: boolean; message?: string };
    await loadSkills(state);
    await loadCatalog(state);
    setSkillMessage(state, skillKey, {
      kind: "success",
      message: result?.message ?? "Installed",
    });
  } catch (err) {
    const message = getErrorMessage(err);
    state.skillsError = message;
    setSkillMessage(state, skillKey, {
      kind: "error",
      message,
    });
  } finally {
    state.skillsBusyKey = null;
  }
}

// ─── Catalog functions (new) ─────────────────────────────

export async function loadCatalog(state: SkillsState) {
  if (!state.client || !state.connected) return;
  if (state.skillsCatalogLoading) return;
  state.skillsCatalogLoading = true;
  state.skillsCatalogError = null;
  try {
    const res = (await state.client.request("skills.catalog", {})) as {
      skills?: SkillCatalogEntry[];
    };
    state.skillsCatalog = Array.isArray(res?.skills) ? res.skills : [];
  } catch (err) {
    state.skillsCatalogError = getErrorMessage(err);
  } finally {
    state.skillsCatalogLoading = false;
  }
}

export function setSkillsSearch(state: SkillsState, keyword: string) {
  state.skillsSearch = keyword;
}

export function setSkillsFilterKind(state: SkillsState, kind: SkillCatalogKind | "all" | "installed") {
  state.skillsFilterKind = kind;
}

export function getFilteredCatalog(state: SkillsState): SkillCatalogEntry[] {
  let items = state.skillsCatalog;

  // Kind filter
  if (state.skillsFilterKind === "installed") {
    items = items.filter((s) => s.installed);
  } else if (state.skillsFilterKind !== "all") {
    items = items.filter((s) => s.kind === state.skillsFilterKind);
  }

  // Search filter
  const keyword = state.skillsSearch.trim().toLowerCase();
  if (keyword) {
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(keyword) ||
        s.description.toLowerCase().includes(keyword) ||
        s.id.toLowerCase().includes(keyword),
    );
  }

  return items;
}

// ─── Catalog toggle (uses skills.update for plugins) ─────

export async function toggleCatalogSkill(state: SkillsState, skillId: string, enabled: boolean) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillId;
  try {
    await state.client.request("skills.update", { skillKey: skillId, enabled });
    await loadCatalog(state);
  } catch (err) {
    state.skillsCatalogError = getErrorMessage(err);
  } finally {
    state.skillsBusyKey = null;
  }
}

// ─── Settings panel functions ────────────────────────────

export async function openSkillSettings(state: SkillsState, skillId: string) {
  if (!state.client || !state.connected) return;
  state.skillsSettingsOpen = true;
  state.skillsSettingsSkillId = skillId;
  state.skillsSettingsLoading = true;
  state.skillsSettingsSchema = null;
  state.skillsSettingsUiHints = null;
  state.skillsSettingsCurrentConfig = null;
  state.skillsSettingsFormValues = {};
  state.skillsSettingsEnvVars = [];

  try {
    const res = (await state.client.request("skills.configSchema", { skillId })) as {
      configSchema?: Record<string, unknown> | null;
      uiHints?: Record<string, unknown> | null;
      currentConfig?: Record<string, unknown> | null;
    };
    state.skillsSettingsSchema = res?.configSchema ?? null;
    state.skillsSettingsUiHints = res?.uiHints ?? null;
    state.skillsSettingsCurrentConfig = res?.currentConfig ?? null;

    // Initialize form values from current config
    const config = res?.currentConfig ?? {};
    state.skillsSettingsFormValues = { ...config };

    // Extract env vars from config
    const env = config.env as Record<string, string> | undefined;
    if (env && typeof env === "object") {
      state.skillsSettingsEnvVars = Object.entries(env).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
  } catch (err) {
    state.skillsCatalogError = getErrorMessage(err);
  } finally {
    state.skillsSettingsLoading = false;
  }
}

export function closeSkillSettings(state: SkillsState) {
  state.skillsSettingsOpen = false;
  state.skillsSettingsSkillId = null;
  state.skillsSettingsSchema = null;
  state.skillsSettingsUiHints = null;
  state.skillsSettingsCurrentConfig = null;
  state.skillsSettingsFormValues = {};
  state.skillsSettingsEnvVars = [];
  state.skillsSettingsSaving = false;
}

export function updateSettingsField(state: SkillsState, field: string, value: unknown) {
  state.skillsSettingsFormValues = { ...state.skillsSettingsFormValues, [field]: value };
}

export function updateSettingsEnvVar(state: SkillsState, index: number, key: string, value: string) {
  const next = [...state.skillsSettingsEnvVars];
  next[index] = { key, value };
  state.skillsSettingsEnvVars = next;
}

export function addSettingsEnvVar(state: SkillsState) {
  state.skillsSettingsEnvVars = [...state.skillsSettingsEnvVars, { key: "", value: "" }];
}

export function removeSettingsEnvVar(state: SkillsState, index: number) {
  state.skillsSettingsEnvVars = state.skillsSettingsEnvVars.filter((_, i) => i !== index);
}

export async function saveSkillSettings(state: SkillsState) {
  if (!state.client || !state.connected || !state.skillsSettingsSkillId) return;
  state.skillsSettingsSaving = true;
  try {
    const skillKey = state.skillsSettingsSkillId;

    // Build env from env vars editor
    const env: Record<string, string> = {};
    for (const { key, value } of state.skillsSettingsEnvVars) {
      const trimmedKey = key.trim();
      if (trimmedKey) env[trimmedKey] = value;
    }

    // Build config update — pass env through skills.update
    await state.client.request("skills.update", {
      skillKey,
      env: Object.keys(env).length > 0 ? env : undefined,
    });

    await loadCatalog(state);
    closeSkillSettings(state);
  } catch (err) {
    state.skillsCatalogError = getErrorMessage(err);
  } finally {
    state.skillsSettingsSaving = false;
  }
}
