// Request wrapper — wrap API requests with cost tracking

import { estimateCost, compareCosts } from "../cost/estimator.js";
import { calculateCost, getTierFromModel } from "../cost/pricing.js";
import type { BudgetManager } from "../cost/budget-manager.js";
import type { AlertManager } from "../cost/alerts.js";
import type { AnalyticsAggregator, UsageRecord } from "../cost/analytics.js";
import type { CostEstimate, CostComparison, BudgetCheckResult } from "../cost/types.js";
import {
  formatPreExecutionVi,
  formatPostExecutionVi,
  formatBudgetWarningVi,
  formatBudgetExceededVi,
  formatHighCostWarningVi,
} from "../cost/messages-vi.js";

export interface WrappedRequest {
  model: string;
  inputText: string;
  taskType?: string;
  contextTokens?: number;
  userId?: string;
}

export interface PreExecutionResult {
  allowed: boolean;
  estimate: CostEstimate;
  comparison: CostComparison;
  budgetCheck: BudgetCheckResult;
  messages: {
    costEstimate: string;
    budgetWarning?: string;
    highCostWarning?: string;
    blocked?: string;
  };
  requiresConfirmation: boolean;
}

export interface PostExecutionResult {
  actualCost: number;
  message: string;
  budgetStatus: {
    daily: { spent: number; limit: number; percent: number };
    weekly: { spent: number; limit: number; percent: number };
    monthly: { spent: number; limit: number; percent: number };
  };
}

export interface CostTrackedResponse<T> {
  response: T;
  cost: PostExecutionResult;
}

export class RequestWrapper {
  private budgetManager: BudgetManager;
  private alertManager: AlertManager;
  private analytics: AnalyticsAggregator;
  private highCostThreshold: number;
  private confirmationThreshold: number;

  constructor(options: {
    budgetManager: BudgetManager;
    alertManager: AlertManager;
    analytics: AnalyticsAggregator;
    highCostThreshold?: number;
    confirmationThreshold?: number;
  }) {
    this.budgetManager = options.budgetManager;
    this.alertManager = options.alertManager;
    this.analytics = options.analytics;
    this.highCostThreshold = options.highCostThreshold ?? 0.1;
    this.confirmationThreshold = options.confirmationThreshold ?? 0.05;
  }

  // ── Pre-execution ───────────────────────────────────────────

  checkBeforeExecution(request: WrappedRequest): PreExecutionResult {
    const estimate = estimateCost(
      request.model,
      request.inputText,
      request.taskType,
      request.contextTokens,
    );

    const comparison = compareCosts(
      request.model,
      request.inputText,
      request.taskType,
      request.contextTokens,
    );

    const budgetCheck = this.budgetManager.checkBudget(estimate.estimatedCost);

    const messages: PreExecutionResult["messages"] = {
      costEstimate: formatPreExecutionVi(estimate),
    };

    if (!budgetCheck.allowed) {
      messages.blocked = formatBudgetExceededVi(budgetCheck.reason || "Vượt ngân sách");
      return {
        allowed: false,
        estimate,
        comparison,
        budgetCheck,
        messages,
        requiresConfirmation: false,
      };
    }

    if (budgetCheck.warnings.length > 0) {
      const worst = budgetCheck.warnings.reduce((a, b) => (a.percentUsed > b.percentUsed ? a : b));
      messages.budgetWarning = formatBudgetWarningVi(
        worst.period,
        worst.percentUsed,
        this.budgetManager.getStatus()[worst.period].remaining,
      );
    }

    if (estimate.estimatedCost >= this.highCostThreshold) {
      messages.highCostWarning = formatHighCostWarningVi(
        estimate.estimatedCost,
        this.highCostThreshold,
      );
    }

    return {
      allowed: true,
      estimate,
      comparison,
      budgetCheck,
      messages,
      requiresConfirmation: estimate.estimatedCost >= this.confirmationThreshold,
    };
  }

  // ── Post-execution ──────────────────────────────────────────

  recordAfterExecution(
    request: WrappedRequest,
    actualInputTokens: number,
    actualOutputTokens: number,
  ): PostExecutionResult {
    const actualCost = calculateCost(request.model, actualInputTokens, actualOutputTokens);

    this.budgetManager.recordSpending(actualCost);

    const record: UsageRecord = {
      timestamp: new Date(),
      model: request.model,
      tier: getTierFromModel(request.model),
      taskType: request.taskType || "unknown",
      inputTokens: actualInputTokens,
      outputTokens: actualOutputTokens,
      cost: actualCost,
      userId: request.userId,
    };
    this.analytics.addRecord(record);

    const status = this.budgetManager.getStatus();

    return {
      actualCost,
      message: formatPostExecutionVi(actualCost, request.model),
      budgetStatus: {
        daily: {
          spent: status.daily.spent,
          limit: status.daily.limit,
          percent: Math.round(status.daily.percentUsed),
        },
        weekly: {
          spent: status.weekly.spent,
          limit: status.weekly.limit,
          percent: Math.round(status.weekly.percentUsed),
        },
        monthly: {
          spent: status.monthly.spent,
          limit: status.monthly.limit,
          percent: Math.round(status.monthly.percentUsed),
        },
      },
    };
  }

  // ── Convenience: wrap full request ──────────────────────────

  async wrapRequest<T>(
    request: WrappedRequest,
    executor: () => Promise<{ response: T; inputTokens: number; outputTokens: number }>,
    options?: {
      skipPreCheck?: boolean;
      onPreCheck?: (result: PreExecutionResult) => Promise<boolean>;
    },
  ): Promise<CostTrackedResponse<T> | { blocked: true; reason: string }> {
    if (!options?.skipPreCheck) {
      const preCheck = this.checkBeforeExecution(request);

      if (!preCheck.allowed) {
        return { blocked: true, reason: preCheck.messages.blocked || "Budget exceeded" };
      }

      if (preCheck.requiresConfirmation && options?.onPreCheck) {
        const confirmed = await options.onPreCheck(preCheck);
        if (!confirmed) return { blocked: true, reason: "User cancelled" };
      }
    }

    const { response, inputTokens, outputTokens } = await executor();
    const cost = this.recordAfterExecution(request, inputTokens, outputTokens);

    return { response, cost };
  }

  // ── Getters ─────────────────────────────────────────────────

  getBudgetStatus() {
    return this.budgetManager.getStatus();
  }

  getAnalytics(period: "day" | "week" | "month") {
    return this.analytics.getAnalytics(period);
  }

  updateBudgetConfig(
    config: Partial<{ daily: number; weekly: number; monthly: number; perRequest: number }>,
  ) {
    this.budgetManager.updateConfig(config);
  }
}
