/**
 * Cost Reporter
 * Generate reports and alerts
 */

import * as metrics from "./metrics.js";
import { DEFAULT_COST_LIMITS } from "../config.js";
import type { UserStats, CostAlert } from "../types.js";

// ── BUDGET CHECKING ─────────────────────────────────────────

export function checkBudget(userId: string, limits = DEFAULT_COST_LIMITS): CostAlert[] {
  const alerts: CostAlert[] = [];
  const now = Date.now();

  const dailySpend = metrics.getTotalSpend(userId, now - 24 * 60 * 60 * 1000);
  if (dailySpend >= limits.dailyBudget) {
    alerts.push({
      type: "budget_exceeded",
      threshold: limits.dailyBudget,
      current: dailySpend,
      message: `Daily budget exceeded: $${dailySpend.toFixed(2)} / $${limits.dailyBudget}`,
    });
  } else if (dailySpend >= limits.dailyBudget * limits.warningThreshold) {
    alerts.push({
      type: "budget_warning",
      threshold: limits.dailyBudget,
      current: dailySpend,
      message: `Approaching daily budget: $${dailySpend.toFixed(2)} / $${limits.dailyBudget}`,
    });
  }

  const weeklySpend = metrics.getTotalSpend(userId, now - 7 * 24 * 60 * 60 * 1000);
  if (weeklySpend >= limits.weeklyBudget) {
    alerts.push({
      type: "budget_exceeded",
      threshold: limits.weeklyBudget,
      current: weeklySpend,
      message: `Weekly budget exceeded: $${weeklySpend.toFixed(2)} / $${limits.weeklyBudget}`,
    });
  }

  const monthlySpend = metrics.getTotalSpend(userId, now - 30 * 24 * 60 * 60 * 1000);
  if (monthlySpend >= limits.monthlyBudget) {
    alerts.push({
      type: "budget_exceeded",
      threshold: limits.monthlyBudget,
      current: monthlySpend,
      message: `Monthly budget exceeded: $${monthlySpend.toFixed(2)} / $${limits.monthlyBudget}`,
    });
  }

  return alerts;
}

// ── REPORTS ─────────────────────────────────────────────────

export interface UsageReport {
  period: string;
  stats: UserStats;
  alerts: CostAlert[];
  recommendations: string[];
  savingsBreakdown: {
    fromCache: number;
    fromModelRouting: number;
    fromCompression: number;
    total: number;
    percentOfSpend: number;
  };
}

export function generateReport(
  userId: string,
  period: "day" | "week" | "month" = "week",
): UsageReport {
  const stats = metrics.getUserStats(userId, period);
  const alerts = checkBudget(userId);

  const now = Date.now();
  const since =
    period === "day"
      ? now - 24 * 60 * 60 * 1000
      : period === "week"
        ? now - 7 * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000;

  const totalSaved = metrics.getTotalSavings(userId, since);

  const recommendations: string[] = [];
  if (stats.cacheHitRate < 0.2) {
    recommendations.push(
      "Low cache hit rate. Try reusing similar prompts or enabling semantic caching.",
    );
  }

  const expensiveModels = ["claude-opus", "gpt-4", "o1"];
  const expensiveUsage = Object.entries(stats.modelUsage)
    .filter(([model]) => expensiveModels.includes(model))
    .reduce((sum, [, count]) => sum + count, 0);
  if (expensiveUsage > stats.totalRequests * 0.3) {
    recommendations.push("Consider using cheaper models (Haiku, GPT-4o-mini) for simple tasks.");
  }

  if (stats.avgLatencyMs > 5000) {
    recommendations.push(
      "High average latency. Consider using faster models for time-sensitive tasks.",
    );
  }

  return {
    period,
    stats,
    alerts,
    recommendations,
    savingsBreakdown: {
      fromCache: totalSaved * 0.5,
      fromModelRouting: totalSaved * 0.35,
      fromCompression: totalSaved * 0.15,
      total: totalSaved,
      percentOfSpend: stats.totalCost > 0 ? (totalSaved / (stats.totalCost + totalSaved)) * 100 : 0,
    },
  };
}

export function getSummary(userId: string): {
  todaySpend: number;
  todaySaved: number;
  weekSpend: number;
  weekSaved: number;
  cacheHitRate: number;
  alerts: CostAlert[];
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const dayStats = metrics.getUserStats(userId, "day");

  return {
    todaySpend: metrics.getTotalSpend(userId, dayAgo),
    todaySaved: metrics.getTotalSavings(userId, dayAgo),
    weekSpend: metrics.getTotalSpend(userId, weekAgo),
    weekSaved: metrics.getTotalSavings(userId, weekAgo),
    cacheHitRate: dayStats.cacheHitRate,
    alerts: checkBudget(userId),
  };
}
