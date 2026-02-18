import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  MemoryCategory,
  UserFact,
  UserFactSearchQuery,
  UserFactStoreData,
} from "./user-facts.types.js";

const STORE_VERSION = 1;

/**
 * Normalize text for comparison: lowercase, trim, collapse whitespace.
 * Removes Vietnamese diacritics for fuzzy matching.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Compute word overlap ratio between two normalized strings.
 * Returns 0.0 to 1.0 — proportion of shared words relative to shorter text.
 */
function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) shared++;
  }
  return shared / Math.min(wordsA.size, wordsB.size);
}

export class UserFactStore {
  private data: UserFactStoreData;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.load();
  }

  private load(): UserFactStoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw) as UserFactStoreData;
        if (parsed && Array.isArray(parsed.facts)) {
          return parsed;
        }
      }
    } catch {
      // Corrupted file — start fresh
    }
    return { facts: [], lastExtraction: null, version: STORE_VERSION };
  }

  persist(): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = this.filePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), "utf-8");
    fs.renameSync(tmp, this.filePath);
  }

  list(query?: UserFactSearchQuery): UserFact[] {
    let results = [...this.data.facts];

    if (query?.category) {
      results = results.filter((f) => f.category === query.category);
    }
    if (query?.minConfidence !== undefined) {
      results = results.filter((f) => f.confidence >= query.minConfidence!);
    }
    if (query?.keyword) {
      const normalized = normalizeText(query.keyword);
      results = results.filter((f) => normalizeText(f.content).includes(normalized));
    }

    // Sort by updatedAt descending
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const limit = query?.limit ?? 50;
    return results.slice(0, limit);
  }

  get(id: string): UserFact | null {
    return this.data.facts.find((f) => f.id === id) ?? null;
  }

  /**
   * Add a fact with deduplication. If content overlap ≥ 80% with an existing
   * fact in the same category, update the existing fact instead.
   */
  add(fact: Omit<UserFact, "id" | "createdAt" | "updatedAt">): UserFact {
    const normalizedContent = normalizeText(fact.content);

    // Dedup check: same category, ≥ 80% word overlap
    for (const existing of this.data.facts) {
      if (existing.category !== fact.category) continue;
      if (wordOverlap(existing.content, fact.content) >= 0.8) {
        // Merge: keep higher confidence, update content if new is longer
        const now = new Date().toISOString();
        if (fact.content.length > existing.content.length) {
          existing.content = fact.content;
        }
        if (fact.confidence > existing.confidence) {
          existing.confidence = fact.confidence;
        }
        existing.updatedAt = now;
        existing.source = fact.source;
        this.persist();
        return existing;
      }
    }

    // Create new
    const now = new Date().toISOString();
    const newFact: UserFact = {
      ...fact,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.data.facts.push(newFact);
    this.persist();
    return newFact;
  }

  update(
    id: string,
    patch: Partial<Pick<UserFact, "content" | "category" | "confidence" | "verified">>,
  ): UserFact | null {
    const fact = this.data.facts.find((f) => f.id === id);
    if (!fact) return null;

    if (patch.content !== undefined) fact.content = patch.content;
    if (patch.category !== undefined) fact.category = patch.category;
    if (patch.confidence !== undefined) fact.confidence = patch.confidence;
    if (patch.verified !== undefined) fact.verified = patch.verified;
    fact.updatedAt = new Date().toISOString();

    this.persist();
    return fact;
  }

  delete(id: string): boolean {
    const index = this.data.facts.findIndex((f) => f.id === id);
    if (index === -1) return false;
    this.data.facts.splice(index, 1);
    this.persist();
    return true;
  }

  search(keyword: string): UserFact[] {
    const normalized = normalizeText(keyword);
    return this.data.facts
      .filter((f) => normalizeText(f.content).includes(normalized))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get the most relevant facts for context injection.
   * Uses keyword overlap between the current message and stored facts.
   * Respects a token budget (~2000 chars).
   */
  getForInjection(currentMessage: string, limit = 10): UserFact[] {
    if (this.data.facts.length === 0) return [];

    const scored = this.data.facts
      .map((fact) => ({
        fact,
        score: wordOverlap(currentMessage, fact.content),
      }))
      .filter((entry) => entry.score > 0 || entry.fact.verified)
      .sort((a, b) => {
        // Verified facts first, then by score
        if (a.fact.verified !== b.fact.verified) {
          return a.fact.verified ? -1 : 1;
        }
        return b.score - a.score;
      });

    const selected: UserFact[] = [];
    let totalChars = 0;
    const charBudget = 2000;

    for (const entry of scored) {
      if (selected.length >= limit) break;
      if (totalChars + entry.fact.content.length > charBudget) continue;
      selected.push(entry.fact);
      totalChars += entry.fact.content.length;
    }

    return selected;
  }

  /**
   * Format facts for system prompt injection.
   */
  formatForInjection(facts: UserFact[]): string {
    if (facts.length === 0) return "";
    const lines = facts.map((f) => f.content);
    return `Bờm nhớ về bạn: ${lines.join(". ")}.`;
  }

  get lastExtraction(): string | null {
    return this.data.lastExtraction;
  }

  set lastExtraction(value: string | null) {
    this.data.lastExtraction = value;
    this.persist();
  }

  get count(): number {
    return this.data.facts.length;
  }
}

/**
 * Resolve the user-facts.json path for a given agent.
 */
export function resolveUserFactsPath(agentDir: string): string {
  return path.join(agentDir, "user-facts.json");
}
