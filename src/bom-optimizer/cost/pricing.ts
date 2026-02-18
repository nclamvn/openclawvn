// Model pricing data (2026)

import type { ModelPricing, ModelTier } from "./types.js";

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude 4.5 family
  "claude-opus-4-5": {
    model: "claude-opus-4-5",
    tier: "opus",
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    longContextInputPer1M: 10.0,
    longContextOutputPer1M: 37.5,
  },
  "claude-sonnet-4-5": {
    model: "claude-sonnet-4-5",
    tier: "sonnet",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    longContextInputPer1M: 6.0,
    longContextOutputPer1M: 22.5,
  },
  "claude-haiku-4-5": {
    model: "claude-haiku-4-5",
    tier: "haiku",
    inputPer1M: 0.25,
    outputPer1M: 1.25,
  },

  // Claude 4 family (legacy)
  "claude-opus-4": {
    model: "claude-opus-4",
    tier: "opus",
    inputPer1M: 5.0,
    outputPer1M: 25.0,
  },
  "claude-sonnet-4": {
    model: "claude-sonnet-4",
    tier: "sonnet",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },

  // Aliases
  opus: {
    model: "claude-opus-4-5",
    tier: "opus",
    inputPer1M: 5.0,
    outputPer1M: 25.0,
  },
  sonnet: {
    model: "claude-sonnet-4-5",
    tier: "sonnet",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  haiku: {
    model: "claude-haiku-4-5",
    tier: "haiku",
    inputPer1M: 0.25,
    outputPer1M: 1.25,
  },
};

export const SUBSCRIPTION_PRICING = {
  free: { monthly: 0, messagesPerWindow: 10 },
  pro: { monthly: 20, messagesPerWindow: 50 },
  max5x: { monthly: 100, messagesPerWindow: 250 },
  max20x: { monthly: 200, messagesPerWindow: 1000 },
} as const;

export function getPricing(model: string): ModelPricing {
  const normalized = model.toLowerCase().replace(/[^a-z0-9-]/g, "");

  if (MODEL_PRICING[normalized]) return MODEL_PRICING[normalized];

  // Match by tier keyword
  if (normalized.includes("opus")) return MODEL_PRICING["opus"];
  if (normalized.includes("haiku")) return MODEL_PRICING["haiku"];

  // Default to Sonnet
  return MODEL_PRICING["sonnet"];
}

export function getTierFromModel(model: string): ModelTier {
  return getPricing(model).tier;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  isLongCtx: boolean = false,
): number {
  const pricing = getPricing(model);

  const inputRate =
    isLongCtx && pricing.longContextInputPer1M ? pricing.longContextInputPer1M : pricing.inputPer1M;

  const outputRate =
    isLongCtx && pricing.longContextOutputPer1M
      ? pricing.longContextOutputPer1M
      : pricing.outputPer1M;

  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
}

export const LONG_CONTEXT_THRESHOLD = 200_000;

export function isLongContext(inputTokens: number): boolean {
  return inputTokens > LONG_CONTEXT_THRESHOLD;
}
