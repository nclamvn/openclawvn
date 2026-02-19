// ═══════════════════════════════════════════════════════════════
// CONNECTION MANAGER
// Smart connection handling with auto-reconnect
// ═══════════════════════════════════════════════════════════════

export interface ConnectionConfig {
  url: string;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError?: string;
  errorCode?: number;
  retryCount: number;
  nextRetryIn?: number;
}

export type ConnectionListener = (state: ConnectionState) => void;

const DEFAULT_CONFIG: ConnectionConfig = {
  url: 'ws://127.0.0.1:18789',
  maxRetries: 5,
  baseDelay: 1000,  // 1 second
  maxDelay: 30000,  // 30 seconds max
};

export class ConnectionManager {
  private config: ConnectionConfig;
  private state: ConnectionState = {
    status: 'disconnected',
    retryCount: 0,
  };
  private listeners: Set<ConnectionListener> = new Set();
  private retryTimeout: number | null = null;
  private countdownInterval: number | null = null;
  private isManualDisconnect = false;

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * Update connection URL
   */
  setUrl(url: string): void {
    this.config.url = url;
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.config.url;
  }

  /**
   * Start connection (called on app init)
   */
  connect(): void {
    this.isManualDisconnect = false;
    this.attemptConnection();
  }

  /**
   * Manual disconnect
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.clearTimers();

    this.updateState({
      status: 'disconnected',
      retryCount: 0,
      lastError: undefined,
      errorCode: undefined,
      nextRetryIn: undefined,
    });
  }

  /**
   * Force reconnect (user clicks retry)
   */
  reconnect(): void {
    this.clearTimers();
    this.isManualDisconnect = false;
    // Reset state properly through updateState to notify listeners
    this.updateState({
      status: 'connecting',
      retryCount: 0,
      lastError: undefined,
      errorCode: undefined,
      nextRetryIn: undefined,
    });
    // Dispatch connection attempt
    window.dispatchEvent(new CustomEvent('connection-attempt', {
      detail: { url: this.config.url },
    }));
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if Gateway is likely running
   */
  async checkGatewayHealth(): Promise<boolean> {
    try {
      // Try HTTP health endpoint if available
      const httpUrl = this.config.url.replace('ws://', 'http://').replace('wss://', 'https://');
      const response = await fetch(`${httpUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      // Try WebSocket connection test
      return new Promise((resolve) => {
        try {
          const testWs = new WebSocket(this.config.url);
          const timeout = setTimeout(() => {
            testWs.close();
            resolve(false);
          }, 3000);

          testWs.onopen = () => {
            clearTimeout(timeout);
            testWs.close();
            resolve(true);
          };

          testWs.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        } catch {
          resolve(false);
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE METHODS
  // ─────────────────────────────────────────────────────────────

  private attemptConnection(): void {
    this.updateState({ status: 'connecting', nextRetryIn: undefined });

    // Dispatch event for app to handle actual connection
    window.dispatchEvent(new CustomEvent('connection-attempt', {
      detail: { url: this.config.url },
    }));
  }

  /**
   * Called by app when connection attempt starts
   */
  onConnecting(): void {
    this.clearTimers();
    this.updateState({
      status: 'connecting',
      nextRetryIn: undefined,
    });
  }

  /**
   * Called by app when connection succeeds
   */
  onConnected(): void {
    console.log('[ConnectionManager] Connected to Gateway');
    this.clearTimers();
    this.updateState({
      status: 'connected',
      retryCount: 0,
      lastError: undefined,
      errorCode: undefined,
      nextRetryIn: undefined,
    });
  }

  /**
   * Called by app when connection fails or closes
   */
  onDisconnected(code?: number, reason?: string): void {
    console.log(`[ConnectionManager] Disconnected: ${code} - ${reason}`);

    const errorMessage = this.getErrorMessage(code || 1006, reason);

    this.updateState({
      status: 'disconnected',
      lastError: errorMessage,
      errorCode: code,
    });
    // NOTE: No auto-retry here. GatewayBrowserClient handles reconnection
    // via its own scheduleReconnect(). Having both systems retry causes
    // race conditions where ConnectionManager kills mid-reconnect clients.
  }

  /**
   * Called by app when connection error occurs
   */
  onError(error?: string): void {
    console.error('[ConnectionManager] Connection error:', error);
    this.updateState({
      status: 'error',
      lastError: error || 'Không thể kết nối tới Gateway',
    });
    // NOTE: No auto-retry here. GatewayBrowserClient handles reconnection.
  }

  private scheduleRetry(): void {
    if (this.state.retryCount >= this.config.maxRetries) {
      console.log('[ConnectionManager] Max retries reached');
      this.updateState({
        status: 'error',
        lastError: 'Không thể kết nối sau nhiều lần thử. Gateway có đang chạy không?',
        nextRetryIn: undefined,
      });
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at maxDelay)
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, this.state.retryCount),
      this.config.maxDelay
    );

    console.log(`[ConnectionManager] Retry in ${delay}ms (attempt ${this.state.retryCount + 1}/${this.config.maxRetries})`);

    this.updateState({
      retryCount: this.state.retryCount + 1,
      nextRetryIn: delay,
    });

    // Countdown timer
    let remaining = delay;
    this.countdownInterval = window.setInterval(() => {
      remaining -= 1000;
      if (remaining > 0) {
        this.updateState({ nextRetryIn: remaining });
      } else {
        this.clearCountdown();
      }
    }, 1000);

    this.retryTimeout = window.setTimeout(() => {
      this.clearCountdown();
      this.attemptConnection();
    }, delay);
  }

  private clearTimers(): void {
    this.clearRetryTimeout();
    this.clearCountdown();
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateState(partial: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private getErrorMessage(code: number, reason?: string): string {
    // WebSocket close codes
    const messages: Record<number, string> = {
      1000: 'Kết nối đóng bình thường',
      1001: 'Server đang tắt hoặc trình duyệt đang chuyển trang',
      1002: 'Lỗi protocol',
      1003: 'Dữ liệu không hợp lệ',
      1005: 'Không có mã đóng',
      1006: 'Gateway không phản hồi. Hãy kiểm tra Gateway đã chạy chưa.',
      1007: 'Dữ liệu không đúng định dạng',
      1008: 'Vi phạm chính sách',
      1009: 'Tin nhắn quá lớn',
      1010: 'Client yêu cầu extension không được hỗ trợ',
      1011: 'Lỗi server không mong đợi',
      1015: 'Lỗi TLS/SSL',
    };

    return reason || messages[code] || `Lỗi kết nối (mã ${code})`;
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
