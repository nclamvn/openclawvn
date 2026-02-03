/**
 * Context Fingerprinting Module
 *
 * Tạo "dấu vân tay" cho từng gói ngữ cảnh để:
 * - Phát hiện trùng lặp
 * - Tái sử dụng cache
 * - Track version changes
 */

import { createHash } from "node:crypto";

// Types
export interface ContextFingerprint {
  hash: string; // SHA-256 của nội dung
  version: number; // Version tăng dần
  createdAt: number; // Timestamp tạo
  tokenEstimate: number; // Số token ước tính
  importance: number; // 0-1, độ quan trọng
  tags: string[]; // Tags để phân loại
}

export interface FingerprintedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  fingerprint: ContextFingerprint;
  compressedContent?: string; // Nội dung đã nén (nếu có)
  compressionRatio?: number; // Tỷ lệ nén
}

export interface FingerprintStore {
  messages: Map<string, ContextFingerprint>;
  systemPrompt: ContextFingerprint | null;
  workspaceFiles: Map<string, ContextFingerprint>;
  lastUpdate: number;
}

// Constants
const CHARS_PER_TOKEN = 4;
const HASH_ALGORITHM = "sha256";

/**
 * Tạo fingerprint cho một đoạn text
 */
export function createFingerprint(
  content: string,
  options: {
    importance?: number;
    tags?: string[];
    existingVersion?: number;
  } = {},
): ContextFingerprint {
  const hash = createHash(HASH_ALGORITHM).update(content).digest("hex").slice(0, 16); // Chỉ lấy 16 chars đầu để tiết kiệm

  return {
    hash,
    version: (options.existingVersion ?? 0) + 1,
    createdAt: Date.now(),
    tokenEstimate: Math.ceil(content.length / CHARS_PER_TOKEN),
    importance: options.importance ?? 0.5,
    tags: options.tags ?? [],
  };
}

/**
 * Tạo fingerprint cho message
 */
export function fingerprintMessage(
  message: { id: string; role: string; content: string },
  options: { importance?: number } = {},
): FingerprintedMessage {
  // Xác định importance dựa trên role
  let importance = options.importance ?? 0.5;
  if (message.role === "system") importance = 0.9;
  if (message.role === "user") importance = 0.7;
  if (message.role === "assistant") importance = 0.6;
  if (message.role === "tool") importance = 0.3; // Tool results ít quan trọng hơn

  const fingerprint = createFingerprint(message.content, {
    importance,
    tags: [message.role],
  });

  return {
    id: message.id,
    role: message.role as FingerprintedMessage["role"],
    content: message.content,
    fingerprint,
  };
}

/**
 * Tạo fingerprint cho system prompt + workspace files
 */
export function fingerprintSystemContext(
  systemPrompt: string,
  workspaceFiles: Record<string, string>,
): {
  systemPromptFingerprint: ContextFingerprint;
  workspaceFingerprints: Map<string, ContextFingerprint>;
  combinedHash: string;
} {
  // Fingerprint system prompt
  const systemPromptFingerprint = createFingerprint(systemPrompt, {
    importance: 1.0,
    tags: ["system-prompt"],
  });

  // Fingerprint workspace files
  const workspaceFingerprints = new Map<string, ContextFingerprint>();
  const fileHashes: string[] = [systemPromptFingerprint.hash];

  for (const [path, content] of Object.entries(workspaceFiles)) {
    const fp = createFingerprint(content, {
      importance: 0.8,
      tags: ["workspace", path],
    });
    workspaceFingerprints.set(path, fp);
    fileHashes.push(fp.hash);
  }

  // Combined hash cho toàn bộ system context
  const combinedHash = createHash(HASH_ALGORITHM)
    .update(fileHashes.sort().join(":"))
    .digest("hex")
    .slice(0, 16);

  return {
    systemPromptFingerprint,
    workspaceFingerprints,
    combinedHash,
  };
}

/**
 * So sánh 2 fingerprints để detect thay đổi
 */
export function compareFingerprints(
  a: ContextFingerprint | null,
  b: ContextFingerprint | null,
): {
  changed: boolean;
  tokenDelta: number;
  versionDelta: number;
} {
  if (!a || !b) {
    return {
      changed: true,
      tokenDelta: (b?.tokenEstimate ?? 0) - (a?.tokenEstimate ?? 0),
      versionDelta: (b?.version ?? 0) - (a?.version ?? 0),
    };
  }

  return {
    changed: a.hash !== b.hash,
    tokenDelta: b.tokenEstimate - a.tokenEstimate,
    versionDelta: b.version - a.version,
  };
}

/**
 * Tìm messages trùng lặp dựa trên fingerprint
 */
export function findDuplicates(
  messages: FingerprintedMessage[],
): Map<string, FingerprintedMessage[]> {
  const hashMap = new Map<string, FingerprintedMessage[]>();

  for (const msg of messages) {
    const hash = msg.fingerprint.hash;
    const existing = hashMap.get(hash) ?? [];
    existing.push(msg);
    hashMap.set(hash, existing);
  }

  // Chỉ trả về những hash có nhiều hơn 1 message
  const duplicates = new Map<string, FingerprintedMessage[]>();
  for (const [hash, msgs] of hashMap) {
    if (msgs.length > 1) {
      duplicates.set(hash, msgs);
    }
  }

  return duplicates;
}

/**
 * Tạo cache key cho Anthropic prompt caching
 * Dựa trên system context fingerprint
 */
export function createCacheKey(
  combinedHash: string,
  modelId: string,
  additionalContext?: string,
): string {
  const components = [combinedHash, modelId];
  if (additionalContext) {
    components.push(createHash(HASH_ALGORITHM).update(additionalContext).digest("hex").slice(0, 8));
  }
  return components.join("-");
}

/**
 * Fingerprint store management
 */
export class FingerprintManager {
  private store: FingerprintStore;

  constructor() {
    this.store = {
      messages: new Map(),
      systemPrompt: null,
      workspaceFiles: new Map(),
      lastUpdate: Date.now(),
    };
  }

  /**
   * Cập nhật fingerprint cho message
   */
  updateMessage(msg: FingerprintedMessage): boolean {
    const existing = this.store.messages.get(msg.id);
    const { changed } = compareFingerprints(existing ?? null, msg.fingerprint);

    if (changed) {
      this.store.messages.set(msg.id, msg.fingerprint);
      this.store.lastUpdate = Date.now();
    }

    return changed;
  }

  /**
   * Cập nhật system prompt fingerprint
   */
  updateSystemPrompt(fp: ContextFingerprint): boolean {
    const { changed } = compareFingerprints(this.store.systemPrompt, fp);

    if (changed) {
      this.store.systemPrompt = fp;
      this.store.lastUpdate = Date.now();
    }

    return changed;
  }

  /**
   * Lấy tổng token estimate
   */
  getTotalTokenEstimate(): number {
    let total = 0;

    if (this.store.systemPrompt) {
      total += this.store.systemPrompt.tokenEstimate;
    }

    for (const fp of this.store.messages.values()) {
      total += fp.tokenEstimate;
    }

    for (const fp of this.store.workspaceFiles.values()) {
      total += fp.tokenEstimate;
    }

    return total;
  }

  /**
   * Lấy messages theo importance (cao -> thấp)
   */
  getMessagesByImportance(): string[] {
    const entries = [...this.store.messages.entries()];
    entries.sort((a, b) => b[1].importance - a[1].importance);
    return entries.map(([id]) => id);
  }

  /**
   * Export store để persist
   */
  export(): FingerprintStore {
    return { ...this.store };
  }

  /**
   * Import store từ persisted data
   */
  import(data: FingerprintStore): void {
    this.store = {
      messages: new Map(data.messages),
      systemPrompt: data.systemPrompt,
      workspaceFiles: new Map(data.workspaceFiles),
      lastUpdate: data.lastUpdate,
    };
  }
}
