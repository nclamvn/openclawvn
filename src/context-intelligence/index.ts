/**
 * Context Intelligence Engine
 *
 * Module tối ưu hóa context để giảm chi phí API token
 *
 * @example
 * ```typescript
 * import { ContextOrchestrator, optimizeContext } from './context-intelligence';
 *
 * // Quick usage
 * const result = optimizeContext(systemPrompt, workspaceFiles, messages, 'claude-sonnet-4-5');
 * console.log(`Saved ${result.budget.total - result.actualTokens} tokens`);
 *
 * // Advanced usage
 * const orchestrator = new ContextOrchestrator({
 *   maxContextTokens: 200000,
 *   targetContextTokens: 150000,
 *   enablePromptCaching: true,
 * });
 *
 * const optimized = orchestrator.orchestrate(systemPrompt, workspaceFiles, messages, modelId);
 * ```
 */

// Fingerprinting
export {
  createFingerprint,
  fingerprintMessage,
  fingerprintSystemContext,
  createCacheKey,
  compareFingerprints,
  findDuplicates,
  FingerprintManager,
  type ContextFingerprint,
  type FingerprintedMessage,
  type FingerprintStore,
} from "./fingerprint.js";

// Compression
export {
  ContextCompressor,
  defaultCompressor,
  type CompressionResult,
  type CompressionMetadata,
  type CompressionMethod,
  type CompressionConfig,
} from "./compressor.js";

// Orchestration
export {
  ContextOrchestrator,
  optimizeContext,
  estimateTokens,
  needsOptimization,
  type OrchestratorConfig,
  type ContextBudget,
  type OrchestrationResult,
  type OrchestrationDecision,
} from "./orchestrator.js";

// Re-export default instances
export { defaultCompressor as compressor } from "./compressor.js";
