import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionManager, type ConnectionState } from "./connection-manager";

// Suppress console.log / console.error from ConnectionManager during tests
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConnectionManager", () => {
  it("starts disconnected", () => {
    const cm = new ConnectionManager();
    const state = cm.getState();
    expect(state.status).toBe("disconnected");
    expect(state.retryCount).toBe(0);
    expect(state.lastError).toBeUndefined();
  });

  // ─── subscribe ───────────────────────────────────────────

  describe("subscribe", () => {
    it("immediately notifies listener with current state", () => {
      const cm = new ConnectionManager();
      const listener = vi.fn();
      cm.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].status).toBe("disconnected");
    });

    it("unsubscribe stops notifications", () => {
      const cm = new ConnectionManager();
      const listener = vi.fn();
      const unsub = cm.subscribe(listener);
      listener.mockClear();

      unsub();
      cm.onConnected();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ─── onConnected ─────────────────────────────────────────

  describe("onConnected", () => {
    it("sets connected, clears errors, notifies listeners", () => {
      const cm = new ConnectionManager();
      cm.onError("some error");

      const listener = vi.fn();
      cm.subscribe(listener);
      listener.mockClear();

      cm.onConnected();

      expect(listener).toHaveBeenCalledTimes(1);
      const state: ConnectionState = listener.mock.calls[0][0];
      expect(state.status).toBe("connected");
      expect(state.lastError).toBeUndefined();
      expect(state.errorCode).toBeUndefined();
      expect(state.retryCount).toBe(0);
    });
  });

  // ─── onDisconnected ──────────────────────────────────────

  describe("onDisconnected", () => {
    it("maps code 1006 to gateway not responding message", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(1006);
      const state = cm.getState();
      expect(state.status).toBe("disconnected");
      expect(state.lastError).toContain("Gateway");
    });

    it("maps code 1000 to normal close message", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(1000);
      expect(cm.getState().lastError).toContain("bình thường");
    });

    it("maps code 1015 to TLS error message", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(1015);
      expect(cm.getState().lastError).toContain("TLS");
    });

    it("maps code 1008 to policy violation message", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(1008);
      expect(cm.getState().lastError).toContain("chính sách");
    });

    it("uses custom reason string when provided", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(1000, "custom disconnect reason");
      expect(cm.getState().lastError).toBe("custom disconnect reason");
    });

    it("uses fallback message for unknown codes", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(4999);
      expect(cm.getState().lastError).toBe("Lỗi kết nối (mã 4999)");
    });

    it("defaults to code 1006 when code is undefined", () => {
      const cm = new ConnectionManager();
      cm.onDisconnected(undefined);
      expect(cm.getState().lastError).toContain("Gateway");
      expect(cm.getState().errorCode).toBeUndefined();
    });
  });

  // ─── onError ─────────────────────────────────────────────

  describe("onError", () => {
    it("sets error status with provided message", () => {
      const cm = new ConnectionManager();
      cm.onError("WebSocket failed");
      const state = cm.getState();
      expect(state.status).toBe("error");
      expect(state.lastError).toBe("WebSocket failed");
    });

    it("uses Vietnamese default when message is omitted", () => {
      const cm = new ConnectionManager();
      cm.onError();
      expect(cm.getState().lastError).toBe("Không thể kết nối tới Gateway");
    });

    it("uses Vietnamese default when message is empty string", () => {
      const cm = new ConnectionManager();
      cm.onError("");
      expect(cm.getState().lastError).toBe("Không thể kết nối tới Gateway");
    });
  });

  // ─── onConnecting ────────────────────────────────────────

  describe("onConnecting", () => {
    it("sets connecting status", () => {
      const cm = new ConnectionManager();
      cm.onConnecting();
      expect(cm.getState().status).toBe("connecting");
    });
  });

  // ─── reconnect ───────────────────────────────────────────

  describe("reconnect", () => {
    it("resets state and dispatches connection-attempt event", () => {
      const cm = new ConnectionManager();
      cm.onError("previous error");

      const handler = vi.fn();
      window.addEventListener("connection-attempt", handler);

      cm.reconnect();

      const state = cm.getState();
      expect(state.status).toBe("connecting");
      expect(state.retryCount).toBe(0);
      expect(state.lastError).toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(1);

      window.removeEventListener("connection-attempt", handler);
    });
  });

  // ─── disconnect ──────────────────────────────────────────

  describe("disconnect", () => {
    it("resets to disconnected with no error", () => {
      const cm = new ConnectionManager();
      cm.onConnected();
      cm.disconnect();

      const state = cm.getState();
      expect(state.status).toBe("disconnected");
      expect(state.retryCount).toBe(0);
      expect(state.lastError).toBeUndefined();
    });
  });

  // ─── state transitions ──────────────────────────────────

  describe("state transitions", () => {
    it("tracks full lifecycle: disconnected -> connecting -> connected -> disconnected", () => {
      const cm = new ConnectionManager();
      const statuses: string[] = [];
      cm.subscribe((s) => statuses.push(s.status));

      cm.onConnecting();
      cm.onConnected();
      cm.onDisconnected(1006);

      expect(statuses).toEqual([
        "disconnected", // initial from subscribe
        "connecting",
        "connected",
        "disconnected",
      ]);
    });

    it("tracks error recovery: error -> connecting -> connected", () => {
      const cm = new ConnectionManager();
      const statuses: string[] = [];
      cm.subscribe((s) => statuses.push(s.status));

      cm.onError("fail");
      cm.onConnecting();
      cm.onConnected();

      expect(statuses).toEqual([
        "disconnected",
        "error",
        "connecting",
        "connected",
      ]);
    });

    it("handles rapid connect/disconnect cycles", () => {
      const cm = new ConnectionManager();
      cm.onConnecting();
      cm.onConnected();
      cm.onDisconnected(1006);
      cm.onConnecting();
      cm.onConnected();

      expect(cm.getState().status).toBe("connected");
      expect(cm.getState().retryCount).toBe(0);
    });
  });

  // ─── getState returns copy ───────────────────────────────

  describe("getState", () => {
    it("returns a copy (mutation protection)", () => {
      const cm = new ConnectionManager();
      const state1 = cm.getState();
      state1.status = "connected";
      state1.retryCount = 99;

      const state2 = cm.getState();
      expect(state2.status).toBe("disconnected");
      expect(state2.retryCount).toBe(0);
    });
  });
});
