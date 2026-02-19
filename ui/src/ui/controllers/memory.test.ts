import { describe, expect, it, vi } from "vitest";

import {
  loadMemory,
  searchMemory,
  updateMemory,
  deleteMemory,
  extractMemory,
  loadMemoryIndicator,
  type MemoryState,
  type MemoryIndicatorState,
} from "./memory";
import type { UserFact } from "../types";

function createFact(id: string, overrides: Partial<UserFact> = {}): UserFact {
  return {
    id,
    category: "fact",
    content: `Fact ${id}`,
    confidence: 0.85,
    source: { sessionId: "sess-1", extractedAt: "2026-01-01T00:00:00Z" },
    verified: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createState(overrides: Partial<MemoryState> = {}): MemoryState {
  return {
    client: null,
    connected: true,
    memoryLoading: false,
    memoryFacts: [],
    memoryError: null,
    memoryFilter: "all",
    memorySearch: "",
    memoryEditingId: null,
    memoryEditDraft: "",
    memoryExtracting: false,
    memoryExtractStatus: "idle",
    ...overrides,
  };
}

function mockClient(overrides: Partial<{ request: ReturnType<typeof vi.fn> }> = {}) {
  return {
    request: overrides.request ?? vi.fn().mockResolvedValue({}),
  } as unknown as MemoryState["client"];
}

// ─── loadMemory ─────────────────────────────────────────

describe("loadMemory", () => {
  it("does nothing when client is null", async () => {
    const state = createState();
    await loadMemory(state);
    expect(state.memoryFacts).toEqual([]);
  });

  it("loads facts from gateway", async () => {
    const facts = [createFact("f1"), createFact("f2")];
    const client = mockClient({ request: vi.fn().mockResolvedValue({ facts }) });
    const state = createState({ client });
    await loadMemory(state);
    expect(state.memoryFacts).toEqual(facts);
    expect(state.memoryLoading).toBe(false);
  });

  it("sets error on failure", async () => {
    const client = mockClient({ request: vi.fn().mockRejectedValue(new Error("fail")) });
    const state = createState({ client });
    await loadMemory(state);
    expect(state.memoryError).toBe("Error: fail");
    expect(state.memoryLoading).toBe(false);
  });

  it("skips when already loading", async () => {
    const client = mockClient();
    const state = createState({ client, memoryLoading: true });
    await loadMemory(state);
    expect(client!.request).not.toHaveBeenCalled();
  });

  it("handles empty response", async () => {
    const client = mockClient({ request: vi.fn().mockResolvedValue({}) });
    const state = createState({ client });
    await loadMemory(state);
    expect(state.memoryFacts).toEqual([]);
  });
});

// ─── searchMemory ─────────────────────────────────────────

describe("searchMemory", () => {
  it("calls memory.search with keyword", async () => {
    const facts = [createFact("f1")];
    const request = vi.fn().mockResolvedValue({ facts });
    const client = mockClient({ request });
    const state = createState({ client });
    await searchMemory(state, "hello");
    expect(request).toHaveBeenCalledWith("memory.search", { query: "hello" });
    expect(state.memoryFacts).toEqual(facts);
  });

  it("falls back to loadMemory for empty keyword", async () => {
    const facts = [createFact("f1")];
    const request = vi.fn().mockResolvedValue({ facts });
    const client = mockClient({ request });
    const state = createState({ client });
    await searchMemory(state, "  ");
    expect(request).toHaveBeenCalledWith("memory.list", {});
  });
});

// ─── updateMemory ─────────────────────────────────────────

describe("updateMemory", () => {
  it("updates fact in list", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const f1 = createFact("f1", { content: "old" });
    const state = createState({ client, memoryFacts: [f1] });
    await updateMemory(state, "f1", { content: "new" });
    expect(request).toHaveBeenCalledWith("memory.update", { id: "f1", content: "new" });
    expect(state.memoryFacts[0].content).toBe("new");
  });

  it("updates verified status", async () => {
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const f1 = createFact("f1", { verified: false });
    const state = createState({ client, memoryFacts: [f1] });
    await updateMemory(state, "f1", { verified: true });
    expect(state.memoryFacts[0].verified).toBe(true);
  });

  it("sets error on failure", async () => {
    const client = mockClient({ request: vi.fn().mockRejectedValue("update error") });
    const state = createState({ client, memoryFacts: [createFact("f1")] });
    await updateMemory(state, "f1", { content: "x" });
    expect(state.memoryError).toBe("update error");
  });
});

// ─── deleteMemory ─────────────────────────────────────────

describe("deleteMemory", () => {
  it("removes fact from list on confirm", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const request = vi.fn().mockResolvedValue({});
    const client = mockClient({ request });
    const state = createState({ client, memoryFacts: [createFact("f1"), createFact("f2")] });
    await deleteMemory(state, "f1");
    expect(request).toHaveBeenCalledWith("memory.delete", { id: "f1" });
    expect(state.memoryFacts).toHaveLength(1);
    expect(state.memoryFacts[0].id).toBe("f2");
  });

  it("does nothing when cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const request = vi.fn();
    const client = mockClient({ request });
    const state = createState({ client, memoryFacts: [createFact("f1")] });
    await deleteMemory(state, "f1");
    expect(request).not.toHaveBeenCalled();
    expect(state.memoryFacts).toHaveLength(1);
  });
});

// ─── extractMemory ─────────────────────────────────────────

describe("extractMemory", () => {
  it("appends extracted facts", async () => {
    const newFacts = [createFact("f2")];
    const request = vi.fn().mockResolvedValue({ facts: newFacts });
    const client = mockClient({ request });
    const state = createState({ client, memoryFacts: [createFact("f1")] });
    await extractMemory(state, "main");
    expect(request).toHaveBeenCalledWith("memory.extract", { sessionKey: "main" });
    expect(state.memoryFacts).toHaveLength(2);
    expect(state.memoryFacts[0].id).toBe("f2");
    expect(state.memoryExtracting).toBe(false);
  });

  it("skips duplicates", async () => {
    const existing = createFact("f1");
    const request = vi.fn().mockResolvedValue({ facts: [createFact("f1")] });
    const client = mockClient({ request });
    const state = createState({ client, memoryFacts: [existing] });
    await extractMemory(state, "main");
    expect(state.memoryFacts).toHaveLength(1);
  });

  it("sets error on failure", async () => {
    const client = mockClient({ request: vi.fn().mockRejectedValue("extract fail") });
    const state = createState({ client });
    await extractMemory(state, "main");
    expect(state.memoryError).toBe("extract fail");
    expect(state.memoryExtractStatus).toBe("idle");
  });

  it("skips when already extracting", async () => {
    const client = mockClient();
    const state = createState({ client, memoryExtracting: true });
    await extractMemory(state, "main");
    expect(client!.request).not.toHaveBeenCalled();
  });
});

// ─── loadMemoryIndicator ─────────────────────────────────────────

function createIndicatorState(
  overrides: Partial<MemoryIndicatorState> = {},
): MemoryIndicatorState {
  return {
    client: null,
    connected: true,
    sessionKey: "main",
    memoryIndicatorEnabled: true,
    memoryIndicatorFacts: [],
    memoryIndicatorTotal: 0,
    ...overrides,
  };
}

describe("loadMemoryIndicator", () => {
  it("does nothing when client is null", async () => {
    const state = createIndicatorState();
    await loadMemoryIndicator(state);
    expect(state.memoryIndicatorFacts).toEqual([]);
  });

  it("loads indicator data from gateway", async () => {
    const facts = [createFact("f1")];
    const request = vi
      .fn()
      .mockResolvedValue({ enabled: true, facts, totalFacts: 3 });
    const client = mockClient({ request });
    const state = createIndicatorState({ client });
    await loadMemoryIndicator(state);
    expect(request).toHaveBeenCalledWith("memory.getActiveContext", {
      sessionKey: "main",
    });
    expect(state.memoryIndicatorEnabled).toBe(true);
    expect(state.memoryIndicatorFacts).toEqual(facts);
    expect(state.memoryIndicatorTotal).toBe(3);
  });

  it("sets enabled to false when gateway returns disabled", async () => {
    const request = vi
      .fn()
      .mockResolvedValue({ enabled: false, facts: [], totalFacts: 0 });
    const client = mockClient({ request });
    const state = createIndicatorState({ client });
    await loadMemoryIndicator(state);
    expect(state.memoryIndicatorEnabled).toBe(false);
  });

  it("handles errors silently", async () => {
    const client = mockClient({
      request: vi.fn().mockRejectedValue(new Error("fail")),
    });
    const state = createIndicatorState({ client });
    await loadMemoryIndicator(state);
    // Should not throw, state stays at defaults
    expect(state.memoryIndicatorEnabled).toBe(true);
    expect(state.memoryIndicatorFacts).toEqual([]);
  });

  it("handles empty response", async () => {
    const client = mockClient({ request: vi.fn().mockResolvedValue({}) });
    const state = createIndicatorState({ client });
    await loadMemoryIndicator(state);
    expect(state.memoryIndicatorEnabled).toBe(true);
    expect(state.memoryIndicatorFacts).toEqual([]);
    expect(state.memoryIndicatorTotal).toBe(0);
  });
});
