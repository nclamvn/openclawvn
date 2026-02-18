import { describe, it, expect, beforeEach } from "vitest";
import { AnalyticsAggregator, formatAnalyticsVi } from "../analytics.js";

describe("AnalyticsAggregator", () => {
  let agg: AnalyticsAggregator;

  beforeEach(() => {
    agg = new AnalyticsAggregator();
  });

  describe("addRecord / getAnalytics", () => {
    it("counts a single record", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "sonnet",
        tier: "sonnet",
        taskType: "code-generation",
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.01,
      });

      const a = agg.getAnalytics("day");
      expect(a.totalRequests).toBe(1);
      expect(a.totalCost).toBeGreaterThan(0);
    });

    it("aggregates multiple records", () => {
      for (let i = 0; i < 5; i++) {
        agg.addRecord({
          timestamp: new Date(),
          model: "sonnet",
          tier: "sonnet",
          taskType: "conversation",
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.002,
        });
      }
      const a = agg.getAnalytics("day");
      expect(a.totalRequests).toBe(5);
      expect(a.totalCost).toBeCloseTo(0.01, 3);
    });
  });

  describe("byModel grouping", () => {
    it("groups by model", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "sonnet",
        tier: "sonnet",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });
      agg.addRecord({
        timestamp: new Date(),
        model: "haiku",
        tier: "haiku",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.001,
      });
      agg.addRecord({
        timestamp: new Date(),
        model: "sonnet",
        tier: "sonnet",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });

      const a = agg.getAnalytics("day");
      expect(a.byModel.length).toBe(2);
      const sonnet = a.byModel.find((m) => m.model === "sonnet");
      expect(sonnet?.requests).toBe(2);
    });
  });

  describe("byTaskType grouping", () => {
    it("groups by task type", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "sonnet",
        tier: "sonnet",
        taskType: "coding",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });
      agg.addRecord({
        timestamp: new Date(),
        model: "sonnet",
        tier: "sonnet",
        taskType: "conversation",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.005,
      });

      const a = agg.getAnalytics("day");
      expect(a.byTaskType.length).toBe(2);
    });
  });

  describe("subscriptionComparison", () => {
    it("includes subscription comparison", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "sonnet",
        tier: "sonnet",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });

      const a = agg.getAnalytics("month");
      expect(a.subscriptionComparison).toHaveProperty("apiCost");
      expect(a.subscriptionComparison).toHaveProperty("proCost");
    });
  });

  describe("peakUsageHour", () => {
    it("finds peak hour", () => {
      const now = new Date();
      for (let i = 0; i < 5; i++) {
        agg.addRecord({
          timestamp: now,
          model: "s",
          tier: "sonnet",
          taskType: "a",
          inputTokens: 1,
          outputTokens: 1,
          cost: 0.01,
        });
      }
      const a = agg.getAnalytics("day");
      expect(a.peakUsageHour).toBe(now.getHours());
    });
  });

  describe("costTrend", () => {
    it("returns stable with no previous data", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "s",
        tier: "sonnet",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });
      expect(agg.getAnalytics("day").costTrend).toBe("stable");
    });
  });

  describe("export/import", () => {
    it("round-trips records", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "s",
        tier: "sonnet",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });

      const exported = agg.exportRecords();
      const newAgg = new AnalyticsAggregator();
      newAgg.importRecords(exported);
      expect(newAgg.getAnalytics("day").totalRequests).toBe(1);
    });
  });

  describe("clearRecords", () => {
    it("clears all records", () => {
      agg.addRecord({
        timestamp: new Date(),
        model: "s",
        tier: "sonnet",
        taskType: "a",
        inputTokens: 1,
        outputTokens: 1,
        cost: 0.01,
      });
      agg.clearRecords();
      expect(agg.getAnalytics("day").totalRequests).toBe(0);
    });
  });
});

describe("formatAnalyticsVi", () => {
  it("formats in Vietnamese", () => {
    const agg = new AnalyticsAggregator();
    agg.addRecord({
      timestamp: new Date(),
      model: "sonnet",
      tier: "sonnet",
      taskType: "code",
      inputTokens: 1000,
      outputTokens: 500,
      cost: 0.01,
    });

    const a = agg.getAnalytics("day");
    const text = formatAnalyticsVi(a);
    expect(text).toContain("Thống kê");
    expect(text).toContain("Tổng chi phí");
    expect(text).toContain("Số request");
  });
});
