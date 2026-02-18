// Cost gate middleware — gate requests based on cost estimation and budget

import { estimateCost, compareCosts, formatCostMessage } from "../cost/estimator.js";
import { analyzeForSubscription, formatSubscriptionAdvice } from "../cost/subscription-advisor.js";
import type { BudgetManager } from "../cost/budget-manager.js";
import type { AlertManager } from "../cost/alerts.js";
import type { CostEstimate, CostComparison, BudgetCheckResult } from "../cost/types.js";

export interface CostGateRequest {
  model: string;
  inputText: string;
  taskType?: string;
  contextTokens?: number;
  skipBudgetCheck?: boolean;
}

export interface CostGateResult {
  allowed: boolean;
  estimate: CostEstimate;
  comparison: CostComparison;
  budgetCheck?: BudgetCheckResult;
  message: {
    preExecution: string;
    warnings: string[];
    subscriptionAdvice?: string;
  };
}

export type CostGateCallback = (result: CostGateResult) => Promise<boolean>;

export class CostGate {
  private budgetManager: BudgetManager;
  private alertManager: AlertManager;
  private confirmCallback?: CostGateCallback;
  private highCostThreshold: number;

  constructor(options: {
    budgetManager: BudgetManager;
    alertManager: AlertManager;
    confirmCallback?: CostGateCallback;
    highCostThreshold?: number;
  }) {
    this.budgetManager = options.budgetManager;
    this.alertManager = options.alertManager;
    this.confirmCallback = options.confirmCallback;
    this.highCostThreshold = options.highCostThreshold ?? 0.1;
  }

  async check(request: CostGateRequest): Promise<CostGateResult> {
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

    let budgetCheck: BudgetCheckResult | undefined;
    if (!request.skipBudgetCheck) {
      budgetCheck = this.budgetManager.checkBudget(estimate.estimatedCost);

      if (budgetCheck.warnings.length > 0) {
        await this.alertManager.alertBudgetWarning(budgetCheck);
      }
      if (!budgetCheck.allowed && budgetCheck.reason) {
        await this.alertManager.alertBudgetExceeded(budgetCheck.reason, budgetCheck);
      }
    }

    if (estimate.estimatedCost >= this.highCostThreshold) {
      await this.alertManager.alertHighCostRequest(estimate, this.highCostThreshold);
    }

    // Rough monthly projection for subscription advice
    const monthlyProjection = estimate.estimatedCost * 300;
    const subscriptionAdvice = analyzeForSubscription(monthlyProjection);
    if (subscriptionAdvice.shouldRecommend) {
      await this.alertManager.alertSubscriptionRecommended(subscriptionAdvice);
    }

    const costMessage = formatCostMessage(estimate);
    const warnings: string[] = [];
    if (budgetCheck?.warnings) {
      for (const w of budgetCheck.warnings) warnings.push(w.message);
    }
    if (estimate.estimatedCost >= this.highCostThreshold) {
      warnings.push(`High cost request: $${estimate.estimatedCost.toFixed(4)}`);
    }

    const allowed = budgetCheck?.allowed !== false;

    const result: CostGateResult = {
      allowed,
      estimate,
      comparison,
      budgetCheck,
      message: {
        preExecution: costMessage.preExecution,
        warnings,
        subscriptionAdvice: subscriptionAdvice.shouldRecommend
          ? formatSubscriptionAdvice(subscriptionAdvice)
          : undefined,
      },
    };

    // Confirmation callback for significant costs
    if (this.confirmCallback && estimate.estimatedCost >= 0.01) {
      const confirmed = await this.confirmCallback(result);
      if (!confirmed) return { ...result, allowed: false };
    }

    return result;
  }

  recordCost(actualCost: number): void {
    this.budgetManager.recordSpending(actualCost);
  }
}

export function formatCostGateMessage(result: CostGateResult): string {
  const lines: string[] = [];

  lines.push(result.message.preExecution);

  if (result.comparison.alternatives.length > 0) {
    lines.push("");
    lines.push("Alternatives:");
    for (const alt of result.comparison.alternatives) {
      const sign = alt.costDifference >= 0 ? "+" : "";
      const marker = alt.recommended ? "[rec]" : "-";
      lines.push(
        `  ${marker} ${alt.tier}: $${alt.estimatedCost.toFixed(4)} (${sign}${alt.costDifferencePercent}%)`,
      );
    }
  }

  if (result.message.warnings.length > 0) {
    lines.push("");
    for (const w of result.message.warnings) lines.push(w);
  }

  if (result.budgetCheck) {
    const d = result.budgetCheck.budgetStatus.daily;
    lines.push("");
    lines.push(`Budget: $${d.spent.toFixed(2)}/$${d.limit} today (${Math.round(d.percentUsed)}%)`);
  }

  if (result.message.subscriptionAdvice) {
    lines.push("");
    lines.push(result.message.subscriptionAdvice);
  }

  return lines.join("\n");
}
