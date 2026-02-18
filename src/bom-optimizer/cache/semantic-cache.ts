/**
 * Semantic Cache
 * Embedding-based similarity matching for similar prompts
 */

import { createHash } from "crypto";
import * as store from "./store.js";
import type { CacheEntry } from "../types.js";
import { DEFAULT_CACHE_CONFIG, EMBEDDING_CONFIG } from "../config.js";

// ── EMBEDDING GENERATION ────────────────────────────────────

const embeddingCache = new Map<string, number[]>();

/** Generate embedding for text using OpenAI API */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = text.substring(0, 1000);
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_CONFIG.model,
        input: text.substring(0, 8000),
        dimensions: EMBEDDING_CONFIG.dimensions,
      }),
    });

    if (!response.ok) {
      console.warn("[SemanticCache] Embedding API error:", response.status);
      return [];
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[] }>;
    };
    const embedding = data.data?.[0]?.embedding || [];

    embeddingCache.set(cacheKey, embedding);

    // Limit memory cache size
    if (embeddingCache.size > 1000) {
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey !== undefined) embeddingCache.delete(firstKey);
    }

    return embedding;
  } catch (error) {
    console.warn("[SemanticCache] Embedding generation failed:", error);
    return [];
  }
}

// ── SIMILARITY COMPUTATION ──────────────────────────────────

/** Compute cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ── SEMANTIC CACHE OPERATIONS ───────────────────────────────

/** Find semantically similar cached response */
export async function findSimilar(
  prompt: string,
  threshold: number = DEFAULT_CACHE_CONFIG.similarityThreshold,
): Promise<{ entry: CacheEntry; similarity: number } | null> {
  const queryEmbedding = await generateEmbedding(prompt);
  if (queryEmbedding.length === 0) return null;

  const cachedEmbeddings = store.getAllEmbeddings();
  if (cachedEmbeddings.length === 0) return null;

  let bestMatch: { id: string; similarity: number } | null = null;

  for (const cached of cachedEmbeddings) {
    const similarity = cosineSimilarity(queryEmbedding, cached.embedding);
    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { id: cached.id, similarity };
      }
    }
  }

  if (!bestMatch) return null;

  const entry = store.getById(bestMatch.id);
  if (!entry) return null;

  return { entry, similarity: bestMatch.similarity };
}

/** Store response with embedding for semantic matching */
export async function set(
  prompt: string,
  response: string,
  options: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    ttl?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const embedding = await generateEmbedding(prompt);
  if (embedding.length === 0) return;

  const now = Date.now();
  const promptHash = createHash("sha256").update(prompt).digest("hex").substring(0, 32);

  store.setEntry({
    id: `semantic_${promptHash}_${now}`,
    promptHash,
    promptEmbedding: embedding,
    response,
    model: options.model,
    tokens: { input: options.inputTokens, output: options.outputTokens },
    cost: options.cost,
    createdAt: now,
    expiresAt: now + (options.ttl || DEFAULT_CACHE_CONFIG.semanticMatchTTL),
    hitCount: 0,
    metadata: options.metadata,
  });
}
