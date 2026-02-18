import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertManager } from "../alerts.js";
import type { BudgetCheckResult, CostEstimate, SubscriptionAdvice } from "../types.js";
import { BudgetManager } from "../budget-manager.js";

describe("AlertManager", () => {
  let manager: AlertManager;

  beforeEach(() => {
    manager = new AlertManager();
  });

  describe("registerHandler", () => {
    it("calls handler when alert is emitted", async () => {
      const handler = vi.fn();
      manager.registerHandler(handler);

      const budget = new BudgetManager({ daily: 10 });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      await manager.alertBudgetWarning(result);

      expect(handler).toHaveBeenCalled();
    });

    it("returns unregister function", async () => {
      const handler = vi.fn();
      const unregister = manager.registerHandler(handler);
      unregister();

      const budget = new BudgetManager({ daily: 10 });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      await manager.alertBudgetWarning(result);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("alertBudgetWarning", () => {
    it("creates alerts from budget warnings", async () => {
      const budget = new BudgetManager({
        daily: 10,
        alertThresholds: [0.5],
      });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);

      await manager.alertBudgetWarning(result);
      const alerts = manager.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe("budget_warning");
    });
  });

  describe("alertBudgetExceeded", () => {
    it("creates critical alert", async () => {
      const budget = new BudgetManager({ daily: 10 });
      budget.recordSpending(10);
      const result = budget.checkBudget(1);

      await manager.alertBudgetExceeded("Daily budget exceeded", result);
      const alerts = manager.getAlerts({ type: "budget_exceeded" });
      expect(alerts.length).toBe(1);
      expect(alerts[0].level).toBe("critical");
    });
  });

  describe("alertHighCostRequest", () => {
    it("creates alert for expensive requests", async () => {
      const estimate: CostEstimate = {
        model: "claude-opus-4-5",
        tier: "opus",
        estimatedInputTokens: 100000,
        estimatedOutputTokens: 50000,
        estimatedCost: 1.5,
        confidence: "medium",
        breakdown: { inputCost: 0.5, outputCost: 1.0 },
        isLongContext: false,
      };

      await manager.alertHighCostRequest(estimate, 0.5);
      const alerts = manager.getAlerts({ type: "high_cost_request" });
      expect(alerts.length).toBe(1);
      expect(alerts[0].level).toBe("critical"); // > $1.0
    });

    it("skips alert below threshold", async () => {
      const estimate: CostEstimate = {
        model: "claude-haiku-4-5",
        tier: "haiku",
        estimatedInputTokens: 100,
        estimatedOutputTokens: 50,
        estimatedCost: 0.001,
        confidence: "high",
        breakdown: { inputCost: 0.0005, outputCost: 0.0005 },
        isLongContext: false,
      };

      await manager.alertHighCostRequest(estimate, 0.5);
      expect(manager.getAlerts().length).toBe(0);
    });
  });

  describe("alertSubscriptionRecommended", () => {
    it("creates alert when recommendation is valid", async () => {
      const advice: SubscriptionAdvice = {
        shouldRecommend: true,
        plan: "pro",
        monthlyCost: 20,
        estimatedApiCost: 30,
        savings: 10,
        savingsPercent: 33,
        reason: "Consider Pro",
      };

      await manager.alertSubscriptionRecommended(advice);
      const alerts = manager.getAlerts({ type: "subscription_recommended" });
      expect(alerts.length).toBe(1);
      expect(alerts[0].level).toBe("info");
    });

    it("skips alert when not recommended", async () => {
      const advice: SubscriptionAdvice = {
        shouldRecommend: false,
        plan: "pro",
        monthlyCost: 20,
        estimatedApiCost: 5,
        savings: 0,
        savingsPercent: 0,
        reason: "Keep API",
      };

      await manager.alertSubscriptionRecommended(advice);
      expect(manager.getAlerts().length).toBe(0);
    });
  });

  describe("alert management", () => {
    it("filters by type", async () => {
      const budget = new BudgetManager({ daily: 10, alertThresholds: [0.5] });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      await manager.alertBudgetWarning(result);
      await manager.alertBudgetExceeded("test", result);

      const warnings = manager.getAlerts({ type: "budget_warning" });
      const exceeded = manager.getAlerts({ type: "budget_exceeded" });
      expect(warnings.length).toBeGreaterThan(0);
      expect(exceeded.length).toBe(1);
    });

    it("filters unacknowledged only", async () => {
      const budget = new BudgetManager({ daily: 10, alertThresholds: [0.5] });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      await manager.alertBudgetWarning(result);

      const all = manager.getAlerts();
      expect(all.length).toBeGreaterThan(0);

      manager.acknowledgeAll();
      const unacked = manager.getAlerts({ unacknowledgedOnly: true });
      expect(unacked.length).toBe(0);
    });

    it("acknowledges single alert", async () => {
      const budget = new BudgetManager({ daily: 10, alertThresholds: [0.5] });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      await manager.alertBudgetWarning(result);

      const alerts = manager.getAlerts();
      const acked = manager.acknowledgeAlert(alerts[0].id);
      expect(acked).toBe(true);
      expect(manager.acknowledgeAlert("nonexistent")).toBe(false);
    });

    it("clears all alerts", async () => {
      const budget = new BudgetManager({ daily: 10, alertThresholds: [0.5] });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      await manager.alertBudgetWarning(result);

      manager.clearAlerts();
      expect(manager.getAlerts().length).toBe(0);
    });

    it("limits results", async () => {
      const budget = new BudgetManager({ daily: 10, alertThresholds: [0.5] });
      budget.recordSpending(6);
      const result = budget.checkBudget(0.01);
      // This generates multiple warnings (daily/weekly/monthly)
      await manager.alertBudgetWarning(result);
      await manager.alertBudgetWarning(result);

      const limited = manager.getAlerts({ limit: 1 });
      expect(limited.length).toBe(1);
    });
  });
});
