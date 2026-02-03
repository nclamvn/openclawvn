// English translations for OpenClaw UI

export const en = {
  // ============================================
  // NAVIGATION & LAYOUT
  // ============================================
  nav: {
    chat: "Chat",
    overview: "Overview",
    channels: "Channels",
    instances: "Instances",
    sessions: "Sessions",
    cronJobs: "Cron Jobs",
    skills: "Skills",
    nodes: "Nodes",
    config: "Config",
    debug: "Debug",
    logs: "Logs",
    docs: "Docs",

    // Groups
    control: "CONTROL",
    agent: "AGENT",
    settings: "SETTINGS",
    resources: "RESOURCES",

    // Subtitles
    subtitles: {
      overview: "Gateway status, access points and quick health check.",
      channels: "Manage channels and settings.",
      instances: "Presence signals from clients and connected nodes.",
      sessions: "Check active sessions and adjust per-session defaults.",
      cron: "Schedule wake-ups and periodic agent runs.",
      skills: "Manage skill availability and API key injection.",
      nodes: "Paired devices, capabilities and command exposure.",
      chat: "Direct gateway chat session for quick intervention.",
      config: "Edit ~/.openclaw/openclaw.json safely.",
      debug: "Gateway snapshots, events and manual RPC calls.",
      logs: "Live tail gateway file logs.",
    },
  },

  // ============================================
  // COMMON / SHARED
  // ============================================
  common: {
    loading: "Loading...",
    refresh: "Refresh",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    remove: "Remove",
    enable: "Enable",
    disable: "Disable",
    enabled: "Enabled",
    disabled: "Disabled",
    yes: "Yes",
    no: "No",
    ok: "OK",
    apply: "Apply",
    update: "Update",
    reload: "Reload",
    export: "Export",
    import: "Import",
    search: "Search",
    filter: "Filter",
    all: "All",
    none: "None",
    unknown: "Unknown",
    na: "N/A",
    connect: "Connect",
    disconnect: "Disconnect",
    connected: "Connected",
    disconnected: "Disconnected",
    offline: "Offline",
    online: "Online",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    running: "Running",
    stopped: "Stopped",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    status: "Status",
    actions: "Actions",
    details: "Details",
    options: "Options",
    settings: "Settings",
    configuration: "Configuration",
    default: "Default",
    custom: "Custom",
    inherit: "Inherit",
    override: "Override",
    useDefault: "Use default",
    change: "change",
    changes: "changes",
    valid: "valid",
    invalid: "invalid",
    unsaved: "unsaved",
    optional: "optional",
  },

  // ============================================
  // HEALTH STATUS
  // ============================================
  health: {
    title: "Health",
    ok: "OK",
    offline: "Offline",
    degraded: "Degraded",
  },

  // ============================================
  // SIDEBAR
  // ============================================
  sidebar: {
    expand: "Expand sidebar",
    collapse: "Collapse sidebar",
    docs: "Documentation (new tab)",
  },

  // ============================================
  // CHAT VIEW
  // ============================================
  chat: {
    title: "Chat",
    placeholder: "What can I help you with today?",
    inputPlaceholder: "Type a message (Enter to send, Shift+Enter for newline, paste images)",
    inputPlaceholderWithImages: "Add a message or paste more images...",
    connectPrompt: "Connect to gateway to start chatting...",
    loadingChat: "Loading chat...",
    connectButton: "Connect to gateway...",

    // Compaction
    compacting: "Compacting context...",
    compacted: "Context compacted",

    // Queue
    queued: "Queued",
    image: "Image",
    removeQueued: "Remove queued message",

    // Quick actions
    quickActions: {
      code: "Write code",
      write: "Write text",
      create: "Create",
      learn: "Learn",
      analyze: "Analyze",
    },

    // Model selector
    selectModel: "Select model",
    apiKey: "API Key",
    enterApiKey: "Enter API key...",
    saveTemp: "Save temp (frontend)",
    savePerm: "Save permanent (backend)",
    tempLabel: "TEMP",
    permLabel: "PERM",
    saveToAuthProfiles: "Save to auth-profiles (permanent)",
    saveSessionOnly: "Save for this session only",

    // Providers
    providers: {
      anthropic: "Anthropic",
      openai: "OpenAI",
      google: "Google",
    },

    // Attachments
    attachmentPreview: "Attachment preview",
    removeAttachment: "Remove attachment",
    attachImage: "Attach image",

    // Voice
    stopRecording: "Stop recording",
    voiceInput: "Voice input",
    microphoneError: "Cannot access microphone",

    // Send button
    stop: "Stop",
    sendMessage: "Send message",

    // Control buttons
    refreshData: "Refresh chat data",
    toggleThinking: "Toggle thinking/activity display",
    toggleFocus: "Toggle focus mode (hide sidebar + header)",
    disabledDuringSetup: "Disabled during setup",
    gatewayDisconnected: "Gateway disconnected.",

    // Copy
    copyAsMarkdown: "Copy as markdown",
    copied: "Copied",
    copyFailed: "Copy failed",

    // User label
    you: "You",

    // Avatar initials
    userInitial: "U",
    assistantDefault: "Assistant",
  },

  // ============================================
  // OVERVIEW / DASHBOARD
  // ============================================
  overview: {
    title: "Overview",

    // Gateway Access
    gatewayAccess: {
      title: "Gateway Access",
      description: "Where the control panel connects and how it authenticates.",
      websocketUrl: "WebSocket URL",
      gatewayToken: "Gateway Token",
      password: "Password (not stored)",
      passwordPlaceholder: "system or shared password",
      defaultSessionKey: "Default Session Key",
      clickConnect: "Click Connect to apply changes.",
      authRequired: "This gateway requires authentication. Add a token or password, then click Connect.",
      authFailed: "Authentication failed. Copy the URL with token using",
      orUpdateToken: ", or update the token, then click Connect.",
      httpWarning: "This page uses HTTP, browser blocks device identity. Use HTTPS (Tailscale Serve) or open",
      onGatewayHost: "on the gateway host.",
      httpFallback: "If HTTP is required, set",
      tokenOnly: "(token only).",
    },

    // Snapshot
    snapshot: {
      title: "Snapshot",
      description: "Latest gateway handshake information.",
      uptime: "Uptime",
      tickInterval: "Tick Interval",
      lastChannelsRefresh: "Last Channels Refresh",
      useChannels: "Use Channels to link WhatsApp, Telegram, Discord, Signal, or iMessage.",
    },

    // Statistics
    stats: {
      instances: "Instances",
      instancesDesc: "Presence signals in the last 5 minutes.",
      sessions: "Sessions",
      sessionsDesc: "Recent session keys tracked by gateway.",
      cron: "Cron",
      nextWake: "Next wake",
    },

    // Notes
    notes: {
      title: "Notes",
      description: "Quick reminders for remote control setup.",
      tailscale: "Tailscale serve",
      tailscaleDesc: "Prefer serve mode to keep gateway on loopback with tailnet auth.",
      sessionHygiene: "Session hygiene",
      sessionHygieneDesc: "Use /new or sessions.patch to reset context.",
      cronReminders: "Cron reminders",
      cronRemindersDesc: "Use isolated sessions for periodic runs.",
    },
  },

  // ============================================
  // CHANNELS
  // ============================================
  channels: {
    title: "Channels",

    health: {
      title: "Channel Health",
      description: "Channel status snapshot from gateway.",
      noSnapshot: "No snapshot yet.",
    },

    status: {
      configured: "Configured",
      connected: "Connected",
      lastInbound: "Last inbound",
      active: "Active",
    },
  },

  // ============================================
  // INSTANCES
  // ============================================
  instances: {
    title: "Connected Instances",
    description: "Presence signals from gateway and clients.",
    empty: "No instances reported yet.",
    unknownHost: "unknown host",
    lastInput: "Last input",
    reason: "Reason",
    secondsAgo: "seconds ago",
  },

  // ============================================
  // SESSIONS
  // ============================================
  sessions: {
    title: "Sessions",
    description: "Active session keys and per-session overrides.",

    filters: {
      activeWithin: "Active within (minutes)",
      limit: "Limit",
      includeGlobal: "Include global",
      includeUnknown: "Include unknown",
    },

    table: {
      key: "Key",
      label: "Label",
      kind: "Kind",
      updated: "Updated",
      tokens: "Tokens",
      thinking: "Thinking",
      verbose: "Verbose",
      reasoning: "Reasoning",
    },

    options: {
      inherit: "inherit",
      offExplicit: "off (explicit)",
      on: "on",
    },

    empty: "No sessions found.",
    store: "Store:",
  },

  // ============================================
  // CRON / SCHEDULER
  // ============================================
  cron: {
    title: "Cron Jobs",

    scheduler: {
      title: "Scheduler",
      description: "Gateway cron scheduler status.",
      jobs: "Jobs",
      nextWake: "Next wake",
      refreshing: "Refreshing...",
    },

    newJob: {
      title: "New Job",
      description: "Create a scheduled wake or agent run.",
      name: "Name",
      jobDescription: "Description",
      agentId: "Agent ID",
      schedule: "Schedule",
      every: "Every",
      at: "At",
      cronExpr: "Cron Expression",
      session: "Session",
      sessionMain: "Main",
      sessionIsolated: "Isolated",
      wakeMode: "Wake Mode",
      nextHeartbeat: "Next heartbeat",
      now: "Now",
      payload: "Payload",
      systemEvent: "System Event",
      agentTurn: "Agent Turn",
      systemText: "System Text",
      agentMessage: "Agent Message",
      deliver: "Deliver",
      channel: "Channel",
      to: "To",
      toPlaceholder: "+1555... or chat id",
      timeout: "Timeout (seconds)",
      postToMainPrefix: "Post to main prefix",
      addJob: "Add Job",
    },

    jobs: {
      title: "Jobs",
      description: "All scheduled jobs stored in gateway.",
      empty: "No jobs yet.",
      run: "Run",
      runs: "Runs",
    },

    runHistory: {
      title: "Run History",
      latestRuns: "Latest runs for",
      selectJob: "(select a job)",
      selectPrompt: "Select a job to view run history.",
      empty: "No runs yet.",
    },

    schedule: {
      runAt: "Run at",
      unit: "Unit",
      minutes: "Minutes",
      hours: "Hours",
      days: "Days",
      expression: "Expression",
      timezone: "Timezone (optional)",
    },
  },

  // ============================================
  // SKILLS
  // ============================================
  skills: {
    title: "Skills",
    description: "Built-in, managed, and workspace skills.",

    filter: {
      search: "Search skills",
      shown: "shown",
    },

    empty: "No skills found.",

    status: {
      disabled: "disabled",
      blockedByAllowlist: "blocked by allowlist",
      eligible: "eligible",
      blocked: "blocked",
      missing: "Missing:",
      reason: "Reason:",
      installing: "Installing...",
    },

    apiKey: "API Key",
    saveKey: "Save Key",
  },

  // ============================================
  // NODES / DEVICES
  // ============================================
  nodes: {
    title: "Nodes",

    nodes: {
      title: "Nodes",
      description: "Paired devices and direct connections.",
      empty: "No nodes found.",
    },

    devices: {
      title: "Devices",
      description: "Pairing requests + role tokens.",
      pending: "Pending",
      paired: "Paired",
      empty: "No paired devices.",
      approve: "Approve",
      reject: "Reject",
    },

    deviceDetails: {
      role: "role:",
      requested: "requested",
      repair: "repair",
      roles: "roles:",
      scopes: "scopes:",
      tokensNone: "Tokens: none",
      tokens: "Tokens",
      active: "active",
      revoked: "revoked",
      rotate: "Rotate",
      revoke: "Revoke",
    },

    execBinding: {
      title: "Exec Node Binding",
      description: "Pin agents to specific nodes when using",
      switchToForm: "Switch Config tab to",
      formMode: "Form",
      toEditBindings: "mode to edit bindings here.",
      loadConfig: "Load config to edit bindings.",
      loadConfigBtn: "Load Config",
      defaultBinding: "Default Binding",
      defaultBindingDesc: "Used when agent doesn't override node binding.",
      node: "Node",
      anyNode: "Any node",
      noNodesAvailable: "No nodes with system.run available.",
      noAgents: "No agents found.",
    },

    execApprovals: {
      title: "Exec Approvals",
      description: "Allowlist and approval policies for",
      loadApprovals: "Load exec approvals to edit allowlist.",
      loadApprovalsBtn: "Load Approvals",
      target: "Target",
      targetDesc: "Gateway edits local approvals; node edits selected node.",
      host: "Host",
      gateway: "Gateway",
      selectNode: "Select node",
      noNodesYet: "No nodes advertising exec approvals yet.",
      scope: "Scope",
      defaults: "Defaults",
    },

    security: {
      title: "Security",
      description: "Default security mode.",
      default: "Default:",
      mode: "Mode",
      deny: "Deny",
      allowlist: "Allowlist",
      full: "Full",
    },

    ask: {
      title: "Ask",
      description: "Default ask policy.",
      off: "Off",
      onMiss: "On miss",
      always: "Always",
      fallback: "Ask Fallback",
      fallbackDesc: "Applied when ask UI is unavailable.",
    },

    autoAllowSkills: {
      title: "Auto-allow Skill CLIs",
      description: "Allow skill executables listed by Gateway.",
      usingDefault: "Using default",
      on: "on",
      off: "off",
    },

    allowlist: {
      title: "Allowlist",
      description: "Case-insensitive glob patterns.",
      addPattern: "Add Pattern",
      empty: "No allowlist entries yet.",
      newPattern: "New pattern",
      lastUsed: "Last used: ",
      never: "never",
      pattern: "Pattern",
    },

    agentBinding: {
      defaultAgent: "default agent",
      agent: "agent",
      usesDefault: "uses default",
      any: "any",
      override: "override:",
      binding: "Binding",
    },

    nodeStatus: {
      paired: "paired",
      unpaired: "unpaired",
      connected: "connected",
      offline: "offline",
    },
  },

  // ============================================
  // CONFIG
  // ============================================
  config: {
    title: "Config",

    search: "Search...",

    mode: {
      form: "Form",
      raw: "Raw",
    },

    diff: {
      view: "View",
      pendingChange: "pending change",
      pendingChanges: "pending changes",
    },

    form: {
      loadingSchema: "Loading schema...",
      rawWarning: "Form mode cannot safely edit some fields. Use Raw to avoid losing config entries.",
      rawJson: "Raw JSON5",
      schemaUnavailable: "Schema not available.",
      schemaUnsupported: "Schema not supported. Use Raw mode.",
      noMatchingSettings: "No settings match",
      noSettingsInSection: "No settings in this section",
      unsupportedType: "Unsupported type",
      useRawMode: "Use Raw mode.",
      resetToDefault: "Reset to default",
      select: "Select...",
      unsupportedArraySchema: "Unsupported array schema. Use Raw mode.",
      items: "items",
      item: "item",
      add: "Add",
      noItems: "No items yet. Click \"Add\" to create new.",
      removeItem: "Remove item",
      customEntries: "Custom entries",
      addEntry: "Add entry",
      noCustomEntries: "No custom entries.",
      key: "Key",
      jsonValue: "JSON value",
    },

    sections: {
      all: "All",
      environment: "Environment",
      updates: "Updates",
      agents: "Agents",
      authentication: "Authentication",
      channels: "Channels",
      messages: "Messages",
      commands: "Commands",
      hooks: "Hooks",
      skills: "Skills",
      tools: "Tools",
      gateway: "Gateway",
      setupWizard: "Setup Wizard",
    },

    sectionDescriptions: {
      env: "Environment variables passed to gateway process",
      update: "Auto-update settings and release channels",
      agents: "Agent configuration, models and identity",
      auth: "API keys and authentication profiles",
      channels: "Messaging channels (Telegram, Discord, Slack, etc.)",
      messages: "Message processing and routing",
      commands: "Custom slash commands",
      hooks: "Webhooks and event hooks",
      skills: "Skill packages and capabilities",
      tools: "Tool configuration (browser, search, etc.)",
      gateway: "Gateway server settings (port, auth, bindings)",
      wizard: "Setup wizard state and history",
      meta: "Gateway metadata and version info",
      logging: "Log levels and output configuration",
      browser: "Browser automation settings",
      ui: "User interface options",
      models: "AI model and provider configuration",
      bindings: "Key bindings and shortcuts",
      broadcast: "Broadcast and notification settings",
      audio: "Audio input/output settings",
      session: "Session management and storage",
      cron: "Scheduled tasks and automation",
      web: "Web server and API settings",
      discovery: "Service and network discovery",
      canvasHost: "Canvas rendering and display",
      talk: "Voice and speech settings",
      plugins: "Plugin and extension management",
    },
  },

  // ============================================
  // LOGS
  // ============================================
  logs: {
    title: "Logs",
    description: "Gateway file logs (JSONL).",

    filter: {
      search: "Search logs",
      autoFollow: "Auto-follow",
    },

    levels: {
      trace: "trace",
      debug: "debug",
      info: "info",
      warn: "warn",
      error: "error",
      fatal: "fatal",
    },

    file: "File:",
    truncated: "Log output truncated; showing latest.",
    empty: "No log entries.",
    filtered: "filtered",
    visible: "visible",
  },

  // ============================================
  // DEBUG
  // ============================================
  debug: {
    title: "Debug",

    snapshots: {
      title: "Snapshots",
      description: "Status, health, and heartbeat data.",
      refreshing: "Refreshing...",
      status: "Status",
      securityAudit: "Security audit:",
      critical: "critical",
      warnings: "warnings",
      noCritical: "No critical issues",
      health: "Health",
      lastHeartbeat: "Last Heartbeat",
      forDetails: "for details.",
    },

    rpc: {
      title: "Manual RPC",
      description: "Send raw gateway methods with JSON params.",
      method: "Method",
      methodPlaceholder: "system-presence",
      params: "Params (JSON)",
      call: "Call",
    },

    models: {
      title: "Models",
      description: "Catalog from models.list.",
    },

    eventLog: {
      title: "Event Log",
      description: "Recent gateway events.",
      empty: "No events yet.",
    },
  },

  // ============================================
  // THEME
  // ============================================
  theme: {
    system: "System theme",
    light: "Light theme",
    dark: "Dark theme",
  },

  // ============================================
  // ASSISTANT
  // ============================================
  assistant: {
    defaultName: "Assistant",
    reasoning: "_Reasoning:_",
    tool: "Tool",
  },

  // ============================================
  // TOOL CARDS
  // ============================================
  toolCards: {
    view: "View",
    completed: "Completed",
    command: "Command:",
    noOutputSuccess: "No output — tool completed successfully.",
  },

  // ============================================
  // DEVICES & CONTROLLERS
  // ============================================
  devices: {
    confirmReject: "Reject this device pairing request?",
    newTokenPrompt: "New device token (copy and store safely):",
    confirmRevoke: "Revoke token for",
  },

  controllers: {
    selectDeviceFirst: "Select a device before loading exec approvals.",
    missingApprovalHash: "Missing exec approval hash; reload and try again.",
    selectDeviceBeforeSave: "Select a device before saving exec approvals.",
    noPresenceYet: "No instances yet.",
    noPresenceData: "No presence data.",
    invalidRunTime: "Invalid run time.",
    invalidIntervalAmount: "Invalid interval amount.",
    cronExprRequired: "Cron expression required.",
    systemEventTextRequired: "System event text required.",
    agentMessageRequired: "Agent message required.",
    nameRequired: "Name required.",
    error: "Error: ",
    importedFromRelays: "Imported profile from relays. Review and publish.",
    imported: "Imported profile. Review and publish.",
    importFailed: "Import profile failed: ",
    profilePublishFailed: "Profile publish failed on all relays.",
    profilePublished: "Profile published to relays.",
  },

  // ============================================
  // STATUS VALUES
  // ============================================
  status: {
    yes: "Yes",
    no: "No",
    na: "n/a",
    active: "Active",
    revoked: "revoked",
    never: "never",
    paired: "paired",
    unpaired: "unpaired",
    connected: "connected",
    offline: "offline",
    unknown: "unknown",
    ok: "ok",
    failed: "failed",
    probeOk: "Probe ok",
    probeFailed: "Probe failed",
  },

  // ============================================
  // NODES VIEW EXTENDED
  // ============================================
  nodesView: {
    refresh: "Refresh",
    loading: "Loading...",
    save: "Save",
    saving: "Saving...",
    loadConfig: "Load Config",
    loadApprovals: "Load Approvals",

    security: {
      deny: "Deny",
      allowlist: "Allowlist",
      full: "Full access",
      defaultMode: "Default security mode.",
      defaultIs: "Default:",
    },

    ask: {
      off: "Off",
      onMiss: "On miss",
      always: "Always",
      defaultPolicy: "Default ask policy.",
      defaultIs: "Default:",
      fallbackDesc: "Applied when ask UI is unavailable.",
    },

    autoAllow: {
      allowSkillExecs: "Allow skill executables listed by Gateway.",
      usingDefault: "Using default",
      override: "Override",
      on: "on",
      off: "off",
    },

    allowlist: {
      newPattern: "New pattern",
      lastUsed: "Last used: ",
    },

    binding: {
      defaultAgent: "default agent",
      agent: "agent",
      usesDefault: "uses default",
      any: "any",
    },

    noProfile: "No profile yet. Click \"Edit profile\" to add name, bio and avatar.",
    about: "About",
  },

  // ============================================
  // CHANNELS VIEW EXTENDED
  // ============================================
  channelsView: {
    noSnapshot: "No snapshot yet.",
    configured: "Configured",
    running: "Running",
    connected: "Connected",
    lastInbound: "Last inbound",
    linked: "Linked",
    showQr: "Show QR",
    processing: "Processing...",
    noProfile: "No profile yet. Click \"Edit profile\" to add name, bio and avatar.",
    loadingConfigSchema: "Loading config schema...",
    lastConnected: "Last connected",
    lastMessage: "Last message",
    authAge: "Auth age",
    relink: "Re-link",
    waitScan: "Wait scan",
    logout: "Logout",
    whatsappDesc: "Link WhatsApp Web and monitor connection health.",
    imessageDesc: "Link iMessage and track message status.",
    discordDesc: "Connect Discord bot and manage message routing.",
    slackDesc: "Connect Slack integration and manage channels.",
    telegramDesc: "Connect Telegram bots and manage message routing.",
    signalDesc: "Connect Signal and manage secure messaging.",
    googleChatDesc: "Connect Google Chat workspace integration.",
    nostrDesc: "Configure Nostr relays and publish events.",
    about: "About",
    editProfile: "Edit profile",
    pubkey: "Pubkey",
    relays: "Relays",
    copyNpub: "Copy npub",
    viewOnNostr: "View on nostr.band",
    probeOk: "Probe ok",
    probeFailed: "Probe failed",
    lastStart: "Last start",
    lastProbe: "Last probe",
    probe: "Probe",
    schemaUnavailable: "Schema unavailable. Use Raw mode.",
    channelSchemaUnavailable: "Channel config schema unavailable.",
    baseUrl: "Base URL",
    credentialSource: "Credential source",
    audience: "Audience",
    mode: "Mode",
    profile: "Profile",
    name: "Name",
    displayNameLabel: "Display name",
    nostrCardDesc: "Decentralized DM via Nostr relays (NIP-04).",
  },

  // ============================================
  // GATEWAY URL CONFIRMATION
  // ============================================
  gatewayUrlConfirm: {
    title: "Change Gateway URL",
    description: "This will reconnect to a different gateway server",
    warning: "Only confirm if you trust this URL. Malicious URLs can compromise your system.",
    confirm: "Confirm",
  },

  // ============================================
  // ERROR MESSAGES
  // ============================================
  errors: {
    failedToChangeModel: "Failed to change model:",
    disconnectedFromGateway: "Disconnected from gateway.",
    connectionFailed: "Connection failed",
    authFailed: "Authentication failed",
    loadFailed: "Load failed",
    saveFailed: "Save failed",
    unknownError: "Unknown error",
  },

  // ============================================
  // EXEC APPROVAL
  // ============================================
  execApproval: {
    title: "Execution approval required",
    expiresIn: "expires in",
    expired: "expired",
    pending: "pending",
    host: "Host",
    agent: "Agent",
    session: "Session",
    directory: "Directory",
    resolved: "Resolved",
    security: "Security",
    ask: "Ask",
    allowOnce: "Allow once",
    allowAlways: "Allow always",
    deny: "Deny",
  },

  // ============================================
  // MARKDOWN SIDEBAR
  // ============================================
  markdownSidebar: {
    title: "Tool result",
    close: "Close sidebar",
    viewRawText: "View raw text",
    noContent: "No content",
  },

  // ============================================
  // NOSTR PROFILE FORM
  // ============================================
  nostrProfile: {
    editTitle: "Edit profile",
    account: "Account:",
    avatarPreview: "Avatar preview",
    username: "Username",
    usernamePlaceholder: "satoshi",
    usernameHelp: "Short name (e.g., satoshi)",
    displayName: "Display name",
    displayNamePlaceholder: "Satoshi Nakamoto",
    displayNameHelp: "Your full display name",
    bio: "Bio",
    bioPlaceholder: "About yourself...",
    bioHelp: "Short description about yourself",
    avatarUrl: "Avatar URL",
    avatarUrlPlaceholder: "https://example.com/avatar.jpg",
    avatarUrlHelp: "HTTPS URL to your avatar",
    advanced: "Advanced",
    bannerUrl: "Banner URL",
    bannerUrlPlaceholder: "https://example.com/banner.jpg",
    bannerUrlHelp: "HTTPS URL to banner image",
    website: "Website",
    websitePlaceholder: "https://example.com",
    websiteHelp: "Your personal website",
    nip05: "NIP-05 Identifier",
    nip05Placeholder: "you@example.com",
    nip05Help: "Verifiable identifier (e.g., you@domain.com)",
    lightning: "Lightning Address",
    lightningPlaceholder: "you@getalby.com",
    lightningHelp: "Lightning address for receiving tips (LUD-16)",
    savePublish: "Save & Publish",
    saving: "Saving...",
    importFromRelay: "Import from Relay",
    importing: "Importing...",
    showAdvanced: "Show advanced",
    hideAdvanced: "Hide advanced",
    unsavedChanges: "You have unsaved changes",
  },
} as const;

export type EnTranslations = typeof en;
