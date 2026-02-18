/**
 * Cache Manager
 * Unified interface for exact and semantic caching
 */

import * as exactCache from "./exact-cache.js";
import * as semanticCache from "./semantic-cache.js";
import * as store from "./store.js";
import { DEFAULT_CACHE_CONFIG } from "../config.js";
import type { CacheEntry, CacheConfig, CacheStats } from "../types.js";

export class CacheManager {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /** Try to get cached response (exact first, then semantic) */
  async get(
    prompt: string,
    options: {
      systemPrompt?: string;
      model?: string;
      allowSemantic?: boolean;
    } = {},
  ): Promise<{
    entry: CacheEntry;
    type: "exact" | "semantic";
    similarity?: number;
  } | null> {
    if (!this.config.enabled) return null;

    // Try exact match first (fast)
    const exactMatch = exactCache.get(prompt, options.systemPrompt, options.model);
    if (exactMatch) {
      const tokensSaved = exactMatch.tokens.input + exactMatch.tokens.output;
      store.recordHit(tokensSaved, exactMatch.cost);
      return { entry: exactMatch, type: "exact" };
    }

    // Try semantic match if allowed
    if (options.allowSemantic !== false) {
      const semanticMatch = await semanticCache.findSimilar(
        prompt,
        this.config.similarityThreshold,
      );
      if (semanticMatch) {
        const tokensSaved = semanticMatch.entry.tokens.input + semanticMatch.entry.tokens.output;
        store.recordHit(tokensSaved, semanticMatch.entry.cost);
        return {
          entry: semanticMatch.entry,
          type: "semantic",
          similarity: semanticMatch.similarity,
        };
      }
    }

    store.recordMiss();
    return null;
  }

  /** Store response in cache */
  async set(
    prompt: string,
    response: string,
    options: {
      systemPrompt?: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      cost: number;
      enableSemantic?: boolean;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    if (!this.config.enabled) return;

    exactCache.set(prompt, response, {
      systemPrompt: options.systemPrompt,
      model: options.model,
      inputTokens: options.inputTokens,
      outputTokens: options.outputTokens,
      cost: options.cost,
      ttl: this.config.exactMatchTTL,
      metadata: options.metadata,
    });

    if (options.enableSemantic !== false) {
      await semanticCache.set(prompt, response, {
        model: options.model,
        inputTokens: options.inputTokens,
        outputTokens: options.outputTokens,
        cost: options.cost,
        ttl: this.config.semanticMatchTTL,
        metadata: options.metadata,
      });
    }
  }

  invalidate(prompt: string, systemPrompt?: string, model?: string): void {
    exactCache.invalidate(prompt, systemPrompt, model);
  }

  getStats(): CacheStats {
    return store.getStats();
  }

  cleanup(): number {
    return store.deleteExpired();
  }

  clear(): void {
    store.clearAll();
  }
}

export const cache = new CacheManager();
export { exactCache, semanticCache, store };
