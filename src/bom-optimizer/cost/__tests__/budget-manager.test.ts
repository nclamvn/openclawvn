import { describe, it, expect, beforeEach } from "vitest";
import { BudgetManager } from "../budget-manager.js";

describe("BudgetManager", () => {
  let manager: BudgetManager;

  beforeEach(() => {
    manager = new BudgetManager({
      daily: 10,
      weekly: 50,
      monthly: 200,
      perRequest: 1,
      alertThresholds: [0.5, 0.8, 0.95],
    });
  });

  describe("getStatus", () => {
    it("returns initial status with zero spending", () => {
      const status = manager.getStatus();
      expect(status.daily.spent).toBe(0);
      expect(status.daily.limit).toBe(10);
      expect(status.daily.percentUsed).toBe(0);
    });

    it("returns correct remaining after spending", () => {
      manager.recordSpending(3.5);
      const status = manager.getStatus();
      expect(status.daily.remaining).toBe(6.5);
    });
  });

  describe("checkBudget", () => {
    it("allows request within budget", () => {
      const result = manager.checkBudget(0.5);
      expect(result.allowed).toBe(true);
    });

    it("denies request exceeding per-request limit", () => {
      const result = manager.checkBudget(1.5);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("per-request limit");
    });

    it("denies request that would exceed daily budget", () => {
      manager.recordSpending(9.8);
      const result = manager.checkBudget(0.5);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("daily budget");
    });

    it("denies request that would exceed weekly budget", () => {
      manager.recordSpending(49.8);
      const result = manager.checkBudget(0.5);
      expect(result.allowed).toBe(false);
      // daily or weekly — daily hit first since daily=10 < 50
    });

    it("generates warnings at 50% threshold", () => {
      manager.recordSpending(5.5); // 55% of daily
      const result = manager.checkBudget(0.1);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.percentUsed >= 50)).toBe(true);
    });

    it("generates critical warning at 95%+", () => {
      manager.recordSpending(9.6); // 96% of daily
      const result = manager.checkBudget(0.01);
      const critical = result.warnings.find((w) => w.level === "critical");
      expect(critical).toBeDefined();
    });

    it("deduplicates warnings per period", () => {
      manager.recordSpending(9.6); // triggers 50%, 80%, 95% thresholds
      const result = manager.checkBudget(0.01);
      const dailyWarnings = result.warnings.filter((w) => w.period === "daily");
      expect(dailyWarnings.length).toBe(1); // only highest
      expect(dailyWarnings[0].level).toBe("critical");
    });
  });

  describe("recordSpending", () => {
    it("accumulates spending", () => {
      manager.recordSpending(1.0);
      manager.recordSpending(2.0);
      const status = manager.getStatus();
      expect(status.daily.spent).toBe(3.0);
    });

    it("updates all periods", () => {
      manager.recordSpending(5.0);
      const status = manager.getStatus();
      expect(status.daily.spent).toBe(5.0);
      expect(status.weekly.spent).toBe(5.0);
      expect(status.monthly.spent).toBe(5.0);
    });
  });

  describe("updateConfig", () => {
    it("updates budget limits", () => {
      manager.updateConfig({ daily: 20 });
      expect(manager.getConfig().daily).toBe(20);
    });

    it("preserves unmodified config", () => {
      manager.updateConfig({ daily: 20 });
      expect(manager.getConfig().weekly).toBe(50);
    });
  });

  describe("exportState / importState", () => {
    it("round-trips state", () => {
      manager.recordSpending(3.0);
      const state = manager.exportState();

      const newManager = new BudgetManager();
      newManager.importState(state as Parameters<BudgetManager["importState"]>[0]);
      expect(newManager.getStatus().daily.spent).toBe(3.0);
    });
  });
});
