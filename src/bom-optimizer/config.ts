/**
 * Token Optimization Engine - Configuration
 */

import type { CacheConfig, ModelConfig } from "./types.js";

// ── MODEL DEFINITIONS ───────────────────────────────────────

export const MODELS: Record<string, ModelConfig> = {
  "claude-3-haiku": {
    id: "claude-3-haiku-20240307",
    provider: "anthropic",
    tier: "fast",
    contextWindow: 200_000,
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
    avgLatencyMs: 500,
    capabilities: ["classification", "extraction", "summarization", "conversation"],
  },
  "claude-sonnet": {
    id: "claude-sonnet-4-5-20250929",
    provider: "anthropic",
    tier: "balanced",
    contextWindow: 200_000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    avgLatencyMs: 1500,
    capabilities: ["writing", "editing", "analysis", "coding", "translation"],
  },
  "claude-opus": {
    id: "claude-opus-4-6",
    provider: "anthropic",
    tier: "powerful",
    contextWindow: 200_000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    avgLatencyMs: 3000,
    capabilities: ["analysis", "coding", "writing", "reasoning"],
  },

  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    tier: "fast",
    contextWindow: 128_000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    avgLatencyMs: 400,
    capabilities: ["classification", "extraction", "summarization", "conversation"],
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    tier: "balanced",
    contextWindow: 128_000,
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    avgLatencyMs: 1200,
    capabilities: ["writing", "editing", "analysis", "coding", "translation"],
  },
  o1: {
    id: "o1",
    provider: "openai",
    tier: "reasoning",
    contextWindow: 200_000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06,
    avgLatencyMs: 10_000,
    capabilities: ["reasoning", "analysis", "coding"],
  },

  "gemini-flash": {
    id: "gemini-2.0-flash",
    provider: "google",
    tier: "fast",
    contextWindow: 1_000_000,
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003,
    avgLatencyMs: 300,
    capabilities: ["classification", "extraction", "summarization"],
  },
  "gemini-pro": {
    id: "gemini-2.5-pro",
    provider: "google",
    tier: "balanced",
    contextWindow: 1_000_000,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    avgLatencyMs: 1000,
    capabilities: ["writing", "analysis", "coding", "translation"],
  },
};

// ── TASK → MODEL MAPPING ────────────────────────────────────

export const TASK_MODEL_MAP: Record<string, { simple: string; medium: string; complex: string }> = {
  classification: {
    simple: "gemini-flash",
    medium: "gpt-4o-mini",
    complex: "claude-3-haiku",
  },
  extraction: {
    simple: "gemini-flash",
    medium: "gpt-4o-mini",
    complex: "claude-sonnet",
  },
  summarization: {
    simple: "gpt-4o-mini",
    medium: "claude-3-haiku",
    complex: "claude-sonnet",
  },
  translation: {
    simple: "gpt-4o-mini",
    medium: "claude-sonnet",
    complex: "gpt-4o",
  },
  writing: {
    simple: "claude-3-haiku",
    medium: "claude-sonnet",
    complex: "claude-opus",
  },
  editing: {
    simple: "gpt-4o-mini",
    medium: "claude-sonnet",
    complex: "gpt-4o",
  },
  analysis: {
    simple: "claude-3-haiku",
    medium: "claude-sonnet",
    complex: "claude-opus",
  },
  coding: {
    simple: "gpt-4o-mini",
    medium: "claude-sonnet",
    complex: "claude-opus",
  },
  build: {
    simple: "claude-sonnet",
    medium: "claude-sonnet",
    complex: "claude-opus",
  },
  deploy: {
    simple: "claude-3-haiku",
    medium: "claude-sonnet",
    complex: "claude-sonnet",
  },
  workflow: {
    simple: "claude-3-haiku",
    medium: "claude-sonnet",
    complex: "claude-opus",
  },
  conversation: {
    simple: "gemini-flash",
    medium: "claude-3-haiku",
    complex: "claude-sonnet",
  },
  unknown: {
    simple: "claude-3-haiku",
    medium: "claude-sonnet",
    complex: "claude-sonnet",
  },
};

// ── CACHE CONFIG ────────────────────────────────────────────

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  exactMatchTTL: 24 * 60 * 60 * 1000,
  semanticMatchTTL: 12 * 60 * 60 * 1000,
  similarityThreshold: 0.95,
  maxEntries: 10_000,
  maxSizeBytes: 100 * 1024 * 1024,
};

// ── COST LIMITS ─────────────────────────────────────────────

export const DEFAULT_COST_LIMITS = {
  dailyBudget: 10,
  weeklyBudget: 50,
  monthlyBudget: 200,
  perRequestMax: 1,
  warningThreshold: 0.8,
};

// ── COMPRESSION CONFIG ──────────────────────────────────────

export const COMPRESSION_CONFIG = {
  enabled: true,
  thresholdTokens: 8000,
  targetRatio: 0.3,
  preserveStructure: true,
};

// ── EMBEDDING CONFIG ────────────────────────────────────────

export const EMBEDDING_CONFIG = {
  model: "text-embedding-3-small",
  dimensions: 512,
  costPer1k: 0.00002,
};
