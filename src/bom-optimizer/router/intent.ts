/**
 * Intent Resolution Engine
 *
 * Maps TaskClassification → IntentMetadata.
 * Pure function module — no LLM calls, no side effects, no external deps.
 */

import type { TaskClassification, IntentMetadata, IntentSuggestion } from "../types.js";

// ── SKILL BOOST MAP ─────────────────────────────────────────

/** Maps skill names to the task types that should boost them. */
const SKILL_BOOST_MAP: Record<string, string[]> = {
  "vibecode-build": ["build"],
};

// ── CONTEXT HINTS ───────────────────────────────────────────

const CONTEXT_HINTS: Record<string, string[]> = {
  build: [
    "User wants to build a web application. Use the vibecode-build skill's Architect→Blueprint→Builder methodology.",
    "Project types: landing, saas, dashboard, blog, portfolio. Recommend /build for guided flow.",
  ],
  deploy: [
    "User wants to deploy an application. Check workspace for existing project first.",
    "Common platforms: Vercel, Railway, Fly.io, Docker.",
  ],
  workflow: [
    "User wants a multi-step workflow. Break into discrete steps and confirm plan before execution.",
  ],
};

// ── SUGGESTIONS ─────────────────────────────────────────────

const SUGGESTIONS: Record<string, IntentSuggestion[]> = {
  build: [
    { label: "Deploy this project?", trigger: "/deploy", timing: "after_reply" },
    { label: "Run verification?", trigger: "/build verify", timing: "after_reply" },
  ],
  coding: [{ label: "Build a full app from this?", trigger: "/build", timing: "after_reply" }],
};

// ── RESOLVE ─────────────────────────────────────────────────

export function resolveIntentMetadata(classification: TaskClassification): IntentMetadata {
  const intent = classification.type;

  const boostSkills: string[] = [];
  for (const [skill, types] of Object.entries(SKILL_BOOST_MAP)) {
    if (types.includes(intent)) boostSkills.push(skill);
  }

  return {
    intent,
    boostSkills,
    contextHints: CONTEXT_HINTS[intent] ?? [],
    suggestions: SUGGESTIONS[intent] ?? [],
    confidence: classification.confidence,
  };
}
