// Usage analytics aggregation

import type { UsageAnalytics, ModelUsage, TaskTypeUsage, ModelTier } from "./types.js";
import { generateSubscriptionComparison } from "./subscription-advisor.js";

export interface UsageRecord {
  timestamp: Date;
  model: string;
  tier: ModelTier;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  userId?: string;
}

export class AnalyticsAggregator {
  private records: UsageRecord[] = [];
  private maxRecords = 10000;

  addRecord(record: UsageRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  getAnalytics(period: "day" | "week" | "month"): UsageAnalytics {
    const now = new Date();
    const { start, end } = periodBounds(period, now);

    const filtered = this.records.filter((r) => r.timestamp >= start && r.timestamp <= end);

    const totalCost = filtered.reduce((s, r) => s + r.cost, 0);
    const totalRequests = filtered.length;
    const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

    const monthlyProjection =
      period === "month" ? totalCost : period === "week" ? totalCost * 4 : totalCost * 30;

    return {
      period,
      periodStart: start,
      periodEnd: end,
      totalCost: round4(totalCost),
      totalRequests,
      byModel: aggregateByModel(filtered, totalCost),
      byTaskType: aggregateByTaskType(filtered, totalCost),
      averageCostPerRequest: round4(averageCostPerRequest),
      peakUsageHour: findPeakHour(filtered),
      costTrend: this.calculateTrend(period),
      subscriptionComparison: generateSubscriptionComparison(monthlyProjection),
    };
  }

  private calculateTrend(period: "day" | "week" | "month"): "increasing" | "decreasing" | "stable" {
    const now = new Date();
    const current = periodBounds(period, now);

    const prevEnd = new Date(current.start.getTime() - 1);
    const previous = periodBounds(period, prevEnd);

    const currentCost = this.records
      .filter((r) => r.timestamp >= current.start && r.timestamp <= current.end)
      .reduce((s, r) => s + r.cost, 0);

    const previousCost = this.records
      .filter((r) => r.timestamp >= previous.start && r.timestamp <= previous.end)
      .reduce((s, r) => s + r.cost, 0);

    if (previousCost === 0) return "stable";
    const pct = ((currentCost - previousCost) / previousCost) * 100;
    if (pct > 10) return "increasing";
    if (pct < -10) return "decreasing";
    return "stable";
  }

  exportRecords(): UsageRecord[] {
    return [...this.records];
  }

  importRecords(records: UsageRecord[]): void {
    this.records = records.map((r) => ({ ...r, timestamp: new Date(r.timestamp) }));
  }

  clearRecords(): void {
    this.records = [];
  }
}

// ── Helpers ─────────────────────────────────────────────────

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function periodBounds(period: "day" | "week" | "month", now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case "day":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = start.getDay();
      start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function aggregateByModel(records: UsageRecord[], totalCost: number): ModelUsage[] {
  const map = new Map<string, { requests: number; cost: number; tier: ModelTier }>();

  for (const r of records) {
    const e = map.get(r.model) ?? { requests: 0, cost: 0, tier: r.tier };
    e.requests++;
    e.cost += r.cost;
    map.set(r.model, e);
  }

  return Array.from(map.entries())
    .map(([model, d]) => ({
      model,
      tier: d.tier,
      requests: d.requests,
      totalCost: round4(d.cost),
      percentOfTotal: totalCost > 0 ? Math.round((d.cost / totalCost) * 100) : 0,
      avgCostPerRequest: d.requests > 0 ? round4(d.cost / d.requests) : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

function aggregateByTaskType(records: UsageRecord[], totalCost: number): TaskTypeUsage[] {
  const map = new Map<string, { requests: number; cost: number }>();

  for (const r of records) {
    const t = r.taskType || "unknown";
    const e = map.get(t) ?? { requests: 0, cost: 0 };
    e.requests++;
    e.cost += r.cost;
    map.set(t, e);
  }

  const haikuTasks = ["classification", "extraction", "summarization", "translation"];
  const opusTasks = ["architecture", "critical", "complex-reasoning"];

  return Array.from(map.entries())
    .map(([taskType, d]) => ({
      taskType,
      requests: d.requests,
      totalCost: round4(d.cost),
      percentOfTotal: totalCost > 0 ? Math.round((d.cost / totalCost) * 100) : 0,
      avgCostPerRequest: d.requests > 0 ? round4(d.cost / d.requests) : 0,
      recommendedModel: haikuTasks.some((t) => taskType.includes(t))
        ? "haiku"
        : opusTasks.some((t) => taskType.includes(t))
          ? "opus"
          : "sonnet",
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

function findPeakHour(records: UsageRecord[]): number {
  const counts = new Array(24).fill(0) as number[];
  for (const r of records) counts[r.timestamp.getHours()]++;

  let peak = 0;
  for (let i = 1; i < 24; i++) {
    if (counts[i] > counts[peak]) peak = i;
  }
  return peak;
}

// ── Format for display ──────────────────────────────────────

export function formatAnalyticsVi(analytics: UsageAnalytics): string {
  const periodVi =
    analytics.period === "day" ? "Hôm nay" : analytics.period === "week" ? "Tuần này" : "Tháng này";

  const lines: string[] = [];
  lines.push(`*Thống kê ${periodVi}*`);
  lines.push("");
  lines.push(`Tổng chi phí: $${analytics.totalCost.toFixed(2)}`);
  lines.push(`Số request: ${analytics.totalRequests}`);
  lines.push(`Trung bình: $${analytics.averageCostPerRequest.toFixed(4)}/request`);

  if (analytics.byModel.length > 0) {
    lines.push("");
    lines.push("*Theo model:*");
    for (const m of analytics.byModel.slice(0, 3)) {
      lines.push(`  - ${m.tier}: $${m.totalCost.toFixed(2)} (${m.percentOfTotal}%)`);
    }
  }

  const sub = analytics.subscriptionComparison;
  if (sub.apiCost > 20) {
    lines.push("");
    lines.push("*So sánh subscription:*");
    lines.push(`  - API hiện tại: ~$${sub.apiCost.toFixed(0)}/tháng`);
    lines.push(`  - Claude Pro: $20/tháng`);
    if (sub.potentialSavings > 0) {
      lines.push(`  Có thể tiết kiệm $${sub.potentialSavings.toFixed(0)}/tháng`);
    }
  }

  return lines.join("\n");
}
