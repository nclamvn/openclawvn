// Cost alerts — generation and handling

import type {
  CostAlert,
  AlertHandler,
  BudgetCheckResult,
  CostEstimate,
  SubscriptionAdvice,
} from "./types.js";

export class AlertManager {
  private handlers: AlertHandler[] = [];
  private alerts: CostAlert[] = [];
  private maxAlerts = 100;

  registerHandler(handler: AlertHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx > -1) this.handlers.splice(idx, 1);
    };
  }

  private async emit(alert: CostAlert): Promise<void> {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    for (const handler of this.handlers) {
      try {
        await handler(alert);
      } catch {
        // Alert handlers must not throw
      }
    }
  }

  private makeId(): string {
    return crypto.randomUUID();
  }

  // ── Alert generators ────────────────────────────────────────

  async alertBudgetWarning(result: BudgetCheckResult): Promise<void> {
    for (const warning of result.warnings) {
      await this.emit({
        id: this.makeId(),
        type: "budget_warning",
        level: warning.level,
        message: warning.message,
        details: { period: warning.period, percentUsed: warning.percentUsed },
        createdAt: new Date(),
        acknowledged: false,
      });
    }
  }

  async alertBudgetExceeded(reason: string, result: BudgetCheckResult): Promise<void> {
    await this.emit({
      id: this.makeId(),
      type: "budget_exceeded",
      level: "critical",
      message: `Budget exceeded: ${reason}`,
      details: { reason, budgetStatus: result.budgetStatus },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  async alertHighCostRequest(estimate: CostEstimate, threshold: number = 0.5): Promise<void> {
    if (estimate.estimatedCost < threshold) return;

    await this.emit({
      id: this.makeId(),
      type: "high_cost_request",
      level: estimate.estimatedCost > 1.0 ? "critical" : "warning",
      message: `High cost request: $${estimate.estimatedCost.toFixed(4)} (${estimate.model})`,
      details: { estimate, threshold },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  async alertSubscriptionRecommended(advice: SubscriptionAdvice): Promise<void> {
    if (!advice.shouldRecommend) return;

    await this.emit({
      id: this.makeId(),
      type: "subscription_recommended",
      level: "info",
      message: `Consider ${advice.plan}: Save $${advice.savings.toFixed(0)}/month`,
      details: { advice },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  // ── Alert management ────────────────────────────────────────

  getAlerts(options?: {
    type?: CostAlert["type"];
    level?: CostAlert["level"];
    unacknowledgedOnly?: boolean;
    limit?: number;
  }): CostAlert[] {
    let filtered = [...this.alerts];

    if (options?.type) filtered = filtered.filter((a) => a.type === options.type);
    if (options?.level) filtered = filtered.filter((a) => a.level === options.level);
    if (options?.unacknowledgedOnly) filtered = filtered.filter((a) => !a.acknowledged);

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) filtered = filtered.slice(0, options.limit);
    return filtered;
  }

  acknowledgeAlert(id: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  acknowledgeAll(): void {
    for (const alert of this.alerts) alert.acknowledged = true;
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}
