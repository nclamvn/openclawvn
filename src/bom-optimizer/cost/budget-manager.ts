// Budget management — track spending and enforce limits

import type { BudgetConfig, BudgetStatus, BudgetCheckResult, BudgetWarning } from "./types.js";

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  daily: 10,
  weekly: 50,
  monthly: 200,
  perRequest: 1,
  alertThresholds: [0.5, 0.8, 0.95],
};

interface PeriodSpend {
  amount: number;
  periodStart: Date;
}

interface SpendingState {
  daily: PeriodSpend;
  weekly: PeriodSpend;
  monthly: PeriodSpend;
}

export class BudgetManager {
  private config: BudgetConfig;
  private spending: SpendingState;

  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = { ...DEFAULT_BUDGET_CONFIG, ...config };
    const now = new Date();
    this.spending = {
      daily: { amount: 0, periodStart: startOfDay(now) },
      weekly: { amount: 0, periodStart: startOfWeek(now) },
      monthly: { amount: 0, periodStart: startOfMonth(now) },
    };
  }

  // ── Period reset ──────────────────────────────────────────

  private resetIfNeeded(): void {
    const now = new Date();

    if (now > endOfDay(this.spending.daily.periodStart)) {
      this.spending.daily = { amount: 0, periodStart: startOfDay(now) };
    }
    if (now > endOfWeek(this.spending.weekly.periodStart)) {
      this.spending.weekly = { amount: 0, periodStart: startOfWeek(now) };
    }
    if (now > endOfMonth(this.spending.monthly.periodStart)) {
      this.spending.monthly = { amount: 0, periodStart: startOfMonth(now) };
    }
  }

  // ── Public API ────────────────────────────────────────────

  getStatus(): BudgetStatus {
    this.resetIfNeeded();
    const now = new Date();

    const makePeriod = (
      limit: number,
      spend: PeriodSpend,
      end: Date,
      period: "daily" | "weekly" | "monthly",
    ) => ({
      limit,
      spent: spend.amount,
      remaining: Math.max(0, limit - spend.amount),
      percentUsed: (spend.amount / limit) * 100,
      periodStart: spend.periodStart,
      periodEnd: end,
      projectedOverage: this.projectOverage(period),
    });

    return {
      daily: makePeriod(this.config.daily, this.spending.daily, endOfDay(now), "daily"),
      weekly: makePeriod(this.config.weekly, this.spending.weekly, endOfWeek(now), "weekly"),
      monthly: makePeriod(this.config.monthly, this.spending.monthly, endOfMonth(now), "monthly"),
    };
  }

  private projectOverage(period: "daily" | "weekly" | "monthly"): number | null {
    const spend = this.spending[period];
    const limit = this.config[period];
    const now = new Date();
    const elapsed = now.getTime() - spend.periodStart.getTime();

    const totalMs =
      period === "daily" ? 86_400_000 : period === "weekly" ? 604_800_000 : 2_592_000_000; // ~30 days

    // Need at least 10% of period elapsed
    if (elapsed < totalMs * 0.1) return null;

    const projected = (spend.amount / elapsed) * totalMs;
    return projected > limit ? projected - limit : null;
  }

  checkBudget(estimatedCost: number): BudgetCheckResult {
    this.resetIfNeeded();
    const status = this.getStatus();
    const warnings: BudgetWarning[] = [];

    // Per-request limit
    if (estimatedCost > this.config.perRequest) {
      return {
        allowed: false,
        reason: `Request cost ($${estimatedCost.toFixed(4)}) exceeds per-request limit ($${this.config.perRequest})`,
        budgetStatus: status,
        warnings,
      };
    }

    // Period limits
    for (const period of ["daily", "weekly", "monthly"] as const) {
      if (this.spending[period].amount + estimatedCost > this.config[period]) {
        return {
          allowed: false,
          reason: `Would exceed ${period} budget ($${this.config[period]})`,
          budgetStatus: status,
          warnings,
        };
      }
    }

    // Threshold warnings
    for (const threshold of this.config.alertThresholds) {
      for (const period of ["daily", "weekly", "monthly"] as const) {
        const pctUsed = status[period].percentUsed;
        if (pctUsed >= threshold * 100) {
          warnings.push({
            level: threshold >= 0.95 ? "critical" : threshold >= 0.8 ? "warning" : "info",
            period,
            message: `${Math.round(pctUsed)}% of ${period} budget used`,
            percentUsed: pctUsed,
          });
        }
      }
    }

    return { allowed: true, budgetStatus: status, warnings: dedupeWarnings(warnings) };
  }

  recordSpending(amount: number): void {
    this.resetIfNeeded();
    this.spending.daily.amount += amount;
    this.spending.weekly.amount += amount;
    this.spending.monthly.amount += amount;
  }

  updateConfig(config: Partial<BudgetConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): BudgetConfig {
    return { ...this.config };
  }

  exportState(): { config: BudgetConfig; spending: SpendingState } {
    return { config: this.config, spending: this.spending };
  }

  importState(state: { config: BudgetConfig; spending: SpendingState }): void {
    this.config = state.config;
    this.spending = state.spending;
    this.resetIfNeeded();
  }
}

// ── Date helpers ──────────────────────────────────────────────

function startOfDay(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfWeek(d: Date = new Date()): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - day + (day === 0 ? -6 : 1)); // Monday
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfWeek(d: Date = new Date()): Date {
  const s = startOfWeek(d);
  s.setDate(s.getDate() + 6);
  s.setHours(23, 59, 59, 999);
  return s;
}

function startOfMonth(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfMonth(d: Date = new Date()): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + 1);
  r.setDate(0);
  r.setHours(23, 59, 59, 999);
  return r;
}

// Keep highest-severity warning per period
function dedupeWarnings(warnings: BudgetWarning[]): BudgetWarning[] {
  const levelVal = (l: string) => (l === "critical" ? 3 : l === "warning" ? 2 : 1);
  const byPeriod = new Map<string, BudgetWarning>();
  for (const w of warnings) {
    const existing = byPeriod.get(w.period);
    if (!existing || levelVal(w.level) > levelVal(existing.level)) byPeriod.set(w.period, w);
  }
  return Array.from(byPeriod.values());
}
