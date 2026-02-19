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
    memory: "Memory",
    docs: "Docs",
    projects: "Projects",
    deploy: "Deploy",
    preview: "Preview",
    eldercare: "Eldercare",
    eldercareConfig: "Eldercare Config",

    // Groups - Minimal 2-group structure
    core: "Core",
    admin: "Admin",
    deployGroup: "Deploy",
    eldercare: "Eldercare",

    // Legacy groups (keep for compatibility)
    conversations: "CONVERSATIONS",
    connections: "CONNECTIONS",
    activity: "ACTIVITY",
    settings: "SETTINGS",
    resources: "RESOURCES",

    // Legacy groups (keep for compatibility)
    control: "CONTROL",
    agent: "AGENT",

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
      memory: "Browse and manage user facts extracted from conversations.",
      projects: "Manage projects, scan environments and check health.",
      deploy: "Deploy projects to production or staging targets.",
      preview: "Create and manage preview deployments with shareable URLs.",
      eldercare: "Monitor grandma's health, alerts, calls and daily activities.",
      eldercareConfig: "Configure monitoring thresholds, SOS contacts, music and video calls.",
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
      build: "Build app",
      code: "Write code",
      write: "Write text",
      create: "Create",
      learn: "Learn",
      analyze: "Analyze",
    },

    // Vibecode Kit
    vibecode: {
      quickStart: "Choose project type",
      landing: "Landing Page",
      saas: "SaaS App",
      dashboard: "Dashboard",
      blog: "Blog",
      portfolio: "Portfolio",
      steps: { vision: "VISION", context: "CONTEXT", blueprint: "BLUEPRINT", contract: "CONTRACT", build: "BUILD", refine: "REFINE" },
      viewBlueprint: "View Blueprint",
      buildingWith: "Building with Vibecode",
    },

    // Model selector
    selectModel: "Select model",
    apiKey: "API Key",
    enterApiKey: "Enter API key...",
    apiKeyNeeded: "Enter API key to start chatting",
    apiKeySaved: "API key saved!",
    configureApiKey: "Configure API key",
    saveToGateway: "Save to gateway (auth-profiles)",
    apiKeySaveError: "Failed to save — check console",
    apiKeySaving: "Saving...",

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
    attachFile: "Attach file",
    fileTooLarge: "File exceeds 5 MB limit",
    unsupportedFileType: "Unsupported file type",

    // Voice
    stopRecording: "Stop recording",
    voiceInput: "Voice input",
    microphoneError: "Cannot access microphone",
    voiceError: "Voice recognition error",
    voiceListening: "Listening...",
    voiceSpeaking: "Speaking...",
    ttsOn: "Enable voice response",
    ttsOff: "Disable voice response",

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
      insecureBanner: "Insecure mode active — security checks are relaxed.",
      insecureDetail: "This gateway has dangerous security overrides enabled. Review your config.",
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

    viewTable: "Table",
    viewCards: "Cards",

    card: {
      resume: "Resume",
      rename: "Rename",
      delete: "Delete",
      messages: "messages",
      noMessages: "No messages",
      untitled: "Untitled session",
    },

    switcher: {
      newSession: "New session",
      viewAll: "View all sessions",
      recentSessions: "Recent sessions",
      noSessions: "No recent sessions",
      current: "current",
    },
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

    catalog: {
      title: "Skills",
      hint: "Manage plugins, channels, tools and services.",
      search: "Search skills...",
      empty: "No skills found.",
      filters: {
        all: "All",
        installed: "Installed",
        channel: "Channels",
        tool: "Tools",
        service: "Services",
        memory: "Memory",
        provider: "Auth",
        skill: "Skills",
      },
      status: {
        active: "Active",
        disabled: "Disabled",
        needsConfig: "Needs config",
        error: "Error",
        notInstalled: "Not installed",
      },
      actions: {
        install: "Install",
        settings: "Settings",
        enable: "Enable",
        disable: "Disable",
      },
      settings: {
        title: "Settings: {name}",
        type: "Type",
        source: "Source",
        config: "Configuration",
        noConfig: "No configuration available.",
        envVars: "Environment variables",
        addEnvVar: "Add variable",
        save: "Save",
        cancel: "Cancel",
        saving: "Saving...",
      },
    },
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
      expired: "expired",
      expiresIn: "expires",
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
    tokenCopied: "Token copied to clipboard. Store it safely.",
    confirmRevoke: "Revoke token for",
    status: {
      active: "Active",
      expiring: "Expiring soon",
      expired: "Expired",
      revoked: "Revoked",
      pending: "Pending",
    },
    tokenExpiry: "Token expires:",
    tokenExpired: "Token expired",
    tokenNeverExpires: "Token never expires",
    lastIp: "Last IP:",
    renewToken: "Renew",
    copyToken: "Copy Token",
    tokenWarning: "Token shown once only. Save it now.",
    activity: "Recent activity",
    viewMore: "View more...",
    noActivity: "No activity yet",
    insecureBanner: "INSECURE MODE",
    insecureDetail: "Device auth is disabled. Not for production.",
    viewDetails: "View details",
    events: {
      auth_success: "Connected",
      auth_failure: "Login failed",
      "auth_rate-limited": "Locked out",
      device_paired: "Paired",
      device_rejected: "Pair rejected",
      token_rotate: "Token rotated",
      token_revoke: "Token revoked",
      token_renew: "Token renewed",
      token_expired: "Token expired",
      cors_rejected: "Origin rejected",
      ip_mismatch: "IP changed",
      ip_rejected: "IP rejected",
      scope_violation: "Permission denied",
      insecure_mode: "Insecure mode",
      session_created: "Session created",
      session_deleted: "Session deleted",
      session_reset: "Session reset",
    },
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
  // MEMORY
  // ============================================
  memory: {
    title: "Memory",
    search: "Search memories...",
    extractButton: "Extract",
    extracting: "Extracting...",
    extracted: "Extracted!",
    empty: "No memories yet.",
    privacy: "Memories are stored locally and never shared.",
    deleteConfirm: "Delete this memory?",
    save: "Save",
    cancel: "Cancel",
    verified: "Verified",
    unverified: "Unverified",
    // Indicator (chat header)
    indicatorActive: "memories active",
    indicatorOff: "Memory off",
    indicatorToggle: "Toggle memory",
    indicatorNone: "No memories",
    categories: {
      all: "All",
      identity: "Identity",
      preference: "Preference",
      project: "Project",
      relationship: "Relationship",
      skill: "Skill",
      fact: "Fact",
    },
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

  // ============================================
  // AGENT TABS
  // ============================================
  agentTabs: {
    newTab: "New tab",
    closeTab: "Close tab",
    closeConfirm: "Close this tab? The session will be archived.",
    rename: "Rename",
    presets: {
      title: "Choose agent type",
      code: "Code",
      writer: "Writer",
      research: "Research",
      translator: "Translator",
      custom: "Custom",
    },
    unread: "unread",
    pin: "Pin tab",
    unpin: "Unpin tab",
    splitView: "Split view",
    focusLeft: "Focus left pane",
    focusRight: "Focus right pane",
  },

  // ============================================
  // PROJECTS
  // ============================================
  projects: {
    title: "Projects",
    description: "Registered projects and environment health.",
    empty: "No projects found.",
    scan: "Scan",
    scanning: "Scanning...",
    scanned: "Scanned!",
    rescan: "Rescan",
    addProject: "Add Project",
    health: {
      healthy: "Healthy",
      warning: "Warning",
      error: "Error",
      unknown: "Unknown",
    },
    env: {
      title: "Environment",
      valid: "Valid",
      missing: "Missing variables",
      check: "Check env",
    },
    card: {
      lastDeploy: "Last deploy",
      platform: "Platform",
      branch: "Branch",
      never: "Never",
    },
  },

  // ============================================
  // DEPLOY
  // ============================================
  deploy: {
    title: "Deploy",
    description: "Deploy projects to production or staging.",
    empty: "No deployments yet.",
    start: "Deploy",
    deploying: "Deploying...",
    cancel: "Cancel",
    platform: "Platform",
    target: "Target",
    branch: "Branch",
    selectProject: "Select project",
    selectPlatform: "Select platform",
    platforms: {
      fly: "Fly.io",
      railway: "Railway",
      vercel: "Vercel",
      docker: "Docker",
      custom: "Custom",
    },
    targets: {
      production: "Production",
      staging: "Staging",
      preview: "Preview",
    },
    status: {
      pending: "Pending",
      building: "Building",
      deploying: "Deploying",
      success: "Success",
      failed: "Failed",
      cancelled: "Cancelled",
    },
    log: {
      title: "Deploy Log",
      empty: "No output yet.",
      copy: "Copy log",
      download: "Download log",
    },
    history: {
      title: "History",
      empty: "No deploy history.",
      viewLog: "View log",
    },
    confirm: {
      title: "Confirm deploy",
      message: "Deploy {project} to {target}?",
      proceed: "Deploy now",
    },
  },

  // ============================================
  // PREVIEW
  // ============================================
  preview: {
    title: "Preview",
    description: "Preview deployments with shareable URLs.",
    empty: "No preview deployments.",
    create: "Create Preview",
    creating: "Creating...",
    delete: "Delete",
    deleting: "Deleting...",
    promote: "Promote to production",
    promoting: "Promoting...",
    open: "Open preview",
    copyUrl: "Copy URL",
    urlCopied: "URL copied!",
    iframe: {
      title: "Preview",
      loading: "Loading preview...",
      openExternal: "Open in new tab",
    },
    card: {
      branch: "Branch",
      created: "Created",
      expires: "Expires",
      url: "URL",
    },
    form: {
      project: "Project",
      branch: "Branch",
      branchPlaceholder: "feature/my-branch",
    },
  },

  // ============================================
  // ELDERCARE — GRANDMA CARE
  // ============================================
  eldercare: {
    // Dashboard
    grandmaStatus: "Grandma Status",
    roomEnvironment: "Room Environment",
    familyCalls: "Family Calls",
    companionActivity: "Companion Activity",
    presence: "Presence",
    inRoom: "In room",
    noMotion: "No motion",
    currentLevel: "Current Level",
    checksToday: "Checks Today",
    alertsToday: "Alerts Today",
    temperature: "Temperature",
    humidity: "Humidity",
    motion: "Motion",
    tempOutOfRange: "⚠️ Temperature outside comfort range (20-35°C)",
    humidityOutOfRange: "⚠️ Humidity outside comfort range (40-80%)",
    musicSessions: "Music Sessions",
    reminders: "Reminders",
    storyActive: "Story Active",
    yes: "Yes",
    no: "No",
    noCalls: "No one called grandma today",
    sosActive: "SOS ACTIVE — Needs immediate attention!",
    sosActiveShort: "Active",
    resolved: "Resolved",
    sosEventsToday: "SOS Events Today",
    lastReport: "Latest Report",
    haOffline: "HA offline",
    refreshing: "Loading...",
    levels: {
      normal: "Normal",
      attention: "Attention",
      warning: "Warning",
      emergency: "Emergency",
    } as Record<string, string>,
    // Config sections
    configSections: {
      monitor: "Monitor",
      sos: "SOS",
      companion: "Companion",
      videocall: "Video Call",
    } as Record<string, string>,
    config: {
      monitorThresholds: "Monitor Thresholds",
      noMotionAttention: "No motion → Attention (min)",
      noMotionWarning: "No motion → Warning (min)",
      noMotionEmergency: "No motion → Emergency (min)",
      minutesHint: "Minutes without motion before alert",
      temperatureThresholds: "Temperature Thresholds",
      tempLow: "Low temperature (°C)",
      tempHigh: "High temperature (°C)",
      haEntities: "Entity IDs (Home Assistant)",
      sosContacts: "SOS Contacts",
      noContacts: "No SOS contacts configured",
      contactsHint: "Edit via memory key eldercare_contacts",
      escalationLevels: "Escalation Levels",
      level1Desc: "Send to Zalo family group",
      level2Desc: "Send Telegram + Zalo",
      level3Desc: "Call everyone + continuous alerts",
      minutes: "min",
      musicSettings: "Music Settings",
      defaultPlaylist: "Default Playlist",
      volume: "Volume (0-1)",
      ttsSettings: "TTS Settings",
      ttsRate: "Speech Rate",
      ttsRateHint: "0.8 = slower than normal (better for grandma)",
      ttsVoice: "TTS Voice",
      tabletSettings: "Tablet Settings",
      tabletIp: "Tablet IP",
      fullyKioskPassword: "Fully Kiosk Password",
      scheduleSettings: "Call Schedule",
      morningReminder: "Morning Reminder Time",
      quietHoursStart: "Quiet Hours Start",
      quietHoursEnd: "Quiet Hours End",
    },
  },
} as const;

export type EnTranslations = typeof en;
