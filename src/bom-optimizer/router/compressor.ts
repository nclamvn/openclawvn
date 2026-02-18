/**
 * Context Compressor
 * Reduces input size while preserving meaning
 */

import { COMPRESSION_CONFIG } from "../config.js";

export interface CompressionResult {
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  ratio: number;
  method: "none" | "truncate" | "extractive";
}

/** Estimate token count (~4 chars per token) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Extract key sentences by importance scoring */
function extractKeySentences(text: string, targetRatio: number): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length === 0) return text;

  const scored = sentences.map((sentence, index) => {
    let score = 0;

    if (index === 0) score += 2;
    if (index === sentences.length - 1) score += 1;
    if (/\d+/.test(sentence)) score += 1;
    if (
      /\b(important|key|main|critical|essential|must|should|conclusion|result|summary)\b/i.test(
        sentence,
      )
    )
      score += 2;
    if (/[A-Z][a-z]+/.test(sentence)) score += 0.5;
    score += Math.min(sentence.length / 200, 1);

    return { sentence: sentence.trim(), score, index };
  });

  const targetCount = Math.ceil(sentences.length * targetRatio);
  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.index - b.index);

  return selected.map((s) => s.sentence).join(". ") + ".";
}

/** Preserve structure (headers, lists) while compressing content */
function preserveStructure(text: string, targetRatio: number): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let contentBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Keep headers
    if (/^#+\s/.test(trimmed) || /^[A-Z][^a-z]*:/.test(trimmed)) {
      if (contentBuffer.length > 0) {
        const content = contentBuffer.join(" ");
        result.push(
          estimateTokens(content) > 200 ? extractKeySentences(content, targetRatio) : content,
        );
        contentBuffer = [];
      }
      result.push(trimmed);
    }
    // Keep list items (truncate if long)
    else if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      result.push(trimmed.length > 200 ? trimmed.substring(0, 200) + "..." : trimmed);
    }
    // Accumulate regular content
    else if (trimmed.length > 0) {
      contentBuffer.push(trimmed);
    }
  }

  if (contentBuffer.length > 0) {
    const content = contentBuffer.join(" ");
    result.push(
      estimateTokens(content) > 200 ? extractKeySentences(content, targetRatio) : content,
    );
  }

  return result.join("\n");
}

// ── MAIN COMPRESSOR ─────────────────────────────────────────

/** Compress text to reduce token usage */
export function compressContext(
  text: string,
  options: {
    targetTokens?: number;
    targetRatio?: number;
    preserveStructure?: boolean;
  } = {},
): CompressionResult {
  const originalTokens = estimateTokens(text);

  if (originalTokens < COMPRESSION_CONFIG.thresholdTokens) {
    return {
      compressed: text,
      originalTokens,
      compressedTokens: originalTokens,
      ratio: 1,
      method: "none",
    };
  }

  const targetRatio = options.targetRatio || COMPRESSION_CONFIG.targetRatio;
  const targetTokens = options.targetTokens || Math.ceil(originalTokens * targetRatio);

  let compressed: string;

  if (options.preserveStructure !== false && COMPRESSION_CONFIG.preserveStructure) {
    compressed = preserveStructure(text, targetRatio);
  } else {
    compressed = extractKeySentences(text, targetRatio);
  }

  let compressedTokens = estimateTokens(compressed);
  let method: CompressionResult["method"] = "extractive";

  // If still too long, truncate
  if (compressedTokens > targetTokens * 1.5) {
    const targetChars = targetTokens * 4;
    compressed = compressed.substring(0, targetChars) + "\n\n[Content truncated for length...]";
    compressedTokens = estimateTokens(compressed);
    method = "truncate";
  }

  return {
    compressed,
    originalTokens,
    compressedTokens,
    ratio: compressedTokens / originalTokens,
    method,
  };
}

/** Compress multiple documents and merge */
export function compressAndMerge(
  documents: Array<{ content: string; name?: string }>,
  targetTokens: number,
): CompressionResult {
  const totalTokens = documents.reduce((sum, doc) => sum + estimateTokens(doc.content), 0);

  if (totalTokens <= targetTokens) {
    const merged = documents
      .map((d) => (d.name ? `## ${d.name}\n${d.content}` : d.content))
      .join("\n\n");
    return {
      compressed: merged,
      originalTokens: totalTokens,
      compressedTokens: totalTokens,
      ratio: 1,
      method: "none",
    };
  }

  const tokensPerDoc = Math.floor(targetTokens / documents.length);

  const compressedDocs = documents.map((doc) => {
    const result = compressContext(doc.content, {
      targetTokens: tokensPerDoc,
      preserveStructure: true,
    });
    return { name: doc.name, content: result.compressed };
  });

  const merged = compressedDocs
    .map((d) => (d.name ? `## ${d.name}\n${d.content}` : d.content))
    .join("\n\n");
  const compressedTokens = estimateTokens(merged);

  return {
    compressed: merged,
    originalTokens: totalTokens,
    compressedTokens,
    ratio: compressedTokens / totalTokens,
    method: "extractive",
  };
}
