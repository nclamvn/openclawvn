/**
 * Smart Context Compressor
 *
 * Nén ngữ cảnh thông minh:
 * - Giữ thông tin quan trọng
 * - Loại bỏ redundancy
 * - Progressive compression theo thời gian
 */

import type { ContextFingerprint, FingerprintedMessage } from "./fingerprint.js";

// Types
export interface CompressionResult {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  method: CompressionMethod;
  lossLevel: "lossless" | "low" | "medium" | "high";
  compressedContent: string;
  metadata: CompressionMetadata;
}

export interface CompressionMetadata {
  originalLength: number;
  compressedLength: number;
  preservedSections: string[];
  removedSections: string[];
  summarizedSections: string[];
  timestamp: number;
}

export type CompressionMethod =
  | "none" // Không nén
  | "dedup" // Loại bỏ trùng lặp
  | "trim" // Cắt bỏ phần không quan trọng
  | "summarize" // Tóm tắt
  | "semantic" // Nén semantic (giữ ý nghĩa)
  | "progressive"; // Nén dần theo thời gian

export interface CompressionConfig {
  maxTokenBudget: number; // Ngân sách token tối đa
  targetCompressionRatio: number; // Tỷ lệ nén mục tiêu (0.3 = giữ 30%)
  preserveRecent: number; // Số messages gần đây không nén
  preserveImportance: number; // Ngưỡng importance để giữ nguyên
  enableSummarization: boolean; // Cho phép tóm tắt
  enableSemantic: boolean; // Cho phép nén semantic
}

// Constants
const CHARS_PER_TOKEN = 4;
const DEFAULT_CONFIG: CompressionConfig = {
  maxTokenBudget: 100000,
  targetCompressionRatio: 0.5,
  preserveRecent: 5,
  preserveImportance: 0.8,
  enableSummarization: true,
  enableSemantic: true,
};

/**
 * Main compressor class
 */
export class ContextCompressor {
  private config: CompressionConfig;

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Nén một message đơn lẻ
   */
  compressMessage(message: FingerprintedMessage, targetTokens?: number): CompressionResult {
    const originalTokens = message.fingerprint.tokenEstimate;
    const target = targetTokens ?? Math.floor(originalTokens * this.config.targetCompressionRatio);

    // Nếu đã nhỏ hơn target, không cần nén
    if (originalTokens <= target) {
      return this.noCompression(message);
    }

    // Chọn phương pháp nén dựa trên importance và content
    if (message.fingerprint.importance >= this.config.preserveImportance) {
      // High importance: chỉ trim nhẹ
      return this.trimContent(message, target);
    }

    if (message.role === "tool") {
      // Tool results: có thể nén mạnh
      return this.compressToolResult(message, target);
    }

    // Messages thông thường: summarize nếu được phép
    if (this.config.enableSummarization) {
      return this.summarizeContent(message, target);
    }

    return this.trimContent(message, target);
  }

  /**
   * Nén batch messages với ngân sách token
   */
  compressBatch(
    messages: FingerprintedMessage[],
    tokenBudget: number = this.config.maxTokenBudget,
  ): {
    compressed: FingerprintedMessage[];
    totalOriginalTokens: number;
    totalCompressedTokens: number;
    compressionStats: Map<string, CompressionResult>;
  } {
    const stats = new Map<string, CompressionResult>();
    let totalOriginal = 0;
    let totalCompressed = 0;

    // Tính tổng token hiện tại
    for (const msg of messages) {
      totalOriginal += msg.fingerprint.tokenEstimate;
    }

    // Nếu đã trong budget, không cần nén
    if (totalOriginal <= tokenBudget) {
      return {
        compressed: messages,
        totalOriginalTokens: totalOriginal,
        totalCompressedTokens: totalOriginal,
        compressionStats: stats,
      };
    }

    // Sắp xếp messages theo độ ưu tiên nén (low importance + old = nén trước)
    const sortedMessages = this.sortByCompressionPriority(messages);

    // Phân bổ ngân sách token
    const budgetAllocation = this.allocateTokenBudget(sortedMessages, tokenBudget);

    // Nén từng message theo budget phân bổ
    const compressed: FingerprintedMessage[] = [];

    for (const msg of messages) {
      const allocatedBudget = budgetAllocation.get(msg.id) ?? msg.fingerprint.tokenEstimate;

      if (msg.fingerprint.tokenEstimate <= allocatedBudget) {
        // Không cần nén
        compressed.push(msg);
        totalCompressed += msg.fingerprint.tokenEstimate;
        stats.set(msg.id, this.noCompression(msg));
      } else {
        // Cần nén
        const result = this.compressMessage(msg, allocatedBudget);
        const compressedMsg: FingerprintedMessage = {
          ...msg,
          compressedContent: result.compressedContent,
          compressionRatio: result.compressionRatio,
        };
        compressed.push(compressedMsg);
        totalCompressed += result.compressedTokens;
        stats.set(msg.id, result);
      }
    }

    return {
      compressed,
      totalOriginalTokens: totalOriginal,
      totalCompressedTokens: totalCompressed,
      compressionStats: stats,
    };
  }

  /**
   * Progressive compression - nén dần theo thời gian
   */
  progressiveCompress(
    messages: FingerprintedMessage[],
    ageThresholds: { minutes: number; compressionLevel: number }[],
  ): FingerprintedMessage[] {
    const now = Date.now();
    const result: FingerprintedMessage[] = [];

    // Sắp xếp thresholds từ lớn -> nhỏ
    const sortedThresholds = [...ageThresholds].sort((a, b) => b.minutes - a.minutes);

    for (const msg of messages) {
      const ageMinutes = (now - msg.fingerprint.createdAt) / (1000 * 60);

      // Tìm compression level phù hợp với age
      let compressionLevel = 0;
      for (const threshold of sortedThresholds) {
        if (ageMinutes >= threshold.minutes) {
          compressionLevel = threshold.compressionLevel;
          break;
        }
      }

      if (compressionLevel === 0) {
        // Không nén messages mới
        result.push(msg);
      } else {
        // Nén theo level
        const targetRatio = 1 - compressionLevel * 0.2; // level 1 = 80%, level 2 = 60%, etc.
        const targetTokens = Math.floor(msg.fingerprint.tokenEstimate * targetRatio);
        const compressed = this.compressMessage(msg, targetTokens);

        result.push({
          ...msg,
          compressedContent: compressed.compressedContent,
          compressionRatio: compressed.compressionRatio,
        });
      }
    }

    return result;
  }

  // Private methods

  private noCompression(message: FingerprintedMessage): CompressionResult {
    return {
      originalTokens: message.fingerprint.tokenEstimate,
      compressedTokens: message.fingerprint.tokenEstimate,
      compressionRatio: 1.0,
      method: "none",
      lossLevel: "lossless",
      compressedContent: message.content,
      metadata: {
        originalLength: message.content.length,
        compressedLength: message.content.length,
        preservedSections: ["all"],
        removedSections: [],
        summarizedSections: [],
        timestamp: Date.now(),
      },
    };
  }

  private trimContent(message: FingerprintedMessage, targetTokens: number): CompressionResult {
    const content = message.content;
    const targetChars = targetTokens * CHARS_PER_TOKEN;

    // Giữ đầu và cuối, bỏ giữa
    const headChars = Math.floor(targetChars * 0.4);
    const tailChars = Math.floor(targetChars * 0.4);
    const ellipsis = "\n\n[...truncated...]\n\n";

    let trimmed: string;
    if (content.length <= targetChars) {
      trimmed = content;
    } else {
      const head = content.slice(0, headChars);
      const tail = content.slice(-tailChars);
      trimmed = head + ellipsis + tail;
    }

    const compressedTokens = Math.ceil(trimmed.length / CHARS_PER_TOKEN);

    return {
      originalTokens: message.fingerprint.tokenEstimate,
      compressedTokens,
      compressionRatio: compressedTokens / message.fingerprint.tokenEstimate,
      method: "trim",
      lossLevel: "low",
      compressedContent: trimmed,
      metadata: {
        originalLength: content.length,
        compressedLength: trimmed.length,
        preservedSections: ["head", "tail"],
        removedSections: ["middle"],
        summarizedSections: [],
        timestamp: Date.now(),
      },
    };
  }

  private compressToolResult(
    message: FingerprintedMessage,
    targetTokens: number,
  ): CompressionResult {
    const content = message.content;
    const targetChars = targetTokens * CHARS_PER_TOKEN;

    // Tool results thường có structure - giữ structure, bỏ data
    let compressed: string;

    // Detect JSON
    if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
      compressed = this.compressJson(content, targetChars);
    }
    // Detect code/logs
    else if (content.includes("\n") && content.split("\n").length > 10) {
      compressed = this.compressLogs(content, targetChars);
    }
    // Default: trim
    else {
      return this.trimContent(message, targetTokens);
    }

    const compressedTokens = Math.ceil(compressed.length / CHARS_PER_TOKEN);

    return {
      originalTokens: message.fingerprint.tokenEstimate,
      compressedTokens,
      compressionRatio: compressedTokens / message.fingerprint.tokenEstimate,
      method: "semantic",
      lossLevel: "medium",
      compressedContent: compressed,
      metadata: {
        originalLength: content.length,
        compressedLength: compressed.length,
        preservedSections: ["structure"],
        removedSections: ["data-details"],
        summarizedSections: [],
        timestamp: Date.now(),
      },
    };
  }

  private compressJson(content: string, targetChars: number): string {
    try {
      const parsed = JSON.parse(content);
      const summarized = this.summarizeJsonStructure(parsed, 2); // Max depth 2
      const result = JSON.stringify(summarized, null, 2);

      if (result.length <= targetChars) {
        return result;
      }

      // Nếu vẫn quá lớn, chỉ giữ keys
      const keysOnly = this.extractJsonKeys(parsed);
      return `[JSON structure with ${keysOnly.length} keys: ${keysOnly.slice(0, 10).join(", ")}${keysOnly.length > 10 ? "..." : ""}]`;
    } catch {
      // Không phải valid JSON, trim bình thường
      return content.slice(0, targetChars);
    }
  }

  private compressLogs(content: string, targetChars: number): string {
    const lines = content.split("\n");
    const totalLines = lines.length;

    // Giữ 10 dòng đầu và 10 dòng cuối
    const headLines = 10;
    const tailLines = 10;

    if (lines.length <= headLines + tailLines) {
      return content.slice(0, targetChars);
    }

    const head = lines.slice(0, headLines).join("\n");
    const tail = lines.slice(-tailLines).join("\n");
    const summary = `\n\n[... ${totalLines - headLines - tailLines} lines omitted ...]\n\n`;

    const result = head + summary + tail;
    return result.slice(0, targetChars);
  }

  private summarizeContent(message: FingerprintedMessage, targetTokens: number): CompressionResult {
    // Placeholder for actual summarization (would call LLM)
    // For now, use trim as fallback
    const trimResult = this.trimContent(message, targetTokens);

    return {
      ...trimResult,
      method: "summarize",
      lossLevel: "medium",
      metadata: {
        ...trimResult.metadata,
        summarizedSections: ["content"],
      },
    };
  }

  private summarizeJsonStructure(obj: unknown, maxDepth: number, currentDepth = 0): unknown {
    if (currentDepth >= maxDepth) {
      if (Array.isArray(obj)) {
        return `[Array(${obj.length})]`;
      }
      if (typeof obj === "object" && obj !== null) {
        return `{Object(${Object.keys(obj).length} keys)}`;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return [];
      if (obj.length <= 3) {
        return obj.map((item) => this.summarizeJsonStructure(item, maxDepth, currentDepth + 1));
      }
      return [
        this.summarizeJsonStructure(obj[0], maxDepth, currentDepth + 1),
        `... ${obj.length - 2} more items ...`,
        this.summarizeJsonStructure(obj[obj.length - 1], maxDepth, currentDepth + 1),
      ];
    }

    if (typeof obj === "object" && obj !== null) {
      const result: Record<string, unknown> = {};
      const keys = Object.keys(obj);

      for (const key of keys.slice(0, 5)) {
        result[key] = this.summarizeJsonStructure(
          (obj as Record<string, unknown>)[key],
          maxDepth,
          currentDepth + 1,
        );
      }

      if (keys.length > 5) {
        result["..."] = `${keys.length - 5} more keys`;
      }

      return result;
    }

    // Primitives: truncate long strings
    if (typeof obj === "string" && obj.length > 100) {
      return obj.slice(0, 100) + "...";
    }

    return obj;
  }

  private extractJsonKeys(obj: unknown, prefix = ""): string[] {
    const keys: string[] = [];

    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        keys.push(...this.extractJsonKeys((obj as Record<string, unknown>)[key], fullKey));
      }
    }

    return keys;
  }

  private sortByCompressionPriority(messages: FingerprintedMessage[]): FingerprintedMessage[] {
    return [...messages].sort((a, b) => {
      // Lower importance = higher priority for compression
      const importanceDiff = a.fingerprint.importance - b.fingerprint.importance;
      if (importanceDiff !== 0) return importanceDiff;

      // Older = higher priority for compression
      return a.fingerprint.createdAt - b.fingerprint.createdAt;
    });
  }

  private allocateTokenBudget(
    messages: FingerprintedMessage[],
    totalBudget: number,
  ): Map<string, number> {
    const allocation = new Map<string, number>();

    // Tính tổng importance
    let totalImportance = 0;
    for (const msg of messages) {
      totalImportance += msg.fingerprint.importance;
    }

    // Phân bổ theo tỷ lệ importance
    for (const msg of messages) {
      const share = msg.fingerprint.importance / totalImportance;
      const allocated = Math.floor(totalBudget * share);
      allocation.set(msg.id, Math.max(allocated, 100)); // Min 100 tokens
    }

    return allocation;
  }
}

/**
 * Default compressor instance
 */
export const defaultCompressor = new ContextCompressor();
