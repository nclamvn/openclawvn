import { describe, it, expect, beforeEach } from "vitest";
import { RequestWrapper } from "../request-wrapper.js";
import { BudgetManager } from "../../cost/budget-manager.js";
import { AlertManager } from "../../cost/alerts.js";
import { AnalyticsAggregator } from "../../cost/analytics.js";

describe("RequestWrapper", () => {
  let wrapper: RequestWrapper;
  let budgetManager: BudgetManager;

  beforeEach(() => {
    budgetManager = new BudgetManager({ daily: 10, weekly: 50, monthly: 200 });
    wrapper = new RequestWrapper({
      budgetManager,
      alertManager: new AlertManager(),
      analytics: new AnalyticsAggregator(),
      highCostThreshold: 0.1,
      confirmationThreshold: 0.05,
    });
  });

  describe("checkBeforeExecution", () => {
    it("allows low-cost requests without confirmation", () => {
      const r = wrapper.checkBeforeExecution({ model: "haiku", inputText: "Hello" });
      expect(r.allowed).toBe(true);
      expect(r.requiresConfirmation).toBe(false);
    });

    it("requires confirmation for medium-cost requests", () => {
      const r = wrapper.checkBeforeExecution({
        model: "opus",
        inputText: "A".repeat(10000),
      });
      expect(r.allowed).toBe(true);
      expect(r.requiresConfirmation).toBe(true);
    });

    it("blocks when budget exceeded", () => {
      // Use a tiny daily budget so even a small request exceeds it
      wrapper.updateBudgetConfig({ daily: 0.001 });
      budgetManager.recordSpending(0.001);
      const r = wrapper.checkBeforeExecution({
        model: "sonnet",
        inputText: "A".repeat(2000),
      });
      expect(r.allowed).toBe(false);
      expect(r.messages.blocked).toBeDefined();
    });

    it("includes Vietnamese cost estimate", () => {
      const r = wrapper.checkBeforeExecution({ model: "sonnet", inputText: "Test" });
      expect(r.messages.costEstimate).toContain("Chi phí");
    });

    it("includes budget warning when over 50%", () => {
      budgetManager.recordSpending(6);
      const r = wrapper.checkBeforeExecution({ model: "haiku", inputText: "Test" });
      expect(r.messages.budgetWarning).toBeDefined();
    });
  });

  describe("recordAfterExecution", () => {
    it("records cost and returns Vietnamese message", () => {
      const r = wrapper.recordAfterExecution({ model: "sonnet", inputText: "Test" }, 1000, 500);
      expect(r.actualCost).toBeGreaterThan(0);
      expect(r.message).toContain("Hoàn thành");
      expect(r.budgetStatus.daily.spent).toBeGreaterThan(0);
    });

    it("updates all budget periods", () => {
      const r = wrapper.recordAfterExecution({ model: "sonnet", inputText: "Test" }, 1000, 500);
      expect(r.budgetStatus.daily.spent).toBeGreaterThan(0);
      expect(r.budgetStatus.weekly.spent).toBeGreaterThan(0);
      expect(r.budgetStatus.monthly.spent).toBeGreaterThan(0);
    });
  });

  describe("wrapRequest", () => {
    it("tracks cost for successful requests", async () => {
      const result = await wrapper.wrapRequest({ model: "haiku", inputText: "Test" }, async () => ({
        response: "OK",
        inputTokens: 100,
        outputTokens: 50,
      }));

      expect("blocked" in result).toBe(false);
      if (!("blocked" in result)) {
        expect(result.response).toBe("OK");
        expect(result.cost.actualCost).toBeGreaterThan(0);
      }
    });

    it("blocks over-budget requests", async () => {
      budgetManager.recordSpending(9.95);
      const result = await wrapper.wrapRequest(
        { model: "opus", inputText: "A".repeat(10000) },
        async () => ({ response: "OK", inputTokens: 10000, outputTokens: 5000 }),
      );

      expect("blocked" in result).toBe(true);
    });

    it("respects user cancellation via onPreCheck", async () => {
      const result = await wrapper.wrapRequest(
        { model: "opus", inputText: "A".repeat(10000) },
        async () => ({ response: "OK", inputTokens: 10000, outputTokens: 5000 }),
        { onPreCheck: async () => false },
      );

      expect("blocked" in result).toBe(true);
      if ("blocked" in result) {
        expect(result.reason).toBe("User cancelled");
      }
    });

    it("skips pre-check when requested", async () => {
      budgetManager.recordSpending(9.95);
      const result = await wrapper.wrapRequest(
        { model: "haiku", inputText: "Test" },
        async () => ({ response: "OK", inputTokens: 10, outputTokens: 5 }),
        { skipPreCheck: true },
      );

      expect("blocked" in result).toBe(false);
    });
  });

  describe("getters", () => {
    it("getBudgetStatus returns current status", () => {
      const status = wrapper.getBudgetStatus();
      expect(status.daily.spent).toBe(0);
    });

    it("getAnalytics returns analytics", () => {
      const analytics = wrapper.getAnalytics("day");
      expect(analytics.totalRequests).toBe(0);
    });

    it("updateBudgetConfig updates config", () => {
      wrapper.updateBudgetConfig({ daily: 20 });
      const status = wrapper.getBudgetStatus();
      expect(status.daily.limit).toBe(20);
    });
  });
});
