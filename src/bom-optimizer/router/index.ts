/**
 * Smart Model Router
 * Selects optimal model based on task analysis
 */

import { MODELS, TASK_MODEL_MAP } from "../config.js";
import { classifyTask, quickClassify } from "./classifier.js";
import { compressContext } from "./compressor.js";
import type { ModelConfig, TaskClassification, RoutingDecision } from "../types.js";

interface RouterConfig {
  preferredProvider?: "anthropic" | "openai" | "google";
  maxCostPerRequest?: number;
  allowUpgrade?: boolean;
  allowDowngrade?: boolean;
  compressionEnabled?: boolean;
}

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  preferredProvider: "anthropic",
  maxCostPerRequest: 0.5,
  allowUpgrade: true,
  allowDowngrade: true,
  compressionEnabled: true,
};

export class SmartRouter {
  private config: RouterConfig;

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = { ...DEFAULT_ROUTER_CONFIG, ...config };
  }

  /** Route request to optimal model */
  route(
    prompt: string,
    options: {
      systemPrompt?: string;
      forceModel?: string;
      userTier?: "free" | "pro" | "enterprise";
    } = {},
  ): RoutingDecision {
    if (options.forceModel && MODELS[options.forceModel]) {
      const model = MODELS[options.forceModel];
      return this.buildDecision(model, "Model explicitly specified", prompt);
    }

    const classification = classifyTask(prompt, options.systemPrompt);
    const modelKey = this.selectModelKey(classification, options.userTier);
    const selectedModel = MODELS[modelKey];

    if (!selectedModel) {
      return this.buildDecision(MODELS["claude-sonnet"], "Fallback to default model", prompt);
    }

    return this.buildDecision(
      selectedModel,
      `Task: ${classification.type}, Complexity: ${classification.complexity}`,
      prompt,
      classification,
    );
  }

  private selectModelKey(
    classification: TaskClassification,
    userTier?: "free" | "pro" | "enterprise",
  ): string {
    const taskMap = TASK_MODEL_MAP[classification.type] || TASK_MODEL_MAP.unknown;
    let modelKey = taskMap[classification.complexity];

    if (userTier === "free") {
      const fastModels = ["gemini-flash", "gpt-4o-mini", "claude-3-haiku"];
      if (!fastModels.includes(modelKey)) {
        modelKey = "claude-3-haiku";
      }
    }

    if (this.config.preferredProvider) {
      const preferredModel = this.findPreferredProviderModel(
        classification,
        this.config.preferredProvider,
      );
      if (preferredModel) modelKey = preferredModel;
    }

    return modelKey;
  }

  private findPreferredProviderModel(
    classification: TaskClassification,
    provider: "anthropic" | "openai" | "google",
  ): string | null {
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

    return models[tierIndex] || models[0];
  }

  private buildDecision(
    model: ModelConfig,
    reason: string,
    prompt: string,
    classification?: TaskClassification,
  ): RoutingDecision {
    const inputTokens = classification?.estimatedInputTokens || Math.ceil(prompt.length / 4);
    const outputTokens = classification?.estimatedOutputTokens || 1000;

    let compressionApplied = false;
    let compressionRatio: number | undefined;
    let finalInputTokens = inputTokens;

    if (this.config.compressionEnabled && inputTokens > 8000) {
      const compressed = compressContext(prompt, { targetRatio: 0.3 });
      if (compressed.method !== "none") {
        compressionApplied = true;
        compressionRatio = compressed.ratio;
        finalInputTokens = compressed.compressedTokens;
      }
    }

    const estimatedCost =
      (finalInputTokens / 1000) * model.inputCostPer1k +
      (outputTokens / 1000) * model.outputCostPer1k;

    const alternatives = Object.values(MODELS)
      .filter((m) => m.id !== model.id)
      .filter((m) => m.tier === model.tier || m.tier === "balanced")
      .slice(0, 3);

    return {
      selectedModel: model,
      reason,
      alternatives,
      estimatedCost,
      estimatedLatency: model.avgLatencyMs,
      compressionApplied,
      compressionRatio,
    };
  }

  /** Quick route without full analysis */
  quickRoute(prompt: string): ModelConfig {
    const { type, complexity } = quickClassify(prompt);
    const modelKey = TASK_MODEL_MAP[type]?.[complexity] || "claude-3-haiku";
    return MODELS[modelKey] || MODELS["claude-3-haiku"];
  }
}

export const router = new SmartRouter();

export function routeRequest(
  prompt: string,
  options?: Parameters<SmartRouter["route"]>[1],
): RoutingDecision {
  return router.route(prompt, options);
}
