// Pre-execution cost estimation with alternatives

import type {
  CostEstimate,
  CostComparison,
  AlternativeEstimate,
  ModelTier,
  CostMessage,
} from "./types.js";
import { getPricing, calculateCost, isLongContext } from "./pricing.js";

// Average tokens per character (rough estimate)
const TOKENS_PER_CHAR = 0.25;

const OUTPUT_MULTIPLIERS: Record<string, number> = {
  "code-generation": 2.5,
  "code-review": 1.5,
  "code-fix": 2.0,
  documentation: 2.0,
  analysis: 1.8,
  creative: 2.5,
  research: 2.0,
  translation: 1.2,
  summarization: 0.3,
  classification: 0.1,
  extraction: 0.5,
  conversation: 1.0,
  build: 1.5,
  deploy: 1.0,
  workflow: 1.5,
  default: 1.0,
};

export function estimateTokens(
  inputText: string,
  taskType?: string,
): { input: number; output: number; confidence: "high" | "medium" | "low" } {
  const inputTokens = Math.ceil(inputText.length * TOKENS_PER_CHAR);
  const multiplier = OUTPUT_MULTIPLIERS[taskType || "default"] || 1.0;
  const outputTokens = Math.ceil(inputTokens * multiplier);

  let confidence: "high" | "medium" | "low";
  if (inputTokens < 1000) confidence = "high";
  else if (inputTokens < 10000) confidence = "medium";
  else confidence = "low";

  return { input: inputTokens, output: outputTokens, confidence };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function estimateCost(
  model: string,
  inputText: string,
  taskType?: string,
  contextTokens: number = 0,
): CostEstimate {
  const pricing = getPricing(model);
  const { input, output, confidence } = estimateTokens(inputText, taskType);

  const totalInputTokens = input + contextTokens;
  const longCtx = isLongContext(totalInputTokens);

  const inputCost = calculateCost(model, totalInputTokens, 0, longCtx);
  const outputCost = calculateCost(model, 0, output, longCtx);

  return {
    model: pricing.model,
    tier: pricing.tier,
    estimatedInputTokens: totalInputTokens,
    estimatedOutputTokens: output,
    estimatedCost: round4(inputCost + outputCost),
    confidence,
    breakdown: { inputCost: round4(inputCost), outputCost: round4(outputCost) },
    isLongContext: longCtx,
  };
}

// Tier tradeoff descriptions
const TIER_TRADEOFFS: Record<ModelTier, Record<ModelTier, string>> = {
  haiku: {
    haiku: "Current selection",
    sonnet: "Better reasoning, 12x cost",
    opus: "Best quality, 20x cost",
  },
  sonnet: {
    haiku: "Faster, may miss nuances",
    sonnet: "Current selection",
    opus: "Deeper analysis, ~1.7x cost",
  },
  opus: {
    haiku: "Much faster, significantly less capable",
    sonnet: "Good balance, ~60% cheaper",
    opus: "Current selection",
  },
};

function shouldRecommendAlt(
  currentTier: ModelTier,
  altTier: ModelTier,
  taskType?: string,
): boolean {
  const simpleTasks = ["classification", "extraction", "summarization", "translation"];
  if (simpleTasks.includes(taskType || "") && altTier === "haiku") return true;

  const codingTasks = ["code-generation", "code-review", "code-fix"];
  if (codingTasks.includes(taskType || "") && currentTier === "opus" && altTier === "sonnet")
    return true;

  return false;
}

export function compareCosts(
  currentModel: string,
  inputText: string,
  taskType?: string,
  contextTokens: number = 0,
): CostComparison {
  const current = estimateCost(currentModel, inputText, taskType, contextTokens);

  const alternatives: AlternativeEstimate[] = [];
  const tiers: ModelTier[] = ["haiku", "sonnet", "opus"];

  for (const tier of tiers) {
    if (tier === current.tier) continue;

    const alt = estimateCost(tier, inputText, taskType, contextTokens);
    const costDiff = alt.estimatedCost - current.estimatedCost;
    const costDiffPct = current.estimatedCost > 0 ? (costDiff / current.estimatedCost) * 100 : 0;

    alternatives.push({
      model: alt.model,
      tier: alt.tier,
      estimatedCost: alt.estimatedCost,
      costDifference: round4(costDiff),
      costDifferencePercent: Math.round(costDiffPct),
      tradeoff: TIER_TRADEOFFS[current.tier][tier],
      recommended: shouldRecommendAlt(current.tier, tier, taskType),
    });
  }

  alternatives.sort((a, b) => a.estimatedCost - b.estimatedCost);

  const recommended = alternatives.find((a) => a.recommended);
  let recommendation: string;
  if (recommended) {
    const savings = Math.abs(recommended.costDifference);
    const pct = Math.abs(recommended.costDifferencePercent);
    recommendation = `Consider ${recommended.tier}: ${recommended.tradeoff}. Save ${savings.toFixed(4)} (${pct}%)`;
  } else if (current.tier === "opus" && current.estimatedCost > 0.05) {
    recommendation = `Using Opus (${current.estimatedCost.toFixed(4)}). Sonnet may suffice for most tasks.`;
  } else {
    recommendation = `${current.tier} selected. Est. cost: ${current.estimatedCost.toFixed(4)}`;
  }

  return { current, alternatives, recommendation };
}

export function formatCostMessage(estimate: CostEstimate): CostMessage {
  const cost = estimate.estimatedCost;
  const tier = estimate.tier.charAt(0).toUpperCase() + estimate.tier.slice(1);

  let preExecution: string;
  if (cost < 0.001) preExecution = `This will cost <$0.001 (${tier}). Proceed?`;
  else if (cost < 0.01) preExecution = `This will cost ~$${cost.toFixed(4)} (${tier}). Proceed?`;
  else preExecution = `This will cost ~$${cost.toFixed(3)} (${tier}). Proceed?`;

  return { preExecution, postExecution: `Cost: $${cost.toFixed(4)} (${tier})` };
}

export function formatComparisonMessage(comparison: CostComparison): string {
  const { current, alternatives } = comparison;
  const lines: string[] = [];

  lines.push(`Cost Estimate: $${current.estimatedCost.toFixed(4)} (${current.tier})`);

  if (alternatives.length > 0) {
    lines.push("Alternatives:");
    for (const alt of alternatives) {
      const sign = alt.costDifference >= 0 ? "+" : "";
      lines.push(
        `  - ${alt.tier}: $${alt.estimatedCost.toFixed(4)} (${sign}${alt.costDifferencePercent}%)`,
      );
    }
  }

  if (comparison.recommendation) lines.push(comparison.recommendation);

  return lines.join("\n");
}
