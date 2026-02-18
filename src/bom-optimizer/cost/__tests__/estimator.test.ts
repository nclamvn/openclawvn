import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  estimateCost,
  compareCosts,
  formatCostMessage,
  formatComparisonMessage,
} from "../estimator.js";

describe("estimateTokens", () => {
  it("estimates tokens from text length", () => {
    const result = estimateTokens("Hello world", "default");
    expect(result.input).toBeGreaterThan(0);
    expect(result.output).toBeGreaterThan(0);
  });

  it("uses higher output multiplier for code generation", () => {
    const codeGen = estimateTokens("Write a function", "code-generation");
    const classify = estimateTokens("Write a function", "classification");
    expect(codeGen.output).toBeGreaterThan(classify.output);
  });

  it("has high confidence for short inputs", () => {
    expect(estimateTokens("Short text").confidence).toBe("high");
  });

  it("has medium confidence for mid-length inputs", () => {
    const text = "a".repeat(10000);
    expect(estimateTokens(text).confidence).toBe("medium");
  });

  it("has low confidence for long inputs", () => {
    const text = "a".repeat(50000);
    expect(estimateTokens(text).confidence).toBe("low");
  });

  it("uses default multiplier for unknown task type", () => {
    const result = estimateTokens("Test", "unknown-type");
    expect(result.output).toBe(result.input); // default multiplier = 1.0
  });
});

describe("estimateCost", () => {
  it("calculates cost for Haiku", () => {
    const result = estimateCost("haiku", "Test input");
    expect(result.tier).toBe("haiku");
    expect(result.estimatedCost).toBeLessThan(0.01);
  });

  it("calculates cost for Sonnet", () => {
    const result = estimateCost("sonnet", "Test input");
    expect(result.tier).toBe("sonnet");
    expect(result.estimatedCost).toBeGreaterThan(0);
  });

  it("calculates cost for Opus", () => {
    const result = estimateCost("opus", "Test input");
    expect(result.tier).toBe("opus");
    expect(result.estimatedCost).toBeGreaterThan(0);
  });

  it("opus costs more than sonnet for same input", () => {
    // Use longer text so rounding doesn't collapse the difference
    const text = "a".repeat(2000);
    const opus = estimateCost("opus", text);
    const sonnet = estimateCost("sonnet", text);
    expect(opus.estimatedCost).toBeGreaterThan(sonnet.estimatedCost);
  });

  it("sonnet costs more than haiku for same input", () => {
    const sonnet = estimateCost("sonnet", "Test input text");
    const haiku = estimateCost("haiku", "Test input text");
    expect(sonnet.estimatedCost).toBeGreaterThan(haiku.estimatedCost);
  });

  it("handles long context pricing", () => {
    const short = estimateCost("sonnet", "Test", undefined, 100000);
    const long = estimateCost("sonnet", "Test", undefined, 250000);
    expect(long.isLongContext).toBe(true);
    expect(short.isLongContext).toBe(false);
  });

  it("long context costs more per token", () => {
    const short = estimateCost("sonnet", "Test", undefined, 100000);
    const long = estimateCost("sonnet", "Test", undefined, 250000);
    // Long context should cost more even with same base tokens
    expect(long.estimatedCost).toBeGreaterThan(short.estimatedCost);
  });

  it("includes breakdown", () => {
    const result = estimateCost("sonnet", "Hello world");
    expect(result.breakdown.inputCost).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.outputCost).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.inputCost + result.breakdown.outputCost).toBeCloseTo(
      result.estimatedCost,
      3,
    );
  });

  it("adds contextTokens to input tokens", () => {
    const noCtx = estimateCost("sonnet", "Test");
    const withCtx = estimateCost("sonnet", "Test", undefined, 5000);
    expect(withCtx.estimatedInputTokens).toBe(noCtx.estimatedInputTokens + 5000);
  });
});

describe("compareCosts", () => {
  it("provides alternatives for sonnet", () => {
    const result = compareCosts("sonnet", "Test input");
    expect(result.alternatives.length).toBe(2); // haiku and opus
  });

  it("sorts alternatives by cost ascending", () => {
    const result = compareCosts("sonnet", "Test input");
    const costs = result.alternatives.map((a) => a.estimatedCost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });

  it("recommends haiku for classification tasks", () => {
    const result = compareCosts("sonnet", "Test", "classification");
    const haiku = result.alternatives.find((a) => a.tier === "haiku");
    expect(haiku?.recommended).toBe(true);
  });

  it("recommends sonnet for opus users doing code review", () => {
    const result = compareCosts("opus", "Test", "code-review");
    const sonnet = result.alternatives.find((a) => a.tier === "sonnet");
    expect(sonnet?.recommended).toBe(true);
  });

  it("includes recommendation text", () => {
    const result = compareCosts("sonnet", "Test");
    expect(result.recommendation.length).toBeGreaterThan(0);
  });

  it("shows negative costDifference for cheaper alternatives", () => {
    const text = "a".repeat(2000);
    const result = compareCosts("opus", text);
    const haiku = result.alternatives.find((a) => a.tier === "haiku");
    expect(haiku?.costDifference).toBeLessThan(0);
  });
});

describe("formatCostMessage", () => {
  it("formats small costs with Proceed prompt", () => {
    const estimate = estimateCost("haiku", "Test");
    const msg = formatCostMessage(estimate);
    expect(msg.preExecution).toContain("Proceed?");
    expect(msg.preExecution).toContain("Haiku");
  });

  it("includes tier in postExecution", () => {
    const estimate = estimateCost("sonnet", "Test");
    const msg = formatCostMessage(estimate);
    expect(msg.postExecution).toContain("Sonnet");
  });
});

describe("formatComparisonMessage", () => {
  it("formats comparison as multi-line string", () => {
    const comparison = compareCosts("sonnet", "Test input");
    const msg = formatComparisonMessage(comparison);
    expect(msg).toContain("Cost Estimate:");
    expect(msg).toContain("Alternatives:");
  });
});
