/**
 * In-memory rate limiter for auth attempts.
 * Resets on gateway restart (intentional — no persistent lockouts).
 */

export interface AttemptRecord {
  count: number;
  firstAttemptMs: number;
  lastAttemptMs: number;
  lockedUntilMs: number | null;
}

export interface RateLimiterConfig {
  /** Maximum failed attempts before lockout. Default: 10 */
  maxAttempts: number;
  /** Lockout duration in ms. Default: 15 min */
  lockoutDurationMs: number;
  /** Window for tracking attempts in ms. Default: 1 hour */
  windowMs: number;
  /** Base backoff delay in ms. Default: 1000 (1s) */
  backoffBaseMs: number;
  /** Maximum backoff delay in ms. Default: 60000 (60s) */
  backoffMaxMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  attemptsLeft?: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxAttempts: 10,
  lockoutDurationMs: 15 * 60 * 1000,
  windowMs: 60 * 60 * 1000,
  backoffBaseMs: 1000,
  backoffMaxMs: 60_000,
};

let _globalInstance: AuthRateLimiter | null = null;

/** Get or create the process-wide rate limiter singleton. */
export function getAuthRateLimiter(): AuthRateLimiter {
  if (!_globalInstance) {
    _globalInstance = new AuthRateLimiter();
  }
  return _globalInstance;
}

export class AuthRateLimiter {
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly config: RateLimiterConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cleanupTimer = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    // Allow the timer to not keep the process alive.
    if (
      this.cleanupTimer &&
      typeof this.cleanupTimer === "object" &&
      "unref" in this.cleanupTimer
    ) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Check whether a key (IP or deviceId) is allowed to attempt auth.
   * Records the attempt. Call recordSuccess() on successful auth to reset.
   */
  checkAndRecord(key: string, nowMs = Date.now()): RateLimitResult {
    let record = this.attempts.get(key);

    if (!record) {
      record = { count: 1, firstAttemptMs: nowMs, lastAttemptMs: nowMs, lockedUntilMs: null };
      this.attempts.set(key, record);
      return { allowed: true, attemptsLeft: this.config.maxAttempts - 1 };
    }

    // If window expired, reset.
    if (nowMs - record.firstAttemptMs > this.config.windowMs) {
      record.count = 1;
      record.firstAttemptMs = nowMs;
      record.lastAttemptMs = nowMs;
      record.lockedUntilMs = null;
      return { allowed: true, attemptsLeft: this.config.maxAttempts - 1 };
    }

    // If locked, check expiry.
    if (record.lockedUntilMs !== null) {
      if (nowMs >= record.lockedUntilMs) {
        // Lockout expired — reset.
        record.count = 1;
        record.firstAttemptMs = nowMs;
        record.lastAttemptMs = nowMs;
        record.lockedUntilMs = null;
        return { allowed: true, attemptsLeft: this.config.maxAttempts - 1 };
      }
      return { allowed: false, retryAfterMs: record.lockedUntilMs - nowMs };
    }

    // Check backoff delay (starts from attempt 2).
    if (record.count >= 1) {
      const delay = Math.min(
        this.config.backoffBaseMs * 2 ** (record.count - 1),
        this.config.backoffMaxMs,
      );
      const elapsed = nowMs - record.lastAttemptMs;
      if (elapsed < delay) {
        return { allowed: false, retryAfterMs: delay - elapsed };
      }
    }

    // Increment and check lockout threshold.
    record.count++;
    record.lastAttemptMs = nowMs;

    if (record.count > this.config.maxAttempts) {
      record.lockedUntilMs = nowMs + this.config.lockoutDurationMs;
      return { allowed: false, retryAfterMs: this.config.lockoutDurationMs };
    }

    return { allowed: true, attemptsLeft: this.config.maxAttempts - record.count };
  }

  /** Reset attempts for a key after successful auth. */
  recordSuccess(key: string): void {
    this.attempts.delete(key);
  }

  /** Remove entries older than windowMs. */
  cleanup(nowMs = Date.now()): void {
    for (const [key, record] of this.attempts) {
      const age = nowMs - record.lastAttemptMs;
      if (age > this.config.windowMs) {
        this.attempts.delete(key);
      }
    }
  }

  /** Get attempt record for debugging/audit. */
  getStatus(key: string): AttemptRecord | null {
    return this.attempts.get(key) ?? null;
  }

  /** Tear down: clear interval and map. */
  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.attempts.clear();
  }
}
