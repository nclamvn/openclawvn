import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isVoiceSupported,
  startVoiceInput,
  stopVoiceInput,
  toggleVoiceInput,
  isTtsSupported,
  speakText,
  stopTts,
  refreshVoices,
  type VoiceHostCallbacks,
  type VoiceConfig,
} from "./voice";

// ── Mock SpeechRecognition ──────────────────────────────

class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  started = false;
  aborted = false;

  start() {
    this.started = true;
  }
  stop() {
    this.started = false;
  }
  abort() {
    this.aborted = true;
    this.started = false;
  }

  // Test helpers
  simulateResult(transcript: string, isFinal: boolean) {
    this.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal,
          length: 1,
          0: { transcript, confidence: 0.9 },
        },
      },
    });
  }

  simulateError(error: string) {
    this.onerror?.({ error, message: "" });
  }

  simulateEnd() {
    this.onend?.();
  }
}

let mockInstance: MockSpeechRecognition | null = null;

function createHostCallbacks(): VoiceHostCallbacks & {
  mode: string;
  interim: string;
  draft: string;
  error: string | null;
  sendCalled: boolean;
} {
  const state = {
    mode: "idle" as string,
    interim: "",
    draft: "",
    error: null as string | null,
    sendCalled: false,
    setMode(m: string) {
      state.mode = m;
    },
    setInterimTranscript(t: string) {
      state.interim = t;
    },
    setDraft(t: string) {
      state.draft = t;
    },
    getDraft() {
      return state.draft;
    },
    setError(msg: string) {
      state.error = msg;
    },
    sendMessage() {
      state.sendCalled = true;
    },
  };
  return state;
}

// ── Tests ───────────────────────────────────────────────

describe("isVoiceSupported", () => {
  const origSR = (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  afterEach(() => {
    // Restore
    if (origSR !== undefined) {
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition = origSR;
    } else {
      delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    }
  });

  it("returns true when SpeechRecognition exists", () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition;
    expect(isVoiceSupported()).toBe(true);
  });

  it("returns false when SpeechRecognition is missing", () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    expect(isVoiceSupported()).toBe(false);
  });
});

describe("startVoiceInput (SpeechRecognition)", () => {
  beforeEach(() => {
    mockInstance = null;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        mockInstance = this;
      }
    };
  });

  afterEach(() => {
    stopVoiceInput();
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("sets mode to listening", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    expect(host.mode).toBe("listening");
    expect(mockInstance?.started).toBe(true);
  });

  it("configures recognition with vi-VN", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    expect(mockInstance?.lang).toBe("vi-VN");
    expect(mockInstance?.interimResults).toBe(true);
  });

  it("handles interim transcript", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    mockInstance?.simulateResult("xin chào", false);
    expect(host.interim).toBe("xin chào");
  });

  it("handles final transcript — sets draft", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    mockInstance?.simulateResult("xin chào Bờm", true);
    expect(host.draft).toBe("xin chào Bờm");
    expect(host.interim).toBe("");
  });

  it("appends to existing draft", async () => {
    const host = createHostCallbacks();
    host.draft = "Hey";
    await startVoiceInput(host);
    mockInstance?.simulateResult("Bờm", true);
    expect(host.draft).toBe("Hey Bờm");
  });

  it("auto-sends on final transcript when autoSend=true", async () => {
    vi.useFakeTimers();
    const host = createHostCallbacks();
    await startVoiceInput(host, { language: "vi-VN", autoSend: true, continuousMode: false });
    mockInstance?.simulateResult("gửi tin", true);
    expect(host.sendCalled).toBe(false); // not yet
    vi.advanceTimersByTime(300);
    expect(host.sendCalled).toBe(true);
    vi.useRealTimers();
  });

  it("does not auto-send in continuous mode", async () => {
    vi.useFakeTimers();
    const host = createHostCallbacks();
    await startVoiceInput(host, { language: "vi-VN", autoSend: true, continuousMode: true });
    mockInstance?.simulateResult("gửi tin", true);
    vi.advanceTimersByTime(500);
    expect(host.sendCalled).toBe(false);
    vi.useRealTimers();
  });

  it("handles not-allowed error", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    mockInstance?.simulateError("not-allowed");
    expect(host.error).toBeTruthy();
    expect(host.mode).toBe("idle");
  });

  it("handles no-speech silently", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    mockInstance?.simulateError("no-speech");
    expect(host.error).toBeNull();
    expect(host.mode).toBe("idle");
  });

  it("handles recognition end", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    expect(host.mode).toBe("listening");
    mockInstance?.simulateEnd();
    expect(host.mode).toBe("idle");
  });
});

describe("stopVoiceInput", () => {
  beforeEach(() => {
    mockInstance = null;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        mockInstance = this;
      }
    };
  });

  afterEach(() => {
    stopVoiceInput();
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("aborts active recognition", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    expect(mockInstance?.started).toBe(true);
    stopVoiceInput();
    expect(mockInstance?.aborted).toBe(true);
    expect(host.mode).toBe("idle");
    expect(host.interim).toBe("");
  });
});

describe("toggleVoiceInput", () => {
  beforeEach(() => {
    mockInstance = null;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        mockInstance = this;
      }
    };
  });

  afterEach(() => {
    stopVoiceInput();
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("starts voice on first toggle", () => {
    const host = createHostCallbacks();
    toggleVoiceInput(host);
    expect(host.mode).toBe("listening");
  });

  it("stops voice on second toggle", async () => {
    const host = createHostCallbacks();
    await startVoiceInput(host);
    expect(host.mode).toBe("listening");
    toggleVoiceInput(host);
    expect(host.mode).toBe("idle");
  });
});

describe("stale callback guard", () => {
  beforeEach(() => {
    mockInstance = null;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        mockInstance = this;
      }
    };
  });

  afterEach(() => {
    stopVoiceInput();
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("ignores results from previous session after restart", async () => {
    const host1 = createHostCallbacks();
    await startVoiceInput(host1);
    const oldInstance = mockInstance;

    // Start new session (stops old)
    const host2 = createHostCallbacks();
    await startVoiceInput(host2);

    // Old instance fires result — should be ignored
    oldInstance?.simulateResult("stale result", true);
    expect(host1.draft).toBe(""); // not updated
    expect(host2.draft).toBe(""); // also not updated (came from old instance)
  });
});

// ── TTS Tests ──────────────────────────────────────────

// Helper: mock speechSynthesis (it's a readonly getter on Window)
function mockSpeechSynthesis(mock: Record<string, unknown>) {
  Object.defineProperty(window, "speechSynthesis", {
    value: mock,
    writable: true,
    configurable: true,
  });
}

function restoreSpeechSynthesis(orig: PropertyDescriptor | undefined) {
  if (orig) {
    Object.defineProperty(window, "speechSynthesis", orig);
  }
}

describe("isTtsSupported", () => {
  const origDesc = Object.getOwnPropertyDescriptor(window, "speechSynthesis");

  afterEach(() => {
    restoreSpeechSynthesis(origDesc);
    refreshVoices();
  });

  it("returns true when Vietnamese voices exist", () => {
    mockSpeechSynthesis({
      getVoices: () => [{ lang: "vi-VN", name: "Linh" }],
      speak: vi.fn(),
      cancel: vi.fn(),
      speaking: false,
    });
    refreshVoices();
    expect(isTtsSupported()).toBe(true);
  });

  it("returns false when no Vietnamese voices (Safari)", () => {
    mockSpeechSynthesis({
      getVoices: () => [],
      speak: vi.fn(),
      cancel: vi.fn(),
      speaking: false,
    });
    refreshVoices();
    expect(isTtsSupported()).toBe(false);
  });
});

describe("speakText", () => {
  const origDesc = Object.getOwnPropertyDescriptor(window, "speechSynthesis");
  let utterances: SpeechSynthesisUtterance[];
  let cancelled: boolean;

  beforeEach(() => {
    utterances = [];
    cancelled = false;
    mockSpeechSynthesis({
      getVoices: () => [{ lang: "vi-VN", name: "Linh" }],
      speak: (u: SpeechSynthesisUtterance) => { utterances.push(u); },
      cancel: () => { cancelled = true; },
      speaking: false,
    });
    refreshVoices();
  });

  afterEach(() => {
    stopTts();
    restoreSpeechSynthesis(origDesc);
    refreshVoices();
  });

  it("sets mode to speaking", () => {
    let mode = "idle";
    speakText("Xin chào", (m) => { mode = m; });
    expect(mode).toBe("speaking");
    expect(utterances.length).toBeGreaterThan(0);
  });

  it("cancels any previous speech", () => {
    speakText("first", () => {});
    cancelled = false;
    speakText("second", () => {});
    expect(cancelled).toBe(true);
  });

  it("sets mode to idle on utterance end", () => {
    let mode = "idle";
    speakText("Done", (m) => { mode = m; });
    expect(mode).toBe("speaking");
    const last = utterances[utterances.length - 1];
    last.onend?.(new Event("end"));
    expect(mode).toBe("idle");
  });

  it("does nothing for empty text", () => {
    let mode = "idle";
    speakText("", (m) => { mode = m; });
    expect(mode).toBe("idle");
    expect(utterances.length).toBe(0);
  });

  it("does nothing when no Vietnamese voices", () => {
    mockSpeechSynthesis({
      getVoices: () => [],
      speak: vi.fn(),
      cancel: vi.fn(),
      speaking: false,
    });
    refreshVoices();
    let mode = "idle";
    speakText("Xin chào", (m) => { mode = m; });
    expect(mode).toBe("idle");
  });
});

describe("stopTts", () => {
  const origDesc = Object.getOwnPropertyDescriptor(window, "speechSynthesis");
  let cancelled = false;

  beforeEach(() => {
    cancelled = false;
    mockSpeechSynthesis({
      getVoices: () => [{ lang: "vi-VN", name: "Linh" }],
      speak: vi.fn(),
      cancel: () => { cancelled = true; },
      speaking: false,
    });
    refreshVoices();
  });

  afterEach(() => {
    restoreSpeechSynthesis(origDesc);
    refreshVoices();
  });

  it("cancels speechSynthesis and resets mode", () => {
    let mode: string = "idle";
    speakText("test", (m) => { mode = m; });
    expect(mode).toBe("speaking");
    cancelled = false;
    stopTts();
    expect(cancelled).toBe(true);
    expect(mode).toBe("idle");
  });
});

describe("TTS auto-cancel on voice input", () => {
  const origDesc = Object.getOwnPropertyDescriptor(window, "speechSynthesis");
  let cancelled = false;

  beforeEach(() => {
    mockInstance = null;
    cancelled = false;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        mockInstance = this;
      }
    };
    mockSpeechSynthesis({
      getVoices: () => [{ lang: "vi-VN", name: "Linh" }],
      speak: vi.fn(),
      cancel: () => { cancelled = true; },
      speaking: true,
    });
    refreshVoices();
  });

  afterEach(() => {
    stopVoiceInput();
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    restoreSpeechSynthesis(origDesc);
    refreshVoices();
  });

  it("starting voice input cancels TTS", async () => {
    let mode: string = "idle";
    speakText("response", (m) => { mode = m; });
    expect(mode).toBe("speaking");
    cancelled = false;
    // Start voice input — should cancel TTS
    const host = createHostCallbacks();
    await startVoiceInput(host);
    expect(cancelled).toBe(true);
    expect(host.mode).toBe("listening");
  });
});
