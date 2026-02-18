/**
 * LLM-powered fact extraction from session transcripts.
 * Extracts structured user facts for the UserFactStore.
 * Follows the same pattern as llm-slug-generator.ts.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runEmbeddedPiAgent } from "../agents/pi-embedded.js";
import {
  resolveDefaultAgentId,
  resolveAgentWorkspaceDir,
  resolveAgentDir,
} from "../agents/agent-scope.js";
import type { OpenClawConfig } from "../config/config.js";
import type { MemoryCategory, UserFact, UserFactExtractionResult } from "./user-facts.types.js";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const EXTRACTION_PROMPT = `Bạn là bộ trích xuất thông tin. Phân tích đoạn hội thoại sau và
trích xuất CÁC SỰ KIỆN CỤ THỂ về người dùng (user).

CHỈ trích xuất thông tin CHẮC CHẮN, KHÔNG suy đoán.

Phân loại mỗi fact vào 1 trong 6 nhóm:
- identity: Tên, tuổi, giới tính, nghề nghiệp, nơi ở
- preference: Thích/ghét, phong cách, thói quen
- project: Dự án đang làm, mục tiêu, deadline
- relationship: Người liên quan (đồng nghiệp, gia đình)
- skill: Kỹ năng, công nghệ sử dụng, expertise
- fact: Thông tin khác đáng nhớ

Cho điểm confidence 0.0-1.0:
- 1.0: User nói trực tiếp ("Tôi tên Minh")
- 0.8: Suy ra rõ ràng từ context
- 0.6: Có thể đúng nhưng chưa chắc chắn
- Dưới 0.6: KHÔNG trích xuất

Trả lời ĐÚNG JSON format, không giải thích thêm:
[
  {
    "category": "identity",
    "content": "Tên là Minh",
    "confidence": 1.0
  }
]

Nếu không có thông tin đáng trích xuất, trả về: []`;

const VALID_CATEGORIES: Set<string> = new Set([
  "identity",
  "preference",
  "project",
  "relationship",
  "skill",
  "fact",
]);

type RawExtractedFact = {
  category: string;
  content: string;
  confidence: number;
};

/**
 * Extract structured facts from chat messages using LLM.
 *
 * @param messages - Chat messages from a session
 * @param sessionId - Session identifier for tracking
 * @param cfg - OpenClaw config (for resolving agent, API keys, etc.)
 * @returns Extraction result with facts and token usage
 */
export async function extractFacts(params: {
  messages: ChatMessage[];
  sessionId: string;
  cfg: OpenClawConfig;
}): Promise<UserFactExtractionResult> {
  const { messages, sessionId, cfg } = params;

  const emptyResult: UserFactExtractionResult = {
    facts: [],
    sessionId,
    tokensUsed: 0,
  };

  // Filter to user messages only for counting
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < 3) {
    return emptyResult;
  }

  // Take up to 20 most recent messages (both user and assistant for context)
  const recentMessages = messages.slice(-20);
  const conversationText = recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

  // Build the full prompt
  const prompt = `${EXTRACTION_PROMPT}\n\nHội thoại:\n${conversationText}`;

  let tempSessionFile: string | null = null;

  try {
    const agentId = resolveDefaultAgentId(cfg);
    const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
    const agentDir = resolveAgentDir(cfg, agentId);

    // Create temporary session file for one-off LLM call
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-fact-extract-"));
    tempSessionFile = path.join(tempDir, "session.jsonl");

    const result = await runEmbeddedPiAgent({
      sessionId: `fact-extract-${Date.now()}`,
      sessionKey: "temp:fact-extractor",
      sessionFile: tempSessionFile,
      workspaceDir,
      agentDir,
      config: cfg,
      prompt,
      timeoutMs: 30_000, // 30 second timeout
      runId: `fact-extract-${Date.now()}`,
    });

    // Extract text from payloads
    const text = result.payloads?.[0]?.text;
    if (!text) {
      return emptyResult;
    }

    // Parse JSON from response (may have markdown fencing)
    const facts = parseExtractionResponse(text, sessionId);

    return {
      facts,
      sessionId,
      tokensUsed: result.usage?.totalTokens ?? 0,
    };
  } catch (err) {
    // Silent fail — extraction errors should never affect the user
    console.error("[fact-extractor] Extraction failed:", err);
    return emptyResult;
  } finally {
    if (tempSessionFile) {
      try {
        await fs.rm(path.dirname(tempSessionFile), { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Parse the LLM response into validated UserFact objects.
 * Handles markdown code fences, invalid JSON, and filters low confidence.
 */
export function parseExtractionResponse(text: string, sessionId: string): UserFact[] {
  // Strip markdown code fences if present
  let jsonText = text.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch?.[1]) {
    jsonText = fenceMatch[1].trim();
  }

  // Try to find JSON array in the response
  const arrayStart = jsonText.indexOf("[");
  const arrayEnd = jsonText.lastIndexOf("]");
  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    return [];
  }
  jsonText = jsonText.slice(arrayStart, arrayEnd + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const now = new Date().toISOString();
  const facts: UserFact[] = [];

  for (const item of parsed) {
    const raw = item as RawExtractedFact;
    if (!raw || typeof raw !== "object") continue;
    if (typeof raw.content !== "string" || !raw.content.trim()) continue;
    if (typeof raw.confidence !== "number" || raw.confidence < 0.7) continue;
    if (!VALID_CATEGORIES.has(raw.category)) continue;

    facts.push({
      id: "", // Will be assigned by UserFactStore.add()
      category: raw.category as MemoryCategory,
      content: raw.content.trim(),
      confidence: Math.min(1, Math.max(0, raw.confidence)),
      source: {
        sessionId,
        extractedAt: now,
      },
      verified: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return facts;
}
