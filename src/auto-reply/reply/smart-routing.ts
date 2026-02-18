/**
 * Smart Routing Bridge
 *
 * Maps bom-optimizer model IDs to gateway provider/model format and back.
 * Provides the integration layer between the optimizer's routing decisions
 * and the gateway's model selection pipeline.
 */

import { SmartRouter } from "../../bom-optimizer/router/index.js";
import { classifyTask } from "../../bom-optimizer/router/classifier.js";
import { MODELS } from "../../bom-optimizer/config.js";
import type { CostTracker } from "../../bom-optimizer/tracker/index.js";
import type { OpenClawConfig } from "../../config/config.js";
import type {
  IntentMetadata,
  RoutingDecision,
  TaskClassification,
} from "../../bom-optimizer/types.js";
import { resolveIntentMetadata } from "../../bom-optimizer/router/intent.js";

// ── MODEL ID MAPPING ────────────────────────────────────────

type ModelMapping = {
  optimizerKey: string;
  provider: string;
  model: string;
};

/**
 * Bidirectional mapping between bom-optimizer model keys and gateway provider/model pairs.
 */
const MODEL_MAP: ModelMapping[] = [
  { optimizerKey: "claude-3-haiku", provider: "anthropic", model: "claude-3-haiku-20240307" },
  { optimizerKey: "claude-sonnet", provider: "anthropic", model: "claude-sonnet-4-5-20250929" },
  { optimizerKey: "claude-opus", provider: "anthropic", model: "claude-opus-4-6" },
  { optimizerKey: "gpt-4o-mini", provider: "openai", model: "gpt-4o-mini" },
  { optimizerKey: "gpt-4o", provider: "openai", model: "gpt-4o" },
  { optimizerKey: "o1", provider: "openai", model: "o1" },
  { optimizerKey: "gemini-flash", provider: "google", model: "gemini-2.0-flash" },
  { optimizerKey: "gemini-pro", provider: "google", model: "gemini-2.5-pro" },
];

/** Map optimizer key → gateway provider/model */
export function optimizerKeyToGateway(key: string): { provider: string; model: string } | null {
  const entry = MODEL_MAP.find((m) => m.optimizerKey === key);
  return entry ? { provider: entry.provider, model: entry.model } : null;
}

/** Map gateway provider/model → optimizer key */
export function gatewayToOptimizerKey(provider: string, model: string): string | null {
  // Try exact match first
  const exact = MODEL_MAP.find((m) => m.provider === provider && m.model === model);
  if (exact) return exact.optimizerKey;

  // Try partial model match (strip date suffixes)
  const modelBase = model.replace(/-\d{8}$/, "");
  const partial = MODEL_MAP.find(
    (m) => m.provider === provider && m.model.replace(/-\d{8}$/, "") === modelBase,
  );
  if (partial) return partial.optimizerKey;

  // Try matching just by model id containing key patterns
  const byId = MODEL_MAP.find((m) => model.includes(m.optimizerKey) || m.model.includes(model));
  return byId?.optimizerKey ?? null;
}

// ── MODEL TIER ORDERING ─────────────────────────────────────

const TIER_ORDER: Record<string, number> = {
  fast: 0,
  balanced: 1,
  powerful: 2,
  reasoning: 3,
};

function getModelTier(optimizerKey: string): number {
  const model = MODELS[optimizerKey];
  return model ? (TIER_ORDER[model.tier] ?? 1) : 1;
}

// ── SMART ROUTING CONFIG ────────────────────────────────────

export type SmartRoutingConfig = {
  enabled: boolean;
  preferredProvider: "anthropic" | "openai" | "google";
  allowDowngrade: boolean;
  allowUpgrade: boolean;
  trackingEnabled: boolean;
  costDisplay: "off" | "prefix" | "footer";
  intentDetection: boolean;
  skillBoost: boolean;
  postReplySuggestions: boolean;
};

type AgentDefaults = NonNullable<NonNullable<OpenClawConfig["agents"]>["defaults"]>;

/** Read smartRouting config from agent defaults, return resolved config or null if disabled. */
export function resolveSmartRouting(params: {
  cfg: OpenClawConfig;
  agentCfg?: AgentDefaults;
}): SmartRoutingConfig | null {
  const raw = params.agentCfg?.smartRouting;
  if (!raw || raw.enabled === false) return null;

  return {
    enabled: true,
    preferredProvider: raw.preferredProvider ?? "anthropic",
    allowDowngrade: raw.allowDowngrade ?? true,
    allowUpgrade: raw.allowUpgrade ?? true,
    trackingEnabled: raw.trackingEnabled ?? true,
    costDisplay: raw.costDisplay ?? "off",
    intentDetection: raw.intentDetection ?? true,
    skillBoost: raw.skillBoost ?? true,
    postReplySuggestions: raw.postReplySuggestions ?? true,
  };
}

// ── SMART ROUTING RESULT ────────────────────────────────────

export type SmartRoutingResult = {
  provider: string;
  model: string;
  routingDecision: RoutingDecision;
  classification: TaskClassification;
  optimizerKey: string;
  intentMetadata?: IntentMetadata;
};

// ── APPLY SMART ROUTING ─────────────────────────────────────

/**
 * Route a prompt to the optimal model based on task classification.
 * Returns null if routing matches the current model (no-op) or if disabled.
 */
export function applySmartRouting(params: {
  prompt: string;
  currentProvider: string;
  currentModel: string;
  config: SmartRoutingConfig;
  userId?: string;
}): SmartRoutingResult | null {
  const { prompt, currentProvider, currentModel, config } = params;

  const router = new SmartRouter({
    preferredProvider: config.preferredProvider,
    allowUpgrade: config.allowUpgrade,
    allowDowngrade: config.allowDowngrade,
    compressionEnabled: false, // gateway handles its own compression
  });

  const classification = classifyTask(prompt);
  const routingDecision = router.route(prompt);
  const intentMetadata = config.intentDetection ? resolveIntentMetadata(classification) : undefined;

  // Map the selected model back to gateway format
  const selectedKey = findOptimizerKeyByModelId(routingDecision.selectedModel.id);
  if (!selectedKey) return null;

  const gatewayModel = optimizerKeyToGateway(selectedKey);
  if (!gatewayModel) return null;

  // Filter by preferred provider
  if (gatewayModel.provider !== config.preferredProvider) {
    // Re-route to preferred provider equivalent
    const preferred = findPreferredEquivalent(classification, config.preferredProvider);
    if (!preferred) return null;
    gatewayModel.provider = preferred.provider;
    gatewayModel.model = preferred.model;
  }

  // Check upgrade/downgrade constraints
  const currentKey = gatewayToOptimizerKey(currentProvider, currentModel);
  if (currentKey) {
    const currentTier = getModelTier(currentKey);
    const selectedTier = getModelTier(
      gatewayToOptimizerKey(gatewayModel.provider, gatewayModel.model) ?? selectedKey,
    );

    if (!config.allowDowngrade && selectedTier < currentTier) return null;
    if (!config.allowUpgrade && selectedTier > currentTier) return null;
  }

  // No-op if routing matches current model
  if (gatewayModel.provider === currentProvider && gatewayModel.model === currentModel) {
    // Still return intent metadata if useful (boost or hints present)
    if (
      intentMetadata &&
      (intentMetadata.boostSkills.length > 0 || intentMetadata.contextHints.length > 0)
    ) {
      return {
        provider: currentProvider,
        model: currentModel,
        routingDecision,
        classification,
        optimizerKey: gatewayToOptimizerKey(currentProvider, currentModel) ?? selectedKey,
        intentMetadata,
      };
    }
    return null;
  }

  return {
    provider: gatewayModel.provider,
    model: gatewayModel.model,
    routingDecision,
    classification,
    optimizerKey: gatewayToOptimizerKey(gatewayModel.provider, gatewayModel.model) ?? selectedKey,
    intentMetadata,
  };
}

/** Find the optimizer key for a given model id (e.g., "claude-3-haiku-20240307" → "claude-3-haiku") */
function findOptimizerKeyByModelId(modelId: string): string | null {
  for (const [key, model] of Object.entries(MODELS)) {
    if (model.id === modelId) return key;
  }
  return null;
}

/** Find the preferred provider equivalent for a given classification */
function findPreferredEquivalent(
  classification: TaskClassification,
  provider: "anthropic" | "openai" | "google",
): { provider: string; model: string } | null {
  const tierMap: Record<string, string[]> = {
    anthropic: ["claude-3-haiku", "claude-sonnet", "claude-opus"],
    openai: ["gpt-4o-mini", "gpt-4o", "o1"],
    google: ["gemini-flash", "gemini-pro"],
  };

  const models = tierMap[provider];
  if (!models) return null;

  const tierIndex =
    classification.complexity === "simple"
      ? 0
      : classification.complexity === "complex"
        ? Math.min(2, models.length - 1)
        : 1;

  const key = models[tierIndex] || models[0];
  return optimizerKeyToGateway(key);
}

// ── USAGE TRACKING ──────────────────────────────────────────

/**
 * Record smart routing usage metrics. Fire-and-forget; never throws.
 */
export async function recordSmartRoutingUsage(params: {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  classification?: TaskClassification;
}): Promise<void> {
  try {
    const optimizerKey = gatewayToOptimizerKey(params.provider, params.model);
    const { CostTracker: Tracker } = await import("../../bom-optimizer/tracker/index.js");
    const tracker = new Tracker(params.userId);
    tracker.record({
      model: optimizerKey ?? params.model,
      taskType: params.classification?.type,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      latencyMs: params.latencyMs,
    });
  } catch {
    // Silently ignore tracking failures (e.g. better-sqlite3 not installed)
  }
}
