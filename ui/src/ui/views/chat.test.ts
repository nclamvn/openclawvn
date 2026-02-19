import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import type { SessionsListResult } from "../types";
import { renderChat, type ChatProps } from "./chat";

function createSessions(): SessionsListResult {
  return {
    ts: 0,
    path: "",
    count: 0,
    defaults: { model: null, contextTokens: null },
    sessions: [],
  };
}

function createProps(overrides: Partial<ChatProps> = {}): ChatProps {
  return {
    sessionKey: "main",
    onSessionKeyChange: () => undefined,
    thinkingLevel: null,
    showThinking: false,
    loading: false,
    sending: false,
    canAbort: false,
    compactionStatus: null,
    messages: [],
    toolMessages: [],
    stream: null,
    streamStartedAt: null,
    assistantAvatarUrl: null,
    draft: "",
    queue: [],
    connected: true,
    canSend: true,
    disabledReason: null,
    error: null,
    sessions: createSessions(),
    focusMode: false,
    assistantName: "OpenClaw",
    assistantAvatar: null,
    apiKeys: {},
    selectedProvider: "anthropic",
    apiKeySaveStatus: "idle",
    apiKeyInputOpen: false,
    onSaveApiKey: () => undefined,
    onApiKeyChange: () => undefined,
    onRefresh: () => undefined,
    onToggleFocusMode: () => undefined,
    onDraftChange: () => undefined,
    onSend: () => undefined,
    onQueueRemove: () => undefined,
    onNewSession: () => undefined,
    ...overrides,
  };
}

function renderInto(props: ChatProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderChat(props), container);
  return container;
}

describe("chat view", () => {
  it("send button calls onAbort when aborting is available", () => {
    const onAbort = vi.fn();
    const container = renderInto(
      createProps({ canAbort: true, onAbort, draft: "x", connected: true }),
    );

    const sendBtn = container.querySelector<HTMLButtonElement>(".composer-send-btn");
    expect(sendBtn).not.toBeNull();
    sendBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it("send button calls onSend when aborting is unavailable", () => {
    const onSend = vi.fn();
    const container = renderInto(
      createProps({ canAbort: false, onSend, draft: "hello", connected: true }),
    );

    const sendBtn = container.querySelector<HTMLButtonElement>(".composer-send-btn");
    expect(sendBtn).not.toBeNull();
    sendBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

// ─── Disconnected state ──────────────────────────────────────

describe("chat view - disconnected state", () => {
  it("disables textarea when not connected", () => {
    const container = renderInto(createProps({ connected: false }));
    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    expect(textarea!.disabled).toBe(true);
  });

  it("disables send button when not connected", () => {
    const container = renderInto(createProps({ connected: false, draft: "hello" }));
    const sendBtn = container.querySelector<HTMLButtonElement>(".composer-send-btn");
    expect(sendBtn).not.toBeNull();
    expect(sendBtn!.disabled).toBe(true);
  });

  it("shows error callout when error prop is set", () => {
    const container = renderInto(createProps({ error: "Connection lost" }));
    const callout = container.querySelector(".callout.danger");
    expect(callout).not.toBeNull();
    expect(callout!.textContent).toContain("Connection lost");
  });

  it("does not show error callout when error is null", () => {
    const container = renderInto(createProps({ error: null }));
    const callout = container.querySelector(".callout.danger");
    expect(callout).toBeNull();
  });
});

// ─── API key banner ──────────────────────────────────────────

describe("chat view - API key banner", () => {
  it("shows when first-time (no messages + no key)", () => {
    const container = renderInto(
      createProps({ messages: [], apiKeys: {}, apiKeyInputOpen: false }),
    );
    const banner = container.querySelector(".api-key-banner");
    expect(banner).not.toBeNull();
  });

  it("hidden when messages exist and not toggled open", () => {
    const container = renderInto(
      createProps({
        messages: [{ role: "user", content: "hi" }],
        apiKeys: { anthropic: "sk-test" },
        apiKeyInputOpen: false,
      }),
    );
    const banner = container.querySelector(".api-key-banner");
    expect(banner).toBeNull();
  });

  it("shows when user toggles it open", () => {
    const container = renderInto(
      createProps({
        messages: [{ role: "user", content: "hi" }],
        apiKeys: { anthropic: "sk-test" },
        apiKeyInputOpen: true,
      }),
    );
    const banner = container.querySelector(".api-key-banner");
    expect(banner).not.toBeNull();
  });

  it("disables save button when no key entered", () => {
    const container = renderInto(
      createProps({ messages: [], apiKeys: {} }),
    );
    const saveBtn = container.querySelector<HTMLButtonElement>(".api-key-banner__save-btn");
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.disabled).toBe(true);
  });

  it("disables save button during saving and adds .saving class", () => {
    const container = renderInto(
      createProps({
        messages: [],
        apiKeys: { anthropic: "sk-key" },
        apiKeySaveStatus: "saving",
        apiKeyInputOpen: true,
      }),
    );
    const saveBtn = container.querySelector<HTMLButtonElement>(".api-key-banner__save-btn");
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.disabled).toBe(true);
    expect(saveBtn!.classList.contains("saving")).toBe(true);
  });

  it("shows .saved class on save button when saved", () => {
    const container = renderInto(
      createProps({
        messages: [],
        apiKeys: { anthropic: "sk-key" },
        apiKeySaveStatus: "saved",
        apiKeyInputOpen: true,
      }),
    );
    const saveBtn = container.querySelector<HTMLButtonElement>(".api-key-banner__save-btn");
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.classList.contains("saved")).toBe(true);
  });

  it("shows .error class on save button when error", () => {
    const container = renderInto(
      createProps({
        messages: [],
        apiKeys: { anthropic: "sk-key" },
        apiKeySaveStatus: "error",
        apiKeyInputOpen: true,
      }),
    );
    const saveBtn = container.querySelector<HTMLButtonElement>(".api-key-banner__save-btn");
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.classList.contains("error")).toBe(true);
  });

  it("shows hint--success class when saved", () => {
    const container = renderInto(
      createProps({
        messages: [],
        apiKeys: { anthropic: "sk-key" },
        apiKeySaveStatus: "saved",
        apiKeyInputOpen: true,
      }),
    );
    const hint = container.querySelector(".api-key-banner__hint");
    expect(hint).not.toBeNull();
    expect(hint!.classList.contains("hint--success")).toBe(true);
  });

  it("shows hint--error class when error", () => {
    const container = renderInto(
      createProps({
        messages: [],
        apiKeys: { anthropic: "sk-key" },
        apiKeySaveStatus: "error",
        apiKeyInputOpen: true,
      }),
    );
    const hint = container.querySelector(".api-key-banner__hint");
    expect(hint).not.toBeNull();
    expect(hint!.classList.contains("hint--error")).toBe(true);
  });

  it("calls onSaveApiKey(provider, key) on save click", () => {
    const onSaveApiKey = vi.fn();
    const container = renderInto(
      createProps({
        messages: [],
        apiKeys: { anthropic: "sk-test-key" },
        selectedProvider: "anthropic",
        apiKeyInputOpen: true,
        onSaveApiKey,
      }),
    );
    const saveBtn = container.querySelector<HTMLButtonElement>(".api-key-banner__save-btn");
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.disabled).toBe(false);
    saveBtn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSaveApiKey).toHaveBeenCalledWith("anthropic", "sk-test-key");
  });
});
