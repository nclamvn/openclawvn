import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../../agents/agent-scope.js";
import { installSkill } from "../../agents/skills-install.js";
import { buildWorkspaceSkillStatus } from "../../agents/skills-status.js";
import { loadWorkspaceSkillEntries, type SkillEntry } from "../../agents/skills.js";
import type { OpenClawConfig } from "../../config/config.js";
import { loadConfig, writeConfigFile } from "../../config/config.js";
import { normalizePluginsConfig } from "../../plugins/config-state.js";
import { discoverOpenClawPlugins } from "../../plugins/discovery.js";
import { loadPluginManifest, type PluginManifest } from "../../plugins/manifest.js";
import type { PluginKind, PluginOrigin } from "../../plugins/types.js";
import { getRemoteSkillEligibility } from "../../infra/skills-remote.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateSkillsBinsParams,
  validateSkillsInstallParams,
  validateSkillsStatusParams,
  validateSkillsUpdateParams,
} from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

function listWorkspaceDirs(cfg: OpenClawConfig): string[] {
  const dirs = new Set<string>();
  const list = cfg.agents?.list;
  if (Array.isArray(list)) {
    for (const entry of list) {
      if (entry && typeof entry === "object" && typeof entry.id === "string") {
        dirs.add(resolveAgentWorkspaceDir(cfg, entry.id));
      }
    }
  }
  dirs.add(resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg)));
  return [...dirs];
}

function collectSkillBins(entries: SkillEntry[]): string[] {
  const bins = new Set<string>();
  for (const entry of entries) {
    const required = entry.metadata?.requires?.bins ?? [];
    const anyBins = entry.metadata?.requires?.anyBins ?? [];
    const install = entry.metadata?.install ?? [];
    for (const bin of required) {
      const trimmed = bin.trim();
      if (trimmed) {
        bins.add(trimmed);
      }
    }
    for (const bin of anyBins) {
      const trimmed = bin.trim();
      if (trimmed) {
        bins.add(trimmed);
      }
    }
    for (const spec of install) {
      const specBins = spec?.bins ?? [];
      for (const bin of specBins) {
        const trimmed = String(bin).trim();
        if (trimmed) {
          bins.add(trimmed);
        }
      }
    }
  }
  return [...bins].toSorted();
}

export const skillsHandlers: GatewayRequestHandlers = {
  "skills.status": ({ params, respond }) => {
    if (!validateSkillsStatusParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.status params: ${formatValidationErrors(validateSkillsStatusParams.errors)}`,
        ),
      );
      return;
    }
    const cfg = loadConfig();
    const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
    const report = buildWorkspaceSkillStatus(workspaceDir, {
      config: cfg,
      eligibility: { remote: getRemoteSkillEligibility() },
    });
    respond(true, report, undefined);
  },
  "skills.bins": ({ params, respond }) => {
    if (!validateSkillsBinsParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.bins params: ${formatValidationErrors(validateSkillsBinsParams.errors)}`,
        ),
      );
      return;
    }
    const cfg = loadConfig();
    const workspaceDirs = listWorkspaceDirs(cfg);
    const bins = new Set<string>();
    for (const workspaceDir of workspaceDirs) {
      const entries = loadWorkspaceSkillEntries(workspaceDir, { config: cfg });
      for (const bin of collectSkillBins(entries)) {
        bins.add(bin);
      }
    }
    respond(true, { bins: [...bins].toSorted() }, undefined);
  },
  "skills.install": async ({ params, respond }) => {
    if (!validateSkillsInstallParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.install params: ${formatValidationErrors(validateSkillsInstallParams.errors)}`,
        ),
      );
      return;
    }
    const p = params as {
      name: string;
      installId: string;
      timeoutMs?: number;
    };
    const cfg = loadConfig();
    const workspaceDirRaw = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
    const result = await installSkill({
      workspaceDir: workspaceDirRaw,
      skillName: p.name,
      installId: p.installId,
      timeoutMs: p.timeoutMs,
      config: cfg,
    });
    respond(
      result.ok,
      result,
      result.ok ? undefined : errorShape(ErrorCodes.UNAVAILABLE, result.message),
    );
  },
  "skills.update": async ({ params, respond }) => {
    if (!validateSkillsUpdateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.update params: ${formatValidationErrors(validateSkillsUpdateParams.errors)}`,
        ),
      );
      return;
    }
    const p = params as {
      skillKey: string;
      enabled?: boolean;
      apiKey?: string;
      env?: Record<string, string>;
    };
    const cfg = loadConfig();
    const skills = cfg.skills ? { ...cfg.skills } : {};
    const entries = skills.entries ? { ...skills.entries } : {};
    const current = entries[p.skillKey] ? { ...entries[p.skillKey] } : {};
    if (typeof p.enabled === "boolean") {
      current.enabled = p.enabled;
    }
    if (typeof p.apiKey === "string") {
      const trimmed = p.apiKey.trim();
      if (trimmed) {
        current.apiKey = trimmed;
      } else {
        delete current.apiKey;
      }
    }
    if (p.env && typeof p.env === "object") {
      const nextEnv = current.env ? { ...current.env } : {};
      for (const [key, value] of Object.entries(p.env)) {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
          continue;
        }
        const trimmedVal = value.trim();
        if (!trimmedVal) {
          delete nextEnv[trimmedKey];
        } else {
          nextEnv[trimmedKey] = trimmedVal;
        }
      }
      current.env = nextEnv;
    }
    entries[p.skillKey] = current;
    skills.entries = entries;
    const nextConfig: OpenClawConfig = {
      ...cfg,
      skills,
    };
    await writeConfigFile(nextConfig);
    respond(true, { ok: true, skillKey: p.skillKey, config: current }, undefined);
  },
  "skills.catalog": ({ params, respond }) => {
    try {
      const filterKind = typeof params.kind === "string" ? params.kind : undefined;
      const filterInstalled = typeof params.installed === "boolean" ? params.installed : undefined;

      const cfg = loadConfig();
      const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
      const pluginsConfig = normalizePluginsConfig(cfg.plugins);
      const extraPaths = pluginsConfig.loadPaths;

      const { candidates } = discoverOpenClawPlugins({ workspaceDir, extraPaths });

      const skills: SkillCatalogEntry[] = [];
      const seen = new Set<string>();

      for (const candidate of candidates) {
        const manifestResult = loadPluginManifest(candidate.rootDir);
        if (!manifestResult.ok) continue;
        const manifest = manifestResult.manifest;
        if (seen.has(manifest.id)) continue;
        seen.add(manifest.id);

        const entry = buildCatalogEntry(manifest, candidate.origin, pluginsConfig, cfg);

        if (filterKind && entry.kind !== filterKind) continue;
        if (filterInstalled === true && !entry.installed) continue;
        if (filterInstalled === false && entry.installed) continue;

        skills.push(entry);
      }

      // Sort: installed first, then alphabetical
      skills.sort((a, b) => {
        if (a.installed !== b.installed) return a.installed ? -1 : 1;
        return (a.name || a.id).localeCompare(b.name || b.id);
      });

      respond(true, { skills }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
  "skills.configSchema": ({ params, respond }) => {
    try {
      const skillId = typeof params.skillId === "string" ? params.skillId.trim() : "";
      if (!skillId) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "skillId required"));
        return;
      }

      const cfg = loadConfig();
      const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
      const pluginsConfig = normalizePluginsConfig(cfg.plugins);
      const { candidates } = discoverOpenClawPlugins({
        workspaceDir,
        extraPaths: pluginsConfig.loadPaths,
      });

      let manifest: PluginManifest | null = null;
      for (const candidate of candidates) {
        const result = loadPluginManifest(candidate.rootDir);
        if (result.ok && result.manifest.id === skillId) {
          manifest = result.manifest;
          break;
        }
      }

      if (!manifest) {
        respond(
          true,
          {
            skillId,
            configSchema: null,
            uiHints: null,
            currentConfig: null,
          },
          undefined,
        );
        return;
      }

      const configSchema = manifest.configSchema ?? null;
      const hasProperties =
        configSchema &&
        typeof configSchema === "object" &&
        "properties" in configSchema &&
        Object.keys(configSchema.properties as object).length > 0;

      // Get current config from plugins.entries OR skills.entries
      const pluginEntry = cfg.plugins?.entries?.[skillId];
      const skillEntry = cfg.skills?.entries?.[skillId];
      const currentConfig = pluginEntry?.config ?? skillEntry ?? null;

      respond(
        true,
        {
          skillId,
          configSchema: hasProperties ? configSchema : null,
          uiHints: manifest.uiHints ?? null,
          currentConfig,
        },
        undefined,
      );
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
};

// ─── Catalog helpers ─────────────────────────────────────

export type SkillCatalogEntry = {
  id: string;
  name: string;
  kind: PluginKind | null;
  description: string;
  version: string | null;
  installed: boolean;
  enabled: boolean;
  hasConfig: boolean;
  source: PluginOrigin;
  status: "active" | "disabled" | "needsConfig" | "error" | "notInstalled";
  channels?: string[];
  providers?: string[];
};

function buildCatalogEntry(
  manifest: PluginManifest,
  origin: PluginOrigin,
  pluginsConfig: ReturnType<typeof normalizePluginsConfig>,
  cfg: OpenClawConfig,
): SkillCatalogEntry {
  const id = manifest.id;
  const pluginEntry = pluginsConfig.entries[id];
  const skillEntry = cfg.skills?.entries?.[id];
  const installed = pluginEntry !== undefined || skillEntry !== undefined;

  // Determine enabled state
  let enabled = false;
  if (installed) {
    if (pluginEntry?.enabled === true) {
      enabled = true;
    } else if (pluginEntry?.enabled === false) {
      enabled = false;
    } else if (skillEntry?.enabled === true) {
      enabled = true;
    } else if (skillEntry?.enabled === false) {
      enabled = false;
    } else {
      // Not explicitly set — use origin defaults
      enabled = origin !== "bundled";
    }
  }

  const configSchema = manifest.configSchema;
  const hasConfig =
    configSchema != null &&
    typeof configSchema === "object" &&
    "properties" in configSchema &&
    Object.keys(configSchema.properties as object).length > 0;

  // Determine status
  let status: SkillCatalogEntry["status"] = "notInstalled";
  if (installed && enabled) {
    // Check if required config is missing
    const required =
      configSchema && "required" in configSchema && Array.isArray(configSchema.required)
        ? (configSchema.required as string[])
        : [];
    const currentConfig =
      (pluginEntry?.config as Record<string, unknown> | undefined) ?? skillEntry ?? {};
    const missingRequired = required.some(
      (key) => currentConfig[key] === undefined || currentConfig[key] === "",
    );
    status = missingRequired && required.length > 0 ? "needsConfig" : "active";
  } else if (installed) {
    status = "disabled";
  }

  // Infer kind from manifest hints when kind is not set
  let kind: PluginKind | null = manifest.kind ?? null;
  if (!kind) {
    if (manifest.channels && manifest.channels.length > 0) kind = "channel";
    else if (manifest.providers && manifest.providers.length > 0) kind = "provider";
  }

  return {
    id,
    name: manifest.name ?? id,
    kind,
    description: manifest.description ?? "",
    version: manifest.version ?? null,
    installed,
    enabled,
    hasConfig,
    source: origin,
    status,
    channels: manifest.channels,
    providers: manifest.providers,
  };
}
