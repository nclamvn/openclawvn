/**
 * Home Assistant WebSocket Event Listener
 * Subscribes to state_changed events for real-time sensor monitoring.
 * Uses built-in WebSocket (Node 22+).
 */

import type { HAEvent, HAWebSocketMessage } from "./types.js";

type EventHandler = (event: HAEvent) => void;

export class HAEventListener {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private msgId = 1;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url = "";
  private token = "";
  private connected = false;
  private shouldReconnect = true;

  async connect(haUrl: string, token: string): Promise<void> {
    this.url = haUrl;
    this.token = token;
    this.shouldReconnect = true;
    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = this.url.replace(/^http/, "ws") + "/api/websocket";

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        console.warn("HA MCP Events: Failed to create WebSocket:", err);
        reject(err);
        return;
      }

      let resolved = false;

      this.ws.onmessage = (event: MessageEvent) => {
        let msg: HAWebSocketMessage;
        try {
          msg = JSON.parse(String(event.data)) as HAWebSocketMessage;
        } catch {
          return;
        }

        switch (msg.type) {
          case "auth_required":
            this.ws?.send(JSON.stringify({ type: "auth", access_token: this.token }));
            break;

          case "auth_ok":
            this.connected = true;
            this.reconnectAttempts = 0;
            // Subscribe to state_changed events
            this.ws?.send(
              JSON.stringify({
                id: this.msgId++,
                type: "subscribe_events",
                event_type: "state_changed",
              }),
            );
            if (!resolved) {
              resolved = true;
              resolve();
            }
            break;

          case "auth_invalid":
            console.error("HA MCP Events: Auth failed —", msg.message);
            this.ws?.close();
            if (!resolved) {
              resolved = true;
              reject(new Error(`HA auth failed: ${msg.message}`));
            }
            break;

          case "event": {
            const eventData = msg.event as HAEvent | undefined;
            if (eventData) {
              this.dispatch(eventData.event_type, eventData);
            }
            break;
          }

          case "pong":
            // Keep-alive response, nothing to do
            break;
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
        if (!resolved) {
          resolved = true;
          reject(new Error("HA MCP Events: WebSocket closed before auth"));
        }
      };

      this.ws.onerror = (err: Event) => {
        console.warn("HA MCP Events: WebSocket error:", err);
        if (!resolved) {
          resolved = true;
          reject(new Error("HA MCP Events: WebSocket error"));
        }
      };
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `HA MCP Events: Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
      );
      return;
    }

    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts), 300_000);
    this.reconnectAttempts++;

    console.warn(
      `HA MCP Events: Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.doConnect();
        console.log("HA MCP Events: Reconnected successfully");
      } catch {
        // onclose will trigger next reconnect
      }
    }, delay);
  }

  on(eventType: string, handler: EventHandler): void {
    let set = this.handlers.get(eventType);
    if (!set) {
      set = new Set();
      this.handlers.set(eventType, set);
    }
    set.add(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  private dispatch(eventType: string, event: HAEvent): void {
    this.handlers.get(eventType)?.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.warn("HA MCP Events: Handler error:", err);
      }
    });
    // Also dispatch to wildcard listeners
    this.handlers.get("*")?.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.warn("HA MCP Events: Wildcard handler error:", err);
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}
