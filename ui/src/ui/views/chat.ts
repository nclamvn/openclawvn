import { html, nothing } from "lit";
import { ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import type { SessionsListResult } from "../types";
import type { ChatAttachment, ChatQueueItem } from "../ui-types";
import type { ChatItem, MessageGroup } from "../types/chat-types";
import { icons } from "../icons";
import { t } from "../i18n";
import { normalizeMessage, normalizeRoleForGrouping } from "../chat/message-normalizer";
import {
  renderMessageGroup,
  renderReadingIndicatorGroup,
  renderStreamingGroup,
} from "../chat/grouped-render";
import { renderMarkdownSidebar } from "./markdown-sidebar";
import "../components/resizable-divider";

export type CompactionIndicatorStatus = {
  active: boolean;
  startedAt: number | null;
  completedAt: number | null;
};

export type QuickAction = {
  id: string;
  label: string;
  icon: keyof typeof icons;
  prompt?: string;
};

export type ModelOption = {
  id: string;
  provider: string;
  name: string;
  label: string;
};

export type ChatProps = {
  sessionKey: string;
  onSessionKeyChange: (next: string) => void;
  thinkingLevel: string | null;
  showThinking: boolean;
  loading: boolean;
  sending: boolean;
  canAbort?: boolean;
  compactionStatus?: CompactionIndicatorStatus | null;
  messages: unknown[];
  toolMessages: unknown[];
  stream: string | null;
  streamStartedAt: number | null;
  assistantAvatarUrl?: string | null;
  draft: string;
  queue: ChatQueueItem[];
  connected: boolean;
  canSend: boolean;
  disabledReason: string | null;
  error: string | null;
  sessions: SessionsListResult | null;
  // Focus mode
  focusMode: boolean;
  // Sidebar state
  sidebarOpen?: boolean;
  sidebarContent?: string | null;
  sidebarError?: string | null;
  splitRatio?: number;
  assistantName: string;
  assistantAvatar: string | null;
  // Image attachments
  attachments?: ChatAttachment[];
  onAttachmentsChange?: (attachments: ChatAttachment[]) => void;
  // Model selection
  currentModel?: string;
  availableModels?: ModelOption[];
  showModelSelector?: boolean;
  selectedProvider?: string;
  onModelChange?: (provider: string, modelName: string) => void;
  onToggleModelSelector?: () => void;
  onSelectProvider?: (provider: string) => void;
  // API keys per provider
  apiKeys?: Record<string, string>;
  apiKeySaveMode?: 'temp' | 'permanent';
  onApiKeyChange?: (provider: string, key: string) => void;
  onApiKeySaveModeChange?: (mode: 'temp' | 'permanent') => void;
  onSaveApiKey?: (provider: string, key: string, permanent: boolean) => void;
  // Voice recording
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  // Quick actions
  quickActions?: QuickAction[];
  onQuickAction?: (action: QuickAction) => void;
  // Event handlers
  onRefresh: () => void;
  onToggleFocusMode: () => void;
  onDraftChange: (next: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  onQueueRemove: (id: string) => void;
  onNewSession: () => void;
  onOpenSidebar?: (content: string) => void;
  onCloseSidebar?: () => void;
  onSplitRatioChange?: (ratio: number) => void;
  onChatScroll?: (event: Event) => void;
};

const COMPACTION_TOAST_DURATION_MS = 5000;

function adjustTextareaHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function renderCompactionIndicator(status: CompactionIndicatorStatus | null | undefined) {
  if (!status) return nothing;

  // Show "compacting..." while active
  if (status.active) {
    return html`
      <div class="callout info compaction-indicator compaction-indicator--active">
        ${icons.loader} ${t().chat.compacting}
      </div>
    `;
  }

  // Show "compaction complete" briefly after completion
  if (status.completedAt) {
    const elapsed = Date.now() - status.completedAt;
    if (elapsed < COMPACTION_TOAST_DURATION_MS) {
      return html`
        <div class="callout success compaction-indicator compaction-indicator--complete">
          ${icons.check} ${t().chat.compacted}
        </div>
      `;
    }
  }

  return nothing;
}

function generateAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function handlePaste(e: ClipboardEvent, props: ChatProps) {
  const items = e.clipboardData?.items;
  if (!items || !props.onAttachmentsChange) return;

  const imageItems: DataTransferItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      imageItems.push(item);
    }
  }

  if (imageItems.length === 0) return;

  e.preventDefault();

  for (const item of imageItems) {
    const file = item.getAsFile();
    if (!file) continue;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAttachment: ChatAttachment = {
        id: generateAttachmentId(),
        dataUrl,
        mimeType: file.type,
      };
      const current = props.attachments ?? [];
      props.onAttachmentsChange?.([...current, newAttachment]);
    };
    reader.readAsDataURL(file);
  }
}

function renderAttachmentPreview(props: ChatProps) {
  const attachments = props.attachments ?? [];
  if (attachments.length === 0) return nothing;

  return html`
    <div class="chat-attachments">
      ${attachments.map(
        (att) => html`
          <div class="chat-attachment">
            <img
              src=${att.dataUrl}
              alt="${t().chat.attachmentPreview}"
              class="chat-attachment__img"
            />
            <button
              class="chat-attachment__remove"
              type="button"
              aria-label="${t().chat.removeAttachment}"
              @click=${() => {
                const next = (props.attachments ?? []).filter((a) => a.id !== att.id);
                props.onAttachmentsChange?.(next);
              }}
            >
              ${icons.x}
            </button>
          </div>
        `,
      )}
    </div>
  `;
}

function getDefaultQuickActions(): QuickAction[] {
  return [
    { id: 'code', label: t().chat.quickActions.code, icon: 'code', prompt: '' },
    { id: 'write', label: t().chat.quickActions.write, icon: 'penLine', prompt: '' },
    { id: 'create', label: t().chat.quickActions.create, icon: 'sparkles', prompt: '' },
    { id: 'learn', label: t().chat.quickActions.learn, icon: 'graduationCap', prompt: '' },
    { id: 'analyze', label: t().chat.quickActions.analyze, icon: 'brain', prompt: '' },
  ];
}

function renderQuickActions(props: ChatProps) {
  const actions = props.quickActions ?? getDefaultQuickActions();
  if (props.draft.trim().length > 0) return nothing;

  return html`
    <div class="composer-quick-actions">
      ${actions.map(
        (action) => html`
          <button
            class="quick-action-btn"
            type="button"
            ?disabled=${!props.connected}
            @click=${() => {
              if (props.onQuickAction) {
                props.onQuickAction(action);
              } else if (action.prompt) {
                props.onDraftChange(action.prompt);
              }
            }}
          >
            <span class="quick-action-icon">${icons[action.icon]}</span>
            <span class="quick-action-label">${action.label}</span>
          </button>
        `,
      )}
    </div>
  `;
}

const DEFAULT_MODELS: ModelOption[] = [
  // Anthropic
  { id: 'claude-opus-4-5', provider: 'anthropic', name: 'claude-opus-4-5-20250514', label: 'Opus 4.5' },
  { id: 'claude-sonnet-4', provider: 'anthropic', name: 'claude-sonnet-4-20250514', label: 'Sonnet 4' },
  { id: 'claude-haiku-3-5', provider: 'anthropic', name: 'claude-3-5-haiku-20241022', label: 'Haiku 3.5' },
  // OpenAI
  { id: 'gpt-4o', provider: 'openai', name: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'gpt-4', provider: 'openai', name: 'gpt-4', label: 'GPT-4' },
  { id: 'gpt-3.5-turbo', provider: 'openai', name: 'gpt-3.5-turbo', label: 'GPT-3.5' },
  // Google
  { id: 'gemini-2.0-flash', provider: 'google', name: 'gemini-2.0-flash', label: 'Gemini 2.0' },
  { id: 'gemini-1.5-pro', provider: 'google', name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', provider: 'google', name: 'gemini-1.5-flash', label: 'Gemini 1.5' },
];

type ProviderModels = {
  provider: string;
  label: string;
  models: ModelOption[];
};

function groupModelsByProvider(models: ModelOption[]): ProviderModels[] {
  const providerLabels: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
  };

  const grouped: Record<string, ModelOption[]> = {};
  for (const model of models) {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push(model);
  }

  return Object.entries(grouped).map(([provider, models]) => ({
    provider,
    label: providerLabels[provider] || provider,
    models,
  }));
}

const PROVIDER_KEY_PLACEHOLDERS: Record<string, string> = {
  anthropic: 'sk-ant-api03-...',
  openai: 'sk-...',
  google: 'AIza...',
};

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};

function renderModelSelectorDropdown(props: ChatProps) {
  const models = props.availableModels ?? DEFAULT_MODELS;
  const groupedModels = groupModelsByProvider(models);
  const selectedProvider = props.selectedProvider || 'anthropic';
  const apiKeys = props.apiKeys || {};
  const saveMode = props.apiKeySaveMode || 'temp';
  const currentKey = apiKeys[selectedProvider] || '';

  // Filter models by selected provider
  const filteredModels = models.filter((m) => m.provider === selectedProvider);

  return html`
    <div class="model-selector-dropdown">
      <div class="model-selector-header">
        <span>${t().chat.selectModel}</span>
        <button
          class="model-selector-close"
          type="button"
          @click=${() => props.onToggleModelSelector?.()}
        >
          ${icons.x}
        </button>
      </div>

      <!-- Provider tabs -->
      <div class="model-provider-tabs">
        ${groupedModels.map(
          (group) => html`
            <button
              class="model-provider-tab ${selectedProvider === group.provider ? 'active' : ''}"
              type="button"
              @click=${() => props.onSelectProvider?.(group.provider)}
            >
              ${group.label}
            </button>
          `,
        )}
      </div>

      <!-- API Key input for selected provider -->
      <div class="model-api-key-section">
        <div class="model-api-key-header">
          <label class="model-api-key-label">${t().chat.apiKey}</label>
          <div class="model-api-key-save-toggle">
            <button
              class="save-mode-btn ${saveMode === 'temp' ? 'active' : ''}"
              type="button"
              title="${t().chat.saveTemp}"
              @click=${() => props.onApiKeySaveModeChange?.('temp')}
            >
              ${t().chat.tempLabel}
            </button>
            <button
              class="save-mode-btn ${saveMode === 'permanent' ? 'active' : ''}"
              type="button"
              title="${t().chat.savePerm}"
              @click=${() => props.onApiKeySaveModeChange?.('permanent')}
            >
              ${t().chat.permLabel}
            </button>
          </div>
        </div>
        <div class="model-api-key-input-wrapper">
          <input
            type="password"
            class="model-api-key-input"
            placeholder=${PROVIDER_KEY_PLACEHOLDERS[selectedProvider] || 'Enter API key...'}
            .value=${currentKey}
            @input=${(e: Event) => {
              const target = e.target as HTMLInputElement;
              props.onApiKeyChange?.(selectedProvider, target.value);
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && currentKey.trim()) {
                props.onSaveApiKey?.(selectedProvider, currentKey, saveMode === 'permanent');
              }
            }}
          />
        </div>
        <button
          class="model-api-key-save-btn"
          type="button"
          ?disabled=${!currentKey.trim()}
          @click=${() => {
            if (currentKey.trim()) {
              props.onSaveApiKey?.(selectedProvider, currentKey, saveMode === 'permanent');
              props.onToggleModelSelector?.();
            }
          }}
        >
          ${icons.check} ${t().common.save}
        </button>
        <div class="model-api-key-hint">
          ${saveMode === 'permanent'
            ? t().chat.saveToAuthProfiles
            : t().chat.saveSessionOnly}
        </div>
      </div>

      <!-- Filtered models list -->
      <div class="model-selector-list">
        ${filteredModels.map(
          (model) => html`
            <button
              class="model-option ${props.currentModel === model.label || props.currentModel === model.id ? 'selected' : ''}"
              type="button"
              @click=${() => {
                props.onModelChange?.(model.provider, model.name);
                props.onToggleModelSelector?.();
              }}
            >
              <span class="model-option-label">${model.label}</span>
              ${(props.currentModel === model.label || props.currentModel === model.id)
                ? html`<span class="model-option-check">${icons.check}</span>`
                : nothing}
            </button>
          `,
        )}
      </div>

    </div>
  `;
}

export function renderChat(props: ChatProps) {
  const canCompose = props.connected;
  const isBusy = props.sending || props.stream !== null;
  const canAbort = Boolean(props.canAbort && props.onAbort);
  const activeSession = props.sessions?.sessions?.find((row) => row.key === props.sessionKey);
  const reasoningLevel = activeSession?.reasoningLevel ?? "off";
  const showReasoning = props.showThinking && reasoningLevel !== "off";
  const assistantIdentity = {
    name: props.assistantName,
    avatar: props.assistantAvatar ?? props.assistantAvatarUrl ?? null,
  };

  const hasAttachments = (props.attachments?.length ?? 0) > 0;
  const composePlaceholder = props.connected
    ? hasAttachments
      ? t().chat.inputPlaceholderWithImages
      : t().chat.inputPlaceholder
    : t().chat.connectPrompt;

  const splitRatio = props.splitRatio ?? 0.6;
  const sidebarOpen = Boolean(props.sidebarOpen && props.onCloseSidebar);
  const thread = html`
    <div
      class="chat-thread"
      role="log"
      aria-live="polite"
      @scroll=${props.onChatScroll}
    >
      ${
        props.loading
          ? html`
              <div class="muted">${t().chat.loadingChat}</div>
            `
          : nothing
      }
      ${repeat(
        buildChatItems(props),
        (item) => item.key,
        (item) => {
          if (item.kind === "reading-indicator") {
            return renderReadingIndicatorGroup(assistantIdentity);
          }

          if (item.kind === "stream") {
            return renderStreamingGroup(
              item.text,
              item.startedAt,
              props.onOpenSidebar,
              assistantIdentity,
            );
          }

          if (item.kind === "group") {
            return renderMessageGroup(item, {
              onOpenSidebar: props.onOpenSidebar,
              showReasoning,
              assistantName: props.assistantName,
              assistantAvatar: assistantIdentity.avatar,
            });
          }

          return nothing;
        },
      )}
    </div>
  `;

  return html`
    <section class="card chat">
      ${props.disabledReason ? html`<div class="callout">${props.disabledReason}</div>` : nothing}

      ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}

      ${renderCompactionIndicator(props.compactionStatus)}

      ${
        props.focusMode
          ? html`
            <button
              class="chat-focus-exit"
              type="button"
              @click=${props.onToggleFocusMode}
              aria-label="${t().chat.toggleFocus}"
              title="${t().chat.toggleFocus}"
            >
              ${icons.x}
            </button>
          `
          : nothing
      }

      <div
        class="chat-split-container ${sidebarOpen ? "chat-split-container--open" : ""}"
      >
        <div
          class="chat-main"
          style="flex: ${sidebarOpen ? `0 0 ${splitRatio * 100}%` : "1 1 100%"}"
        >
          ${thread}
        </div>

        ${
          sidebarOpen
            ? html`
              <resizable-divider
                .splitRatio=${splitRatio}
                @resize=${(e: CustomEvent) => props.onSplitRatioChange?.(e.detail.splitRatio)}
              ></resizable-divider>
              <div class="chat-sidebar">
                ${renderMarkdownSidebar({
                  content: props.sidebarContent ?? null,
                  error: props.sidebarError ?? null,
                  onClose: props.onCloseSidebar!,
                  onViewRawText: () => {
                    if (!props.sidebarContent || !props.onOpenSidebar) return;
                    props.onOpenSidebar(`\`\`\`\n${props.sidebarContent}\n\`\`\``);
                  },
                })}
              </div>
            `
            : nothing
        }
      </div>

      ${
        props.queue.length
          ? html`
            <div class="chat-queue" role="status" aria-live="polite">
              <div class="chat-queue__title">${t().chat.queued} (${props.queue.length})</div>
              <div class="chat-queue__list">
                ${props.queue.map(
                  (item) => html`
                    <div class="chat-queue__item">
                      <div class="chat-queue__text">
                        ${
                          item.text ||
                          (item.attachments?.length ? `${t().chat.image} (${item.attachments.length})` : "")
                        }
                      </div>
                      <button
                        class="btn chat-queue__remove"
                        type="button"
                        aria-label="${t().chat.removeQueued}"
                        @click=${() => props.onQueueRemove(item.id)}
                      >
                        ${icons.x}
                      </button>
                    </div>
                  `,
                )}
              </div>
            </div>
          `
          : nothing
      }

      <div class="chat-composer claude-style">
        ${renderAttachmentPreview(props)}

        <div class="composer-main">
          <textarea
            class="composer-input"
            ${ref((el) => el && adjustTextareaHeight(el as HTMLTextAreaElement))}
            .value=${props.draft}
            ?disabled=${!props.connected}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key !== "Enter") return;
              if (e.isComposing || e.keyCode === 229) return;
              if (e.shiftKey) return;
              if (!props.connected) return;
              e.preventDefault();
              if (canCompose) props.onSend();
            }}
            @input=${(e: Event) => {
              const target = e.target as HTMLTextAreaElement;
              adjustTextareaHeight(target);
              props.onDraftChange(target.value);
            }}
            @paste=${(e: ClipboardEvent) => handlePaste(e, props)}
            placeholder=${props.connected ? t().chat.placeholder : t().chat.connectButton}
          ></textarea>

          <div class="composer-toolbar">
            <div class="composer-toolbar__left">
              <input
                type="file"
                id="composer-file-input"
                accept="image/*"
                multiple
                style="display: none"
                @change=${(e: Event) => {
                  const input = e.target as HTMLInputElement;
                  const files = input.files;
                  if (!files || !props.onAttachmentsChange) return;

                  for (const file of Array.from(files)) {
                    if (!file.type.startsWith("image/")) continue;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      const newAttachment: ChatAttachment = {
                        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                        dataUrl,
                        mimeType: file.type,
                      };
                      const current = props.attachments ?? [];
                      props.onAttachmentsChange?.([...current, newAttachment]);
                    };
                    reader.readAsDataURL(file);
                  }
                  input.value = '';
                }}
              />
              <button
                class="composer-icon-btn"
                type="button"
                title="${t().chat.attachImage}"
                ?disabled=${!props.connected}
                @click=${() => {
                  const input = document.getElementById('composer-file-input') as HTMLInputElement;
                  input?.click();
                }}
              >
                ${icons.plus}
              </button>
              <button
                class="composer-icon-btn ${props.isRecording ? 'recording' : ''}"
                type="button"
                title="${props.isRecording ? t().chat.stopRecording : t().chat.voiceInput}"
                ?disabled=${!props.connected}
                @click=${() => {
                  if (props.isRecording && props.onStopRecording) {
                    props.onStopRecording();
                  } else if (props.onStartRecording) {
                    props.onStartRecording();
                  }
                }}
              >
                ${icons.mic}
              </button>
            </div>

            <div class="composer-toolbar__right">
              <button
                class="composer-model-selector"
                type="button"
                @click=${() => props.onToggleModelSelector?.()}
                ?disabled=${!props.connected}
              >
                <span class="model-name">${props.currentModel || 'Opus 4.5'}</span>
                ${icons.chevronDown}
              </button>

              <button
                class="composer-send-btn ${isBusy ? 'busy' : ''}"
                type="button"
                ?disabled=${!props.connected || (!props.draft.trim() && !hasAttachments)}
                @click=${canAbort ? props.onAbort : props.onSend}
                title="${canAbort ? t().chat.stop : t().chat.sendMessage}"
              >
                ${canAbort ? icons.x : icons.arrowUp}
              </button>
            </div>
          </div>
        </div>

        ${props.showModelSelector ? renderModelSelectorDropdown(props) : nothing}
      </div>
    </section>
  `;
}

const CHAT_HISTORY_RENDER_LIMIT = 200;

function groupMessages(items: ChatItem[]): Array<ChatItem | MessageGroup> {
  const result: Array<ChatItem | MessageGroup> = [];
  let currentGroup: MessageGroup | null = null;

  for (const item of items) {
    if (item.kind !== "message") {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push(item);
      continue;
    }

    const normalized = normalizeMessage(item.message);
    const role = normalizeRoleForGrouping(normalized.role);
    const timestamp = normalized.timestamp || Date.now();

    if (!currentGroup || currentGroup.role !== role) {
      if (currentGroup) result.push(currentGroup);
      currentGroup = {
        kind: "group",
        key: `group:${role}:${item.key}`,
        role,
        messages: [{ message: item.message, key: item.key }],
        timestamp,
        isStreaming: false,
      };
    } else {
      currentGroup.messages.push({ message: item.message, key: item.key });
    }
  }

  if (currentGroup) result.push(currentGroup);
  return result;
}

function buildChatItems(props: ChatProps): Array<ChatItem | MessageGroup> {
  const items: ChatItem[] = [];
  const history = Array.isArray(props.messages) ? props.messages : [];
  const tools = Array.isArray(props.toolMessages) ? props.toolMessages : [];
  const historyStart = Math.max(0, history.length - CHAT_HISTORY_RENDER_LIMIT);
  if (historyStart > 0) {
    items.push({
      kind: "message",
      key: "chat:history:notice",
      message: {
        role: "system",
        content: `Hiển thị ${CHAT_HISTORY_RENDER_LIMIT} tin nhắn gần nhất (${historyStart} đã ẩn).`,
        timestamp: Date.now(),
      },
    });
  }
  for (let i = historyStart; i < history.length; i++) {
    const msg = history[i];
    const normalized = normalizeMessage(msg);

    if (!props.showThinking && normalized.role.toLowerCase() === "toolresult") {
      continue;
    }

    items.push({
      kind: "message",
      key: messageKey(msg, i),
      message: msg,
    });
  }
  if (props.showThinking) {
    for (let i = 0; i < tools.length; i++) {
      items.push({
        kind: "message",
        key: messageKey(tools[i], i + history.length),
        message: tools[i],
      });
    }
  }

  if (props.stream !== null) {
    const key = `stream:${props.sessionKey}:${props.streamStartedAt ?? "live"}`;
    if (props.stream.trim().length > 0) {
      items.push({
        kind: "stream",
        key,
        text: props.stream,
        startedAt: props.streamStartedAt ?? Date.now(),
      });
    } else {
      items.push({ kind: "reading-indicator", key });
    }
  }

  return groupMessages(items);
}

function messageKey(message: unknown, index: number): string {
  const m = message as Record<string, unknown>;
  const toolCallId = typeof m.toolCallId === "string" ? m.toolCallId : "";
  if (toolCallId) return `tool:${toolCallId}`;
  const id = typeof m.id === "string" ? m.id : "";
  if (id) return `msg:${id}`;
  const messageId = typeof m.messageId === "string" ? m.messageId : "";
  if (messageId) return `msg:${messageId}`;
  const timestamp = typeof m.timestamp === "number" ? m.timestamp : null;
  const role = typeof m.role === "string" ? m.role : "unknown";
  if (timestamp != null) return `msg:${role}:${timestamp}:${index}`;
  return `msg:${role}:${index}`;
}
