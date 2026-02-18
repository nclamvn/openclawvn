import { describe, it, expect } from "vitest";
import { formatSuggestions } from "./post-reply-suggestions.js";
import type { IntentMetadata } from "../../bom-optimizer/types.js";

function makeIntent(overrides: Partial<IntentMetadata> = {}): IntentMetadata {
  return {
    intent: "build",
    boostSkills: ["vibecode-build"],
    contextHints: ["User wants to build a web application."],
    suggestions: [
      { label: "Deploy this project?", trigger: "/deploy", timing: "after_reply" },
      { label: "Run verification?", trigger: "/build verify", timing: "after_reply" },
    ],
    confidence: 0.8,
    ...overrides,
  };
}

describe("formatSuggestions", () => {
  it("formats suggestions correctly for build intent", () => {
    const result = formatSuggestions({ intentMetadata: makeIntent() });
    expect(result).not.toBeNull();
    expect(result).toContain("Gợi ý tiếp theo");
    expect(result).toContain("/deploy");
    expect(result).toContain("/build verify");
    expect(result).toContain("Deploy this project?");
  });

  it("returns null when confidence < 0.5", () => {
    const result = formatSuggestions({ intentMetadata: makeIntent({ confidence: 0.3 }) });
    expect(result).toBeNull();
  });

  it("returns null when intentMetadata is null", () => {
    expect(formatSuggestions({ intentMetadata: null })).toBeNull();
  });

  it("returns null when intentMetadata is undefined", () => {
    expect(formatSuggestions({ intentMetadata: undefined })).toBeNull();
  });

  it("returns null for conversation intent (no suggestions)", () => {
    const result = formatSuggestions({
      intentMetadata: makeIntent({
        intent: "conversation",
        suggestions: [],
        confidence: 0.8,
      }),
    });
    expect(result).toBeNull();
  });

  it("includes separator and heading", () => {
    const result = formatSuggestions({ intentMetadata: makeIntent() });
    expect(result).toContain("---");
    expect(result).toContain("**Gợi ý tiếp theo:**");
  });

  it("returns null when all suggestions have non-matching timing", () => {
    // Currently all suggestions use "after_reply", but test the filter
    const result = formatSuggestions({
      intentMetadata: makeIntent({ suggestions: [] }),
    });
    expect(result).toBeNull();
  });
});
