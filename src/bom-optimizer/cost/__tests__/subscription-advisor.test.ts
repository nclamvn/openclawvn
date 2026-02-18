import { describe, it, expect } from "vitest";
import {
  analyzeForSubscription,
  generateSubscriptionComparison,
  formatSubscriptionAdvice,
} from "../subscription-advisor.js";

describe("analyzeForSubscription", () => {
  it("does not recommend for low API cost ($10/mo)", () => {
    const advice = analyzeForSubscription(10);
    expect(advice.shouldRecommend).toBe(false);
  });

  it("recommends Pro for moderate API cost ($30/mo)", () => {
    // $30 > $15 threshold, Pro=$20, savings=10, savingsPercent=33% > 20%
    const advice = analyzeForSubscription(30);
    expect(advice.shouldRecommend).toBe(true);
    expect(advice.plan).toBe("pro");
  });

  it("recommends Max 5x for high API cost ($150/mo)", () => {
    // $150 > $70 threshold, Max5x=$100, savings=50, savingsPercent=33% > 20%
    const advice = analyzeForSubscription(150);
    expect(advice.shouldRecommend).toBe(true);
    expect(advice.plan).toBe("max5x");
  });

  it("recommends Max 20x for very high API cost ($300/mo)", () => {
    // $300 > $150 threshold, Max20x=$200, savings=100, savingsPercent=33% > 20%
    const advice = analyzeForSubscription(300);
    expect(advice.shouldRecommend).toBe(true);
    expect(advice.plan).toBe("max20x");
  });

  it("does not recommend for automation-heavy usage", () => {
    const advice = analyzeForSubscription(150, { interactivePercent: 20 });
    expect(advice.shouldRecommend).toBe(false);
    expect(advice.reason).toContain("automation");
  });

  it("recommends for interactive-heavy usage", () => {
    const advice = analyzeForSubscription(150, { interactivePercent: 80 });
    expect(advice.shouldRecommend).toBe(true);
  });

  it("includes correct savings figures", () => {
    const advice = analyzeForSubscription(150);
    expect(advice.savings).toBe(50); // 150 - 100
    expect(advice.savingsPercent).toBeGreaterThan(0);
  });

  it("does not recommend when savings below threshold", () => {
    // $16 > $15 threshold → Pro selected, but Pro=$20, savings=-4 → negative
    const advice = analyzeForSubscription(16);
    expect(advice.shouldRecommend).toBe(false);
  });

  it("does not recommend when savings percent is marginal", () => {
    // $80 > $70 → Max5x($100) selected, savings = 80-100 = -20 → negative
    const advice = analyzeForSubscription(80);
    expect(advice.shouldRecommend).toBe(false);
  });
});

describe("generateSubscriptionComparison", () => {
  it("compares all options", () => {
    const comparison = generateSubscriptionComparison(50);
    expect(comparison.apiCost).toBe(50);
    expect(comparison.proCost).toBe(20);
    expect(comparison.max5xCost).toBe(100);
    expect(comparison.max20xCost).toBe(200);
  });

  it("identifies cheapest option for $150 API cost", () => {
    // api=$150, pro=$20, max5x=$100, max20x=$200 → cheapest is pro ($20)
    const comparison = generateSubscriptionComparison(150);
    expect(comparison.cheapestOption).toBe("pro");
  });

  it("identifies API as cheapest for $10 cost", () => {
    const comparison = generateSubscriptionComparison(10);
    expect(comparison.cheapestOption).toBe("api");
  });

  it("calculates potential savings vs cheapest option", () => {
    // $150 API, cheapest=pro($20), savings = 150-20 = 130
    const comparison = generateSubscriptionComparison(150);
    expect(comparison.potentialSavings).toBe(130);
  });

  it("shows zero savings when API is cheapest", () => {
    const comparison = generateSubscriptionComparison(10);
    expect(comparison.potentialSavings).toBe(0);
  });
});

describe("formatSubscriptionAdvice", () => {
  it("formats recommendation message", () => {
    // $300/mo → Max20x recommended, savings 33%
    const advice = analyzeForSubscription(300);
    const message = formatSubscriptionAdvice(advice);
    expect(message).toContain("SUBSCRIPTION RECOMMENDATION");
  });

  it("includes savings info", () => {
    const advice = analyzeForSubscription(300);
    const message = formatSubscriptionAdvice(advice);
    expect(message).toContain("savings");
  });

  it("returns reason for non-recommendation", () => {
    const advice = analyzeForSubscription(5);
    const message = formatSubscriptionAdvice(advice);
    expect(message).toContain("lower than Pro");
  });
});
