import { html, nothing } from "lit";

import type { GatewayBrowserClient, GatewayHelloOk } from "./gateway";
import type { AppViewState } from "./app-view-state";
import { parseAgentSessionKey } from "../lib/session-key.js";
import {
  TAB_GROUPS,
  getTabGroupLabel,
  iconForTab,
  pathForTab,
  subtitleForTab,
  titleForTab,
  type Tab,
} from "./navigation";
import { icons } from "./icons";
import type { UiSettings } from "./storage";
import type { ThemeMode } from "./theme";
import { t } from "./i18n";
import type { ThemeTransitionContext } from "./theme-transition";
import type {
  ConfigSnapshot,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  LogLevel,
  PresenceEntry,
  ChannelsStatusSnapshot,
  SessionsListResult,
  SkillStatusReport,
  StatusSummary,
} from "./types";
import type { ChatQueueItem, CronFormState } from "./ui-types";
import { refreshChatAvatar } from "./app-chat";
import { renderChat } from "./views/chat";
import { renderOverview } from "./views/overview";
import { renderExecApprovalPrompt } from "./views/exec-approval";
import { renderGatewayUrlConfirmation } from "./views/gateway-url-confirmation";
import { renderCommandPalette } from "./views/command-palette";
import {
  approveDevicePairing,
  loadDevices,
  rejectDevicePairing,
  revokeDeviceToken,
  rotateDeviceToken,
} from "./controllers/devices";
import { lazyView } from "./lazy-view";
import { renderChatControls, renderNavStatus, renderTab, renderThemeToggle } from "./app-render.helpers";
import { loadChannels } from "./controllers/channels";
import { toggleVoiceInput, stopTts, type VoiceHostCallbacks } from "./controllers/voice";
import { loadPresence } from "./controllers/presence";
import { deleteSession, loadSessions, patchSession } from "./controllers/sessions";
import {
  installSkill,
  loadSkills,
  loadCatalog,
  getFilteredCatalog,
  setSkillsSearch,
  setSkillsFilterKind,
  toggleCatalogSkill,
  openSkillSettings,
  closeSkillSettings,
  updateSettingsField,
  updateSettingsEnvVar,
  addSettingsEnvVar,
  removeSettingsEnvVar,
  saveSkillSettings,
  saveSkillApiKey,
  updateSkillEdit,
  updateSkillEnabled,
  type SkillMessage,
} from "./controllers/skills";
import {
  loadMemory,
  searchMemory,
  updateMemory,
  deleteMemory,
  extractMemory,
} from "./controllers/memory";
import { loadNodes } from "./controllers/nodes";
import { loadChatHistory } from "./controllers/chat";
import {
  createTab,
  removeTab,
  switchTab,
  renameTab,
  pinTab,
  unpinTab,
  getPinnedTabs,
  isSplitActive,
  serializeTabsForStorage,
  type AgentPreset,
} from "./controllers/agent-tabs";
import {
  applyConfig,
  loadConfig,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
  removeConfigFormValue,
} from "./controllers/config";
import {
  loadExecApprovals,
  removeExecApprovalsFormValue,
  saveExecApprovals,
  updateExecApprovalsFormValue,
} from "./controllers/exec-approvals";
import {
  loadCronRuns,
  toggleCronJob,
  runCronJob,
  removeCronJob,
  addCronJob,
} from "./controllers/cron";
import { loadDebug, callDebugMethod } from "./controllers/debug";
import { loadLogs } from "./controllers/logs";
import {
  loadProjects,
  scanProject,
} from "./controllers/projects";
import {
  loadEldercare,
  EMPTY_SUMMARY,
  EMPTY_ROOM,
} from "./controllers/eldercare";
import type { EldercareConfigSection } from "./views/eldercare-config";
import {
  deployProject,
  loadDeployHistory,
  loadPreviews,
  createPreview,
  deletePreview,
  promotePreview,
} from "./controllers/deploys";
import { renderConnectionBanner } from "./components/connection-banner";
import { renderSetupGuide, type SetupGuideState } from "./views/setup-guide";
import { type ConnectionState } from "./connection/connection-manager";

const AVATAR_DATA_RE = /^data:/i;
const AVATAR_HTTP_RE = /^https?:\/\//i;

function resolveAssistantAvatarUrl(state: AppViewState): string | undefined {
  const list = state.agentsList?.agents ?? [];
  const parsed = parseAgentSessionKey(state.sessionKey);
  const agentId = parsed?.agentId ?? state.agentsList?.defaultId ?? "main";
  const agent = list.find((entry) => entry.id === agentId);
  const identity = agent?.identity;
  const candidate = identity?.avatarUrl ?? identity?.avatar;
  if (!candidate) return undefined;
  if (AVATAR_DATA_RE.test(candidate) || AVATAR_HTTP_RE.test(candidate)) return candidate;
  return identity?.avatarUrl;
}

export function renderApp(state: AppViewState) {
  const presenceCount = state.presenceEntries.length;
  const sessionsCount = state.sessionsResult?.count ?? null;
  const cronNext = state.cronStatus?.nextWakeAtMs ?? null;
  const chatDisabledReason = state.connected ? null : t().chat.gatewayDisconnected;
  const isChat = state.tab === "chat";
  const chatFocus = isChat && (state.settings.chatFocusMode || state.onboarding);
  const showThinking = state.onboarding ? false : state.settings.chatShowThinking;
  const assistantAvatarUrl = resolveAssistantAvatarUrl(state);
  const chatAvatarUrl = state.chatAvatarUrl ?? assistantAvatarUrl ?? null;

  // Get connection and setup guide state with safe defaults
  const connectionState: ConnectionState = (state as unknown as { connectionState?: ConnectionState }).connectionState ?? { status: 'disconnected', retryCount: 0 };
  const setupGuideState: SetupGuideState = (state as unknown as { setupGuideState?: SetupGuideState }).setupGuideState ?? { isOpen: false, currentStep: 0, gatewayRunning: false, checkingGateway: false, copiedCommand: null };
  const appState = state as unknown as {
    showSetupGuide?: () => void;
    retryConnection?: () => void;
    hideSetupGuide?: () => void;
    checkGateway?: () => void;
    connectFromGuide?: () => void;
    setupGuideNextStep?: () => void;
    setupGuidePrevStep?: () => void;
    copyCommand?: (cmd: string) => void;
  };

  const hasSplitPanel = isChat && state.sidebarOpen;
  return html`
    <div class="shell ${isChat ? "shell--chat" : ""} ${chatFocus ? "shell--chat-focus" : ""} ${state.settings.navCollapsed ? "shell--nav-collapsed" : ""} ${state.onboarding ? "shell--onboarding" : ""} ${hasSplitPanel ? "shell--split-panel" : ""}">
      ${renderConnectionBanner(
        connectionState,
        () => appState.retryConnection?.(),
        () => appState.showSetupGuide?.()
      )}
      <header class="topbar">
        <div class="topbar-left">
          <div class="brand">
            <img class="brand-icon" src="/logo.png" alt="BỜM" />
            <div class="brand-text">
              <div class="brand-title">BỜM</div>
              <div class="brand-sub">OPEN<span class="brand-claw">CLAW</span></div>
            </div>
          </div>
        </div>
        <div class="topbar-status">
          ${renderThemeToggle(state)}
        </div>
      </header>
      <aside class="nav ${state.settings.navCollapsed ? "nav--collapsed" : ""}">
        ${TAB_GROUPS.map((group, groupIndex) => {
          const isGroupCollapsed = state.settings.navGroupsCollapsed[group.label] ?? false;
          const hasActiveTab = group.tabs.some((tab) => tab === state.tab);
          const isFirstGroup = groupIndex === 0;
          return html`
            <div class="nav-group ${isGroupCollapsed && !hasActiveTab ? "nav-group--collapsed" : ""} ${isFirstGroup ? "nav-group--first" : ""}">
              <div class="nav-label-row">
                <button
                  class="nav-label"
                  @click=${() => {
                    const next = { ...state.settings.navGroupsCollapsed };
                    next[group.label] = !isGroupCollapsed;
                    state.applySettings({
                      ...state.settings,
                      navGroupsCollapsed: next,
                    });
                  }}
                  aria-expanded=${!isGroupCollapsed}
                >
                  <span class="nav-label__text">${getTabGroupLabel(group)}</span>
                </button>
                ${isFirstGroup
                  ? html`<button
                      class="nav-sidebar-toggle"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        const wantExpand = state.settings.navCollapsed || hasSplitPanel;
                        if (wantExpand && hasSplitPanel) {
                          // Close split panel first to allow nav to expand
                          state.handleCloseSidebar();
                        }
                        state.applySettings({
                          ...state.settings,
                          navCollapsed: !wantExpand,
                        });
                      }}
                      title="${(state.settings.navCollapsed || hasSplitPanel) ? t().sidebar.expand : t().sidebar.collapse}"
                      aria-label="${(state.settings.navCollapsed || hasSplitPanel) ? t().sidebar.expand : t().sidebar.collapse}"
                    >
                      ${(state.settings.navCollapsed || hasSplitPanel) ? icons.chevronRight : icons.chevronLeft}
                    </button>`
                  : ""}
              </div>
              <div class="nav-group__items">
                ${group.tabs.map((tab) => renderTab(state, tab))}
              </div>
            </div>
          `;
        })}
        ${renderNavStatus(state.connected)}
      </aside>
      <main class="content ${isChat ? "content--chat" : ""}">
        <section class="content-header">
          <div>
            <div class="page-title">${titleForTab(state.tab)}</div>
            ${!isChat ? html`<div class="page-sub">${subtitleForTab(state.tab)}</div>` : nothing}
          </div>
          <div class="page-meta">
            ${state.lastError ? html`<div class="pill danger">${state.lastError}</div>` : nothing}
            ${isChat ? renderChatControls(state) : nothing}
          </div>
        </section>

        ${
          state.tab === "overview"
            ? renderOverview({
                connected: state.connected,
                hello: state.hello,
                settings: state.settings,
                password: state.password,
                lastError: state.lastError,
                presenceCount,
                sessionsCount,
                cronEnabled: state.cronStatus?.enabled ?? null,
                cronNext,
                lastChannelsRefresh: state.channelsLastSuccess,
                onSettingsChange: (next) => state.applySettings(next),
                onPasswordChange: (next) => (state.password = next),
                onSessionKeyChange: (next) => {
                  state.sessionKey = next;
                  state.chatMessage = "";
                  state.resetToolStream();
                  state.applySettings({
                    ...state.settings,
                    sessionKey: next,
                    lastActiveSessionKey: next,
                  });
                  void state.loadAssistantIdentity();
                },
                onConnect: () => state.connect(),
                onRefresh: () => {
                  if (!state.connected) {
                    state.connect();
                  } else {
                    state.loadOverview();
                  }
                },
              })
            : nothing
        }

        ${
          state.tab === "channels"
            ? lazyView("channels", () => import("./views/channels"), (m) => m.renderChannels({
                connected: state.connected,
                loading: state.channelsLoading,
                snapshot: state.channelsSnapshot,
                lastError: state.channelsError,
                lastSuccessAt: state.channelsLastSuccess,
                whatsappMessage: state.whatsappLoginMessage,
                whatsappQrDataUrl: state.whatsappLoginQrDataUrl,
                whatsappConnected: state.whatsappLoginConnected,
                whatsappBusy: state.whatsappBusy,
                configSchema: state.configSchema,
                configSchemaLoading: state.configSchemaLoading,
                configForm: state.configForm,
                configUiHints: state.configUiHints,
                configSaving: state.configSaving,
                configFormDirty: state.configFormDirty,
                nostrProfileFormState: state.nostrProfileFormState,
                nostrProfileAccountId: state.nostrProfileAccountId,
                onRefresh: (probe) => loadChannels(state, probe),
                onWhatsAppStart: (force) => state.handleWhatsAppStart(force),
                onWhatsAppWait: () => state.handleWhatsAppWait(),
                onWhatsAppLogout: () => state.handleWhatsAppLogout(),
                onConfigPatch: (path, value) => updateConfigFormValue(state, path, value),
                onConfigSave: () => state.handleChannelConfigSave(),
                onConfigReload: () => state.handleChannelConfigReload(),
                onNostrProfileEdit: (accountId, profile) =>
                  state.handleNostrProfileEdit(accountId, profile),
                onNostrProfileCancel: () => state.handleNostrProfileCancel(),
                onNostrProfileFieldChange: (field, value) =>
                  state.handleNostrProfileFieldChange(field, value),
                onNostrProfileSave: () => state.handleNostrProfileSave(),
                onNostrProfileImport: () => state.handleNostrProfileImport(),
                onNostrProfileToggleAdvanced: () => state.handleNostrProfileToggleAdvanced(),
              }))
            : nothing
        }

        ${
          state.tab === "instances"
            ? lazyView("instances", () => import("./views/instances"), (m) => m.renderInstances({
                loading: state.presenceLoading,
                entries: state.presenceEntries,
                lastError: state.presenceError,
                statusMessage: state.presenceStatus,
                onRefresh: () => loadPresence(state),
              }))
            : nothing
        }

        ${
          state.tab === "sessions"
            ? lazyView("sessions", () => import("./views/sessions"), (m) => m.renderSessions({
                loading: state.sessionsLoading,
                result: state.sessionsResult,
                error: state.sessionsError,
                activeMinutes: state.sessionsFilterActive,
                limit: state.sessionsFilterLimit,
                includeGlobal: state.sessionsIncludeGlobal,
                includeUnknown: state.sessionsIncludeUnknown,
                basePath: state.basePath,
                viewMode: state.settings.sessionsViewMode,
                currentSessionKey: state.sessionKey,
                onFiltersChange: (next) => {
                  state.sessionsFilterActive = next.activeMinutes;
                  state.sessionsFilterLimit = next.limit;
                  state.sessionsIncludeGlobal = next.includeGlobal;
                  state.sessionsIncludeUnknown = next.includeUnknown;
                },
                onRefresh: () => loadSessions(state),
                onViewModeChange: (mode) => {
                  state.applySettings({
                    ...state.settings,
                    sessionsViewMode: mode,
                  });
                },
                onResume: (key) => {
                  state.sessionKey = key;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatStream = null;
                  state.chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
                  state.resetToolStream();
                  state.resetChatScroll();
                  state.applySettings({
                    ...state.settings,
                    sessionKey: key,
                    lastActiveSessionKey: key,
                  });
                  state.tab = "chat";
                  void state.loadAssistantIdentity();
                  void loadChatHistory(state);
                  void refreshChatAvatar(state);
                },
                onPatch: (key, patch) => patchSession(state, key, patch),
                onDelete: (key) => deleteSession(state, key),
              }))
            : nothing
        }

        ${
          state.tab === "memory"
            ? lazyView("memory", () => import("./views/memory-view"), (m) => m.renderMemory({
                loading: state.memoryLoading,
                facts: state.memoryFacts,
                error: state.memoryError,
                filter: state.memoryFilter,
                search: state.memorySearch,
                editingId: state.memoryEditingId,
                editDraft: state.memoryEditDraft,
                extracting: state.memoryExtracting,
                extractStatus: state.memoryExtractStatus,
                sessionKey: state.sessionKey,
                connected: state.connected,
                onRefresh: () => loadMemory(state),
                onSearch: (keyword) => {
                  state.memorySearch = keyword;
                  searchMemory(state, keyword);
                },
                onFilterChange: (cat) => (state.memoryFilter = cat),
                onEdit: (id) => {
                  const fact = state.memoryFacts.find((f) => f.id === id);
                  state.memoryEditingId = id;
                  state.memoryEditDraft = fact?.content ?? "";
                },
                onEditDraftChange: (draft) => (state.memoryEditDraft = draft),
                onSave: (id, content) => {
                  updateMemory(state, id, { content });
                  state.memoryEditingId = null;
                  state.memoryEditDraft = "";
                },
                onCancel: () => {
                  state.memoryEditingId = null;
                  state.memoryEditDraft = "";
                },
                onDelete: (id) => deleteMemory(state, id),
                onVerify: (id, verified) => updateMemory(state, id, { verified }),
                onExtract: (sessionKey) => extractMemory(state, sessionKey),
              }))
            : nothing
        }

        ${
          state.tab === "cron"
            ? lazyView("cron", () => import("./views/cron"), (m) => m.renderCron({
                loading: state.cronLoading,
                status: state.cronStatus,
                jobs: state.cronJobs,
                error: state.cronError,
                busy: state.cronBusy,
                form: state.cronForm,
                channels: state.channelsSnapshot?.channelMeta?.length
                  ? state.channelsSnapshot.channelMeta.map((entry) => entry.id)
                  : (state.channelsSnapshot?.channelOrder ?? []),
                channelLabels: state.channelsSnapshot?.channelLabels ?? {},
                channelMeta: state.channelsSnapshot?.channelMeta ?? [],
                runsJobId: state.cronRunsJobId,
                runs: state.cronRuns,
                onFormChange: (patch) => (state.cronForm = { ...state.cronForm, ...patch }),
                onRefresh: () => state.loadCron(),
                onAdd: () => addCronJob(state),
                onToggle: (job, enabled) => toggleCronJob(state, job, enabled),
                onRun: (job) => runCronJob(state, job),
                onRemove: (job) => removeCronJob(state, job),
                onLoadRuns: (jobId) => loadCronRuns(state, jobId),
              }))
            : nothing
        }

        ${
          state.tab === "skills"
            ? lazyView("skills", () => import("./views/skills"), (m) => m.renderSkills({
                loading: state.skillsLoading,
                report: state.skillsReport,
                error: state.skillsError,
                filter: state.skillsFilter,
                edits: state.skillEdits,
                messages: state.skillMessages,
                busyKey: state.skillsBusyKey,
                onFilterChange: (next) => (state.skillsFilter = next),
                onRefresh: () => loadSkills(state, { clearMessages: true }),
                onToggle: (key, enabled) => updateSkillEnabled(state, key, enabled),
                onEdit: (key, value) => updateSkillEdit(state, key, value),
                onSaveKey: (key) => saveSkillApiKey(state, key),
                onInstall: (skillKey, name, installId) =>
                  installSkill(state, skillKey, name, installId),
                // Catalog props
                catalog: getFilteredCatalog(state),
                catalogLoading: state.skillsCatalogLoading,
                catalogError: state.skillsCatalogError,
                filterKind: state.skillsFilterKind,
                search: state.skillsSearch,
                onSearch: (keyword) => setSkillsSearch(state, keyword),
                onFilterKindChange: (kind) => setSkillsFilterKind(state, kind),
                onCatalogRefresh: () => loadCatalog(state),
                onCatalogToggle: (skillId, enabled) => toggleCatalogSkill(state, skillId, enabled),
                onCatalogSettings: (skillId) => openSkillSettings(state, skillId),
                onCatalogInstall: (skillId) => {
                  // Use skills.update to enable a not-installed plugin
                  toggleCatalogSkill(state, skillId, true);
                },
                // Settings panel
                settingsPanel: {
                  open: state.skillsSettingsOpen,
                  skillId: state.skillsSettingsSkillId,
                  skill: state.skillsCatalog.find((s) => s.id === state.skillsSettingsSkillId) ?? null,
                  schema: state.skillsSettingsSchema,
                  uiHints: state.skillsSettingsUiHints,
                  currentConfig: state.skillsSettingsCurrentConfig,
                  loading: state.skillsSettingsLoading,
                  saving: state.skillsSettingsSaving,
                  formValues: state.skillsSettingsFormValues,
                  envVars: state.skillsSettingsEnvVars,
                  onFieldChange: (field, value) => updateSettingsField(state, field, value),
                  onEnvChange: (index, key, value) => updateSettingsEnvVar(state, index, key, value),
                  onEnvAdd: () => addSettingsEnvVar(state),
                  onEnvRemove: (index) => removeSettingsEnvVar(state, index),
                  onSave: () => saveSkillSettings(state),
                  onClose: () => closeSkillSettings(state),
                },
              }))
            : nothing
        }

        ${
          state.tab === "nodes"
            ? lazyView("nodes", () => import("./views/nodes"), (m) => m.renderNodes({
                loading: state.nodesLoading,
                nodes: state.nodes,
                devicesLoading: state.devicesLoading,
                devicesError: state.devicesError,
                devicesList: state.devicesList,
                configForm:
                  state.configForm ??
                  (state.configSnapshot?.config as Record<string, unknown> | null),
                configLoading: state.configLoading,
                configSaving: state.configSaving,
                configDirty: state.configFormDirty,
                configFormMode: state.configFormMode,
                execApprovalsLoading: state.execApprovalsLoading,
                execApprovalsSaving: state.execApprovalsSaving,
                execApprovalsDirty: state.execApprovalsDirty,
                execApprovalsSnapshot: state.execApprovalsSnapshot,
                execApprovalsForm: state.execApprovalsForm,
                execApprovalsSelectedAgent: state.execApprovalsSelectedAgent,
                execApprovalsTarget: state.execApprovalsTarget,
                execApprovalsTargetNodeId: state.execApprovalsTargetNodeId,
                onRefresh: () => loadNodes(state),
                onDevicesRefresh: () => loadDevices(state),
                onDeviceApprove: (requestId) => approveDevicePairing(state, requestId),
                onDeviceReject: (requestId) => rejectDevicePairing(state, requestId),
                onDeviceRotate: (deviceId, role, scopes) =>
                  rotateDeviceToken(state, { deviceId, role, scopes }),
                onDeviceRevoke: (deviceId, role) => revokeDeviceToken(state, { deviceId, role }),
                onLoadConfig: () => loadConfig(state),
                onLoadExecApprovals: () => {
                  const target =
                    state.execApprovalsTarget === "node" && state.execApprovalsTargetNodeId
                      ? { kind: "node" as const, nodeId: state.execApprovalsTargetNodeId }
                      : { kind: "gateway" as const };
                  return loadExecApprovals(state, target);
                },
                onBindDefault: (nodeId) => {
                  if (nodeId) {
                    updateConfigFormValue(state, ["tools", "exec", "node"], nodeId);
                  } else {
                    removeConfigFormValue(state, ["tools", "exec", "node"]);
                  }
                },
                onBindAgent: (agentIndex, nodeId) => {
                  const basePath = ["agents", "list", agentIndex, "tools", "exec", "node"];
                  if (nodeId) {
                    updateConfigFormValue(state, basePath, nodeId);
                  } else {
                    removeConfigFormValue(state, basePath);
                  }
                },
                onSaveBindings: () => saveConfig(state),
                onExecApprovalsTargetChange: (kind, nodeId) => {
                  state.execApprovalsTarget = kind;
                  state.execApprovalsTargetNodeId = nodeId;
                  state.execApprovalsSnapshot = null;
                  state.execApprovalsForm = null;
                  state.execApprovalsDirty = false;
                  state.execApprovalsSelectedAgent = null;
                },
                onExecApprovalsSelectAgent: (agentId) => {
                  state.execApprovalsSelectedAgent = agentId;
                },
                onExecApprovalsPatch: (path, value) =>
                  updateExecApprovalsFormValue(state, path, value),
                onExecApprovalsRemove: (path) => removeExecApprovalsFormValue(state, path),
                onSaveExecApprovals: () => {
                  const target =
                    state.execApprovalsTarget === "node" && state.execApprovalsTargetNodeId
                      ? { kind: "node" as const, nodeId: state.execApprovalsTargetNodeId }
                      : { kind: "gateway" as const };
                  return saveExecApprovals(state, target);
                },
              }))
            : nothing
        }

        ${
          state.tab === "chat"
            ? renderChat({
                sessionKey: state.sessionKey,
                onSessionKeyChange: (next) => {
                  state.sessionKey = next;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatStream = null;
                  state.chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
                  state.resetToolStream();
                  state.resetChatScroll();
                  state.applySettings({
                    ...state.settings,
                    sessionKey: next,
                    lastActiveSessionKey: next,
                  });
                  void state.loadAssistantIdentity();
                  void loadChatHistory(state);
                  void refreshChatAvatar(state);
                },
                thinkingLevel: state.chatThinkingLevel,
                showThinking,
                loading: state.chatLoading,
                sending: state.chatSending,
                compactionStatus: state.compactionStatus,
                assistantAvatarUrl: chatAvatarUrl,
                messages: state.chatMessages,
                toolMessages: state.chatToolMessages,
                stream: state.chatStream,
                streamStartedAt: state.chatStreamStartedAt,
                draft: state.chatMessage,
                queue: state.chatQueue,
                connected: state.connected,
                canSend: state.connected,
                disabledReason: chatDisabledReason,
                error: state.lastError,
                sessions: state.sessionsResult,
                focusMode: chatFocus,
                onRefresh: () => {
                  state.resetToolStream();
                  return Promise.all([loadChatHistory(state), refreshChatAvatar(state)]);
                },
                onToggleFocusMode: () => {
                  if (state.onboarding) return;
                  state.applySettings({
                    ...state.settings,
                    chatFocusMode: !state.settings.chatFocusMode,
                  });
                },
                onChatScroll: (event) => state.handleChatScroll(event),
                onDraftChange: (next) => (state.chatMessage = next),
                attachments: state.chatAttachments,
                onAttachmentsChange: (next) => (state.chatAttachments = next),
                quickActions: [
                  { id: 'build', label: 'Build app', icon: 'zap' as const, prompt: '/build' },
                  { id: 'code', label: 'Write code', icon: 'code' as const, prompt: '' },
                  { id: 'write', label: 'Write text', icon: 'penLine' as const, prompt: '' },
                  { id: 'create', label: 'Create', icon: 'sparkles' as const, prompt: '' },
                  { id: 'learn', label: 'Learn', icon: 'graduationCap' as const, prompt: '' },
                  { id: 'analyze', label: 'Analyze', icon: 'brain' as const, prompt: '' },
                ],
                onQuickAction: (action) => {
                  if (action.prompt?.startsWith('/')) {
                    state.handleSendChat(action.prompt);
                  } else {
                    state.chatMessage = action.prompt || action.label;
                  }
                },
                onSend: () => state.handleSendChat(),
                canAbort: Boolean(state.chatRunId),
                onAbort: () => void state.handleAbortChat(),
                onQueueRemove: (id) => state.removeQueuedMessage(id),
                onNewSession: () => state.handleSendChat("/new", { restoreDraft: true }),
                // Sidebar props for tool output viewing
                sidebarOpen: state.sidebarOpen,
                sidebarContent: state.sidebarContent,
                sidebarError: state.sidebarError,
                splitRatio: state.splitRatio,
                onOpenSidebar: (content: string) => state.handleOpenSidebar(content),
                onCloseSidebar: () => state.handleCloseSidebar(),
                onSplitRatioChange: (ratio: number) => state.handleSplitRatioChange(ratio),
                assistantName: state.assistantName,
                assistantAvatar: state.assistantAvatar,
                // Model selector props
                showModelSelector: state.chatModelSelectorOpen,
                currentModel: state.chatCurrentModel,
                selectedProvider: state.chatSelectedProvider,
                apiKeys: state.chatApiKeys,
                apiKeySaveStatus: state.chatApiKeySaveStatus,
                apiKeyInputOpen: state.chatApiKeyInputOpen,
                onToggleModelSelector: () => {
                  state.chatModelSelectorOpen = !state.chatModelSelectorOpen;
                },
                onSelectProvider: (provider: string) => {
                  state.chatSelectedProvider = provider;
                },
                onModelChange: async (provider: string, modelName: string) => {
                  // Update UI immediately
                  const modelLabels: Record<string, string> = {
                    'claude-opus-4-5-20250514': 'Opus 4.5',
                    'claude-sonnet-4-20250514': 'Sonnet 4',
                    'claude-3-5-haiku-20241022': 'Haiku 3.5',
                    'gpt-4o': 'GPT-4o',
                    'gpt-4-turbo': 'GPT-4 Turbo',
                    'gpt-4': 'GPT-4',
                    'gpt-3.5-turbo': 'GPT-3.5',
                    'gemini-2.0-flash': 'Gemini 2.0',
                    'gemini-1.5-pro': 'Gemini 1.5 Pro',
                    'gemini-1.5-flash': 'Gemini 1.5',
                  };
                  state.chatCurrentModel = modelLabels[modelName] || modelName;
                  state.chatSelectedProvider = provider;

                  // Call backend to actually change the model
                  if (state.client && state.connected) {
                    try {
                      await state.client.request("sessions.patch", {
                        key: state.sessionKey,
                        model: `${provider}:${modelName}`,
                      });
                    } catch (err) {
                      console.error("Failed to change model:", err);
                      state.lastError = `Failed to change model: ${err}`;
                    }
                  }
                },
                onToggleApiKeyInput: () => {
                  state.chatApiKeyInputOpen = !state.chatApiKeyInputOpen;
                },
                onApiKeyChange: (provider: string, key: string) => {
                  state.chatApiKeys = { ...state.chatApiKeys, [provider]: key };
                },
                // Voice input (STT via Web Speech API)
                isRecording: state.chatIsRecording,
                voiceSupported: (state as any).voiceSupported ?? false,
                voiceInterimTranscript: (state as any).voiceInterimTranscript ?? "",
                voiceMode: (state as any).voiceMode ?? "idle",
                ttsEnabled: (state as any).ttsEnabled ?? false,
                ttsSupported: (state as any).ttsSupported ?? false,
                onToggleVoice: () => {
                  // Cancel TTS when user starts speaking
                  stopTts();
                  const host: VoiceHostCallbacks = {
                    setMode: (mode) => {
                      state.chatIsRecording = mode === "listening";
                      (state as any).voiceMode = mode;
                    },
                    setInterimTranscript: (text) => {
                      (state as any).voiceInterimTranscript = text;
                    },
                    setDraft: (text) => {
                      state.chatMessage = text;
                    },
                    getDraft: () => state.chatMessage,
                    setError: (msg) => {
                      state.lastError = msg;
                    },
                    sendMessage: () => {
                      if (state.chatMessage.trim()) {
                        state.handleSendChat();
                      }
                    },
                  };
                  toggleVoiceInput(host);
                },
                onToggleTts: () => {
                  (state as any).ttsEnabled = !(state as any).ttsEnabled;
                  if (!(state as any).ttsEnabled) {
                    stopTts();
                    (state as any).voiceMode = "idle";
                  }
                },
                onSaveApiKey: async (provider: string, key: string) => {
                  state.chatApiKeys = { ...state.chatApiKeys, [provider]: key };
                  state.chatApiKeySaveStatus = 'saving';
                  try {
                    if (!state.client || !state.connected) {
                      throw new Error("gateway not connected");
                    }
                    await state.client.request("auth.profiles.set", { provider, key });
                    state.chatApiKeySaveStatus = 'saved';
                    setTimeout(() => { state.chatApiKeyInputOpen = false; }, 1500);
                  } catch (err) {
                    console.error("Failed to save API key:", err);
                    state.chatApiKeySaveStatus = 'error';
                    state.lastError = `Failed to save API key: ${err instanceof Error ? err.message : err}`;
                  }
                  setTimeout(() => { state.chatApiKeySaveStatus = 'idle'; }, 3000);
                },
                // Agent tabs props
                agentTabs: state.agentTabs,
                activeTabSessionKey: state.sessionKey,
                agentPresetPickerOpen: state.agentPresetPickerOpen,
                onTabSelect: (sessionKey: string) => {
                  if (sessionKey === state.sessionKey) return;
                  state.agentTabs = switchTab(state.agentTabs, sessionKey);
                  state.sessionKey = sessionKey;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatStream = null;
                  (state as any).chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
                  state.resetToolStream();
                  state.resetChatScroll();
                  state.applySettings({
                    ...state.settings,
                    sessionKey,
                    lastActiveSessionKey: sessionKey,
                    agentTabs: serializeTabsForStorage(state.agentTabs),
                  });
                  void state.loadAssistantIdentity();
                  void loadChatHistory(state);
                  void refreshChatAvatar(state);
                },
                onTabClose: (sessionKey: string) => {
                  if (!confirm(t().agentTabs.closeConfirm)) return;
                  const remaining = removeTab(state.agentTabs, sessionKey);
                  state.agentTabs = remaining;
                  // Switch to adjacent tab if closing the active one
                  if (sessionKey === state.sessionKey && remaining.length > 0) {
                    const next = remaining[0].sessionKey;
                    state.sessionKey = next;
                    state.chatMessage = "";
                    state.chatAttachments = [];
                    state.chatStream = null;
                    (state as any).chatStreamStartedAt = null;
                    state.chatRunId = null;
                    state.chatQueue = [];
                    state.resetToolStream();
                    state.resetChatScroll();
                    state.applySettings({
                      ...state.settings,
                      sessionKey: next,
                      lastActiveSessionKey: next,
                      agentTabs: serializeTabsForStorage(remaining),
                    });
                    void state.loadAssistantIdentity();
                    void loadChatHistory(state);
                    void refreshChatAvatar(state);
                  } else {
                    state.applySettings({
                      ...state.settings,
                      agentTabs: serializeTabsForStorage(remaining),
                    });
                  }
                },
                onTabRename: (sessionKey: string, label: string) => {
                  state.agentTabs = renameTab(state.agentTabs, sessionKey, label);
                  state.applySettings({
                    ...state.settings,
                    agentTabs: serializeTabsForStorage(state.agentTabs),
                  });
                  // Also patch the session label on the gateway
                  if (state.client && state.connected) {
                    void state.client.request("sessions.patch", { key: sessionKey, label });
                  }
                },
                onNewTab: () => {
                  state.agentPresetPickerOpen = !state.agentPresetPickerOpen;
                },
                onPresetSelect: (preset: AgentPreset) => {
                  const tab = createTab(preset);
                  state.agentTabs = [...state.agentTabs, tab];
                  state.agentPresetPickerOpen = false;
                  // Switch to the new tab
                  state.sessionKey = tab.sessionKey;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatStream = null;
                  (state as any).chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
                  state.resetToolStream();
                  state.resetChatScroll();
                  state.applySettings({
                    ...state.settings,
                    sessionKey: tab.sessionKey,
                    lastActiveSessionKey: tab.sessionKey,
                    agentTabs: serializeTabsForStorage(state.agentTabs),
                  });
                  void state.loadAssistantIdentity();
                  void loadChatHistory(state);
                  void refreshChatAvatar(state);
                },
                onPresetPickerClose: () => {
                  state.agentPresetPickerOpen = false;
                },
                // Split view props
                onTabPin: (sessionKey: string) => {
                  state.agentTabs = pinTab(state.agentTabs, sessionKey);
                  state.applySettings({
                    ...state.settings,
                    agentTabs: serializeTabsForStorage(state.agentTabs),
                  });
                },
                onTabUnpin: (sessionKey: string) => {
                  state.agentTabs = unpinTab(state.agentTabs, sessionKey);
                  state.applySettings({
                    ...state.settings,
                    agentTabs: serializeTabsForStorage(state.agentTabs),
                  });
                },
                splitActive: isSplitActive(state.agentTabs),
                splitViewRatio: state.splitRatio,
                focusedPane: state.focusedPane,
                pinnedTabs: getPinnedTabs(state.agentTabs),
                onSplitResize: (ratio: number) => {
                  state.splitRatio = ratio;
                },
                onPaneFocus: (pane: "left" | "right") => {
                  state.focusedPane = pane;
                  const pinned = getPinnedTabs(state.agentTabs);
                  const targetTab = pane === "left" ? pinned[0] : pinned[1];
                  if (targetTab && targetTab.sessionKey !== state.sessionKey) {
                    state.sessionKey = targetTab.sessionKey;
                    state.chatMessage = "";
                    state.chatAttachments = [];
                    void state.loadAssistantIdentity();
                    void loadChatHistory(state);
                    void refreshChatAvatar(state);
                  }
                },
                renderPaneChat: (sessionKey: string) => {
                  // Render chat thread for a given session (reuse existing chat render)
                  return html`<div class="chat-main" style="flex: 1 1 100%">
                    <div class="chat-body">
                      <div class="chat-body__messages" role="log" aria-live="polite">
                        <p class="chat-body__placeholder">${sessionKey}</p>
                      </div>
                    </div>
                  </div>`;
                },
              })
            : nothing
        }

        ${
          state.tab === "config"
            ? lazyView("config", () => import("./views/config"), (m) => m.renderConfig({
                raw: state.configRaw,
                originalRaw: state.configRawOriginal,
                valid: state.configValid,
                issues: state.configIssues,
                loading: state.configLoading,
                saving: state.configSaving,
                applying: state.configApplying,
                updating: state.updateRunning,
                connected: state.connected,
                schema: state.configSchema,
                schemaLoading: state.configSchemaLoading,
                uiHints: state.configUiHints,
                formMode: state.configFormMode,
                formValue: state.configForm,
                originalValue: state.configFormOriginal,
                searchQuery: state.configSearchQuery,
                activeSection: state.configActiveSection,
                activeSubsection: state.configActiveSubsection,
                onRawChange: (next) => {
                  state.configRaw = next;
                },
                onFormModeChange: (mode) => (state.configFormMode = mode),
                onFormPatch: (path, value) => updateConfigFormValue(state, path, value),
                onSearchChange: (query) => (state.configSearchQuery = query),
                onSectionChange: (section) => {
                  state.configActiveSection = section;
                  state.configActiveSubsection = null;
                },
                onSubsectionChange: (section) => (state.configActiveSubsection = section),
                onReload: () => loadConfig(state),
                onSave: () => saveConfig(state),
                onApply: () => applyConfig(state),
                onUpdate: () => runUpdate(state),
              }))
            : nothing
        }

        ${
          state.tab === "debug"
            ? lazyView("debug", () => import("./views/debug"), (m) => m.renderDebug({
                loading: state.debugLoading,
                status: state.debugStatus,
                health: state.debugHealth,
                models: state.debugModels,
                heartbeat: state.debugHeartbeat,
                eventLog: state.eventLog,
                callMethod: state.debugCallMethod,
                callParams: state.debugCallParams,
                callResult: state.debugCallResult,
                callError: state.debugCallError,
                onCallMethodChange: (next) => (state.debugCallMethod = next),
                onCallParamsChange: (next) => (state.debugCallParams = next),
                onRefresh: () => loadDebug(state),
                onCall: () => callDebugMethod(state),
              }))
            : nothing
        }

        ${
          state.tab === "logs"
            ? lazyView("logs", () => import("./views/logs"), (m) => m.renderLogs({
                loading: state.logsLoading,
                error: state.logsError,
                file: state.logsFile,
                entries: state.logsEntries,
                filterText: state.logsFilterText,
                levelFilters: state.logsLevelFilters,
                autoFollow: state.logsAutoFollow,
                truncated: state.logsTruncated,
                onFilterTextChange: (next) => (state.logsFilterText = next),
                onLevelToggle: (level, enabled) => {
                  state.logsLevelFilters = { ...state.logsLevelFilters, [level]: enabled };
                },
                onToggleAutoFollow: (next) => (state.logsAutoFollow = next),
                onRefresh: () => loadLogs(state, { reset: true }),
                onExport: (lines, label) => state.exportLogs(lines, label),
                onScroll: (event) => state.handleLogsScroll(event),
              }))
            : nothing
        }

        ${
          state.tab === "projects"
            ? lazyView("projects", () => import("./views/projects-view"), (m) => m.renderProjects({
                loading: state.projectsLoading,
                projects: state.projectsList,
                error: state.projectsError,
                scanning: state.projectsScanning,
                scanStatus: state.projectsScanStatus,
                connected: state.connected,
                onRefresh: () => loadProjects(state),
                onScan: (projectId) => scanProject(state, projectId),
              }))
            : nothing
        }

        ${
          state.tab === "deploy"
            ? lazyView("deploy", () => import("./views/deploy-view"), (m) => m.renderDeploy({
                loading: state.deployLoading,
                history: state.deployHistory,
                error: state.deployError,
                connected: state.connected,
                projects: state.projectsList,
                selectedProject: state.deploySelectedProject,
                selectedPlatform: state.deploySelectedPlatform,
                selectedTarget: state.deploySelectedTarget,
                selectedBranch: state.deploySelectedBranch,
                running: state.deployRunning,
                status: state.deployStatus,
                logLines: state.deployLogLines,
                onRefresh: () => loadDeployHistory(state),
                onDeploy: () => deployProject(state),
                onProjectChange: (id) => (state.deploySelectedProject = id),
                onPlatformChange: (p) => (state.deploySelectedPlatform = p),
                onTargetChange: (t) => (state.deploySelectedTarget = t),
                onBranchChange: (b) => (state.deploySelectedBranch = b),
                onCopyLog: () => {
                  navigator.clipboard.writeText(state.deployLogLines.join("\n")).catch(() => {});
                },
              }))
            : nothing
        }

        ${
          state.tab === "preview"
            ? lazyView("preview", () => import("./views/preview-view"), (m) => m.renderPreview({
                loading: state.previewLoading,
                previews: state.previewList,
                error: state.previewError,
                connected: state.connected,
                projects: state.projectsList,
                creating: state.previewCreating,
                deleting: state.previewDeleting,
                promoting: state.previewPromoting,
                selectedProject: state.previewSelectedProject,
                branch: state.previewBranch,
                iframeUrl: state.previewIframeUrl,
                onRefresh: () => loadPreviews(state),
                onCreate: () => createPreview(state),
                onDelete: (id) => deletePreview(state, id),
                onPromote: (id) => promotePreview(state, id),
                onProjectChange: (id) => (state.previewSelectedProject = id),
                onBranchChange: (b) => (state.previewBranch = b),
                onOpenPreview: (url) => (state.previewIframeUrl = url),
                onCopyUrl: (url) => {
                  navigator.clipboard.writeText(url).catch(() => {});
                },
              }))
            : nothing
        }

        ${
          state.tab === "eldercare"
            ? lazyView("eldercare", () => import("./views/eldercare-dashboard"), (m) => m.renderEldercareDashboard({
                connected: state.connected,
                loading: state.eldercareLoading,
                error: state.eldercareError,
                haConnected: state.eldercareHaConnected,
                room: state.eldercareRoom,
                summary: state.eldercareSummary,
                lastCheck: state.eldercareLastCheck,
                sosActive: state.eldercareSosActive,
                onRefresh: () => loadEldercare(state),
              }))
            : nothing
        }

        ${
          state.tab === "eldercare-config"
            ? lazyView("eldercare-config", () => import("./views/eldercare-config"), (m) => m.renderEldercareConfig({
                connected: state.connected,
                loading: state.eldercareConfigLoading,
                saving: state.eldercareConfigSaving,
                error: state.eldercareConfigError,
                activeSection: state.eldercareConfigSection,
                monitorConfig: state.eldercareMonitorConfig,
                sosContacts: state.eldercareSosContacts,
                companionConfig: state.eldercareCompanionConfig,
                videocallConfig: state.eldercareVideocallConfig,
                haEntities: state.eldercareHaEntities,
                onSave: () => void state.handleEldercareSaveConfig(),
                onRefresh: () => void state.handleEldercareLoadConfig(),
                onSectionChange: (section: EldercareConfigSection) => {
                  state.eldercareConfigSection = section;
                },
                onConfigChange: (section: string, path: string[], value: unknown) => {
                  state.handleEldercareConfigChange(section, path, value);
                },
              }))
            : nothing
        }
      </main>
      ${renderExecApprovalPrompt(state)}
      ${renderGatewayUrlConfirmation(state)}
      ${renderCommandPalette({
        state: {
          isOpen: state.commandPaletteOpen,
          query: state.commandPaletteQuery,
          selectedIndex: state.commandPaletteSelectedIndex,
        },
        connected: state.connected,
        currentTab: state.tab,
        onClose: () => {
          state.commandPaletteOpen = false;
        },
        onQueryChange: (query) => {
          state.commandPaletteQuery = query;
          state.commandPaletteSelectedIndex = 0;
        },
        onSelectIndex: (index) => {
          state.commandPaletteSelectedIndex = index;
        },
        onNavigate: (tab) => {
          state.setTab(tab);
        },
        onNewChat: () => {
          state.handleSendChat("/new", { restoreDraft: true });
        },
        onToggleSidebar: () => {
          state.applySettings({
            ...state.settings,
            navCollapsed: !state.settings.navCollapsed,
          });
        },
        onRefresh: () => {
          state.loadOverview();
        },
      })}
      ${renderSetupGuide(setupGuideState, {
        onClose: () => appState.hideSetupGuide?.(),
        onCheckGateway: () => appState.checkGateway?.(),
        onConnect: () => appState.connectFromGuide?.(),
        onNextStep: () => appState.setupGuideNextStep?.(),
        onPrevStep: () => appState.setupGuidePrevStep?.(),
        onCopyCommand: (cmd) => appState.copyCommand?.(cmd),
      })}
    </div>
  `;
}
