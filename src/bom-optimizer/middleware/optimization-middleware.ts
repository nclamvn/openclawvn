/**
 * Optimization Middleware
 * Integrates with OpenClaw gateway or any LLM handler
 */

import { router } from "../router/index.js";
import { cache } from "../cache/index.js";
import { createTracker } from "../tracker/index.js";
import { compressContext } from "../router/compressor.js";
import { MODELS } from "../config.js";

interface LLMRequest {
  userId: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  maxTokens?: number;
}

interface LLMResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

type LLMHandler = (request: LLMRequest) => Promise<LLMResponse>;

/** Create optimization middleware that wraps an LLM handler */
export function createOptimizationMiddleware(
  options: {
    enableCache?: boolean;
    enableRouting?: boolean;
    enableCompression?: boolean;
    enableTracking?: boolean;
    logger?: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  } = {},
) {
  const {
    enableCache = true,
    enableRouting = true,
    enableCompression = true,
    enableTracking = true,
    logger = console,
  } = options;

  return function optimizationMiddleware(handler: LLMHandler): LLMHandler {
    return async (request: LLMRequest): Promise<LLMResponse> => {
      const startTime = Date.now();
      const userMessage = request.messages.find((m) => m.role === "user");
      const prompt = userMessage?.content || "";

      // Check cache
      if (enableCache) {
        const cached = await cache.get(prompt, {
          systemPrompt: request.systemPrompt,
          model: request.model,
          allowSemantic: true,
        });

        if (cached) {
          logger.info(`[Optimization] Cache HIT (${cached.type})`);

          if (enableTracking) {
            createTracker(request.userId).record({
              model: cached.entry.model,
              inputTokens: cached.entry.tokens.input,
              outputTokens: cached.entry.tokens.output,
              latencyMs: Date.now() - startTime,
              cacheHit: true,
            });
          }

          return {
            content: cached.entry.response,
            model: cached.entry.model,
            usage: { inputTokens: 0, outputTokens: 0 },
          };
        }
        logger.info("[Optimization] Cache MISS");
      }

      // Route to optimal model
      const finalRequest = { ...request };

      if (enableRouting && !request.model) {
        const routingDecision = router.route(prompt, {
          systemPrompt: request.systemPrompt,
        });
        finalRequest.model = routingDecision.selectedModel.id;
        logger.info(
          `[Optimization] Routed to ${routingDecision.selectedModel.id} (${routingDecision.reason})`,
        );
      }

      // Compress if needed
      if (enableCompression) {
        const compressed = compressContext(prompt);
        if (compressed.method !== "none") {
          finalRequest.messages = request.messages.map((m) =>
            m.role === "user" ? { ...m, content: compressed.compressed } : m,
          );
          logger.info(
            `[Optimization] Compressed ${compressed.originalTokens} → ${compressed.compressedTokens} tokens (${Math.round(compressed.ratio * 100)}%)`,
          );
        }
      }

      // Baseline cost estimate (without optimization)
      const baselineModel = MODELS["claude-sonnet"];
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      const baselineCost = (estimatedInputTokens / 1000) * baselineModel.inputCostPer1k;

      // Execute
      const response = await handler(finalRequest);
      const latencyMs = Date.now() - startTime;

      // Save to cache
      if (enableCache) {
        await cache.set(prompt, response.content, {
          systemPrompt: request.systemPrompt,
          model: response.model,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          cost: 0,
          enableSemantic: true,
        });
      }

      // Track metrics
      if (enableTracking) {
        createTracker(request.userId).record({
          model: response.model,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          latencyMs,
          cacheHit: false,
          baselineCost,
        });
      }

      return response;
    };
  };
}
