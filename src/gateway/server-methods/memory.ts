import { loadConfig } from "../../config/config.js";
import { resolveDefaultAgentId, resolveAgentDir } from "../../agents/agent-scope.js";
import { UserFactStore, resolveUserFactsPath } from "../../memory/user-fact-store.js";
import { extractFacts } from "../../memory/fact-extractor.js";
import { parseExtractionResponse } from "../../memory/fact-extractor.js";
import type { MemoryCategory } from "../../memory/user-facts.types.js";
import { readSessionMessages, loadSessionEntry } from "../session-utils.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

function getStore(): UserFactStore {
  const cfg = loadConfig();
  const agentId = resolveDefaultAgentId(cfg);
  const agentDir = resolveAgentDir(cfg, agentId);
  return new UserFactStore(resolveUserFactsPath(agentDir));
}

function extractTextContent(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const msg = message as Record<string, unknown>;
  const role = msg.role;
  if (typeof role !== "string") return "";

  const content = msg.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as Record<string, unknown>).text ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

export const memoryHandlers: GatewayRequestHandlers = {
  "memory.list": ({ params, respond }) => {
    try {
      const store = getStore();
      const category =
        typeof params.category === "string" ? (params.category as MemoryCategory) : undefined;
      const keyword = typeof params.keyword === "string" ? params.keyword : undefined;
      const minConfidence =
        typeof params.minConfidence === "number" ? params.minConfidence : undefined;
      const limit = typeof params.limit === "number" ? params.limit : undefined;

      const facts = store.list({ category, keyword, minConfidence, limit });
      respond(true, { facts, total: facts.length }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },

  "memory.search": ({ params, respond }) => {
    try {
      const keyword = typeof params.keyword === "string" ? params.keyword.trim() : "";
      if (!keyword) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "keyword required"));
        return;
      }
      const store = getStore();
      const limit = typeof params.limit === "number" ? Math.min(params.limit, 100) : 50;
      const facts = store.search(keyword).slice(0, limit);
      respond(true, { facts }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },

  "memory.update": ({ params, respond }) => {
    try {
      const id = typeof params.id === "string" ? params.id.trim() : "";
      if (!id) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "id required"));
        return;
      }
      const store = getStore();
      const patch: Record<string, unknown> = {};
      if (typeof params.content === "string") patch.content = params.content;
      if (typeof params.category === "string") patch.category = params.category;
      if (typeof params.verified === "boolean") patch.verified = params.verified;
      if (typeof params.confidence === "number") patch.confidence = params.confidence;

      const fact = store.update(id, patch);
      if (!fact) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, `fact not found: ${id}`));
        return;
      }
      respond(true, { fact }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },

  "memory.delete": ({ params, respond }) => {
    try {
      const id = typeof params.id === "string" ? params.id.trim() : "";
      if (!id) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "id required"));
        return;
      }
      const store = getStore();
      const success = store.delete(id);
      respond(true, { success }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },

  "memory.extract": async ({ params, respond }) => {
    try {
      const sessionKey = typeof params.sessionKey === "string" ? params.sessionKey.trim() : "";
      if (!sessionKey) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "sessionKey required"));
        return;
      }

      const cfg = loadConfig();
      const { entry } = loadSessionEntry(sessionKey);
      const sessionId = entry?.sessionId;
      if (!sessionId) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, `session not found: ${sessionKey}`),
        );
        return;
      }

      // Read session messages
      const rawMessages = readSessionMessages(sessionId, undefined, entry?.sessionFile);
      const messages = rawMessages
        .filter((m) => {
          const msg = m as Record<string, unknown>;
          return msg.role === "user" || msg.role === "assistant";
        })
        .map((m) => {
          const msg = m as Record<string, unknown>;
          return {
            role: msg.role as "user" | "assistant",
            content: extractTextContent(m),
          };
        })
        .filter((m) => m.content.length > 0);

      const result = await extractFacts({ messages, sessionId, cfg });

      // Add extracted facts to store (with dedup)
      const store = getStore();
      const added = [];
      for (const fact of result.facts) {
        const stored = store.add({
          category: fact.category,
          content: fact.content,
          confidence: fact.confidence,
          source: fact.source,
          verified: false,
        });
        added.push(stored);
      }

      respond(
        true,
        { facts: added, count: added.length, tokensUsed: result.tokensUsed },
        undefined,
      );
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },

  "memory.inject": ({ params, respond }) => {
    try {
      const message = typeof params.message === "string" ? params.message.trim() : "";
      if (!message) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "message required"));
        return;
      }

      const store = getStore();
      const limit = typeof params.limit === "number" ? params.limit : 10;
      const facts = store.getForInjection(message, limit);
      const context = store.formatForInjection(facts);

      respond(true, { context, count: facts.length }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },

  "memory.getActiveContext": ({ params, respond }) => {
    try {
      const sessionKey = typeof params.sessionKey === "string" ? params.sessionKey.trim() : "";

      // Check memoryEnabled on the session entry (default: true)
      if (sessionKey) {
        const { entry } = loadSessionEntry(sessionKey);
        if (entry?.memoryEnabled === false) {
          respond(true, { enabled: false, facts: [], context: "", totalFacts: 0 }, undefined);
          return;
        }
      }

      const store = getStore();
      const totalFacts = store.count;
      const message = typeof params.message === "string" ? params.message.trim() : "";
      const limit = typeof params.limit === "number" ? params.limit : 10;

      // If a message is provided, get relevant facts; otherwise return all
      const facts = message ? store.getForInjection(message, limit) : store.list({ limit: limit });
      const context = store.formatForInjection(facts);

      respond(true, { enabled: true, facts, context, totalFacts }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, String(err)));
    }
  },
};
