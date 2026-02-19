/**
 * Home Assistant REST API Client
 * Uses built-in fetch (Node 22+), no external dependencies.
 */

import type { HAConfig, HAEntityState, HAServiceCall } from "./types.js";

const REQUEST_TIMEOUT_MS = 10_000;

export class HAClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(private readonly config: HAConfig) {
    // Remove trailing slash
    this.baseUrl = config.url.replace(/\/+$/, "");
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...options?.headers },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`HA API ${response.status}: ${response.statusText} — ${body}`);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Retry once on timeout
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetch(url, {
            ...options,
            headers: { ...this.headers, ...options?.headers },
            signal: retryController.signal,
          });
          if (!response.ok) {
            throw new Error(`HA API ${response.status} on retry`);
          }
          return (await response.json()) as T;
        } finally {
          clearTimeout(retryTimeout);
        }
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          headers: this.headers,
          signal: controller.signal,
        });
        return response.ok;
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      return false;
    }
  }

  async getState(entityId: string): Promise<HAEntityState> {
    return this.request<HAEntityState>(`/api/states/${entityId}`);
  }

  async getStates(): Promise<HAEntityState[]> {
    return this.request<HAEntityState[]>("/api/states");
  }

  async callService(call: HAServiceCall): Promise<void> {
    const body: Record<string, unknown> = { ...call.data };
    if (call.target) {
      if (call.target.entity_id) body.entity_id = call.target.entity_id;
      if (call.target.area_id) body.area_id = call.target.area_id;
    }
    await this.request(`/api/services/${call.domain}/${call.service}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getHistory(
    entityId: string,
    startTime: Date,
    endTime?: Date,
  ): Promise<HAEntityState[][]> {
    let path = `/api/history/period/${startTime.toISOString()}?filter_entity_id=${entityId}`;
    if (endTime) {
      path += `&end_time=${endTime.toISOString()}`;
    }
    return this.request<HAEntityState[][]>(path);
  }

  async fireEvent(eventType: string, data?: Record<string, unknown>): Promise<void> {
    await this.request(`/api/events/${eventType}`, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    });
  }
}
