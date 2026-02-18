import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { UserFactStore, resolveUserFactsPath } from "./user-fact-store.js";
import type { UserFact } from "./user-facts.types.js";

let tempDir: string;
let store: UserFactStore;
let storePath: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "user-fact-store-test-"));
  storePath = path.join(tempDir, "user-facts.json");
  store = new UserFactStore(storePath);
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function addFact(overrides: Partial<Omit<UserFact, "id" | "createdAt" | "updatedAt">> = {}) {
  return store.add({
    category: "identity",
    content: "Tên là Minh",
    confidence: 1.0,
    source: { sessionId: "test-session", extractedAt: new Date().toISOString() },
    verified: false,
    ...overrides,
  });
}

describe("UserFactStore", () => {
  describe("add", () => {
    it("creates a fact with id and timestamps", () => {
      const fact = addFact();
      expect(fact.id).toBeTruthy();
      expect(fact.createdAt).toBeTruthy();
      expect(fact.updatedAt).toBeTruthy();
      expect(fact.content).toBe("Tên là Minh");
      expect(fact.category).toBe("identity");
    });

    it("deduplicates — similar content in same category updates existing", () => {
      const first = addFact({ content: "Tên là Minh, làm designer" });
      const second = addFact({ content: "Tên là Minh, làm designer freelance" });
      // Should update existing rather than create new
      expect(store.list().length).toBe(1);
      // Second has more content, so content should be updated
      expect(store.list()[0]?.content).toBe("Tên là Minh, làm designer freelance");
    });

    it("allows similar content in different categories", () => {
      addFact({ content: "Làm việc với TypeScript", category: "skill" });
      addFact({ content: "Làm việc với TypeScript", category: "project" });
      expect(store.list().length).toBe(2);
    });

    it("keeps higher confidence on dedup", () => {
      addFact({ content: "Tên là Minh", confidence: 0.7 });
      addFact({ content: "Tên là Minh", confidence: 0.95 });
      const facts = store.list();
      expect(facts.length).toBe(1);
      expect(facts[0]?.confidence).toBe(0.95);
    });
  });

  describe("list", () => {
    it("returns all facts sorted by updatedAt desc", async () => {
      const a = addFact({ content: "Fact A" });
      const b = addFact({ content: "Fact B", category: "skill" });
      const c = addFact({ content: "Fact C", category: "preference" });

      // Force different timestamps with delays so sorting is deterministic
      await new Promise((resolve) => setTimeout(resolve, 2));
      store.update(a.id, { content: "Fact A updated" });
      await new Promise((resolve) => setTimeout(resolve, 2));
      store.update(c.id, { content: "Fact C updated" });

      const facts = store.list();
      expect(facts.length).toBe(3);
      // Most recently updated should be first
      expect(facts[0]?.content).toBe("Fact C updated");
    });

    it("filters by category", () => {
      addFact({ content: "Tên Minh", category: "identity" });
      addFact({ content: "Thích cà phê", category: "preference" });
      const facts = store.list({ category: "identity" });
      expect(facts.length).toBe(1);
      expect(facts[0]?.category).toBe("identity");
    });

    it("filters by minConfidence", () => {
      addFact({ content: "Fact sure", confidence: 0.9 });
      addFact({ content: "Fact unsure", confidence: 0.6, category: "fact" });
      const facts = store.list({ minConfidence: 0.8 });
      expect(facts.length).toBe(1);
      expect(facts[0]?.content).toBe("Fact sure");
    });

    it("filters by keyword", () => {
      addFact({ content: "Tên là Minh" });
      addFact({ content: "Thích cà phê", category: "preference" });
      const facts = store.list({ keyword: "Minh" });
      expect(facts.length).toBe(1);
    });

    it("respects limit", () => {
      for (let i = 0; i < 10; i++) {
        addFact({ content: `Fact ${i}`, category: i % 2 === 0 ? "identity" : "fact" });
      }
      const facts = store.list({ limit: 3 });
      expect(facts.length).toBe(3);
    });
  });

  describe("get", () => {
    it("returns fact by id", () => {
      const fact = addFact();
      const found = store.get(fact.id);
      expect(found?.id).toBe(fact.id);
      expect(found?.content).toBe("Tên là Minh");
    });

    it("returns null for unknown id", () => {
      const found = store.get("nonexistent");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("patches fields and updates timestamp", async () => {
      const fact = addFact();
      const originalUpdatedAt = fact.updatedAt;

      // Wait 2ms for timestamp difference (ISO timestamps have ms precision)
      await new Promise((resolve) => setTimeout(resolve, 2));

      const updated = store.update(fact.id, { content: "Tên là Minh Phạm" });
      expect(updated).not.toBeNull();
      expect(updated?.content).toBe("Tên là Minh Phạm");
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("returns null for unknown id", () => {
      const result = store.update("nonexistent", { content: "new" });
      expect(result).toBeNull();
    });

    it("patches verified flag", () => {
      const fact = addFact();
      const updated = store.update(fact.id, { verified: true });
      expect(updated?.verified).toBe(true);
    });
  });

  describe("delete", () => {
    it("removes fact", () => {
      const fact = addFact();
      expect(store.list().length).toBe(1);
      const result = store.delete(fact.id);
      expect(result).toBe(true);
      expect(store.list().length).toBe(0);
    });

    it("returns false for unknown id", () => {
      const result = store.delete("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("search", () => {
    it("keyword search on content", () => {
      addFact({ content: "Tên là Minh" });
      addFact({ content: "Làm designer", category: "skill" });
      const results = store.search("designer");
      expect(results.length).toBe(1);
      expect(results[0]?.content).toBe("Làm designer");
    });

    it("diacritics-insensitive search", () => {
      addFact({ content: "Thích cà phê", category: "preference" });
      const results = store.search("ca phe");
      expect(results.length).toBe(1);
    });
  });

  describe("getForInjection", () => {
    it("returns relevant facts", () => {
      addFact({ content: "Tên là Minh" });
      addFact({ content: "Làm designer", category: "skill" });
      addFact({ content: "Dự án web app", category: "project" });
      const facts = store.getForInjection("designer web");
      expect(facts.length).toBeGreaterThan(0);
    });

    it("respects token budget (~2000 chars)", () => {
      for (let i = 0; i < 20; i++) {
        addFact({
          content: "A".repeat(300) + ` fact-${i}`,
          category: i % 2 === 0 ? "identity" : "fact",
        });
      }
      const facts = store.getForInjection("fact");
      const totalChars = facts.reduce((sum, f) => sum + f.content.length, 0);
      expect(totalChars).toBeLessThanOrEqual(2000);
    });

    it("returns empty array when no facts", () => {
      const facts = store.getForInjection("anything");
      expect(facts).toEqual([]);
    });

    it("prioritizes verified facts", () => {
      addFact({ content: "Unverified fact about coding", category: "skill" });
      const verified = addFact({
        content: "Verified fact about coding",
        category: "skill",
        verified: true,
      } as any);
      store.update(verified.id, { verified: true });
      const facts = store.getForInjection("coding");
      expect(facts[0]?.verified).toBe(true);
    });
  });

  describe("formatForInjection", () => {
    it("formats facts into Vietnamese context string", () => {
      const fact = addFact({ content: "Tên là Minh" });
      const result = store.formatForInjection([fact]);
      expect(result).toContain("Bờm nhớ về bạn:");
      expect(result).toContain("Tên là Minh");
    });

    it("returns empty string for no facts", () => {
      const result = store.formatForInjection([]);
      expect(result).toBe("");
    });
  });

  describe("persist and load", () => {
    it("persists to file and loads back", () => {
      addFact({ content: "Tên là Minh" });
      addFact({ content: "Làm designer", category: "skill" });

      // Create new store from same file
      const store2 = new UserFactStore(storePath);
      const facts = store2.list();
      expect(facts.length).toBe(2);
    });

    it("handles corrupted file", () => {
      fs.writeFileSync(storePath, "not valid json", "utf-8");
      const store2 = new UserFactStore(storePath);
      expect(store2.list()).toEqual([]);
    });

    it("handles missing file", () => {
      const missing = path.join(tempDir, "nonexistent", "facts.json");
      const store2 = new UserFactStore(missing);
      expect(store2.list()).toEqual([]);
      // Should create on first add
      store2.add({
        category: "identity",
        content: "Test",
        confidence: 1.0,
        source: { sessionId: "s", extractedAt: new Date().toISOString() },
        verified: false,
      });
      expect(fs.existsSync(missing)).toBe(true);
    });
  });

  describe("resolveUserFactsPath", () => {
    it("returns path inside agent dir", () => {
      const result = resolveUserFactsPath("/home/user/.openclaw/agents/main/agent");
      expect(result).toBe("/home/user/.openclaw/agents/main/agent/user-facts.json");
    });
  });
});
