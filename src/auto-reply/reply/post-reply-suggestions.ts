/**
 * Post-Reply Suggestions
 *
 * Formats contextual follow-up suggestions based on intent metadata.
 */

import type { IntentMetadata } from "../../bom-optimizer/types.js";

const CONFIDENCE_THRESHOLD = 0.5;

export function formatSuggestions(params: {
  intentMetadata?: IntentMetadata | null;
}): string | null {
  if (!params.intentMetadata) return null;
  if (params.intentMetadata.confidence < CONFIDENCE_THRESHOLD) return null;

  const applicable = params.intentMetadata.suggestions.filter((s) => s.timing === "after_reply");
  if (!applicable.length) return null;

  const lines = ["\n\n---", "**Gợi ý tiếp theo:**"];
  for (const s of applicable) lines.push(`- ${s.label} → \`${s.trigger}\``);
  return lines.join("\n");
}
