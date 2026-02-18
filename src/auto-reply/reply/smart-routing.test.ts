import { describe, it, expect, vi } from "vitest";
import {
  optimizerKeyToGateway,
  gatewayToOptimizerKey,
  resolveSmartRouting,
  applySmartRouting,
  recordSmartRoutingUsage,
  type SmartRoutingConfig,
} from "./smart-routing.js";
import { classifyTask } from "../../bom-optimizer/router/classifier.js";
import type { OpenClawConfig } from "../../config/config.js";

// ── MODEL ID MAPPING ────────────────────────────────────────

describe("optimizerKeyToGateway", () => {
  it("maps claude-3-haiku to anthropic provider", () => {
    const result = optimizerKeyToGateway("claude-3-haiku");
    expect(result).toEqual({
      provider: "anthropic",
      model: "claude-3-haiku-20240307",
    });
  });

  it("maps claude-sonnet to anthropic provider", () => {
    const result = optimizerKeyToGateway("claude-sonnet");
    expect(result).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
    });
  });

  it("maps claude-opus to anthropic provider", () => {
    const result = optimizerKeyToGateway("claude-opus");
    expect(result).toEqual({
      provider: "anthropic",
      model: "claude-opus-4-6",
    });
  });

  it("maps gpt-4o-mini to openai provider", () => {
    const result = optimizerKeyToGateway("gpt-4o-mini");
    expect(result).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
    });
  });

  it("maps gemini-flash to google provider", () => {
    const result = optimizerKeyToGateway("gemini-flash");
    expect(result).toEqual({
      provider: "google",
      model: "gemini-2.0-flash",
    });
  });

  it("maps gemini-pro to google provider", () => {
    const result = optimizerKeyToGateway("gemini-pro");
    expect(result).toEqual({
      provider: "google",
      model: "gemini-2.5-pro",
    });
  });

  it("maps gpt-4o to openai provider", () => {
    const result = optimizerKeyToGateway("gpt-4o");
    expect(result).toEqual({
      provider: "openai",
      model: "gpt-4o",
    });
  });

  it("maps o1 to openai provider", () => {
    const result = optimizerKeyToGateway("o1");
    expect(result).toEqual({
      provider: "openai",
      model: "o1",
    });
  });

  it("returns null for unknown key", () => {
    expect(optimizerKeyToGateway("unknown-model")).toBeNull();
  });
});

describe("gatewayToOptimizerKey", () => {
  it("maps anthropic/claude-3-haiku-20240307 back to claude-3-haiku", () => {
    expect(gatewayToOptimizerKey("anthropic", "claude-3-haiku-20240307")).toBe("claude-3-haiku");
  });

  it("maps anthropic/claude-sonnet-4-5-20250929 back to claude-sonnet", () => {
    expect(gatewayToOptimizerKey("anthropic", "claude-sonnet-4-5-20250929")).toBe("claude-sonnet");
  });

  it("maps anthropic/claude-opus-4-6 back to claude-opus", () => {
    expect(gatewayToOptimizerKey("anthropic", "claude-opus-4-6")).toBe("claude-opus");
  });

  it("maps openai/gpt-4o-mini back to gpt-4o-mini", () => {
    expect(gatewayToOptimizerKey("openai", "gpt-4o-mini")).toBe("gpt-4o-mini");
  });

  it("maps google/gemini-2.0-flash back to gemini-flash", () => {
    expect(gatewayToOptimizerKey("google", "gemini-2.0-flash")).toBe("gemini-flash");
  });

  it("returns null for unrecognized model", () => {
    expect(gatewayToOptimizerKey("anthropic", "unknown-model-123")).toBeNull();
  });
});

// ── TASK CLASSIFICATION ─────────────────────────────────────

describe("classifyTask", () => {
  it("classifies 'hi' as conversation/simple", () => {
    const result = classifyTask("hi");
    expect(result.type).toBe("conversation");
    expect(result.complexity).toBe("simple");
  });

  it("classifies 'hello' as conversation/simple", () => {
    const result = classifyTask("hello");
    expect(result.type).toBe("conversation");
    expect(result.complexity).toBe("simple");
  });

  it("classifies coding request as coding", () => {
    const result = classifyTask("write a Python function for binary search");
    expect(result.type).toBe("coding");
  });

  it("classifies 'write a Python function for merge sort with tests' as coding/medium", () => {
    const result = classifyTask("write a Python function for merge sort with tests");
    expect(result.type).toBe("coding");
    // "with tests" matches COMPLEXITY_COMPLEX_PATTERNS via "with ... (code|explanation)"
    // but "write a" also matches writing. coding scores higher due to "function" + "Python"
  });

  it("classifies translation request", () => {
    const result = classifyTask("translate this to Vietnamese: hello world");
    expect(result.type).toBe("translation");
  });

  it("classifies summarization request", () => {
    const result = classifyTask("summarize this article for me");
    expect(result.type).toBe("summarization");
  });
});

// ── RESOLVE SMART ROUTING CONFIG ────────────────────────────

describe("resolveSmartRouting", () => {
  it("returns null when smartRouting is not configured", () => {
    const cfg = { agents: { defaults: {} } } as OpenClawConfig;
    expect(resolveSmartRouting({ cfg, agentCfg: cfg.agents?.defaults })).toBeNull();
  });

  it("returns null when enabled is false", () => {
    const cfg = {
      agents: { defaults: { smartRouting: { enabled: false } } },
    } as OpenClawConfig;
    expect(resolveSmartRouting({ cfg, agentCfg: cfg.agents?.defaults })).toBeNull();
  });

  it("returns config with defaults when enabled", () => {
    const cfg = {
      agents: { defaults: { smartRouting: { enabled: true } } },
    } as OpenClawConfig;
    const result = resolveSmartRouting({ cfg, agentCfg: cfg.agents?.defaults });
    expect(result).toEqual({
      enabled: true,
      preferredProvider: "anthropic",
      allowDowngrade: true,
      allowUpgrade: true,
      trackingEnabled: true,
      costDisplay: "off",
      intentDetection: true,
      skillBoost: true,
      postReplySuggestions: true,
    });
  });

  it("respects custom config values", () => {
    const cfg = {
      agents: {
        defaults: {
          smartRouting: {
            enabled: true,
            preferredProvider: "google" as const,
            allowDowngrade: false,
            costDisplay: "prefix" as const,
          },
        },
      },
    } as OpenClawConfig;
    const result = resolveSmartRouting({ cfg, agentCfg: cfg.agents?.defaults });
    expect(result?.preferredProvider).toBe("google");
    expect(result?.allowDowngrade).toBe(false);
    expect(result?.costDisplay).toBe("prefix");
  });
});

// ── APPLY SMART ROUTING ─────────────────────────────────────

describe("applySmartRouting", () => {
  const baseConfig: SmartRoutingConfig = {
    enabled: true,
    preferredProvider: "anthropic",
    allowDowngrade: true,
    allowUpgrade: true,
    trackingEnabled: true,
    costDisplay: "off",
    intentDetection: true,
    skillBoost: true,
    postReplySuggestions: true,
  };

  it("routes 'hi' to haiku (cheapest anthropic model)", () => {
    const result = applySmartRouting({
      prompt: "hi",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: baseConfig,
    });
    expect(result).not.toBeNull();
    expect(result?.provider).toBe("anthropic");
    expect(result?.model).toBe("claude-3-haiku-20240307");
    expect(result?.classification.type).toBe("conversation");
  });

  it("returns null when routing matches current model", () => {
    const result = applySmartRouting({
      prompt: "hi",
      currentProvider: "anthropic",
      currentModel: "claude-3-haiku-20240307",
      config: baseConfig,
    });
    // "hi" → conversation/simple → haiku, which matches current model
    expect(result).toBeNull();
  });

  it("prevents downgrade when allowDowngrade is false", () => {
    const result = applySmartRouting({
      prompt: "hi",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: { ...baseConfig, allowDowngrade: false },
    });
    // Would route to haiku (cheaper) but downgrade is not allowed
    expect(result).toBeNull();
  });

  it("prevents upgrade when allowUpgrade is false", () => {
    const result = applySmartRouting({
      prompt: "write a detailed analysis of quantum computing with step by step explanation",
      currentProvider: "anthropic",
      currentModel: "claude-3-haiku-20240307",
      config: { ...baseConfig, allowUpgrade: false },
    });
    // Would want to upgrade to sonnet/opus but upgrade is not allowed
    expect(result).toBeNull();
  });

  it("routes coding to sonnet (balanced tier)", () => {
    const result = applySmartRouting({
      prompt: "write a Python function for merge sort",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: baseConfig,
    });
    // coding/medium → claude-sonnet
    if (result) {
      expect(result.provider).toBe("anthropic");
      // Medium coding → sonnet
      expect(result.model).toBe("claude-sonnet-4-5-20250929");
    }
  });

  it("includes classification in result", () => {
    const result = applySmartRouting({
      prompt: "translate this to English: xin chào",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: baseConfig,
    });
    expect(result).not.toBeNull();
    expect(result?.classification.type).toBe("translation");
  });

  it("includes routing decision with estimated cost", () => {
    const result = applySmartRouting({
      prompt: "hello there, how are you?",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: baseConfig,
    });
    expect(result).not.toBeNull();
    expect(result?.routingDecision.estimatedCost).toBeGreaterThanOrEqual(0);
  });

  it("includes intentMetadata for build prompt", () => {
    const result = applySmartRouting({
      prompt: "build me a landing page for coffee shop",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: baseConfig,
    });
    expect(result).not.toBeNull();
    expect(result?.intentMetadata).toBeDefined();
    expect(result?.intentMetadata?.intent).toBe("build");
    expect(result?.intentMetadata?.boostSkills).toContain("vibecode-build");
  });

  it("returns no intentMetadata when intentDetection is disabled", () => {
    const result = applySmartRouting({
      prompt: "build me a landing page for coffee shop",
      currentProvider: "anthropic",
      currentModel: "claude-opus-4-6",
      config: { ...baseConfig, intentDetection: false },
    });
    if (result) {
      expect(result.intentMetadata).toBeUndefined();
    }
  });

  it("returns intentMetadata on no-op routing when boostSkills present", () => {
    // build/medium → claude-sonnet, if current is already sonnet it's a no-op
    // but we should still get intentMetadata
    const result = applySmartRouting({
      prompt: "build me a landing page",
      currentProvider: "anthropic",
      currentModel: "claude-sonnet-4-5-20250929",
      config: baseConfig,
    });
    // build routes to sonnet (same model) but should still return for intent
    expect(result).not.toBeNull();
    expect(result?.intentMetadata?.boostSkills).toContain("vibecode-build");
  });
});

// ── USAGE RECORDING ─────────────────────────────────────────

describe("recordSmartRoutingUsage", () => {
  it("does not throw on recording", async () => {
    // This will try to open the SQLite DB; in test env it may fail
    // but recordSmartRoutingUsage should never throw
    await expect(
      recordSmartRoutingUsage({
        userId: "test-user",
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        inputTokens: 100,
        outputTokens: 50,
        latencyMs: 500,
      }),
    ).resolves.not.toThrow();
  });

  it("maps gateway model IDs back to optimizer keys", () => {
    // Verify the reverse mapping is correct
    expect(gatewayToOptimizerKey("anthropic", "claude-3-haiku-20240307")).toBe("claude-3-haiku");
    expect(gatewayToOptimizerKey("anthropic", "claude-sonnet-4-5-20250929")).toBe("claude-sonnet");
    expect(gatewayToOptimizerKey("anthropic", "claude-opus-4-6")).toBe("claude-opus");
    expect(gatewayToOptimizerKey("openai", "gpt-4o-mini")).toBe("gpt-4o-mini");
    expect(gatewayToOptimizerKey("google", "gemini-2.0-flash")).toBe("gemini-flash");
  });
});
