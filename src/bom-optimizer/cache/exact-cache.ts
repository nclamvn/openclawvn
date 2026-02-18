/**
 * Exact Match Cache
 * Fast hash-based lookup for identical prompts
 */

import { createHash } from "crypto";
import * as store from "./store.js";
import type { CacheEntry } from "../types.js";
import { DEFAULT_CACHE_CONFIG } from "../config.js";

/** Create deterministic hash of prompt + system prompt */
export function hashPrompt(prompt: string, systemPrompt?: string, model?: string): string {
  const content = [systemPrompt || "", prompt, model || ""].join("|||");
  return createHash("sha256").update(content).digest("hex").substring(0, 32);
}

/** Check for exact match */
export function get(prompt: string, systemPrompt?: string, model?: string): CacheEntry | null {
  const hash = hashPrompt(prompt, systemPrompt, model);
  return store.getByHash(hash);
}

/** Store response in cache */
export function set(
  prompt: string,
  response: string,
  options: {
    systemPrompt?: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    ttl?: number;
    metadata?: Record<string, unknown>;
  },
): void {
  const hash = hashPrompt(prompt, options.systemPrompt, options.model);
  const now = Date.now();

  store.setEntry({
    id: `exact_${hash}_${now}`,
    promptHash: hash,
    response,
    model: options.model,
    tokens: { input: options.inputTokens, output: options.outputTokens },
    cost: options.cost,
    createdAt: now,
    expiresAt: now + (options.ttl || DEFAULT_CACHE_CONFIG.exactMatchTTL),
    hitCount: 0,
    metadata: options.metadata,
  });
}

/** Check if prompt is cached */
export function has(prompt: string, systemPrompt?: string, model?: string): boolean {
  return get(prompt, systemPrompt, model) !== null;
}

/** Invalidate specific cache entry */
export function invalidate(prompt: string, systemPrompt?: string, model?: string): void {
  const entry = get(prompt, systemPrompt, model);
  if (entry) store.deleteEntry(entry.id);
}
