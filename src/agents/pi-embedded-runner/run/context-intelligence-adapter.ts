/**
 * Context Intelligence Adapter for Pi Embedded Runner
 *
 * Adapts the Context Intelligence Engine for use with Pi agent sessions.
 * Handles the conversion between AgentMessage and FingerprintedMessage formats.
 */

import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ContextIntelligenceConfig } from "../../../config/types.agent-defaults.js";
import {
  ContextOrchestrator,
  estimateTokens,
  needsOptimization,
  type OrchestratorConfig,
  type OrchestrationResult,
} from "../../../context-intelligence/index.js";
import { log } from "../logger.js";

// Type guard to check if message has content property
type MessageWithContent = Extract<AgentMessage, { content: unknown }>;

function hasContent(msg: AgentMessage): msg is MessageWithContent {
  return "content" in msg && msg.content !== undefined;
}

/**
 * Extract text content from AgentMessage content field
 */
function extractTextContent(content: MessageWithContent["content"]): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter(
        (c): c is { type: "text"; text: string } =>
          c != null && typeof c === "object" && c.type === "text" && typeof c.text === "string",
      )
      .map((c) => c.text)
      .join("\n");
  }
  return "";
}

/**
 * Convert AgentMessage to the format expected by Context Intelligence
 */
function toFingerprintableMessage(
  msg: AgentMessage,
  index: number,
): { id: string; role: string; content: string } | null {
  if (!hasContent(msg)) {
    return null;
  }

  const content = extractTextContent(msg.content);
  if (!content) {
    return null;
  }

  return {
    id: `msg-${index}`,
    role: msg.role,
    content,
  };
}

/**
 * Apply optimized content back to AgentMessage array
 *
 * Note: We preserve the original message structure and only modify text content.
 * For array content (like AssistantMessage), we update text blocks in place.
 */
function applyOptimizedContent(
  messages: AgentMessage[],
  result: OrchestrationResult,
): AgentMessage[] {
  const optimizedMap = new Map<string, string>();

  for (const msg of result.messages) {
    if (msg.compressedContent && msg.compressedContent !== msg.content) {
      optimizedMap.set(msg.id, msg.compressedContent);
    }
  }

  // If no compression was applied, return original messages
  if (optimizedMap.size === 0) {
    return messages;
  }

  // Apply compressed content to messages
  // We need to be careful to preserve the original message types
  return messages.map((msg, index) => {
    const msgId = `msg-${index}`;
    const compressed = optimizedMap.get(msgId);

    if (!compressed || !hasContent(msg)) {
      return msg;
    }

    // For user messages with string content, we can directly replace
    if (msg.role === "user" && typeof msg.content === "string") {
      return { ...msg, content: compressed } as AgentMessage;
    }

    // For messages with array content (assistant, etc.), update text blocks
    if (Array.isArray(msg.content)) {
      const newContent = msg.content.map((c) => {
        if (c != null && typeof c === "object" && c.type === "text") {
          return { ...c, text: compressed };
        }
        return c;
      });
      // Cast back to preserve the original type structure
      return { ...msg, content: newContent } as AgentMessage;
    }

    return msg;
  });
}

/**
 * Build orchestrator config from ContextIntelligenceConfig
 */
function buildOrchestratorConfig(config: ContextIntelligenceConfig): Partial<OrchestratorConfig> {
  const orchestratorConfig: Partial<OrchestratorConfig> = {};

  if (config.maxContextTokens) {
    orchestratorConfig.maxContextTokens = config.maxContextTokens;
  }
  if (config.targetContextTokens) {
    orchestratorConfig.targetContextTokens = config.targetContextTokens;
  }
  if (config.reserveTokens) {
    orchestratorConfig.reserveTokens = config.reserveTokens;
  }

  // Compression settings
  if (config.compression) {
    orchestratorConfig.compression = {
      preserveRecent: config.compression.preserveRecent ?? 5,
      preserveImportance: config.compression.preserveImportance ?? 0.8,
      targetCompressionRatio: config.compression.targetRatio ?? 0.5,
      enableSummarization: config.compression.enableSummarization ?? true,
      enableSemantic: config.compression.enableSemantic ?? true,
    };
  }

  // Progressive compression thresholds
  if (config.progressive?.enabled && config.progressive.thresholds) {
    orchestratorConfig.progressiveThresholds = config.progressive.thresholds.map((t) => ({
      minutes: t.minutes,
      compressionLevel: t.level,
    }));
  }

  // Caching settings
  if (config.caching) {
    orchestratorConfig.enablePromptCaching = config.caching.enabled ?? true;
    if (config.caching.warmupInterval) {
      orchestratorConfig.cacheWarmupInterval = config.caching.warmupInterval;
    }
  }

  return orchestratorConfig;
}

/**
 * Result of context intelligence optimization
 */
export interface ContextOptimizationResult {
  messages: AgentMessage[];
  applied: boolean;
  originalTokens: number;
  optimizedTokens: number;
  savedTokens: number;
  savingsPercent: number;
  decisions: Array<{
    type: string;
    reason: string;
    tokenImpact: number;
  }>;
}

/**
 * Estimate tokens for an AgentMessage
 */
function estimateMessageTokens(msg: AgentMessage): number {
  if (!hasContent(msg)) {
    return 0;
  }

  if (typeof msg.content === "string") {
    return estimateTokens(msg.content);
  }

  if (Array.isArray(msg.content)) {
    return msg.content.reduce((sum: number, c) => {
      if (c != null && typeof c === "object") {
        if (c.type === "text" && typeof c.text === "string") {
          return sum + estimateTokens(c.text);
        }
        // Images add roughly 1000 tokens each
        if (c.type === "image") {
          return sum + 1000;
        }
      }
      return sum;
    }, 0);
  }

  return 0;
}

/**
 * Apply context intelligence optimization to session messages
 */
export function applyContextIntelligence(
  messages: AgentMessage[],
  systemPrompt: string,
  config: ContextIntelligenceConfig | undefined,
  modelId: string,
): ContextOptimizationResult {
  // Check if context intelligence is enabled
  if (!config?.enabled) {
    const totalTokens =
      estimateTokens(systemPrompt) + messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
    return {
      messages,
      applied: false,
      originalTokens: totalTokens,
      optimizedTokens: totalTokens,
      savedTokens: 0,
      savingsPercent: 0,
      decisions: [],
    };
  }

  // Calculate current token usage
  const systemTokens = estimateTokens(systemPrompt);
  const messageTokens = messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
  const totalOriginal = systemTokens + messageTokens;

  // Check if optimization is needed
  const targetLimit = config.targetContextTokens ?? 150000;
  if (!needsOptimization(systemTokens, messageTokens, targetLimit)) {
    log.debug(
      `context-intelligence: no optimization needed (${totalOriginal} tokens < ${targetLimit} target)`,
    );
    return {
      messages,
      applied: false,
      originalTokens: totalOriginal,
      optimizedTokens: totalOriginal,
      savedTokens: 0,
      savingsPercent: 0,
      decisions: [],
    };
  }

  log.debug(
    `context-intelligence: optimizing context (${totalOriginal} tokens > ${targetLimit} target)`,
  );

  // Convert messages to fingerprintable format (filter out messages without content)
  const fingerprintableMessages = messages
    .map((msg, i) => toFingerprintableMessage(msg, i))
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null);

  // Create orchestrator with config
  const orchestratorConfig = buildOrchestratorConfig(config);
  const orchestrator = new ContextOrchestrator(orchestratorConfig);

  // Run orchestration (empty workspace files for now)
  const result = orchestrator.orchestrate(systemPrompt, {}, fingerprintableMessages, modelId);

  // Apply optimized content back to messages
  const optimizedMessages = applyOptimizedContent(messages, result);

  // Calculate final token count
  const optimizedTokens = result.actualTokens;
  const savedTokens = totalOriginal - optimizedTokens;
  const savingsPercent = totalOriginal > 0 ? (savedTokens / totalOriginal) * 100 : 0;

  log.debug(
    `context-intelligence: optimized ${totalOriginal} -> ${optimizedTokens} tokens ` +
      `(saved ${savedTokens}, ${savingsPercent.toFixed(1)}%)`,
  );

  // Log decisions for debugging
  for (const decision of result.decisions) {
    log.debug(
      `context-intelligence: ${decision.type} - ${decision.reason} (${decision.tokenImpact} tokens)`,
    );
  }

  return {
    messages: optimizedMessages,
    applied: result.compressionApplied,
    originalTokens: totalOriginal,
    optimizedTokens,
    savedTokens,
    savingsPercent,
    decisions: result.decisions.map((d) => ({
      type: d.type,
      reason: d.reason,
      tokenImpact: d.tokenImpact,
    })),
  };
}
