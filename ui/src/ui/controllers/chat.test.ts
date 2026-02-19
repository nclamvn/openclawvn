import { describe, expect, it, vi } from "vitest";

import {
  handleChatEvent,
  loadChatHistory,
  sendChatMessage,
  abortChatRun,
  type ChatEventPayload,
  type ChatState,
} from "./chat";

function createState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    client: null,
    connected: true,
    sessionKey: "main",
    chatLoading: false,
    chatMessages: [],
    chatThinkingLevel: null,
    chatSending: false,
    chatMessage: "",
    chatAttachments: [],
    chatRunId: null,
    chatStream: null,
    chatStreamStartedAt: null,
    lastError: null,
    ...overrides,
  };
}

function mockClient(overrides: Partial<{ request: ReturnType<typeof vi.fn> }> = {}) {
  return {
    request: overrides.request ?? vi.fn().mockResolvedValue({}),
  } as unknown as ChatState["client"];
}

// ─── handleChatEvent ─────────────────────────────────────────

describe("handleChatEvent", () => {
  it("returns null when payload is missing", () => {
    const state = createState();
    expect(handleChatEvent(state, undefined)).toBe(null);
  });

  it("returns null when sessionKey does not match", () => {
    const state = createState({ sessionKey: "main" });
    const payload: ChatEventPayload = {
      runId: "run-1",
      sessionKey: "other",
      state: "final",
    };
    expect(handleChatEvent(state, payload)).toBe(null);
  });

  it("returns null for delta from another run", () => {
    const state = createState({
      sessionKey: "main",
      chatRunId: "run-user",
      chatStream: "Hello",
    });
    const payload: ChatEventPayload = {
      runId: "run-announce",
      sessionKey: "main",
      state: "delta",
      message: { role: "assistant", content: [{ type: "text", text: "Done" }] },
    };
    expect(handleChatEvent(state, payload)).toBe(null);
    expect(state.chatRunId).toBe("run-user");
    expect(state.chatStream).toBe("Hello");
  });

  it("returns 'final' for final from another run (e.g. sub-agent announce) without clearing state", () => {
    const state = createState({
      sessionKey: "main",
      chatRunId: "run-user",
      chatStream: "Working...",
      chatStreamStartedAt: 123,
    });
    const payload: ChatEventPayload = {
      runId: "run-announce",
      sessionKey: "main",
      state: "final",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Sub-agent findings" }],
      },
    };
    expect(handleChatEvent(state, payload)).toBe("final");
    expect(state.chatRunId).toBe("run-user");
    expect(state.chatStream).toBe("Working...");
    expect(state.chatStreamStartedAt).toBe(123);
  });

  it("processes final from own run and clears state", () => {
    const state = createState({
      sessionKey: "main",
      chatRunId: "run-1",
      chatStream: "Reply",
      chatStreamStartedAt: 100,
    });
    const payload: ChatEventPayload = {
      runId: "run-1",
      sessionKey: "main",
      state: "final",
    };
    expect(handleChatEvent(state, payload)).toBe("final");
    expect(state.chatRunId).toBe(null);
    expect(state.chatStream).toBe(null);
    expect(state.chatStreamStartedAt).toBe(null);
  });

  it("sets lastError from errorMessage on error state", () => {
    const state = createState({
      sessionKey: "main",
      chatRunId: null,
      chatStream: "partial",
    });
    const payload: ChatEventPayload = {
      runId: "run-1",
      sessionKey: "main",
      state: "error",
      errorMessage: "Token expired",
    };
    expect(handleChatEvent(state, payload)).toBe("error");
    expect(state.lastError).toBe("Token expired");
    expect(state.chatStream).toBe(null);
    expect(state.chatRunId).toBe(null);
  });

  it("uses 'chat error' default when errorMessage is missing", () => {
    const state = createState({ sessionKey: "main" });
    const payload: ChatEventPayload = {
      runId: "run-1",
      sessionKey: "main",
      state: "error",
    };
    handleChatEvent(state, payload);
    expect(state.lastError).toBe("chat error");
  });

  it("clears stream state on aborted", () => {
    const state = createState({
      sessionKey: "main",
      chatRunId: "run-1",
      chatStream: "in progress",
      chatStreamStartedAt: 999,
    });
    const payload: ChatEventPayload = {
      runId: "run-1",
      sessionKey: "main",
      state: "aborted",
    };
    expect(handleChatEvent(state, payload)).toBe("aborted");
    expect(state.chatRunId).toBe(null);
    expect(state.chatStream).toBe(null);
    expect(state.chatStreamStartedAt).toBe(null);
  });
});

// ─── loadChatHistory ─────────────────────────────────────────

describe("loadChatHistory", () => {
  it("returns early when client is null", async () => {
    const state = createState({ client: null, connected: true });
    await loadChatHistory(state);
    expect(state.chatLoading).toBe(false);
    expect(state.chatMessages).toEqual([]);
  });

  it("returns early when not connected", async () => {
    const req = vi.fn();
    const state = createState({ client: mockClient({ request: req }), connected: false });
    await loadChatHistory(state);
    expect(req).not.toHaveBeenCalled();
  });

  it("sets lastError when request rejects", async () => {
    const req = vi.fn().mockRejectedValue(new Error("auth failed"));
    const state = createState({ client: mockClient({ request: req }), connected: true });
    await loadChatHistory(state);
    expect(state.lastError).toBe("Error: auth failed");
    expect(state.chatLoading).toBe(false);
  });

  it("loads messages on success", async () => {
    const messages = [{ role: "user", content: "hi" }];
    const req = vi.fn().mockResolvedValue({ messages, thinkingLevel: "low" });
    const state = createState({ client: mockClient({ request: req }), connected: true });
    await loadChatHistory(state);
    expect(state.chatMessages).toEqual(messages);
    expect(state.chatThinkingLevel).toBe("low");
    expect(state.chatLoading).toBe(false);
    expect(state.lastError).toBe(null);
  });
});

// ─── sendChatMessage ─────────────────────────────────────────

describe("sendChatMessage", () => {
  it("returns null when client is null", async () => {
    const state = createState({ client: null });
    const result = await sendChatMessage(state, "hello");
    expect(result).toBe(null);
  });

  it("returns null when not connected", async () => {
    const state = createState({ client: mockClient(), connected: false });
    const result = await sendChatMessage(state, "hello");
    expect(result).toBe(null);
  });

  it("returns null for empty message (no attachments)", async () => {
    const state = createState({ client: mockClient(), connected: true });
    const result = await sendChatMessage(state, "   ");
    expect(result).toBe(null);
  });

  it("sets lastError and appends error message when request fails", async () => {
    const req = vi.fn().mockRejectedValue(new Error("token expired"));
    const state = createState({ client: mockClient({ request: req }), connected: true });
    const result = await sendChatMessage(state, "hello");
    expect(result).toBe(null);
    expect(state.lastError).toBe("Error: token expired");
    // Error message appended to chat
    const last = state.chatMessages[state.chatMessages.length - 1] as Record<string, unknown>;
    expect(last.role).toBe("assistant");
    expect(state.chatSending).toBe(false);
  });

  it("returns runId on success", async () => {
    const req = vi.fn().mockResolvedValue({});
    const state = createState({ client: mockClient({ request: req }), connected: true });
    const result = await sendChatMessage(state, "hello");
    expect(typeof result).toBe("string");
    expect(result!.length).toBeGreaterThan(0);
    expect(state.chatSending).toBe(false);
    expect(state.lastError).toBe(null);
  });

  it("sends document type for PDF attachments", async () => {
    const req = vi.fn().mockResolvedValue({});
    const state = createState({ client: mockClient({ request: req }), connected: true });
    const pdfAttachment = {
      id: "att-1",
      dataUrl: "data:application/pdf;base64,AAAA",
      mimeType: "application/pdf",
      fileName: "report.pdf",
    };
    await sendChatMessage(state, "check this", [pdfAttachment]);
    expect(req).toHaveBeenCalledTimes(1);
    const callArgs = req.mock.calls[0];
    expect(callArgs[0]).toBe("chat.send");
    const apiAttachments = callArgs[1].attachments;
    expect(apiAttachments).toHaveLength(1);
    expect(apiAttachments[0].type).toBe("document");
    expect(apiAttachments[0].mimeType).toBe("application/pdf");
    expect(apiAttachments[0].fileName).toBe("report.pdf");
  });

  it("sends image type for image attachments with fileName", async () => {
    const req = vi.fn().mockResolvedValue({});
    const state = createState({ client: mockClient({ request: req }), connected: true });
    const imgAttachment = {
      id: "att-2",
      dataUrl: "data:image/png;base64,AAAA",
      mimeType: "image/png",
      fileName: "screenshot.png",
    };
    await sendChatMessage(state, "", [imgAttachment]);
    expect(req).toHaveBeenCalledTimes(1);
    const callArgs = req.mock.calls[0];
    const apiAttachments = callArgs[1].attachments;
    expect(apiAttachments).toHaveLength(1);
    expect(apiAttachments[0].type).toBe("image");
    expect(apiAttachments[0].fileName).toBe("screenshot.png");
  });

  it("includes document content block in chat messages for non-image attachments", async () => {
    const req = vi.fn().mockResolvedValue({});
    const state = createState({ client: mockClient({ request: req }), connected: true });
    const txtAttachment = {
      id: "att-3",
      dataUrl: "data:text/plain;base64,SGVsbG8=",
      mimeType: "text/plain",
      fileName: "notes.txt",
    };
    await sendChatMessage(state, "read this", [txtAttachment]);
    // Check the user message added to chatMessages
    const userMsg = state.chatMessages[0] as Record<string, unknown>;
    const content = userMsg.content as Array<Record<string, unknown>>;
    expect(content).toHaveLength(2);
    expect(content[0].type).toBe("text");
    expect(content[1].type).toBe("document");
    expect(content[1].fileName).toBe("notes.txt");
  });
});

// ─── abortChatRun ────────────────────────────────────────────

describe("abortChatRun", () => {
  it("returns false when client is null", async () => {
    const state = createState({ client: null });
    expect(await abortChatRun(state)).toBe(false);
  });

  it("returns false when not connected", async () => {
    const state = createState({ client: mockClient(), connected: false });
    expect(await abortChatRun(state)).toBe(false);
  });

  it("returns false and sets lastError on request failure", async () => {
    const req = vi.fn().mockRejectedValue(new Error("abort denied"));
    const state = createState({
      client: mockClient({ request: req }),
      connected: true,
      chatRunId: "run-1",
    });
    expect(await abortChatRun(state)).toBe(false);
    expect(state.lastError).toBe("Error: abort denied");
  });

  it("returns true on success", async () => {
    const req = vi.fn().mockResolvedValue({});
    const state = createState({
      client: mockClient({ request: req }),
      connected: true,
      chatRunId: "run-1",
    });
    expect(await abortChatRun(state)).toBe(true);
    expect(req).toHaveBeenCalledWith("chat.abort", {
      sessionKey: "main",
      runId: "run-1",
    });
  });
});
