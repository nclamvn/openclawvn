/**
 * Home Assistant Entity State Cache
 * Reduces API calls by caching entity states with configurable TTL.
 */

import type { HAClient } from "./ha-client.js";
import type { HAEntityState } from "./types.js";

interface CacheEntry {
  state: HAEntityState;
  cachedAt: number;
}

export class HAEntityCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 60_000) {
    this.ttlMs = ttlMs;
  }

  async get(entityId: string, client: HAClient): Promise<HAEntityState> {
    const entry = this.cache.get(entityId);
    const now = Date.now();

    if (entry && now - entry.cachedAt < this.ttlMs) {
      return entry.state;
    }

    const state = await client.getState(entityId);
    this.cache.set(entityId, { state, cachedAt: now });
    return state;
  }

  async getMultiple(
    entityIds: string[],
    client: HAClient,
  ): Promise<Map<string, HAEntityState>> {
    const result = new Map<string, HAEntityState>();
    const now = Date.now();
    const toFetch: string[] = [];

    // Check cache first
    for (const id of entityIds) {
      const entry = this.cache.get(id);
      if (entry && now - entry.cachedAt < this.ttlMs) {
        result.set(id, entry.state);
      } else {
        toFetch.push(id);
      }
    }

    // Fetch missing entities individually (HA REST API doesn't support batch by IDs)
    for (const id of toFetch) {
      try {
        const state = await client.getState(id);
        this.cache.set(id, { state, cachedAt: Date.now() });
        result.set(id, state);
      } catch (err) {
        console.warn(`HA MCP: Failed to get state for ${id}:`, err);
      }
    }

    return result;
  }

  invalidate(entityId?: string): void {
    if (entityId) {
      this.cache.delete(entityId);
    } else {
      this.cache.clear();
    }
  }

  onStateChanged(entityId: string, newState: HAEntityState): void {
    this.cache.set(entityId, { state: newState, cachedAt: Date.now() });
  }
}
