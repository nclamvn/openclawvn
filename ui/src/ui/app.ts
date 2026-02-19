import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { GatewayBrowserClient, GatewayHelloOk } from "./gateway";
import { resolveInjectedAssistantIdentity } from "./assistant-identity";
import { loadSettings, type UiSettings } from "./storage";
import { renderApp } from "./app-render";
import type { Tab } from "./navigation";
import type { ResolvedTheme, ThemeMode } from "./theme";
import type {
  AgentsListResult,
  ConfigSnapshot,
  ConfigUiHints,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  LogLevel,
  MemoryCategory,
  PresenceEntry,
  ChannelsStatusSnapshot,
  SessionsListResult,
  SkillCatalogEntry,
  SkillCatalogKind,
  SkillStatusReport,
  StatusSummary,
  NostrProfile,
  UserFact,
} from "./types";
import { type ChatAttachment, type ChatQueueItem, type CronFormState } from "./ui-types";
import type { EventLogEntry } from "./app-events";
import { DEFAULT_CRON_FORM, DEFAULT_LOG_LEVEL_FILTERS } from "./app-defaults";
import type { ExecApprovalsFile, ExecApprovalsSnapshot } from "./controllers/exec-approvals";
import type { DevicePairingList } from "./controllers/devices";
import type { ExecApprovalRequest } from "./controllers/exec-approval";
import {
  resetToolStream as resetToolStreamInternal,
  type ToolStreamEntry,
} from "./app-tool-stream";
import {
  exportLogs as exportLogsInternal,
  handleChatScroll as handleChatScrollInternal,
  handleLogsScroll as handleLogsScrollInternal,
  resetChatScroll as resetChatScrollInternal,
} from "./app-scroll";
import { connectGateway as connectGatewayInternal } from "./app-gateway";
import {
  handleConnected,
  handleDisconnected,
  handleFirstUpdated,
  handleUpdated,
} from "./app-lifecycle";
import {
  applySettings as applySettingsInternal,
  loadCron as loadCronInternal,
  loadOverview as loadOverviewInternal,
  setTab as setTabInternal,
  setTheme as setThemeInternal,
  onPopState as onPopStateInternal,
} from "./app-settings";
import {
  handleAbortChat as handleAbortChatInternal,
  handleSendChat as handleSendChatInternal,
  removeQueuedMessage as removeQueuedMessageInternal,
} from "./app-chat";
import {
  handleChannelConfigReload as handleChannelConfigReloadInternal,
  handleChannelConfigSave as handleChannelConfigSaveInternal,
  handleNostrProfileCancel as handleNostrProfileCancelInternal,
  handleNostrProfileEdit as handleNostrProfileEditInternal,
  handleNostrProfileFieldChange as handleNostrProfileFieldChangeInternal,
  handleNostrProfileImport as handleNostrProfileImportInternal,
  handleNostrProfileSave as handleNostrProfileSaveInternal,
  handleNostrProfileToggleAdvanced as handleNostrProfileToggleAdvancedInternal,
  handleWhatsAppLogout as handleWhatsAppLogoutInternal,
  handleWhatsAppStart as handleWhatsAppStartInternal,
  handleWhatsAppWait as handleWhatsAppWaitInternal,
} from "./app-channels";
import type { NostrProfileFormState } from "./views/channels.nostr-profile-form";
import { loadAssistantIdentity as loadAssistantIdentityInternal } from "./controllers/assistant-identity";
import { connectionManager, type ConnectionState } from "./connection/connection-manager";
import { loadMemory as loadMemoryInternal } from "./controllers/memory";
import { type SetupGuideState, createSetupGuideState } from "./views/setup-guide";
import type { AgentTab } from "./controllers/agent-tabs";
import {
  loadProjects as loadProjectsInternal,
  scanProject as scanProjectInternal,
} from "./controllers/projects";
import {
  deployProject as deployProjectInternal,
  loadDeployHistory as loadDeployHistoryInternal,
  loadPreviews as loadPreviewsInternal,
  createPreview as createPreviewInternal,
  deletePreview as deletePreviewInternal,
  promotePreview as promotePreviewInternal,
  type ProjectInfo,
  type DeployRecord,
  type DeployPlatform,
  type DeployStatus,
  type PreviewRecord,
} from "./controllers/deploys";

declare global {
  interface Window {
    __OPENCLAW_CONTROL_UI_BASE_PATH__?: string;
  }
}

const injectedAssistantIdentity = resolveInjectedAssistantIdentity();

function resolveOnboardingMode(): boolean {
  if (!window.location.search) return false;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("onboarding");
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

@customElement("openclaw-app")
export class OpenClawApp extends LitElement {
  @state() settings: UiSettings = loadSettings();
  @state() password = "";
  @state() tab: Tab = "chat";
  @state() onboarding = resolveOnboardingMode();
  @state() connected = false;
  @state() theme: ThemeMode = this.settings.theme ?? "system";
  @state() themeResolved: ResolvedTheme = "dark";
  @state() hello: GatewayHelloOk | null = null;
  @state() lastError: string | null = null;
  @state() eventLog: EventLogEntry[] = [];
  private eventLogBuffer: EventLogEntry[] = [];
  private toolStreamSyncTimer: number | null = null;
  private sidebarCloseTimer: number | null = null;

  // Command palette state
  @state() commandPaletteOpen = false;
  @state() commandPaletteQuery = "";
  @state() commandPaletteSelectedIndex = 0;

  // Connection state
  @state() connectionState: ConnectionState = {
    status: 'disconnected',
    retryCount: 0,
  };
  @state() setupGuideState: SetupGuideState = createSetupGuideState();

  @state() assistantName = injectedAssistantIdentity.name;
  @state() assistantAvatar = injectedAssistantIdentity.avatar;
  @state() assistantAgentId = injectedAssistantIdentity.agentId ?? null;

  @state() sessionKey = this.settings.sessionKey;
  @state() chatLoading = false;
  @state() chatSending = false;
  @state() chatMessage = "";
  @state() chatMessages: unknown[] = [];
  @state() chatToolMessages: unknown[] = [];
  @state() chatStream: string | null = null;
  @state() chatStreamStartedAt: number | null = null;
  @state() chatRunId: string | null = null;
  @state() compactionStatus: import("./app-tool-stream").CompactionStatus | null = null;
  @state() chatAvatarUrl: string | null = null;
  @state() chatThinkingLevel: string | null = null;
  @state() chatQueue: ChatQueueItem[] = [];
  @state() chatAttachments: ChatAttachment[] = [];
  // Session switcher state
  @state() sessionSwitcherOpen = false;
  // Agent tabs state
  @state() agentTabs: AgentTab[] = this.settings.agentTabs ?? [];
  @state() agentPresetPickerOpen = false;
  // Split view state
  @state() focusedPane: "left" | "right" = "left";
  // Model selector state
  @state() chatModelSelectorOpen = false;
  @state() chatCurrentModel = "Opus 4.5";
  @state() chatSelectedProvider = "anthropic";
  @state() chatApiKeys: Record<string, string> = {};
  @state() chatApiKeyInputOpen = false;
  @state() chatApiKeySaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  // Voice state
  @state() chatIsRecording = false;
  @state() voiceInterimTranscript = "";
  @state() voiceSupported = false;
  @state() voiceMode: "idle" | "listening" | "speaking" = "idle";
  @state() ttsEnabled = false;
  @state() ttsSupported = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  // Sidebar state for tool output viewing
  @state() sidebarOpen = false;
  @state() sidebarContent: string | null = null;
  @state() sidebarError: string | null = null;
  @state() splitRatio = this.settings.splitRatio;

  @state() nodesLoading = false;
  @state() nodes: Array<Record<string, unknown>> = [];
  @state() devicesLoading = false;
  @state() devicesError: string | null = null;
  @state() devicesList: DevicePairingList | null = null;
  @state() execApprovalsLoading = false;
  @state() execApprovalsSaving = false;
  @state() execApprovalsDirty = false;
  @state() execApprovalsSnapshot: ExecApprovalsSnapshot | null = null;
  @state() execApprovalsForm: ExecApprovalsFile | null = null;
  @state() execApprovalsSelectedAgent: string | null = null;
  @state() execApprovalsTarget: "gateway" | "node" = "gateway";
  @state() execApprovalsTargetNodeId: string | null = null;
  @state() execApprovalQueue: ExecApprovalRequest[] = [];
  @state() execApprovalBusy = false;
  @state() execApprovalError: string | null = null;
  @state() pendingGatewayUrl: string | null = null;

  @state() configLoading = false;
  @state() configRaw = "{\n}\n";
  @state() configRawOriginal = "";
  @state() configValid: boolean | null = null;
  @state() configIssues: unknown[] = [];
  @state() configSaving = false;
  @state() configApplying = false;
  @state() updateRunning = false;
  @state() applySessionKey = this.settings.lastActiveSessionKey;
  @state() configSnapshot: ConfigSnapshot | null = null;
  @state() configSchema: unknown | null = null;
  @state() configSchemaVersion: string | null = null;
  @state() configSchemaLoading = false;
  @state() configUiHints: ConfigUiHints = {};
  @state() configForm: Record<string, unknown> | null = null;
  @state() configFormOriginal: Record<string, unknown> | null = null;
  @state() configFormDirty = false;
  @state() configFormMode: "form" | "raw" = "form";
  @state() configSearchQuery = "";
  @state() configActiveSection: string | null = null;
  @state() configActiveSubsection: string | null = null;

  @state() channelsLoading = false;
  @state() channelsSnapshot: ChannelsStatusSnapshot | null = null;
  @state() channelsError: string | null = null;
  @state() channelsLastSuccess: number | null = null;
  @state() whatsappLoginMessage: string | null = null;
  @state() whatsappLoginQrDataUrl: string | null = null;
  @state() whatsappLoginConnected: boolean | null = null;
  @state() whatsappBusy = false;
  @state() nostrProfileFormState: NostrProfileFormState | null = null;
  @state() nostrProfileAccountId: string | null = null;

  @state() presenceLoading = false;
  @state() presenceEntries: PresenceEntry[] = [];
  @state() presenceError: string | null = null;
  @state() presenceStatus: string | null = null;

  @state() agentsLoading = false;
  @state() agentsList: AgentsListResult | null = null;
  @state() agentsError: string | null = null;

  @state() sessionsLoading = false;
  @state() sessionsResult: SessionsListResult | null = null;
  @state() sessionsError: string | null = null;
  @state() sessionsFilterActive = "";
  @state() sessionsFilterLimit = "120";
  @state() sessionsIncludeGlobal = true;
  @state() sessionsIncludeUnknown = false;

  @state() cronLoading = false;
  @state() cronJobs: CronJob[] = [];
  @state() cronStatus: CronStatus | null = null;
  @state() cronError: string | null = null;
  @state() cronForm: CronFormState = { ...DEFAULT_CRON_FORM };
  @state() cronRunsJobId: string | null = null;
  @state() cronRuns: CronRunLogEntry[] = [];
  @state() cronBusy = false;

  @state() skillsLoading = false;
  @state() skillsReport: SkillStatusReport | null = null;
  @state() skillsError: string | null = null;
  @state() skillsFilter = "";
  @state() skillEdits: Record<string, string> = {};
  @state() skillsBusyKey: string | null = null;
  @state() skillMessages: Record<string, SkillMessage> = {};
  // Catalog state
  @state() skillsCatalog: SkillCatalogEntry[] = [];
  @state() skillsCatalogLoading = false;
  @state() skillsCatalogError: string | null = null;
  @state() skillsFilterKind: SkillCatalogKind | "all" | "installed" = "all";
  @state() skillsSearch = "";
  // Settings panel state
  @state() skillsSettingsOpen = false;
  @state() skillsSettingsSkillId: string | null = null;
  @state() skillsSettingsSchema: Record<string, unknown> | null = null;
  @state() skillsSettingsUiHints: Record<string, unknown> | null = null;
  @state() skillsSettingsCurrentConfig: Record<string, unknown> | null = null;
  @state() skillsSettingsLoading = false;
  @state() skillsSettingsSaving = false;
  @state() skillsSettingsFormValues: Record<string, unknown> = {};
  @state() skillsSettingsEnvVars: Array<{ key: string; value: string }> = [];

  @state() memoryLoading = false;
  @state() memoryFacts: UserFact[] = [];
  @state() memoryError: string | null = null;
  @state() memoryFilter: MemoryCategory | "all" = "all";
  @state() memorySearch = "";
  @state() memoryEditingId: string | null = null;
  @state() memoryEditDraft = "";
  @state() memoryExtracting = false;
  @state() memoryExtractStatus: "idle" | "extracting" | "extracted" = "idle";

  // Projects state
  @state() projectsLoading = false;
  @state() projectsList: ProjectInfo[] = [];
  @state() projectsError: string | null = null;
  @state() projectsScanning = false;
  @state() projectsScanStatus: "idle" | "scanning" | "scanned" = "idle";

  // Deploy state
  @state() deployLoading = false;
  @state() deployHistory: DeployRecord[] = [];
  @state() deployError: string | null = null;
  @state() deployActiveId: string | null = null;
  @state() deployStatus: DeployStatus | null = null;
  @state() deployLogLines: string[] = [];
  @state() deploySelectedProject: string | null = null;
  @state() deploySelectedPlatform: DeployPlatform | null = null;
  @state() deploySelectedTarget: "production" | "staging" | "preview" = "production";
  @state() deploySelectedBranch = "";
  @state() deployRunning = false;

  // Preview state
  @state() previewLoading = false;
  @state() previewList: PreviewRecord[] = [];
  @state() previewError: string | null = null;
  @state() previewCreating = false;
  @state() previewDeleting: string | null = null;
  @state() previewPromoting: string | null = null;
  @state() previewSelectedProject: string | null = null;
  @state() previewBranch = "";
  @state() previewIframeUrl: string | null = null;

  // Eldercare dashboard state
  @state() eldercareLoading = false;
  @state() eldercareError: string | null = null;
  @state() eldercareHaConnected = false;
  @state() eldercareRoom: import("./controllers/eldercare").EldercareRoomData = { temperature: null, humidity: null, motionMinutes: null, presence: null };
  @state() eldercareSummary: import("./controllers/eldercare").EldercareDailySummary = { checksToday: 0, alertsToday: 0, highestLevel: "normal", callsToday: [], musicPlayed: 0, remindersDelivered: 0, storyActive: false, sosEvents: [], lastReport: null, lastReportDate: null };
  @state() eldercareLastCheck: import("./controllers/eldercare").EldercareCheck | null = null;
  @state() eldercareSosActive = false;

  // Eldercare config state
  @state() eldercareConfigLoading = false;
  @state() eldercareConfigSaving = false;
  @state() eldercareConfigError: string | null = null;
  @state() eldercareConfigSection: import("./views/eldercare-config").EldercareConfigSection = "monitor";
  @state() eldercareMonitorConfig: Record<string, unknown> | null = null;
  @state() eldercareSosContacts: import("./views/eldercare-config").EldercareContact[] = [];
  @state() eldercareCompanionConfig: Record<string, unknown> | null = null;
  @state() eldercareVideocallConfig: Record<string, unknown> | null = null;
  @state() eldercareHaEntities: Record<string, string> = {
    presence: "binary_sensor.grandma_room_presence",
    temperature: "sensor.grandma_room_temperature",
    humidity: "sensor.grandma_room_humidity",
    motion: "sensor.grandma_room_motion_minutes",
  };

  // Memory indicator (chat header)
  @state() memoryIndicatorEnabled = true;
  @state() memoryIndicatorFacts: UserFact[] = [];
  @state() memoryIndicatorTotal = 0;
  @state() memoryIndicatorExpanded = false;

  @state() debugLoading = false;
  @state() debugStatus: StatusSummary | null = null;
  @state() debugHealth: HealthSnapshot | null = null;
  @state() debugModels: unknown[] = [];
  @state() debugHeartbeat: unknown | null = null;
  @state() debugCallMethod = "";
  @state() debugCallParams = "{}";
  @state() debugCallResult: string | null = null;
  @state() debugCallError: string | null = null;

  @state() logsLoading = false;
  @state() logsError: string | null = null;
  @state() logsFile: string | null = null;
  @state() logsEntries: LogEntry[] = [];
  @state() logsFilterText = "";
  @state() logsLevelFilters: Record<LogLevel, boolean> = {
    ...DEFAULT_LOG_LEVEL_FILTERS,
  };
  @state() logsAutoFollow = true;
  @state() logsTruncated = false;
  @state() logsCursor: number | null = null;
  @state() logsLastFetchAt: number | null = null;
  @state() logsLimit = 500;
  @state() logsMaxBytes = 250_000;
  @state() logsAtBottom = true;

  client: GatewayBrowserClient | null = null;
  private chatScrollFrame: number | null = null;
  private chatScrollTimeout: number | null = null;
  private chatHasAutoScrolled = false;
  private chatUserNearBottom = true;
  private nodesPollInterval: number | null = null;
  private logsPollInterval: number | null = null;
  private debugPollInterval: number | null = null;
  private logsScrollFrame: number | null = null;
  private toolStreamById = new Map<string, ToolStreamEntry>();
  private toolStreamOrder: string[] = [];
  refreshSessionsAfterChat = new Set<string>();
  basePath = "";
  private popStateHandler = () =>
    onPopStateInternal(this as unknown as Parameters<typeof onPopStateInternal>[0]);
  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private topbarObserver: ResizeObserver | null = null;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    // Subscribe to connection manager state
    connectionManager.subscribe((state) => {
      this.connectionState = state;
    });
    // Detect voice/TTS support
    const w = window as unknown as Record<string, unknown>;
    this.voiceSupported = !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
    this.ttsSupported = typeof speechSynthesis !== "undefined" && speechSynthesis.getVoices().some((v) => v.lang.startsWith("vi"));
    // Some browsers load voices async — re-check on voiceschanged
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.addEventListener("voiceschanged", () => {
        this.ttsSupported = speechSynthesis.getVoices().some((v) => v.lang.startsWith("vi"));
      });
    }
    handleConnected(this as unknown as Parameters<typeof handleConnected>[0]);
  }

  protected firstUpdated() {
    handleFirstUpdated(this as unknown as Parameters<typeof handleFirstUpdated>[0]);
  }

  disconnectedCallback() {
    handleDisconnected(this as unknown as Parameters<typeof handleDisconnected>[0]);
    super.disconnectedCallback();
  }

  protected updated(changed: Map<PropertyKey, unknown>) {
    handleUpdated(this as unknown as Parameters<typeof handleUpdated>[0], changed);
  }

  connect() {
    connectGatewayInternal(this as unknown as Parameters<typeof connectGatewayInternal>[0]);
  }

  handleChatScroll(event: Event) {
    handleChatScrollInternal(
      this as unknown as Parameters<typeof handleChatScrollInternal>[0],
      event,
    );
  }

  handleLogsScroll(event: Event) {
    handleLogsScrollInternal(
      this as unknown as Parameters<typeof handleLogsScrollInternal>[0],
      event,
    );
  }

  exportLogs(lines: string[], label: string) {
    exportLogsInternal(lines, label);
  }

  resetToolStream() {
    resetToolStreamInternal(this as unknown as Parameters<typeof resetToolStreamInternal>[0]);
  }

  resetChatScroll() {
    resetChatScrollInternal(this as unknown as Parameters<typeof resetChatScrollInternal>[0]);
  }

  async loadAssistantIdentity() {
    await loadAssistantIdentityInternal(this);
  }

  applySettings(next: UiSettings) {
    applySettingsInternal(this as unknown as Parameters<typeof applySettingsInternal>[0], next);
  }

  setTab(next: Tab) {
    setTabInternal(this as unknown as Parameters<typeof setTabInternal>[0], next);
  }

  setTheme(next: ThemeMode, context?: Parameters<typeof setThemeInternal>[2]) {
    setThemeInternal(this as unknown as Parameters<typeof setThemeInternal>[0], next, context);
  }

  async loadOverview() {
    await loadOverviewInternal(this as unknown as Parameters<typeof loadOverviewInternal>[0]);
  }

  async loadCron() {
    await loadCronInternal(this as unknown as Parameters<typeof loadCronInternal>[0]);
  }

  async handleLoadMemory() {
    await loadMemoryInternal(this);
  }

  async handleAbortChat() {
    await handleAbortChatInternal(this as unknown as Parameters<typeof handleAbortChatInternal>[0]);
  }

  removeQueuedMessage(id: string) {
    removeQueuedMessageInternal(
      this as unknown as Parameters<typeof removeQueuedMessageInternal>[0],
      id,
    );
  }

  async handleSendChat(
    messageOverride?: string,
    opts?: Parameters<typeof handleSendChatInternal>[2],
  ) {
    await handleSendChatInternal(
      this as unknown as Parameters<typeof handleSendChatInternal>[0],
      messageOverride,
      opts,
    );
  }

  async handleWhatsAppStart(force: boolean) {
    await handleWhatsAppStartInternal(this, force);
  }

  async handleWhatsAppWait() {
    await handleWhatsAppWaitInternal(this);
  }

  async handleWhatsAppLogout() {
    await handleWhatsAppLogoutInternal(this);
  }

  async handleChannelConfigSave() {
    await handleChannelConfigSaveInternal(this);
  }

  async handleChannelConfigReload() {
    await handleChannelConfigReloadInternal(this);
  }

  handleNostrProfileEdit(accountId: string, profile: NostrProfile | null) {
    handleNostrProfileEditInternal(this, accountId, profile);
  }

  handleNostrProfileCancel() {
    handleNostrProfileCancelInternal(this);
  }

  handleNostrProfileFieldChange(field: keyof NostrProfile, value: string) {
    handleNostrProfileFieldChangeInternal(this, field, value);
  }

  async handleNostrProfileSave() {
    await handleNostrProfileSaveInternal(this);
  }

  async handleNostrProfileImport() {
    await handleNostrProfileImportInternal(this);
  }

  handleNostrProfileToggleAdvanced() {
    handleNostrProfileToggleAdvancedInternal(this);
  }

  async handleExecApprovalDecision(decision: "allow-once" | "allow-always" | "deny") {
    const active = this.execApprovalQueue[0];
    if (!active || !this.client || this.execApprovalBusy) return;
    this.execApprovalBusy = true;
    this.execApprovalError = null;
    try {
      await this.client.request("exec.approval.resolve", {
        id: active.id,
        decision,
      });
      this.execApprovalQueue = this.execApprovalQueue.filter((entry) => entry.id !== active.id);
    } catch (err) {
      this.execApprovalError = `Exec approval failed: ${String(err)}`;
    } finally {
      this.execApprovalBusy = false;
    }
  }

  handleGatewayUrlConfirm() {
    const nextGatewayUrl = this.pendingGatewayUrl;
    if (!nextGatewayUrl) return;
    this.pendingGatewayUrl = null;
    applySettingsInternal(this as unknown as Parameters<typeof applySettingsInternal>[0], {
      ...this.settings,
      gatewayUrl: nextGatewayUrl,
    });
    this.connect();
  }

  handleGatewayUrlCancel() {
    this.pendingGatewayUrl = null;
  }

  // Sidebar handlers for tool output viewing
  handleOpenSidebar(content: string) {
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = null;
    }
    this.sidebarContent = content;
    this.sidebarError = null;
    this.sidebarOpen = true;
    // Auto-collapse nav sidebar when content panel opens (Claude-style)
    if (!this.settings.navCollapsed) {
      this.applySettings({ ...this.settings, navCollapsed: true });
    }
  }

  handleCloseSidebar() {
    this.sidebarOpen = false;
    // Clear content after transition
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
    }
    this.sidebarCloseTimer = window.setTimeout(() => {
      if (this.sidebarOpen) return;
      this.sidebarContent = null;
      this.sidebarError = null;
      this.sidebarCloseTimer = null;
    }, 200);
  }

  handleSplitRatioChange(ratio: number) {
    const newRatio = Math.max(0.4, Math.min(0.7, ratio));
    this.splitRatio = newRatio;
    this.applySettings({ ...this.settings, splitRatio: newRatio });
  }

  // Setup guide handlers
  showSetupGuide() {
    this.setupGuideState = { ...this.setupGuideState, isOpen: true };
  }

  hideSetupGuide() {
    this.setupGuideState = { ...this.setupGuideState, isOpen: false, currentStep: 0 };
  }

  async checkGateway() {
    this.setupGuideState = { ...this.setupGuideState, checkingGateway: true };
    try {
      const running = await connectionManager.checkGatewayHealth();
      this.setupGuideState = {
        ...this.setupGuideState,
        checkingGateway: false,
        gatewayRunning: running,
      };
    } catch {
      this.setupGuideState = {
        ...this.setupGuideState,
        checkingGateway: false,
        gatewayRunning: false,
      };
    }
  }

  setupGuideNextStep() {
    this.setupGuideState = {
      ...this.setupGuideState,
      currentStep: Math.min(this.setupGuideState.currentStep + 1, 2),
    };
  }

  setupGuidePrevStep() {
    this.setupGuideState = {
      ...this.setupGuideState,
      currentStep: Math.max(this.setupGuideState.currentStep - 1, 0),
    };
  }

  async copyCommand(cmd: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      this.setupGuideState = { ...this.setupGuideState, copiedCommand: cmd };
      setTimeout(() => {
        this.setupGuideState = { ...this.setupGuideState, copiedCommand: null };
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = cmd;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  connectFromGuide() {
    this.hideSetupGuide();
    connectionManager.reconnect();
    this.connect();
  }

  retryConnection() {
    connectionManager.reconnect();
    this.connect();
  }

  async handleLoadProjects() {
    await loadProjectsInternal(this);
  }

  async handleScanProject(projectId: string) {
    await scanProjectInternal(this, projectId);
  }

  async handleDeploy() {
    await deployProjectInternal(this);
  }

  async handleLoadDeployHistory() {
    await loadDeployHistoryInternal(this);
  }

  async handleLoadPreviews() {
    await loadPreviewsInternal(this);
  }

  async handleCreatePreview() {
    await createPreviewInternal(this);
  }

  async handleDeletePreview(previewId: string) {
    await deletePreviewInternal(this, previewId);
  }

  async handlePromotePreview(previewId: string) {
    await promotePreviewInternal(this, previewId);
  }

  // Eldercare handlers
  async handleEldercareLoadConfig() {
    if (!this.client || !this.connected) return;
    this.eldercareConfigLoading = true;
    this.eldercareConfigError = null;
    try {
      // Load config files from memory
      const res = (await this.client.request("memory.search", {
        query: "eldercare_config",
        limit: 20,
      })) as Array<{ id: string; content: string }> | undefined;
      const facts = Array.isArray(res) ? res : [];
      for (const fact of facts) {
        try {
          const data = JSON.parse(fact.content);
          if (fact.id === "eldercare_monitor_config") this.eldercareMonitorConfig = data;
          if (fact.id === "eldercare_companion_config") this.eldercareCompanionConfig = data;
          if (fact.id === "eldercare_videocall_config") this.eldercareVideocallConfig = data;
          if (fact.id === "eldercare_contacts") {
            this.eldercareSosContacts = Array.isArray(data) ? data : [];
          }
        } catch {
          // skip
        }
      }
    } catch (err) {
      this.eldercareConfigError = String(err);
    } finally {
      this.eldercareConfigLoading = false;
    }
  }

  async handleEldercareSaveConfig() {
    if (!this.client || !this.connected) return;
    this.eldercareConfigSaving = true;
    this.eldercareConfigError = null;
    try {
      if (this.eldercareMonitorConfig) {
        await this.client.request("memory.upsert", {
          key: "eldercare_monitor_config",
          content: JSON.stringify(this.eldercareMonitorConfig),
        });
      }
      if (this.eldercareCompanionConfig) {
        await this.client.request("memory.upsert", {
          key: "eldercare_companion_config",
          content: JSON.stringify(this.eldercareCompanionConfig),
        });
      }
      if (this.eldercareVideocallConfig) {
        await this.client.request("memory.upsert", {
          key: "eldercare_videocall_config",
          content: JSON.stringify(this.eldercareVideocallConfig),
        });
      }
      if (this.eldercareSosContacts.length > 0) {
        await this.client.request("memory.upsert", {
          key: "eldercare_contacts",
          content: JSON.stringify(this.eldercareSosContacts),
        });
      }
    } catch (err) {
      this.eldercareConfigError = String(err);
    } finally {
      this.eldercareConfigSaving = false;
    }
  }

  handleEldercareConfigChange(section: string, path: string[], value: unknown) {
    const setNested = (obj: Record<string, unknown>, keys: string[], val: unknown) => {
      const clone = { ...obj };
      let current: Record<string, unknown> = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        current[k] = { ...(current[k] as Record<string, unknown> ?? {}) };
        current = current[k] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = val;
      return clone;
    };

    switch (section) {
      case "monitor":
        this.eldercareMonitorConfig = setNested(this.eldercareMonitorConfig ?? {}, path, value);
        break;
      case "companion":
        this.eldercareCompanionConfig = setNested(this.eldercareCompanionConfig ?? {}, path, value);
        break;
      case "videocall":
        this.eldercareVideocallConfig = setNested(this.eldercareVideocallConfig ?? {}, path, value);
        break;
    }
  }

  render() {
    return renderApp(this);
  }
}
