// Vietnamese translations for OpenClaw UI
// Bản dịch tiếng Việt cho giao diện OpenClaw

export const vi = {
  // ============================================
  // NAVIGATION & LAYOUT
  // ============================================
  nav: {
    chat: "Trò chuyện",
    overview: "Tổng quan",
    channels: "Kênh kết nối",
    instances: "Phiên bản",
    sessions: "Phiên làm việc",
    cronJobs: "Lịch trình",
    skills: "Kỹ năng",
    nodes: "Thiết bị",
    config: "Cấu hình",
    debug: "Gỡ lỗi",
    logs: "Nhật ký",
    memory: "Trí nhớ",
    docs: "Tài liệu",
    projects: "Dự án",
    deploy: "Triển khai",
    preview: "Xem trước",
    eldercare: "Bà nội care",
    eldercareConfig: "Cài đặt eldercare",

    // Groups - Minimal 2-group structure
    core: "Chính",
    admin: "Quản trị",
    deployGroup: "Triển khai",
    eldercare: "Bà nội care",

    // Legacy groups (keep for compatibility)
    conversations: "HỘI THOẠI",
    connections: "KẾT NỐI",
    activity: "HOẠT ĐỘNG",
    settings: "CÀI ĐẶT",
    resources: "TÀI NGUYÊN",

    // Legacy groups (keep for compatibility)
    control: "ĐIỀU KHIỂN",
    agent: "TÁC TỬ",

    // Subtitles
    subtitles: {
      overview: "Trạng thái gateway, điểm truy cập và kiểm tra sức khỏe nhanh.",
      channels: "Quản lý kênh và cài đặt.",
      instances: "Tín hiệu hiện diện từ các client và nút đã kết nối.",
      sessions: "Kiểm tra phiên hoạt động và điều chỉnh mặc định theo phiên.",
      cron: "Lên lịch đánh thức và chạy tác tử định kỳ.",
      skills: "Quản lý khả dụng kỹ năng và tiêm khóa API.",
      nodes: "Thiết bị đã ghép nối, khả năng và phơi bày lệnh.",
      chat: "Phiên trò chuyện gateway trực tiếp cho can thiệp nhanh.",
      config: "Chỉnh sửa ~/.openclaw/openclaw.json an toàn.",
      debug: "Ảnh chụp gateway, sự kiện và gọi RPC thủ công.",
      logs: "Theo dõi trực tiếp nhật ký tệp gateway.",
      memory: "Duyệt và quản lý sự kiện người dùng trích xuất từ hội thoại.",
      projects: "Quản lý dự án, quét môi trường và kiểm tra sức khỏe.",
      deploy: "Triển khai dự án lên production hoặc staging.",
      preview: "Tạo và quản lý bản triển khai xem trước với URL chia sẻ.",
      eldercare: "Giám sát sức khỏe bà, cảnh báo, cuộc gọi và hoạt động hàng ngày.",
      eldercareConfig: "Cấu hình ngưỡng giám sát, danh bạ SOS, nhạc và video call.",
    },
  },

  // ============================================
  // COMMON / SHARED
  // ============================================
  common: {
    loading: "Đang tải…",
    refresh: "Làm mới",
    save: "Lưu",
    saving: "Đang lưu…",
    cancel: "Hủy",
    delete: "Xóa",
    edit: "Sửa",
    add: "Thêm",
    remove: "Xóa",
    enable: "Bật",
    disable: "Tắt",
    enabled: "Đã bật",
    disabled: "Đã tắt",
    yes: "Có",
    no: "Không",
    ok: "OK",
    apply: "Áp dụng",
    update: "Cập nhật",
    reload: "Tải lại",
    export: "Xuất",
    import: "Nhập",
    search: "Tìm kiếm",
    filter: "Lọc",
    all: "Tất cả",
    none: "Không có",
    unknown: "Không xác định",
    na: "N/A",
    connect: "Kết nối",
    disconnect: "Ngắt kết nối",
    connected: "Đã kết nối",
    disconnected: "Mất kết nối",
    offline: "Ngoại tuyến",
    online: "Trực tuyến",
    active: "Hoạt động",
    inactive: "Không hoạt động",
    pending: "Đang chờ",
    running: "Đang chạy",
    stopped: "Đã dừng",
    error: "Lỗi",
    success: "Thành công",
    warning: "Cảnh báo",
    info: "Thông tin",
    status: "Trạng thái",
    actions: "Thao tác",
    details: "Chi tiết",
    options: "Tùy chọn",
    settings: "Cài đặt",
    configuration: "Cấu hình",
    default: "Mặc định",
    custom: "Tùy chỉnh",
    inherit: "Kế thừa",
    override: "Ghi đè",
    useDefault: "Dùng mặc định",
    change: "thay đổi",
    changes: "thay đổi",
    valid: "hợp lệ",
    invalid: "không hợp lệ",
    unsaved: "chưa lưu",
    optional: "tùy chọn",
  },

  // ============================================
  // HEALTH STATUS
  // ============================================
  health: {
    title: "Sức khỏe",
    ok: "Tốt",
    offline: "Ngoại tuyến",
    degraded: "Suy giảm",
  },

  // ============================================
  // SIDEBAR
  // ============================================
  sidebar: {
    expand: "Mở rộng thanh bên",
    collapse: "Thu gọn thanh bên",
    docs: "Tài liệu (mở tab mới)",
  },

  // ============================================
  // CHAT VIEW
  // ============================================
  chat: {
    title: "Trò chuyện",
    placeholder: "Hôm nay tôi có thể giúp gì cho bạn?",
    inputPlaceholder: "Nhập tin nhắn (↩ gửi, Shift+↩ xuống dòng, dán ảnh)",
    inputPlaceholderWithImages: "Thêm tin nhắn hoặc dán thêm ảnh...",
    connectPrompt: "Kết nối tới gateway để bắt đầu trò chuyện…",
    loadingChat: "Đang tải cuộc trò chuyện…",
    connectButton: "Kết nối gateway...",

    // Compaction
    compacting: "Đang nén ngữ cảnh...",
    compacted: "Đã nén ngữ cảnh",

    // Queue
    queued: "Đang chờ",
    image: "Ảnh",
    removeQueued: "Xóa tin nhắn đang chờ",

    // Quick actions
    quickActions: {
      build: "Build app",
      code: "Viết mã",
      write: "Soạn văn",
      create: "Tạo mới",
      learn: "Học hỏi",
      analyze: "Phân tích",
    },

    // Vibecode Kit
    vibecode: {
      quickStart: "Chọn loại dự án",
      landing: "Landing Page",
      saas: "Ứng dụng SaaS",
      dashboard: "Dashboard",
      blog: "Blog",
      portfolio: "Portfolio",
      steps: { vision: "VISION", context: "CONTEXT", blueprint: "BLUEPRINT", contract: "CONTRACT", build: "BUILD", refine: "REFINE" },
      viewBlueprint: "Xem Blueprint",
      buildingWith: "Đang build với Vibecode",
    },

    // Model selector
    selectModel: "Chọn mô hình",
    apiKey: "Khóa API",
    enterApiKey: "Nhập khóa API...",
    apiKeyNeeded: "Nhập khóa API để bắt đầu trò chuyện",
    apiKeySaved: "Đã lưu khóa API!",
    configureApiKey: "Cài đặt khóa API",
    saveToGateway: "Lưu vào gateway (auth-profiles)",
    apiKeySaveError: "Lưu thất bại — xem console",
    apiKeySaving: "Đang lưu...",

    // Providers
    providers: {
      anthropic: "Anthropic",
      openai: "OpenAI",
      google: "Google",
    },

    // Attachments
    attachmentPreview: "Xem trước tệp đính kèm",
    removeAttachment: "Xóa tệp đính kèm",
    attachImage: "Đính kèm ảnh",
    attachFile: "Đính kèm tệp",
    fileTooLarge: "Tệp vượt quá giới hạn 5 MB",
    unsupportedFileType: "Loại tệp không được hỗ trợ",

    // Voice
    stopRecording: "Dừng ghi âm",
    voiceInput: "Nhập giọng nói",
    microphoneError: "Không thể truy cập microphone",
    voiceError: "Lỗi nhận dạng giọng nói",
    voiceListening: "Đang nghe...",
    voiceSpeaking: "Đang nói...",
    ttsOn: "Bật đọc phản hồi",
    ttsOff: "Tắt đọc phản hồi",

    // Send button
    stop: "Dừng",
    sendMessage: "Gửi tin nhắn",

    // Control buttons
    refreshData: "Làm mới dữ liệu chat",
    toggleThinking: "Bật/tắt hiển thị suy nghĩ/hoạt động của trợ lý",
    toggleFocus: "Bật/tắt chế độ tập trung (ẩn thanh bên + đầu trang)",
    disabledDuringSetup: "Vô hiệu trong quá trình thiết lập",
    gatewayDisconnected: "Mất kết nối gateway.",

    // Copy
    copyAsMarkdown: "Sao chép dạng markdown",
    copied: "Đã sao chép",
    copyFailed: "Sao chép thất bại",

    // User label
    you: "Bạn",

    // Avatar initials
    userInitial: "B",
    assistantDefault: "Trợ lý",
  },

  // ============================================
  // OVERVIEW / DASHBOARD
  // ============================================
  overview: {
    title: "Tổng quan",

    // Gateway Access
    gatewayAccess: {
      title: "Truy cập Gateway",
      description: "Nơi bảng điều khiển kết nối và cách xác thực.",
      websocketUrl: "URL WebSocket",
      gatewayToken: "Token Gateway",
      password: "Mật khẩu (không lưu)",
      passwordPlaceholder: "mật khẩu hệ thống hoặc chung",
      defaultSessionKey: "Khóa phiên mặc định",
      clickConnect: "Nhấn Kết nối để áp dụng thay đổi.",
      authRequired: "Gateway này yêu cầu xác thực. Thêm token hoặc mật khẩu, sau đó nhấn Kết nối.",
      authFailed: "Xác thực thất bại. Sao chép lại URL có token với",
      orUpdateToken: ", hoặc cập nhật token, sau đó nhấn Kết nối.",
      httpWarning: "Trang này dùng HTTP, trình duyệt chặn định danh thiết bị. Dùng HTTPS (Tailscale Serve) hoặc mở",
      onGatewayHost: "trên máy chủ gateway.",
      httpFallback: "Nếu bắt buộc dùng HTTP, đặt",
      tokenOnly: "(chỉ token).",
      insecureBanner: "Chế độ không an toàn — các kiểm tra bảo mật đã được nới lỏng.",
      insecureDetail: "Gateway này có các ghi đè bảo mật nguy hiểm được bật. Kiểm tra lại cấu hình.",
    },

    // Snapshot
    snapshot: {
      title: "Ảnh chụp",
      description: "Thông tin bắt tay gateway mới nhất.",
      uptime: "Thời gian hoạt động",
      tickInterval: "Chu kỳ tick",
      lastChannelsRefresh: "Làm mới kênh lần cuối",
      useChannels: "Dùng Kênh kết nối để liên kết WhatsApp, Telegram, Discord, Signal, hoặc iMessage.",
    },

    // Statistics
    stats: {
      instances: "Phiên bản",
      instancesDesc: "Tín hiệu hiện diện trong 5 phút qua.",
      sessions: "Phiên làm việc",
      sessionsDesc: "Khóa phiên gần đây được gateway theo dõi.",
      cron: "Lịch trình",
      nextWake: "Lần đánh thức tiếp",
    },

    // Notes
    notes: {
      title: "Ghi chú",
      description: "Nhắc nhở nhanh cho thiết lập điều khiển từ xa.",
      tailscale: "Tailscale serve",
      tailscaleDesc: "Ưu tiên chế độ serve để giữ gateway trên loopback với xác thực tailnet.",
      sessionHygiene: "Vệ sinh phiên",
      sessionHygieneDesc: "Dùng /new hoặc sessions.patch để đặt lại ngữ cảnh.",
      cronReminders: "Nhắc nhở lịch trình",
      cronRemindersDesc: "Dùng phiên cô lập cho các lần chạy định kỳ.",
    },
  },

  // ============================================
  // CHANNELS
  // ============================================
  channels: {
    title: "Kênh kết nối",

    health: {
      title: "Sức khỏe kênh",
      description: "Ảnh chụp trạng thái kênh từ gateway.",
      noSnapshot: "Chưa có ảnh chụp.",
    },

    status: {
      configured: "Đã cấu hình",
      connected: "Đã kết nối",
      lastInbound: "Tin nhắn đến cuối",
      active: "Hoạt động",
    },
  },

  // ============================================
  // INSTANCES
  // ============================================
  instances: {
    title: "Phiên bản kết nối",
    description: "Tín hiệu hiện diện từ gateway và các client.",
    empty: "Chưa có phiên bản nào được báo cáo.",
    unknownHost: "máy chủ không xác định",
    lastInput: "Nhập liệu cuối",
    reason: "Lý do",
    secondsAgo: "giây trước",
  },

  // ============================================
  // SESSIONS
  // ============================================
  sessions: {
    title: "Phiên làm việc",
    description: "Khóa phiên hoạt động và tùy chỉnh theo phiên.",

    filters: {
      activeWithin: "Hoạt động trong (phút)",
      limit: "Giới hạn",
      includeGlobal: "Bao gồm toàn cục",
      includeUnknown: "Bao gồm không xác định",
    },

    table: {
      key: "Khóa",
      label: "Nhãn",
      kind: "Loại",
      updated: "Cập nhật",
      tokens: "Token",
      thinking: "Suy nghĩ",
      verbose: "Chi tiết",
      reasoning: "Lý luận",
    },

    options: {
      inherit: "kế thừa",
      offExplicit: "tắt (rõ ràng)",
      on: "bật",
    },

    empty: "Không tìm thấy phiên nào.",
    store: "Kho lưu trữ:",

    viewTable: "Bảng",
    viewCards: "Thẻ",

    card: {
      resume: "Tiếp tục",
      rename: "Đổi tên",
      delete: "Xoá",
      messages: "tin nhắn",
      noMessages: "Chưa có tin nhắn",
      untitled: "Phiên chưa đặt tên",
    },

    switcher: {
      newSession: "Phiên mới",
      viewAll: "Xem tất cả phiên",
      recentSessions: "Phiên gần đây",
      noSessions: "Không có phiên gần đây",
      current: "đang mở",
    },
  },

  // ============================================
  // CRON / SCHEDULER
  // ============================================
  cron: {
    title: "Lịch trình",

    scheduler: {
      title: "Bộ lập lịch",
      description: "Trạng thái bộ lập lịch cron của gateway.",
      jobs: "Công việc",
      nextWake: "Lần đánh thức tiếp",
      refreshing: "Đang làm mới…",
    },

    newJob: {
      title: "Công việc mới",
      description: "Tạo lịch đánh thức hoặc chạy tác tử.",
      name: "Tên",
      jobDescription: "Mô tả",
      agentId: "ID Tác tử",
      schedule: "Lịch trình",
      every: "Mỗi",
      at: "Lúc",
      cronExpr: "Biểu thức Cron",
      session: "Phiên",
      sessionMain: "Chính",
      sessionIsolated: "Cô lập",
      wakeMode: "Chế độ đánh thức",
      nextHeartbeat: "Nhịp tim tiếp theo",
      now: "Ngay bây giờ",
      payload: "Nội dung",
      systemEvent: "Sự kiện hệ thống",
      agentTurn: "Lượt tác tử",
      systemText: "Văn bản hệ thống",
      agentMessage: "Tin nhắn tác tử",
      deliver: "Gửi đến",
      channel: "Kênh",
      to: "Tới",
      toPlaceholder: "+1555… hoặc chat id",
      timeout: "Hết giờ (giây)",
      postToMainPrefix: "Đăng vào tiền tố chính",
      addJob: "Thêm công việc",
    },

    jobs: {
      title: "Danh sách công việc",
      description: "Tất cả công việc đã lên lịch trong gateway.",
      empty: "Chưa có công việc nào.",
      run: "Chạy",
      runs: "Lịch sử chạy",
    },

    runHistory: {
      title: "Lịch sử chạy",
      latestRuns: "Các lần chạy gần nhất của",
      selectJob: "(chọn công việc)",
      selectPrompt: "Chọn một công việc để xem lịch sử chạy.",
      empty: "Chưa có lần chạy nào.",
    },

    schedule: {
      runAt: "Chạy lúc",
      unit: "Đơn vị",
      minutes: "Phút",
      hours: "Giờ",
      days: "Ngày",
      expression: "Biểu thức",
      timezone: "Múi giờ (tùy chọn)",
    },
  },

  // ============================================
  // SKILLS
  // ============================================
  skills: {
    title: "Kỹ năng",
    description: "Kỹ năng tích hợp, quản lý và workspace.",

    filter: {
      search: "Tìm kỹ năng",
      shown: "hiển thị",
    },

    empty: "Không tìm thấy kỹ năng nào.",

    status: {
      disabled: "đã tắt",
      blockedByAllowlist: "bị chặn bởi danh sách cho phép",
      eligible: "đủ điều kiện",
      blocked: "bị chặn",
      missing: "Thiếu:",
      reason: "Lý do:",
      installing: "Đang cài đặt…",
    },

    apiKey: "Khóa API",
    saveKey: "Lưu khóa",

    catalog: {
      title: "Kỹ năng",
      hint: "Quản lý plugin, kênh, công cụ và dịch vụ.",
      search: "Tìm kỹ năng...",
      empty: "Không tìm thấy kỹ năng nào.",
      filters: {
        all: "Tất cả",
        installed: "Đã cài",
        channel: "Kênh",
        tool: "Công cụ",
        service: "Dịch vụ",
        memory: "Bộ nhớ",
        provider: "Xác thực",
        skill: "Kỹ năng",
      },
      status: {
        active: "Hoạt động",
        disabled: "Đã tắt",
        needsConfig: "Cần cấu hình",
        error: "Lỗi",
        notInstalled: "Chưa cài",
      },
      actions: {
        install: "Cài đặt",
        settings: "Cài đặt",
        enable: "Bật",
        disable: "Tắt",
      },
      settings: {
        title: "Cài đặt: {name}",
        type: "Loại",
        source: "Nguồn",
        config: "Cấu hình",
        noConfig: "Không có cấu hình.",
        envVars: "Biến môi trường",
        addEnvVar: "Thêm biến",
        save: "Lưu",
        cancel: "Hủy",
        saving: "Đang lưu...",
      },
    },
  },

  // ============================================
  // NODES / DEVICES
  // ============================================
  nodes: {
    title: "Thiết bị",

    nodes: {
      title: "Nút",
      description: "Thiết bị đã ghép nối và liên kết trực tiếp.",
      empty: "Không tìm thấy nút nào.",
    },

    devices: {
      title: "Thiết bị",
      description: "Yêu cầu ghép nối + token vai trò.",
      pending: "Đang chờ",
      paired: "Đã ghép nối",
      empty: "Không có thiết bị đã ghép nối.",
      approve: "Chấp nhận",
      reject: "Từ chối",
    },

    deviceDetails: {
      role: "vai trò:",
      requested: "đã yêu cầu",
      repair: "sửa chữa",
      roles: "vai trò:",
      scopes: "phạm vi:",
      tokensNone: "Token: không có",
      tokens: "Token",
      active: "hoạt động",
      revoked: "đã thu hồi",
      expired: "hết hạn",
      expiresIn: "hết hạn",
      rotate: "Xoay vòng",
      revoke: "Thu hồi",
    },

    execBinding: {
      title: "Ràng buộc nút Exec",
      description: "Ghim tác tử vào nút cụ thể khi dùng",
      switchToForm: "Chuyển tab Cấu hình sang chế độ",
      formMode: "Form",
      toEditBindings: "để sửa ràng buộc tại đây.",
      loadConfig: "Tải cấu hình để sửa ràng buộc.",
      loadConfigBtn: "Tải cấu hình",
      defaultBinding: "Ràng buộc mặc định",
      defaultBindingDesc: "Dùng khi tác tử không ghi đè ràng buộc nút.",
      node: "Nút",
      anyNode: "Bất kỳ nút nào",
      noNodesAvailable: "Không có nút nào có system.run khả dụng.",
      noAgents: "Không tìm thấy tác tử nào.",
    },

    execApprovals: {
      title: "Phê duyệt Exec",
      description: "Danh sách cho phép và chính sách phê duyệt cho",
      loadApprovals: "Tải phê duyệt exec để sửa danh sách cho phép.",
      loadApprovalsBtn: "Tải phê duyệt",
      target: "Mục tiêu",
      targetDesc: "Gateway sửa phê duyệt cục bộ; nút sửa nút đã chọn.",
      host: "Máy chủ",
      gateway: "Gateway",
      selectNode: "Chọn nút",
      noNodesYet: "Chưa có nút nào quảng bá phê duyệt exec.",
      scope: "Phạm vi",
      defaults: "Mặc định",
    },

    security: {
      title: "Bảo mật",
      description: "Chế độ bảo mật mặc định.",
      default: "Mặc định:",
      mode: "Chế độ",
      deny: "Từ chối",
      allowlist: "Danh sách cho phép",
      full: "Đầy đủ",
    },

    ask: {
      title: "Hỏi",
      description: "Chính sách hỏi mặc định.",
      off: "Tắt",
      onMiss: "Khi thiếu",
      always: "Luôn luôn",
      fallback: "Dự phòng hỏi",
      fallbackDesc: "Áp dụng khi giao diện hỏi không khả dụng.",
    },

    autoAllowSkills: {
      title: "Tự động cho phép CLI kỹ năng",
      description: "Cho phép các tệp thực thi kỹ năng được Gateway liệt kê.",
      usingDefault: "Dùng mặc định",
      on: "bật",
      off: "tắt",
    },

    allowlist: {
      title: "Danh sách cho phép",
      description: "Mẫu glob không phân biệt hoa thường.",
      addPattern: "Thêm mẫu",
      empty: "Chưa có mục danh sách cho phép nào.",
      newPattern: "Mẫu mới",
      lastUsed: "Dùng lần cuối: ",
      never: "chưa bao giờ",
      pattern: "Mẫu",
    },

    agentBinding: {
      defaultAgent: "tác tử mặc định",
      agent: "tác tử",
      usesDefault: "dùng mặc định",
      any: "bất kỳ",
      override: "ghi đè:",
      binding: "Ràng buộc",
    },

    nodeStatus: {
      paired: "đã ghép nối",
      unpaired: "chưa ghép nối",
      connected: "đã kết nối",
      offline: "ngoại tuyến",
    },
  },

  // ============================================
  // CONFIG
  // ============================================
  config: {
    title: "Cấu hình",

    search: "Tìm kiếm...",

    mode: {
      form: "Form",
      raw: "Raw",
    },

    diff: {
      view: "Xem",
      pendingChange: "thay đổi đang chờ",
      pendingChanges: "thay đổi đang chờ",
    },

    form: {
      loadingSchema: "Đang tải schema…",
      rawWarning: "Chế độ Form không thể sửa an toàn một số trường. Dùng Raw để tránh mất mục cấu hình.",
      rawJson: "JSON5 Raw",
      schemaUnavailable: "Schema không khả dụng.",
      schemaUnsupported: "Schema không được hỗ trợ. Dùng chế độ Raw.",
      noMatchingSettings: "Không có cài đặt nào khớp",
      noSettingsInSection: "Không có cài đặt trong mục này",
      unsupportedType: "Loại không được hỗ trợ",
      useRawMode: "Dùng chế độ Raw.",
      resetToDefault: "Đặt lại mặc định",
      select: "Chọn...",
      unsupportedArraySchema: "Schema mảng không được hỗ trợ. Dùng chế độ Raw.",
      items: "mục",
      item: "mục",
      add: "Thêm",
      noItems: "Chưa có mục nào. Nhấn \"Thêm\" để tạo mới.",
      removeItem: "Xóa mục",
      customEntries: "Mục tùy chỉnh",
      addEntry: "Thêm mục",
      noCustomEntries: "Không có mục tùy chỉnh.",
      key: "Khóa",
      jsonValue: "Giá trị JSON",
    },

    sections: {
      all: "Tất cả",
      environment: "Môi trường",
      updates: "Cập nhật",
      agents: "Tác tử",
      authentication: "Xác thực",
      channels: "Kênh",
      messages: "Tin nhắn",
      commands: "Lệnh",
      hooks: "Hook",
      skills: "Kỹ năng",
      tools: "Công cụ",
      gateway: "Gateway",
      setupWizard: "Hướng dẫn cài đặt",
    },

    sectionDescriptions: {
      env: "Biến môi trường truyền vào tiến trình gateway",
      update: "Cài đặt tự động cập nhật và kênh phát hành",
      agents: "Cấu hình tác tử, mô hình và danh tính",
      auth: "Khóa API và hồ sơ xác thực",
      channels: "Kênh nhắn tin (Telegram, Discord, Slack, v.v.)",
      messages: "Xử lý và định tuyến tin nhắn",
      commands: "Lệnh slash tùy chỉnh",
      hooks: "Webhook và hook sự kiện",
      skills: "Gói kỹ năng và khả năng",
      tools: "Cấu hình công cụ (trình duyệt, tìm kiếm, v.v.)",
      gateway: "Cài đặt máy chủ gateway (cổng, xác thực, liên kết)",
      wizard: "Trạng thái và lịch sử trình hướng dẫn thiết lập",
      meta: "Siêu dữ liệu và thông tin phiên bản gateway",
      logging: "Cấp độ nhật ký và cấu hình đầu ra",
      browser: "Cài đặt tự động hóa trình duyệt",
      ui: "Tùy chọn giao diện người dùng",
      models: "Cấu hình mô hình AI và nhà cung cấp",
      bindings: "Liên kết phím và phím tắt",
      broadcast: "Cài đặt phát sóng và thông báo",
      audio: "Cài đặt đầu vào/đầu ra âm thanh",
      session: "Quản lý và lưu trữ phiên",
      cron: "Tác vụ theo lịch và tự động hóa",
      web: "Cài đặt máy chủ web và API",
      discovery: "Khám phá dịch vụ và mạng",
      canvasHost: "Kết xuất và hiển thị canvas",
      talk: "Cài đặt giọng nói và lời nói",
      plugins: "Quản lý plugin và tiện ích mở rộng",
    },
  },

  // ============================================
  // LOGS
  // ============================================
  logs: {
    title: "Nhật ký",
    description: "Nhật ký tệp Gateway (JSONL).",

    filter: {
      search: "Tìm nhật ký",
      autoFollow: "Tự động theo dõi",
    },

    levels: {
      trace: "trace",
      debug: "debug",
      info: "info",
      warn: "warn",
      error: "error",
      fatal: "fatal",
    },

    file: "Tệp:",
    truncated: "Đầu ra nhật ký đã cắt bớt; hiển thị phần mới nhất.",
    empty: "Không có mục nhật ký nào.",
    filtered: "đã lọc",
    visible: "hiển thị",
  },

  // ============================================
  // DEBUG
  // ============================================
  debug: {
    title: "Gỡ lỗi",

    snapshots: {
      title: "Ảnh chụp",
      description: "Dữ liệu trạng thái, sức khỏe và nhịp tim.",
      refreshing: "Đang làm mới…",
      status: "Trạng thái",
      securityAudit: "Kiểm tra bảo mật:",
      critical: "nghiêm trọng",
      warnings: "cảnh báo",
      noCritical: "Không có vấn đề nghiêm trọng",
      health: "Sức khỏe",
      lastHeartbeat: "Nhịp tim cuối",
      forDetails: "để biết chi tiết.",
    },

    rpc: {
      title: "RPC Thủ công",
      description: "Gửi phương thức gateway raw với tham số JSON.",
      method: "Phương thức",
      methodPlaceholder: "system-presence",
      params: "Tham số (JSON)",
      call: "Gọi",
    },

    models: {
      title: "Mô hình",
      description: "Danh mục từ models.list.",
    },

    eventLog: {
      title: "Nhật ký sự kiện",
      description: "Các sự kiện gateway gần nhất.",
      empty: "Chưa có sự kiện nào.",
    },
  },

  // ============================================
  // THEME
  // ============================================
  theme: {
    system: "Chủ đề hệ thống",
    light: "Chủ đề sáng",
    dark: "Chủ đề tối",
  },

  // ============================================
  // ASSISTANT
  // ============================================
  assistant: {
    defaultName: "Trợ lý",
    reasoning: "_Suy luận:_",
    tool: "Công cụ",
  },

  // ============================================
  // TOOL CARDS
  // ============================================
  toolCards: {
    view: "Xem",
    completed: "Hoàn thành",
    command: "Lệnh:",
    noOutputSuccess: "Không có đầu ra — công cụ hoàn thành thành công.",
  },

  // ============================================
  // DEVICES & CONTROLLERS
  // ============================================
  devices: {
    confirmReject: "Từ chối yêu cầu ghép nối thiết bị này?",
    newTokenPrompt: "Token thiết bị mới (sao chép và lưu trữ an toàn):",
    tokenCopied: "Đã sao chép token vào clipboard. Lưu trữ an toàn.",
    confirmRevoke: "Thu hồi token cho",
    status: {
      active: "Hoạt động",
      expiring: "Sắp hết hạn",
      expired: "Hết hạn",
      revoked: "Đã thu hồi",
      pending: "Chờ duyệt",
    },
    tokenExpiry: "Token hết hạn:",
    tokenExpired: "Token đã hết hạn",
    tokenNeverExpires: "Token không hết hạn",
    lastIp: "IP gần nhất:",
    renewToken: "Gia hạn",
    copyToken: "Copy Token",
    tokenWarning: "Token chỉ hiển thị 1 lần. Lưu lại ngay.",
    activity: "Hoạt động gần đây",
    viewMore: "Xem thêm...",
    noActivity: "Chưa có hoạt động nào",
    insecureBanner: "CHẾ ĐỘ KHÔNG AN TOÀN",
    insecureDetail: "Xác thực thiết bị đang bị tắt. Không dùng cho production.",
    viewDetails: "Xem chi tiết",
    events: {
      auth_success: "Kết nối thành công",
      auth_failure: "Đăng nhập thất bại",
      "auth_rate-limited": "Bị khoá tạm thời",
      device_paired: "Ghép nối thành công",
      device_rejected: "Từ chối ghép nối",
      token_rotate: "Xoay token",
      token_revoke: "Thu hồi token",
      token_renew: "Gia hạn token",
      token_expired: "Token hết hạn",
      cors_rejected: "Origin bị từ chối",
      ip_mismatch: "IP thay đổi",
      ip_rejected: "IP bị từ chối",
      scope_violation: "Không đủ quyền",
      insecure_mode: "Chế độ không an toàn",
      session_created: "Tạo phiên mới",
      session_deleted: "Xoá phiên",
      session_reset: "Reset phiên",
    },
  },

  controllers: {
    selectDeviceFirst: "Chọn một thiết bị trước khi tải phê duyệt exec.",
    missingApprovalHash: "Thiếu hash phê duyệt exec; tải lại và thử lại.",
    selectDeviceBeforeSave: "Chọn một thiết bị trước khi lưu phê duyệt exec.",
    noPresenceYet: "Chưa có phiên bản nào.",
    noPresenceData: "Không có dữ liệu hiện diện.",
    invalidRunTime: "Thời gian chạy không hợp lệ.",
    invalidIntervalAmount: "Số lượng khoảng thời gian không hợp lệ.",
    cronExprRequired: "Yêu cầu biểu thức cron.",
    systemEventTextRequired: "Yêu cầu văn bản sự kiện hệ thống.",
    agentMessageRequired: "Yêu cầu tin nhắn tác tử.",
    nameRequired: "Yêu cầu tên.",
    error: "Lỗi: ",
    importedFromRelays: "Đã nhập hồ sơ từ relays. Xem lại và xuất bản.",
    imported: "Đã nhập hồ sơ. Xem lại và xuất bản.",
    importFailed: "Nhập hồ sơ thất bại: ",
    profilePublishFailed: "Xuất bản hồ sơ thất bại trên tất cả relays.",
    profilePublished: "Đã xuất bản hồ sơ lên relays.",
  },

  // ============================================
  // STATUS VALUES
  // ============================================
  status: {
    yes: "Có",
    no: "Không",
    na: "n/a",
    active: "Hoạt động",
    revoked: "đã thu hồi",
    never: "chưa bao giờ",
    paired: "đã ghép",
    unpaired: "chưa ghép",
    connected: "kết nối",
    offline: "ngoại tuyến",
    unknown: "không rõ",
    ok: "ok",
    failed: "thất bại",
    probeOk: "Kiểm tra ok",
    probeFailed: "Kiểm tra thất bại",
  },

  // ============================================
  // NODES VIEW EXTENDED
  // ============================================
  nodesView: {
    refresh: "Làm mới",
    loading: "Đang tải…",
    save: "Lưu",
    saving: "Đang lưu…",
    loadConfig: "Tải cấu hình",
    loadApprovals: "Tải phê duyệt",

    security: {
      deny: "Từ chối",
      allowlist: "Danh sách cho phép",
      full: "Toàn quyền",
      defaultMode: "Chế độ bảo mật mặc định.",
      defaultIs: "Mặc định:",
    },

    ask: {
      off: "Tắt",
      onMiss: "Khi thiếu",
      always: "Luôn luôn",
      defaultPolicy: "Chính sách nhắc mặc định.",
      defaultIs: "Mặc định:",
      fallbackDesc: "Áp dụng khi nhắc UI không khả dụng.",
    },

    autoAllow: {
      allowSkillExecs: "Cho phép file thực thi kỹ năng được liệt kê bởi Gateway.",
      usingDefault: "Dùng mặc định",
      override: "Ghi đè",
      on: "bật",
      off: "tắt",
    },

    allowlist: {
      newPattern: "Mẫu mới",
      lastUsed: "Dùng lần cuối: ",
    },

    binding: {
      defaultAgent: "tác tử mặc định",
      agent: "tác tử",
      usesDefault: "dùng mặc định",
      any: "bất kỳ",
    },

    noProfile: "Chưa có hồ sơ. Nhấn \"Chỉnh sửa hồ sơ\" để thêm tên, tiểu sử và ảnh đại diện.",
    about: "Giới thiệu",
  },

  // ============================================
  // CHANNELS VIEW EXTENDED
  // ============================================
  channelsView: {
    noSnapshot: "Chưa có ảnh chụp.",
    configured: "Đã cấu hình",
    running: "Đang chạy",
    connected: "Đã kết nối",
    lastInbound: "Tin nhắn đến cuối",
    linked: "Đã liên kết",
    showQr: "Hiện QR",
    processing: "Đang xử lý…",
    noProfile: "Chưa có hồ sơ. Nhấn \"Chỉnh sửa hồ sơ\" để thêm tên, tiểu sử và ảnh đại diện.",
    loadingConfigSchema: "Đang tải schema cấu hình…",
    lastConnected: "Kết nối cuối",
    lastMessage: "Tin nhắn cuối",
    authAge: "Tuổi xác thực",
    relink: "Liên kết lại",
    waitScan: "Chờ quét",
    logout: "Đăng xuất",
    whatsappDesc: "Liên kết WhatsApp Web và theo dõi sức khỏe kết nối.",
    imessageDesc: "Liên kết iMessage và theo dõi trạng thái tin nhắn.",
    discordDesc: "Kết nối bot Discord và quản lý định tuyến tin nhắn.",
    slackDesc: "Kết nối tích hợp Slack và quản lý kênh.",
    telegramDesc: "Kết nối bot Telegram và quản lý định tuyến tin nhắn.",
    signalDesc: "Kết nối Signal và quản lý tin nhắn bảo mật.",
    googleChatDesc: "Kết nối tích hợp Google Chat workspace.",
    nostrDesc: "Cấu hình relay Nostr và xuất bản sự kiện.",
    about: "Giới thiệu",
    editProfile: "Chỉnh sửa hồ sơ",
    pubkey: "Khóa công khai",
    relays: "Relay",
    copyNpub: "Sao chép npub",
    viewOnNostr: "Xem trên nostr.band",
    probeOk: "Kiểm tra ok",
    probeFailed: "Kiểm tra thất bại",
    lastStart: "Bắt đầu cuối",
    lastProbe: "Kiểm tra cuối",
    probe: "Kiểm tra",
    schemaUnavailable: "Schema không khả dụng. Dùng chế độ Thô.",
    channelSchemaUnavailable: "Schema cấu hình kênh không khả dụng.",
    baseUrl: "URL cơ sở",
    credentialSource: "Thông tin xác thực",
    audience: "Đối tượng",
    mode: "Chế độ",
    profile: "Hồ sơ",
    name: "Tên",
    displayNameLabel: "Tên hiển thị",
    nostrCardDesc: "DM phi tập trung qua relay Nostr (NIP-04).",
  },

  // ============================================
  // GATEWAY URL CONFIRMATION
  // ============================================
  gatewayUrlConfirm: {
    title: "Đổi URL Gateway",
    description: "Thao tác này sẽ kết nối lại đến máy chủ gateway khác",
    warning: "Chỉ xác nhận nếu bạn tin tưởng URL này. URL độc hại có thể xâm nhập hệ thống của bạn.",
    confirm: "Xác nhận",
  },

  // ============================================
  // ERROR MESSAGES
  // ============================================
  errors: {
    failedToChangeModel: "Không thể thay đổi mô hình:",
    disconnectedFromGateway: "Đã ngắt kết nối khỏi gateway.",
    connectionFailed: "Kết nối thất bại",
    authFailed: "Xác thực thất bại",
    loadFailed: "Tải thất bại",
    saveFailed: "Lưu thất bại",
    unknownError: "Lỗi không xác định",
  },

  // ============================================
  // EXEC APPROVAL
  // ============================================
  execApproval: {
    title: "Cần phê duyệt thực thi",
    expiresIn: "hết hạn sau",
    expired: "đã hết hạn",
    pending: "đang chờ",
    host: "Máy chủ",
    agent: "Tác tử",
    session: "Phiên",
    directory: "Thư mục",
    resolved: "Đã giải quyết",
    security: "Bảo mật",
    ask: "Yêu cầu",
    allowOnce: "Cho phép một lần",
    allowAlways: "Luôn cho phép",
    deny: "Từ chối",
  },

  // ============================================
  // MARKDOWN SIDEBAR
  // ============================================
  markdownSidebar: {
    title: "Kết quả công cụ",
    close: "Đóng thanh bên",
    viewRawText: "Xem văn bản thô",
    noContent: "Không có nội dung",
  },

  // ============================================
  // MEMORY
  // ============================================
  memory: {
    title: "Trí nhớ",
    search: "Tìm kiếm trí nhớ...",
    extractButton: "Trích xuất",
    extracting: "Đang trích xuất...",
    extracted: "Đã trích xuất!",
    empty: "Chưa có trí nhớ nào.",
    privacy: "Trí nhớ được lưu cục bộ và không bao giờ chia sẻ.",
    deleteConfirm: "Xóa trí nhớ này?",
    save: "Lưu",
    cancel: "Hủy",
    verified: "Đã xác minh",
    unverified: "Chưa xác minh",
    // Indicator (chat header)
    indicatorActive: "trí nhớ đang hoạt động",
    indicatorOff: "Trí nhớ tắt",
    indicatorToggle: "Bật/tắt trí nhớ",
    indicatorNone: "Không có trí nhớ",
    categories: {
      all: "Tất cả",
      identity: "Danh tính",
      preference: "Sở thích",
      project: "Dự án",
      relationship: "Mối quan hệ",
      skill: "Kỹ năng",
      fact: "Sự kiện",
    },
  },

  // ============================================
  // NOSTR PROFILE FORM
  // ============================================
  nostrProfile: {
    editTitle: "Chỉnh sửa hồ sơ",
    account: "Tài khoản:",
    avatarPreview: "Xem trước ảnh đại diện",
    username: "Tên người dùng",
    usernamePlaceholder: "satoshi",
    usernameHelp: "Tên ngắn (ví dụ: satoshi)",
    displayName: "Tên hiển thị",
    displayNamePlaceholder: "Satoshi Nakamoto",
    displayNameHelp: "Tên hiển thị đầy đủ của bạn",
    bio: "Tiểu sử",
    bioPlaceholder: "Giới thiệu về bản thân...",
    bioHelp: "Mô tả ngắn về bản thân",
    avatarUrl: "URL ảnh đại diện",
    avatarUrlPlaceholder: "https://example.com/avatar.jpg",
    avatarUrlHelp: "URL HTTPS đến ảnh đại diện của bạn",
    advanced: "Nâng cao",
    bannerUrl: "URL ảnh bìa",
    bannerUrlPlaceholder: "https://example.com/banner.jpg",
    bannerUrlHelp: "URL HTTPS đến ảnh bìa",
    website: "Trang web",
    websitePlaceholder: "https://example.com",
    websiteHelp: "Trang web cá nhân của bạn",
    nip05: "Định danh NIP-05",
    nip05Placeholder: "you@example.com",
    nip05Help: "Định danh có thể xác minh (ví dụ: you@domain.com)",
    lightning: "Địa chỉ Lightning",
    lightningPlaceholder: "you@getalby.com",
    lightningHelp: "Địa chỉ Lightning để nhận tip (LUD-16)",
    savePublish: "Lưu & Xuất bản",
    saving: "Đang lưu...",
    importFromRelay: "Nhập từ Relay",
    importing: "Đang nhập...",
    showAdvanced: "Hiện nâng cao",
    hideAdvanced: "Ẩn nâng cao",
    unsavedChanges: "Bạn có thay đổi chưa lưu",
  },

  // ============================================
  // AGENT TABS
  // ============================================
  agentTabs: {
    newTab: "Tab mới",
    closeTab: "Đóng tab",
    closeConfirm: "Đóng tab này? Phiên sẽ được lưu trữ.",
    rename: "Đổi tên",
    presets: {
      title: "Chọn loại tác tử",
      code: "Lập trình",
      writer: "Soạn văn",
      research: "Nghiên cứu",
      translator: "Phiên dịch",
      custom: "Tùy chỉnh",
    },
    unread: "chưa đọc",
    pin: "Ghim tab",
    unpin: "Bỏ ghim tab",
    splitView: "Chia đôi màn hình",
    focusLeft: "Chọn khung trái",
    focusRight: "Chọn khung phải",
  },

  // ============================================
  // PROJECTS
  // ============================================
  projects: {
    title: "Dự án",
    description: "Dự án đã đăng ký và sức khỏe môi trường.",
    empty: "Không tìm thấy dự án nào.",
    scan: "Quét",
    scanning: "Đang quét...",
    scanned: "Đã quét!",
    rescan: "Quét lại",
    addProject: "Thêm dự án",
    health: {
      healthy: "Khỏe mạnh",
      warning: "Cảnh báo",
      error: "Lỗi",
      unknown: "Không rõ",
    },
    env: {
      title: "Môi trường",
      valid: "Hợp lệ",
      missing: "Thiếu biến",
      check: "Kiểm tra env",
    },
    card: {
      lastDeploy: "Triển khai cuối",
      platform: "Nền tảng",
      branch: "Nhánh",
      never: "Chưa bao giờ",
    },
  },

  // ============================================
  // DEPLOY
  // ============================================
  deploy: {
    title: "Triển khai",
    description: "Triển khai dự án lên production hoặc staging.",
    empty: "Chưa có triển khai nào.",
    start: "Triển khai",
    deploying: "Đang triển khai...",
    cancel: "Hủy",
    platform: "Nền tảng",
    target: "Mục tiêu",
    branch: "Nhánh",
    selectProject: "Chọn dự án",
    selectPlatform: "Chọn nền tảng",
    platforms: {
      fly: "Fly.io",
      railway: "Railway",
      vercel: "Vercel",
      docker: "Docker",
      custom: "Tùy chỉnh",
    },
    targets: {
      production: "Production",
      staging: "Staging",
      preview: "Preview",
    },
    status: {
      pending: "Đang chờ",
      building: "Đang build",
      deploying: "Đang triển khai",
      success: "Thành công",
      failed: "Thất bại",
      cancelled: "Đã hủy",
    },
    log: {
      title: "Nhật ký triển khai",
      empty: "Chưa có đầu ra.",
      copy: "Sao chép log",
      download: "Tải log",
    },
    history: {
      title: "Lịch sử",
      empty: "Không có lịch sử triển khai.",
      viewLog: "Xem log",
    },
    confirm: {
      title: "Xác nhận triển khai",
      message: "Triển khai {project} lên {target}?",
      proceed: "Triển khai ngay",
    },
  },

  // ============================================
  // PREVIEW
  // ============================================
  preview: {
    title: "Xem trước",
    description: "Bản triển khai xem trước với URL chia sẻ.",
    empty: "Không có bản triển khai xem trước.",
    create: "Tạo Preview",
    creating: "Đang tạo...",
    delete: "Xóa",
    deleting: "Đang xóa...",
    promote: "Nâng lên production",
    promoting: "Đang nâng cấp...",
    open: "Mở xem trước",
    copyUrl: "Sao chép URL",
    urlCopied: "Đã sao chép URL!",
    iframe: {
      title: "Xem trước",
      loading: "Đang tải xem trước...",
      openExternal: "Mở trong tab mới",
    },
    card: {
      branch: "Nhánh",
      created: "Tạo lúc",
      expires: "Hết hạn",
      url: "URL",
    },
    form: {
      project: "Dự án",
      branch: "Nhánh",
      branchPlaceholder: "feature/nhánh-tôi",
    },
  },

  // ============================================
  // ELDERCARE — BÀ NỘI CARE
  // ============================================
  eldercare: {
    // Dashboard
    grandmaStatus: "Tình trạng bà",
    roomEnvironment: "Môi trường phòng",
    familyCalls: "Cuộc gọi gia đình",
    companionActivity: "Hoạt động giải trí",
    presence: "Hiện diện",
    inRoom: "Có trong phòng",
    noMotion: "Không có chuyển động",
    currentLevel: "Mức hiện tại",
    checksToday: "Lượt kiểm tra hôm nay",
    alertsToday: "Cảnh báo hôm nay",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    motion: "Chuyển động",
    tempOutOfRange: "⚠️ Nhiệt độ ngoài ngưỡng thoải mái (20-35°C)",
    humidityOutOfRange: "⚠️ Độ ẩm ngoài ngưỡng thoải mái (40-80%)",
    musicSessions: "Lần nghe nhạc",
    reminders: "Nhắc sinh hoạt",
    storyActive: "Đang nghe truyện",
    yes: "Có",
    no: "Không",
    noCalls: "Chưa ai gọi bà hôm nay",
    sosActive: "SOS ĐANG HOẠT ĐỘNG — Cần xử lý ngay!",
    sosActiveShort: "Đang xử lý",
    resolved: "Đã xử lý",
    sosEventsToday: "Sự kiện SOS hôm nay",
    lastReport: "Báo cáo gần nhất",
    haOffline: "HA offline",
    refreshing: "Đang tải...",
    levels: {
      normal: "Bình thường",
      attention: "Chú ý",
      warning: "Cảnh báo",
      emergency: "Khẩn cấp",
    } as Record<string, string>,
    // Config sections
    configSections: {
      monitor: "Giám sát",
      sos: "SOS",
      companion: "Bạn đồng hành",
      videocall: "Video call",
    } as Record<string, string>,
    config: {
      monitorThresholds: "Ngưỡng giám sát",
      noMotionAttention: "Không chuyển động → Chú ý (phút)",
      noMotionWarning: "Không chuyển động → Cảnh báo (phút)",
      noMotionEmergency: "Không chuyển động → Khẩn cấp (phút)",
      minutesHint: "Số phút không có chuyển động trước khi cảnh báo",
      temperatureThresholds: "Ngưỡng nhiệt độ",
      tempLow: "Nhiệt độ thấp (°C)",
      tempHigh: "Nhiệt độ cao (°C)",
      haEntities: "Entity IDs (Home Assistant)",
      sosContacts: "Danh bạ SOS",
      noContacts: "Chưa có liên hệ SOS",
      contactsHint: "Chỉnh sửa trong memory key eldercare_contacts",
      escalationLevels: "Mức escalation",
      level1Desc: "Gửi Zalo group gia đình",
      level2Desc: "Gửi Telegram + Zalo",
      level3Desc: "Gọi tất cả + thông báo liên tục",
      minutes: "phút",
      musicSettings: "Cài đặt nhạc",
      defaultPlaylist: "Playlist mặc định",
      volume: "Âm lượng (0-1)",
      ttsSettings: "Cài đặt giọng đọc (TTS)",
      ttsRate: "Tốc độ đọc",
      ttsRateHint: "0.8 = chậm hơn bình thường (tốt cho bà)",
      ttsVoice: "Giọng TTS",
      tabletSettings: "Cài đặt tablet",
      tabletIp: "IP tablet",
      fullyKioskPassword: "Mật khẩu Fully Kiosk",
      scheduleSettings: "Lịch gọi",
      morningReminder: "Giờ nhắc sáng",
      quietHoursStart: "Giờ yên tĩnh bắt đầu",
      quietHoursEnd: "Giờ yên tĩnh kết thúc",
    },
  },
} as const;

export type Translations = typeof vi;
