import { describe, it, expect } from "vitest";
import { resolveIntentMetadata } from "./intent.js";
import type { TaskClassification } from "../types.js";

function makeClassification(overrides: Partial<TaskClassification> = {}): TaskClassification {
  return {
    type: "unknown",
    complexity: "medium",
    estimatedInputTokens: 100,
    estimatedOutputTokens: 500,
    requiresReasoning: false,
    requiresCreativity: false,
    requiresAccuracy: false,
    confidence: 0.8,
    ...overrides,
  };
}

describe("resolveIntentMetadata", () => {
  it("boosts vibecode-build skill for build intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "build" }));
    expect(result.intent).toBe("build");
    expect(result.boostSkills).toContain("vibecode-build");
  });

  it("returns context hints for build intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "build" }));
    expect(result.contextHints.length).toBeGreaterThan(0);
    expect(result.contextHints[0]).toContain("vibecode-build");
  });

  it("returns deploy context hints for deploy intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "deploy" }));
    expect(result.intent).toBe("deploy");
    expect(result.contextHints.length).toBeGreaterThan(0);
    expect(result.contextHints[0]).toContain("deploy");
    expect(result.boostSkills).toEqual([]);
  });

  it("returns workflow context hints for workflow intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "workflow" }));
    expect(result.intent).toBe("workflow");
    expect(result.contextHints.length).toBeGreaterThan(0);
    expect(result.contextHints[0]).toContain("multi-step");
  });

  it("returns suggestions for build intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "build" }));
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].timing).toBe("after_reply");
  });

  it("returns coding suggestion for coding intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "coding" }));
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].trigger).toBe("/build");
  });

  it("returns empty boostSkills and suggestions for conversation intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "conversation" }));
    expect(result.boostSkills).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(result.contextHints).toEqual([]);
  });

  it("returns empty boostSkills and suggestions for unknown intent", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "unknown" }));
    expect(result.boostSkills).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(result.contextHints).toEqual([]);
  });

  it("passes through confidence from classification", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "build", confidence: 0.95 }));
    expect(result.confidence).toBe(0.95);
  });

  it("passes through confidence of 0.3", () => {
    const result = resolveIntentMetadata(makeClassification({ type: "build", confidence: 0.3 }));
    expect(result.confidence).toBe(0.3);
  });
});
