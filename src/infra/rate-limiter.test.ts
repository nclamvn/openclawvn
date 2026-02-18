import { afterEach, describe, expect, test } from "vitest";

import { AuthRateLimiter } from "./rate-limiter.js";

describe("AuthRateLimiter", () => {
  let limiter: AuthRateLimiter;

  afterEach(() => {
    limiter?.destroy();
  });

  test("allows first attempt", () => {
    limiter = new AuthRateLimiter();
    const result = limiter.checkAndRecord("1.2.3.4", 1000);
    expect(result.allowed).toBe(true);
    expect(result.attemptsLeft).toBe(9);
  });

  test("increments count on subsequent attempts", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 0 });
    limiter.checkAndRecord("1.2.3.4", 1000);
    const result = limiter.checkAndRecord("1.2.3.4", 2000);
    expect(result.allowed).toBe(true);
    expect(result.attemptsLeft).toBe(8);
  });

  test("enforces backoff delay — too fast rejected", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 1000 });
    limiter.checkAndRecord("1.2.3.4", 1000);
    // Attempt 2 needs 1s backoff, only 500ms elapsed.
    const result = limiter.checkAndRecord("1.2.3.4", 1500);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(500);
  });

  test("allows after backoff delay passed", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 1000 });
    limiter.checkAndRecord("1.2.3.4", 1000);
    // Attempt 2 needs 1s backoff, 1.1s elapsed — allowed.
    const result = limiter.checkAndRecord("1.2.3.4", 2100);
    expect(result.allowed).toBe(true);
  });

  test("exponential backoff: 1s, 2s, 4s, 8s...", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 1000, backoffMaxMs: 60_000 });
    let now = 0;
    // Attempt 1: immediate.
    limiter.checkAndRecord("ip", now);
    // Attempt 2: needs 1s.
    now += 1000;
    const r2 = limiter.checkAndRecord("ip", now);
    expect(r2.allowed).toBe(true);
    // Attempt 3: needs 2s.
    now += 2000;
    const r3 = limiter.checkAndRecord("ip", now);
    expect(r3.allowed).toBe(true);
    // Attempt 4: needs 4s.
    now += 4000;
    const r4 = limiter.checkAndRecord("ip", now);
    expect(r4.allowed).toBe(true);
    // Attempt 5: needs 8s.
    now += 8000;
    const r5 = limiter.checkAndRecord("ip", now);
    expect(r5.allowed).toBe(true);
  });

  test("backoff caps at backoffMaxMs", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 1000, backoffMaxMs: 5000 });
    let now = 0;
    // Build up to high count.
    for (let i = 0; i < 8; i++) {
      now += 60_000; // Well past any backoff.
      limiter.checkAndRecord("ip", now);
    }
    // At count 8, backoff would be 1000 * 2^7 = 128000, but capped at 5000.
    const tooFast = limiter.checkAndRecord("ip", now + 4000);
    expect(tooFast.allowed).toBe(false);
    expect(tooFast.retryAfterMs).toBe(1000); // 5000 - 4000

    const ok = limiter.checkAndRecord("ip", now + 6000);
    expect(ok.allowed).toBe(true);
  });

  test("lockout after maxAttempts", () => {
    limiter = new AuthRateLimiter({
      maxAttempts: 3,
      lockoutDurationMs: 10_000,
      backoffBaseMs: 0,
    });
    limiter.checkAndRecord("ip", 1000);
    limiter.checkAndRecord("ip", 2000);
    limiter.checkAndRecord("ip", 3000);
    // 4th attempt triggers lockout.
    const result = limiter.checkAndRecord("ip", 4000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(10_000);
  });

  test("lockout expires after lockoutDurationMs", () => {
    limiter = new AuthRateLimiter({
      maxAttempts: 2,
      lockoutDurationMs: 5000,
      backoffBaseMs: 0,
    });
    limiter.checkAndRecord("ip", 1000);
    limiter.checkAndRecord("ip", 2000);
    // 3rd triggers lockout.
    const locked = limiter.checkAndRecord("ip", 3000);
    expect(locked.allowed).toBe(false);
    // After lockout expires.
    const result = limiter.checkAndRecord("ip", 3000 + 5000);
    expect(result.allowed).toBe(true);
    expect(result.attemptsLeft).toBe(1);
  });

  test("recordSuccess resets attempt counter", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 0 });
    limiter.checkAndRecord("ip", 1000);
    limiter.checkAndRecord("ip", 2000);
    limiter.recordSuccess("ip");
    expect(limiter.getStatus("ip")).toBe(null);
    const result = limiter.checkAndRecord("ip", 3000);
    expect(result.allowed).toBe(true);
    expect(result.attemptsLeft).toBe(9);
  });

  test("cleanup removes old entries", () => {
    limiter = new AuthRateLimiter({ windowMs: 5000 });
    limiter.checkAndRecord("old", 1000);
    limiter.checkAndRecord("recent", 8000);
    limiter.cleanup(9000);
    expect(limiter.getStatus("old")).toBe(null);
    expect(limiter.getStatus("recent")).not.toBe(null);
  });

  test("per-key isolation: different IPs tracked separately", () => {
    limiter = new AuthRateLimiter({ backoffBaseMs: 0 });
    limiter.checkAndRecord("ip-a", 1000);
    limiter.checkAndRecord("ip-a", 2000);
    const resultA = limiter.checkAndRecord("ip-a", 3000);
    expect(resultA.attemptsLeft).toBe(7);

    const resultB = limiter.checkAndRecord("ip-b", 3000);
    expect(resultB.attemptsLeft).toBe(9);
  });

  test("window expiry resets record", () => {
    limiter = new AuthRateLimiter({ windowMs: 5000, backoffBaseMs: 0 });
    limiter.checkAndRecord("ip", 1000);
    limiter.checkAndRecord("ip", 2000);
    // Window expired.
    const result = limiter.checkAndRecord("ip", 7000);
    expect(result.allowed).toBe(true);
    expect(result.attemptsLeft).toBe(9);
  });

  test("getStatus returns null for unknown key", () => {
    limiter = new AuthRateLimiter();
    expect(limiter.getStatus("unknown")).toBe(null);
  });

  test("destroy clears state", () => {
    limiter = new AuthRateLimiter();
    limiter.checkAndRecord("ip", 1000);
    limiter.destroy();
    expect(limiter.getStatus("ip")).toBe(null);
  });
});
