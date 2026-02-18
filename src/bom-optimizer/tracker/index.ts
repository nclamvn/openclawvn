/**
 * Cost Tracker
 */

import { randomUUID } from "crypto";
import * as metricsStore from "./metrics.js";
import * as reporter from "./reporter.js";
import type { RequestMetrics, ModelTier, TaskType } from "../types.js";
import { MODELS } from "../config.js";

export class CostTracker {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /** Record a completed request */
  record(data: {
    model: string;
    taskType?: TaskType;
    inputTokens: number;
    outputTokens: number;
    latencyMs?: number;
    cacheHit?: boolean;
    checkpointUsed?: boolean;
    baselineCost?: number;
  }): void {
    const modelConfig =
      MODELS[data.model] || Object.values(MODELS).find((m) => m.id === data.model);

    const cost = modelConfig
      ? (data.inputTokens / 1000) * modelConfig.inputCostPer1k +
        (data.outputTokens / 1000) * modelConfig.outputCostPer1k
      : 0;

    const costSaved = data.baselineCost ? data.baselineCost - cost : 0;
    const tokensSaved = data.cacheHit ? data.inputTokens + data.outputTokens : 0;

    const metrics: RequestMetrics = {
      id: randomUUID(),
      userId: this.userId,
      timestamp: Date.now(),
      taskType: data.taskType || "unknown",
      model: data.model,
      modelTier: (modelConfig?.tier || "balanced") as ModelTier,
      tokens: { input: data.inputTokens, output: data.outputTokens },
      cost,
      latencyMs: data.latencyMs || 0,
      cacheHit: data.cacheHit || false,
      checkpointUsed: data.checkpointUsed || false,
      tokensSaved,
      costSaved: Math.max(0, costSaved),
    };

    metricsStore.recordRequest(metrics);
  }

  getStats(period: "day" | "week" | "month" | "all" = "day") {
    return metricsStore.getUserStats(this.userId, period);
  }

  getRecent(limit: number = 20) {
    return metricsStore.getRecentRequests(this.userId, limit);
  }

  getSummary() {
    return reporter.getSummary(this.userId);
  }

  generateReport(period: "day" | "week" | "month" = "week") {
    return reporter.generateReport(this.userId, period);
  }

  checkBudget() {
    return reporter.checkBudget(this.userId);
  }
}

export function createTracker(userId: string): CostTracker {
  return new CostTracker(userId);
}

export { metricsStore, reporter };
