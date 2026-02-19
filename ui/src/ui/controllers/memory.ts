import type { GatewayBrowserClient } from "../gateway";
import type { MemoryCategory, UserFact } from "../types";
import { t } from "../i18n";

export type MemoryState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  memoryLoading: boolean;
  memoryFacts: UserFact[];
  memoryError: string | null;
  memoryFilter: MemoryCategory | "all";
  memorySearch: string;
  memoryEditingId: string | null;
  memoryEditDraft: string;
  memoryExtracting: boolean;
  memoryExtractStatus: "idle" | "extracting" | "extracted";
};

export async function loadMemory(state: MemoryState) {
  if (!state.client || !state.connected) return;
  if (state.memoryLoading) return;
  state.memoryLoading = true;
  state.memoryError = null;
  try {
    const res = (await state.client.request("memory.list", {})) as {
      facts?: UserFact[];
    };
    state.memoryFacts = Array.isArray(res.facts) ? res.facts : [];
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memoryLoading = false;
  }
}

export async function searchMemory(state: MemoryState, keyword: string) {
  if (!state.client || !state.connected) return;
  if (!keyword.trim()) {
    await loadMemory(state);
    return;
  }
  state.memoryLoading = true;
  state.memoryError = null;
  try {
    const res = (await state.client.request("memory.search", {
      query: keyword.trim(),
    })) as { facts?: UserFact[] };
    state.memoryFacts = Array.isArray(res.facts) ? res.facts : [];
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memoryLoading = false;
  }
}

export async function updateMemory(
  state: MemoryState,
  id: string,
  patch: { content?: string; verified?: boolean },
) {
  if (!state.client || !state.connected) return;
  state.memoryError = null;
  try {
    await state.client.request("memory.update", { id, ...patch });
    const idx = state.memoryFacts.findIndex((f) => f.id === id);
    if (idx >= 0) {
      state.memoryFacts = state.memoryFacts.map((f) =>
        f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f,
      );
    }
  } catch (err) {
    state.memoryError = String(err);
  }
}

export async function deleteMemory(state: MemoryState, id: string) {
  if (!state.client || !state.connected) return;
  const confirmed = window.confirm(t().memory.deleteConfirm);
  if (!confirmed) return;
  state.memoryError = null;
  try {
    await state.client.request("memory.delete", { id });
    state.memoryFacts = state.memoryFacts.filter((f) => f.id !== id);
  } catch (err) {
    state.memoryError = String(err);
  }
}

export async function extractMemory(state: MemoryState, sessionKey: string) {
  if (!state.client || !state.connected) return;
  if (state.memoryExtracting) return;
  state.memoryExtracting = true;
  state.memoryExtractStatus = "extracting";
  state.memoryError = null;
  try {
    const res = (await state.client.request("memory.extract", {
      sessionKey,
    })) as { facts?: UserFact[] };
    const newFacts = Array.isArray(res.facts) ? res.facts : [];
    if (newFacts.length > 0) {
      const existingIds = new Set(state.memoryFacts.map((f) => f.id));
      const unique = newFacts.filter((f) => !existingIds.has(f.id));
      state.memoryFacts = [...unique, ...state.memoryFacts];
    }
    state.memoryExtractStatus = "extracted";
    setTimeout(() => {
      state.memoryExtractStatus = "idle";
    }, 2000);
  } catch (err) {
    state.memoryError = String(err);
    state.memoryExtractStatus = "idle";
  } finally {
    state.memoryExtracting = false;
  }
}

// ─── Memory Indicator ─────────────────────────────────────

export type MemoryIndicatorState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  sessionKey: string;
  memoryIndicatorEnabled: boolean;
  memoryIndicatorFacts: UserFact[];
  memoryIndicatorTotal: number;
};

export async function loadMemoryIndicator(state: MemoryIndicatorState) {
  if (!state.client || !state.connected) return;
  try {
    const res = (await state.client.request("memory.getActiveContext", {
      sessionKey: state.sessionKey,
    })) as {
      enabled?: boolean;
      facts?: UserFact[];
      totalFacts?: number;
    };
    state.memoryIndicatorEnabled = res.enabled !== false;
    state.memoryIndicatorFacts = Array.isArray(res.facts) ? res.facts : [];
    state.memoryIndicatorTotal = typeof res.totalFacts === "number" ? res.totalFacts : 0;
  } catch {
    // Non-blocking; indicator just stays at defaults
  }
}
