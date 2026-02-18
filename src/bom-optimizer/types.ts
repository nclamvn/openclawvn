/**
 * Token Optimization Engine - Type Definitions
 */

// ── MODEL & TASK TYPES ──────────────────────────────────────

export type ModelProvider = "anthropic" | "openai" | "google" | "local";

export type ModelTier = "fast" | "balanced" | "powerful" | "reasoning";

export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  tier: ModelTier;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgLatencyMs: number;
  capabilities: string[];
}

export type TaskType =
  | "classification"
  | "extraction"
  | "summarization"
  | "translation"
  | "writing"
  | "editing"
  | "analysis"
  | "coding"
  | "conversation"
  | "build"
  | "deploy"
  | "workflow"
  | "unknown";

export interface TaskClassification {
  type: TaskType;
  complexity: "simple" | "medium" | "complex";
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresAccuracy: boolean;
  confidence: number;
}

export interface IntentMetadata {
  intent: TaskType;
  boostSkills: string[];
  contextHints: string[];
  suggestions: IntentSuggestion[];
  confidence: number;
}

export interface IntentSuggestion {
  label: string;
  trigger: string;
  timing: "after_reply";
}

// ── CACHE TYPES ─────────────────────────────────────────────

export interface CacheEntry {
  id: string;
  promptHash: string;
  promptEmbedding?: number[];
  response: string;
  model: string;
  tokens: { input: number; output: number };
  cost: number;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  metadata?: Record<string, unknown>;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  tokensSaved: number;
  costSaved: number;
}

export interface CacheConfig {
  enabled: boolean;
  exactMatchTTL: number;
  semanticMatchTTL: number;
  similarityThreshold: number;
  maxEntries: number;
  maxSizeBytes: number;
}

// ── CHECKPOINT TYPES ────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: unknown;
  output?: unknown;
  error?: string;
  model?: string;
  tokens?: { input: number; output: number };
  cost?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface WorkflowCheckpoint {
  id: string;
  userId: string;
  name: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  status: "running" | "completed" | "failed" | "paused";
  createdAt: number;
  updatedAt: number;
  totalTokens: { input: number; output: number };
  totalCost: number;
  metadata?: Record<string, unknown>;
}

// ── COST TRACKING TYPES ─────────────────────────────────────

export interface RequestMetrics {
  id: string;
  userId: string;
  timestamp: number;
  taskType: TaskType;
  model: string;
  modelTier: ModelTier;
  tokens: { input: number; output: number };
  cost: number;
  latencyMs: number;
  cacheHit: boolean;
  checkpointUsed: boolean;
  tokensSaved: number;
  costSaved: number;
}

export interface UserStats {
  userId: string;
  period: "day" | "week" | "month" | "all";
  totalRequests: number;
  totalTokens: { input: number; output: number };
  totalCost: number;
  totalSaved: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  modelUsage: Record<string, number>;
  taskTypeUsage: Record<string, number>;
}

export interface CostAlert {
  type: "budget_warning" | "budget_exceeded" | "unusual_spike";
  threshold: number;
  current: number;
  message: string;
}

// ── ROUTING DECISION ────────────────────────────────────────

export interface RoutingDecision {
  selectedModel: ModelConfig;
  reason: string;
  alternatives: ModelConfig[];
  estimatedCost: number;
  estimatedLatency: number;
  compressionApplied: boolean;
  compressionRatio?: number;
}
