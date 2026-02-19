import { t } from "../i18n";

// ── Types ──────────────────────────────────────────────

export type VoiceMode = "idle" | "listening" | "speaking";

export type VoiceConfig = {
  language: string;
  autoSend: boolean;
  continuousMode: boolean;
};

const DEFAULT_CONFIG: VoiceConfig = {
  language: "vi-VN",
  autoSend: true,
  continuousMode: false,
};

/**
 * Callbacks the voice controller uses to communicate state changes
 * back to the host component (OpenClawApp).
 */
export type VoiceHostCallbacks = {
  setMode: (mode: VoiceMode) => void;
  setInterimTranscript: (text: string) => void;
  setDraft: (text: string) => void;
  getDraft: () => string;
  setError: (msg: string) => void;
  sendMessage: () => void;
};

// ── Browser Support Detection ──────────────────────────

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

export function isVoiceSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

// ── TTS Support Detection ──────────────────────────────

let ttsVoicesCache: SpeechSynthesisVoice[] | null = null;

/**
 * Get available Vietnamese TTS voices. Returns empty array if
 * SpeechSynthesis is not available or no vi-VN voices found.
 * Handles Safari's getVoices() returning empty.
 */
export function getVietnameseVoices(): SpeechSynthesisVoice[] {
  if (ttsVoicesCache !== null) return ttsVoicesCache;
  if (typeof speechSynthesis === "undefined") {
    ttsVoicesCache = [];
    return ttsVoicesCache;
  }
  const all = speechSynthesis.getVoices();
  ttsVoicesCache = all.filter((v) => v.lang.startsWith("vi"));
  return ttsVoicesCache;
}

/**
 * Check if TTS is available for Vietnamese.
 * Returns false on Safari where getVoices() returns empty.
 */
export function isTtsSupported(): boolean {
  return getVietnameseVoices().length > 0;
}

/**
 * Re-probe voices. Call on `voiceschanged` event since some browsers
 * load voices asynchronously.
 */
export function refreshVoices(): void {
  ttsVoicesCache = null;
}

// ── Preferred MediaRecorder MIME type ──────────────────

function getPreferredMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "";
}

// ── Module State (singleton — one voice input at a time) ──

let activeRecognition: SpeechRecognition | null = null;
let activeMediaRecorder: MediaRecorder | null = null;
let activeStream: MediaStream | null = null;
let activeCallbacks: VoiceHostCallbacks | null = null;

// ── STT ────────────────────────────────────────────────

/**
 * Start voice input using SpeechRecognition (Web Speech API).
 * Falls back to MediaRecorder-only capture when STT is unavailable.
 */
export async function startVoiceInput(
  host: VoiceHostCallbacks,
  config: VoiceConfig = DEFAULT_CONFIG,
): Promise<void> {
  // Stop any previous session (STT + TTS)
  stopVoiceInput();
  stopTts();

  activeCallbacks = host;
  const Ctor = getSpeechRecognitionCtor();

  if (Ctor) {
    // ── SpeechRecognition path ──
    try {
      const recognition = new Ctor();
      recognition.lang = config.language;
      recognition.interimResults = true;
      recognition.continuous = config.continuousMode;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (activeCallbacks !== host) return; // stale callback guard
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          host.setInterimTranscript(interim);
        }

        if (final) {
          host.setInterimTranscript("");
          const existing = host.getDraft().trim();
          const draft = existing ? existing + " " + final.trim() : final.trim();
          host.setDraft(draft);

          if (config.autoSend && !config.continuousMode) {
            setTimeout(() => {
              if (activeCallbacks !== host) return;
              host.sendMessage();
              stopVoiceInput();
            }, 300);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (activeCallbacks !== host) return;
        if (event.error === "no-speech") {
          stopVoiceInput();
          return;
        }
        if (event.error === "not-allowed") {
          host.setError(t().chat.microphoneError);
        } else if (event.error !== "aborted") {
          host.setError(t().chat.voiceError);
        }
        stopVoiceInput();
      };

      recognition.onend = () => {
        if (activeCallbacks !== host) return;
        // SpeechRecognition auto-stops after silence or final result
        stopVoiceInput();
      };

      recognition.start();
      activeRecognition = recognition;
      host.setMode("listening");
    } catch (err) {
      console.error("SpeechRecognition start failed:", err);
      host.setError(t().chat.voiceError);
    }
  } else {
    // ── MediaRecorder fallback (no STT available) ──
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeUsed = recorder.mimeType || "audio/webm";
        const _audioBlob = new Blob(chunks, { type: mimeUsed });
        stream.getTracks().forEach((track) => track.stop());
        // Future: send blob to Cloud STT API (Tầng 2)
      };

      recorder.start();
      activeMediaRecorder = recorder;
      activeStream = stream;
      host.setMode("listening");
    } catch (err) {
      console.error("Failed to start recording:", err);
      host.setError(t().chat.microphoneError);
    }
  }
}

/**
 * Stop voice input — tears down SpeechRecognition or MediaRecorder.
 */
export function stopVoiceInput(): void {
  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch {
      // already stopped
    }
    activeRecognition = null;
  }

  if (activeMediaRecorder && activeMediaRecorder.state !== "inactive") {
    activeMediaRecorder.stop();
    activeMediaRecorder = null;
  }

  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }

  if (activeCallbacks) {
    activeCallbacks.setMode("idle");
    activeCallbacks.setInterimTranscript("");
    activeCallbacks = null;
  }
}

/**
 * Toggle voice input on/off.
 */
export function toggleVoiceInput(
  host: VoiceHostCallbacks,
  config?: VoiceConfig,
): void {
  if (activeRecognition || activeMediaRecorder) {
    stopVoiceInput();
  } else {
    startVoiceInput(host, config);
  }
}

// ── TTS ────────────────────────────────────────────────

let ttsSetModeCallback: ((mode: VoiceMode) => void) | null = null;

// Max text length per utterance to avoid SpeechSynthesis cutoffs
const TTS_CHUNK_MAX = 200;

/**
 * Split text into sentence-based chunks for TTS reliability.
 * SpeechSynthesis can cut off long texts.
 */
function chunkText(text: string): string[] {
  // Split on sentence boundaries (Vietnamese + English)
  const sentences = text.split(/(?<=[.!?。！？\n])\s*/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if (current.length + sentence.length > TTS_CHUNK_MAX && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Speak text using SpeechSynthesis (Web Speech API TTS).
 * Auto-cancels if user starts voice input.
 * @param text - Text to speak
 * @param setMode - Callback to update voice mode in host
 * @param language - BCP-47 language tag (default: vi-VN)
 */
export function speakText(
  text: string,
  setMode: (mode: VoiceMode) => void,
  language = "vi-VN",
): void {
  if (typeof speechSynthesis === "undefined") return;
  if (!text.trim()) return;

  // Cancel any in-progress speech
  speechSynthesis.cancel();

  const voices = getVietnameseVoices();
  if (voices.length === 0) return; // no Vietnamese voice = silent fail

  const chunks = chunkText(text);
  ttsSetModeCallback = setMode;
  setMode("speaking");

  chunks.forEach((chunk, i) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = language;
    try { utterance.voice = voices[0]; } catch { /* mock/unsupported */ }

    if (i === chunks.length - 1) {
      // Last chunk — restore mode when done
      utterance.onend = () => {
        if (ttsSetModeCallback === setMode) {
          setMode("idle");
          ttsSetModeCallback = null;
        }
      };
      utterance.onerror = () => {
        if (ttsSetModeCallback === setMode) {
          setMode("idle");
          ttsSetModeCallback = null;
        }
      };
    }

    speechSynthesis.speak(utterance);
  });
}

/**
 * Stop TTS playback.
 */
export function stopTts(): void {
  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.cancel();
  }
  if (ttsSetModeCallback) {
    ttsSetModeCallback("idle");
    ttsSetModeCallback = null;
  }
}

/**
 * Check if TTS is currently speaking.
 */
export function isSpeaking(): boolean {
  return typeof speechSynthesis !== "undefined" && speechSynthesis.speaking;
}
