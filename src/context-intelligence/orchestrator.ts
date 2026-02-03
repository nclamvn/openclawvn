/**
 * Smart Context Orchestrator
 *
 * Điều phối thông minh việc quản lý context:
 * - Chọn context phù hợp với task
 * - Token budgeting
 * - Cache-aware routing
 * - Adaptive decisions
 */

import {
  createFingerprint,
  fingerprintMessage,
  fingerprintSystemContext,
  createCacheKey,
  FingerprintManager,
  type ContextFingerprint,
  type FingerprintedMessage,
} from "./fingerprint.js";
import { ContextCompressor, type CompressionConfig } from "./compressor.js";

// Types
export interface OrchestratorConfig {
  // Token limits
  maxContextTokens: number; // Hard limit từ model
  targetContextTokens: number; // Target để có headroom
  reserveTokens: number; // Reserve cho response

  // Compression settings
  compression: Partial<CompressionConfig>;

  // Progressive compression thresholds
  progressiveThresholds: { minutes: number; compressionLevel: number }[];

  // Cache settings
  enablePromptCaching: boolean;
  cacheWarmupInterval: number; // minutes

  // Intelligence settings
  enableSemanticSelection: boolean;
  enableImportanceScoring: boolean;
}

export interface ContextBudget {
  systemPrompt: number;
  workspaceFiles: number;
  conversationHistory: number;
  toolResults: number;
  reserve: number;
  total: number;
}

export interface OrchestrationResult {
  messages: FingerprintedMessage[];
  systemPrompt: string;
  budget: ContextBudget;
  actualTokens: number;
  compressionApplied: boolean;
  cacheKey: string | null;
  decisions: OrchestrationDecision[];
}

export interface OrchestrationDecision {
  type: "include" | "exclude" | "compress" | "summarize";
  messageId?: string;
  reason: string;
  tokenImpact: number;
}

// Constants
const DEFAULT_CONFIG: OrchestratorConfig = {
  maxContextTokens: 200000,
  targetContextTokens: 150000,
  reserveTokens: 10000,

  compression: {
    maxTokenBudget: 100000,
    targetCompressionRatio: 0.5,
    preserveRecent: 5,
    preserveImportance: 0.8,
  },

  progressiveThresholds: [
    { minutes: 5, compressionLevel: 0 }, // 0-5m: không nén
    { minutes: 30, compressionLevel: 1 }, // 5-30m: nén nhẹ
    { minutes: 60, compressionLevel: 2 }, // 30-60m: nén vừa
    { minutes: 180, compressionLevel: 3 }, // 1-3h: nén mạnh
    { minutes: Infinity, compressionLevel: 4 }, // >3h: nén tối đa
  ],

  enablePromptCaching: true,
  cacheWarmupInterval: 55, // Just under 1h TTL

  enableSemanticSelection: true,
  enableImportanceScoring: true,
};

/**
 * Main orchestrator class
 */
export class ContextOrchestrator {
  private config: OrchestratorConfig;
  private fingerprintManager: FingerprintManager;
  private compressor: ContextCompressor;
  private lastCacheKey: string | null = null;
  private cacheKeyTimestamp: number = 0;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.fingerprintManager = new FingerprintManager();
    this.compressor = new ContextCompressor(this.config.compression);
  }

  /**
   * Main orchestration method
   * Nhận raw messages và trả về optimized context
   */
  orchestrate(
    systemPrompt: string,
    workspaceFiles: Record<string, string>,
    messages: Array<{ id: string; role: string; content: string }>,
    modelId: string,
  ): OrchestrationResult {
    const decisions: OrchestrationDecision[] = [];

    // Step 1: Fingerprint everything
    const { systemPromptFingerprint, workspaceFingerprints, combinedHash } =
      fingerprintSystemContext(systemPrompt, workspaceFiles);

    const fingerprintedMessages = messages.map((msg) => fingerprintMessage(msg));

    // Step 2: Calculate budget
    const budget = this.calculateBudget(
      systemPromptFingerprint,
      workspaceFingerprints,
      fingerprintedMessages,
    );

    // Step 3: Check if we need compression
    const totalCurrentTokens = this.calculateTotalTokens(
      systemPromptFingerprint,
      workspaceFingerprints,
      fingerprintedMessages,
    );

    let finalMessages = fingerprintedMessages;
    let compressionApplied = false;

    if (totalCurrentTokens > this.config.targetContextTokens) {
      // Step 4: Apply progressive compression
      finalMessages = this.compressor.progressiveCompress(
        fingerprintedMessages,
        this.config.progressiveThresholds,
      );

      decisions.push({
        type: "compress",
        reason: `Total tokens ${totalCurrentTokens} exceeds target ${this.config.targetContextTokens}`,
        tokenImpact: totalCurrentTokens - this.calculateMessageTokens(finalMessages),
      });

      compressionApplied = true;

      // Step 5: If still over budget, apply selective exclusion
      const afterCompressionTokens = this.calculateMessageTokens(finalMessages);
      if (
        afterCompressionTokens + budget.systemPrompt + budget.workspaceFiles >
        this.config.targetContextTokens
      ) {
        const { messages: selected, excluded } = this.selectMessages(
          finalMessages,
          this.config.targetContextTokens - budget.systemPrompt - budget.workspaceFiles,
        );

        finalMessages = selected;

        for (const msg of excluded) {
          decisions.push({
            type: "exclude",
            messageId: msg.id,
            reason: `Low importance (${msg.fingerprint.importance.toFixed(2)}) and old`,
            tokenImpact: msg.fingerprint.tokenEstimate,
          });
        }
      }
    }

    // Step 6: Generate cache key if caching enabled
    let cacheKey: string | null = null;
    if (this.config.enablePromptCaching) {
      cacheKey = this.getCacheKey(combinedHash, modelId);
    }

    // Step 7: Calculate actual tokens
    const actualTokens =
      budget.systemPrompt + budget.workspaceFiles + this.calculateMessageTokens(finalMessages);

    return {
      messages: finalMessages,
      systemPrompt,
      budget,
      actualTokens,
      compressionApplied,
      cacheKey,
      decisions,
    };
  }

  /**
   * Get or create cache key with warmup tracking
   */
  private getCacheKey(combinedHash: string, modelId: string): string {
    const now = Date.now();
    const cacheWarmupMs = this.config.cacheWarmupInterval * 60 * 1000;

    // Check if we should reuse existing cache key
    if (
      this.lastCacheKey &&
      now - this.cacheKeyTimestamp < cacheWarmupMs &&
      this.lastCacheKey.startsWith(combinedHash)
    ) {
      return this.lastCacheKey;
    }

    // Create new cache key
    const newKey = createCacheKey(combinedHash, modelId);
    this.lastCacheKey = newKey;
    this.cacheKeyTimestamp = now;

    return newKey;
  }

  /**
   * Calculate token budget allocation
   */
  private calculateBudget(
    systemPromptFp: ContextFingerprint,
    workspaceFilesFp: Map<string, ContextFingerprint>,
    messages: FingerprintedMessage[],
  ): ContextBudget {
    const systemPromptTokens = systemPromptFp.tokenEstimate;

    let workspaceTokens = 0;
    for (const fp of workspaceFilesFp.values()) {
      workspaceTokens += fp.tokenEstimate;
    }

    // Calculate message tokens by type
    let conversationTokens = 0;
    let toolTokens = 0;
    for (const msg of messages) {
      if (msg.role === "tool") {
        toolTokens += msg.fingerprint.tokenEstimate;
      } else {
        conversationTokens += msg.fingerprint.tokenEstimate;
      }
    }

    const total =
      systemPromptTokens +
      workspaceTokens +
      conversationTokens +
      toolTokens +
      this.config.reserveTokens;

    return {
      systemPrompt: systemPromptTokens,
      workspaceFiles: workspaceTokens,
      conversationHistory: conversationTokens,
      toolResults: toolTokens,
      reserve: this.config.reserveTokens,
      total,
    };
  }

  /**
   * Calculate total tokens
   */
  private calculateTotalTokens(
    systemPromptFp: ContextFingerprint,
    workspaceFilesFp: Map<string, ContextFingerprint>,
    messages: FingerprintedMessage[],
  ): number {
    let total = systemPromptFp.tokenEstimate;

    for (const fp of workspaceFilesFp.values()) {
      total += fp.tokenEstimate;
    }

    for (const msg of messages) {
      total += msg.fingerprint.tokenEstimate;
    }

    return total;
  }

  /**
   * Calculate message tokens
   */
  private calculateMessageTokens(messages: FingerprintedMessage[]): number {
    let total = 0;
    for (const msg of messages) {
      // Use compressed content length if available
      if (msg.compressedContent) {
        total += Math.ceil(msg.compressedContent.length / 4);
      } else {
        total += msg.fingerprint.tokenEstimate;
      }
    }
    return total;
  }

  /**
   * Select messages to fit within budget
   */
  private selectMessages(
    messages: FingerprintedMessage[],
    tokenBudget: number,
  ): {
    messages: FingerprintedMessage[];
    excluded: FingerprintedMessage[];
  } {
    // Sort by importance (high to low) and recency (new to old)
    const sorted = [...messages].sort((a, b) => {
      // First by importance
      const importanceDiff = b.fingerprint.importance - a.fingerprint.importance;
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff;

      // Then by recency
      return b.fingerprint.createdAt - a.fingerprint.createdAt;
    });

    // Always include recent messages
    const recent = sorted.slice(0, this.config.compression.preserveRecent ?? 5);
    const rest = sorted.slice(this.config.compression.preserveRecent ?? 5);

    let currentTokens = 0;
    for (const msg of recent) {
      currentTokens += msg.compressedContent
        ? Math.ceil(msg.compressedContent.length / 4)
        : msg.fingerprint.tokenEstimate;
    }

    const selected: FingerprintedMessage[] = [...recent];
    const excluded: FingerprintedMessage[] = [];

    // Add more messages until budget exhausted
    for (const msg of rest) {
      const msgTokens = msg.compressedContent
        ? Math.ceil(msg.compressedContent.length / 4)
        : msg.fingerprint.tokenEstimate;

      if (currentTokens + msgTokens <= tokenBudget) {
        selected.push(msg);
        currentTokens += msgTokens;
      } else {
        excluded.push(msg);
      }
    }

    // Restore original order
    selected.sort((a, b) => {
      const aIndex = messages.findIndex((m) => m.id === a.id);
      const bIndex = messages.findIndex((m) => m.id === b.id);
      return aIndex - bIndex;
    });

    return { messages: selected, excluded };
  }

  /**
   * Get compression stats
   */
  getStats(): {
    totalMessagesProcessed: number;
    totalTokensSaved: number;
    cacheHitRate: number;
  } {
    return {
      totalMessagesProcessed: this.fingerprintManager.export().messages.size,
      totalTokensSaved: 0, // Would need to track this
      cacheHitRate: 0, // Would need to track this
    };
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.fingerprintManager = new FingerprintManager();
    this.lastCacheKey = null;
    this.cacheKeyTimestamp = 0;
  }
}

/**
 * Create optimized context for API call
 * Convenience function
 */
export function optimizeContext(
  systemPrompt: string,
  workspaceFiles: Record<string, string>,
  messages: Array<{ id: string; role: string; content: string }>,
  modelId: string,
  config?: Partial<OrchestratorConfig>,
): OrchestrationResult {
  const orchestrator = new ContextOrchestrator(config);
  return orchestrator.orchestrate(systemPrompt, workspaceFiles, messages, modelId);
}

/**
 * Quick token estimation
 */
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Check if context needs optimization
 */
export function needsOptimization(
  systemPromptTokens: number,
  messagesTokens: number,
  targetLimit: number = 150000,
): boolean {
  return systemPromptTokens + messagesTokens > targetLimit;
}
