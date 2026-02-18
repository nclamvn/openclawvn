/**
 * Task Classifier
 * Analyzes request to determine task type and complexity
 */

import type { TaskType, TaskClassification } from "../types.js";

// ── TASK PATTERNS ───────────────────────────────────────────

const TASK_PATTERNS: Record<TaskType, RegExp[]> = {
  classification: [
    /\b(classify|categorize|label|tag|sort|which category|what type)\b/i,
    /\b(is this|is it|does this|determine if)\b/i,
    /\b(spam|not spam|positive|negative|sentiment)\b/i,
  ],
  extraction: [
    /\b(extract|pull out|find all|list all|get the|parse)\b/i,
    /\b(entities|names|dates|numbers|emails|phones)\b/i,
    /\b(from this|from the following)\b.*\b(document|text|data)\b/i,
  ],
  summarization: [
    /\b(summarize|summary|summarise|tldr|tl;dr|brief|overview)\b/i,
    /\b(condense|shorten|key points|main points|highlights)\b/i,
    /\b(in (a few|brief|short) words)\b/i,
  ],
  translation: [
    /\b(translate|translation|dịch|chuyển ngữ)\b/i,
    /\b(to english|to vietnamese|sang tiếng|into)\b/i,
    /\b(tiếng việt|tiếng anh|vietnamese|english|chinese|japanese)\b/i,
  ],
  writing: [
    /\b(write|draft|compose|create|generate)\b/i,
    /\b(email|letter|article|blog|post|essay|report|story)\b/i,
    /\b(viết|soạn|tạo)\b/i,
  ],
  editing: [
    /\b(edit|revise|improve|fix|correct|proofread|rewrite)\b/i,
    /\b(grammar|spelling|style|tone|clarity)\b/i,
    /\b(make it|make this)\b.*\b(better|clearer|shorter|longer)\b/i,
  ],
  analysis: [
    /\b(analyze|analyse|analysis|evaluate|assess|review|examine)\b/i,
    /\b(compare|contrast|pros and cons|advantages|disadvantages)\b/i,
    /\b(why|how come|what caused|explain why|reason)\b/i,
  ],
  coding: [
    /\b(code|function|class|method|api|bug|error|debug)\b/i,
    /\b(javascript|typescript|python|java|react|node)\b/i,
    /\b(implement|refactor|optimize|fix the|write a)\b.*\b(code|function|script)\b/i,
  ],
  build: [
    /\b(build|tạo|xây dựng|vibecode|scaffold|generate\s+app)\b/i,
    /\b(landing\s*page|saas|dashboard|portfolio)\b/i,
    /\b(blueprint|web\s*app|next\.?js\s+app|react\s+app)\b/i,
    /\b(\/build|vibecode-build)\b/i,
  ],
  deploy: [
    /\b(deploy|triển khai|ship|publish|go\s+live|push\s+to\s+prod)\b/i,
    /\b(vercel|railway|fly\.io|docker|netlify|cloudflare)\b/i,
    /\b(hosting|domain|production\s+server)\b/i,
  ],
  workflow: [
    /\b(workflow|quy\s+trình|pipeline|automate|orchestrate)\b/i,
    /\b(multi.?step|sequence|chain\s+of)\b/i,
  ],
  conversation: [
    /\b(hi|hello|hey|xin chào|chào)\b/i,
    /\b(how are you|what do you think|tell me about)\b/i,
    /\b(chat|talk|discuss|conversation)\b/i,
  ],
  unknown: [],
};

const COMPLEXITY_SIMPLE_PATTERNS = [
  /\b(simple|quick|brief|short|just)\b/i,
  /\b(one sentence|few words|yes or no)\b/i,
];

const COMPLEXITY_COMPLEX_PATTERNS = [
  /\b(detailed|comprehensive|thorough|in-depth|extensive)\b/i,
  /\b(step by step|multiple|all aspects|complete)\b/i,
  /\b(with examples|with code|with explanation)\b/i,
];

// ── CLASSIFIER ──────────────────────────────────────────────

export function classifyTask(prompt: string, systemPrompt?: string): TaskClassification {
  const fullText = `${systemPrompt || ""} ${prompt}`.toLowerCase();
  const inputLength = prompt.length;

  // Detect task type
  let detectedType: TaskType = "unknown";
  let maxScore = 0;

  for (const [type, patterns] of Object.entries(TASK_PATTERNS)) {
    if (type === "unknown") continue;

    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(fullText)) score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      detectedType = type as TaskType;
    }
  }

  // Estimate complexity
  let complexity: "simple" | "medium" | "complex" = "medium";

  if (inputLength < 1000) {
    const isSimple = COMPLEXITY_SIMPLE_PATTERNS.some((p) => p.test(fullText));
    if (isSimple) complexity = "simple";
  }

  if (inputLength > 5000) {
    complexity = "complex";
  } else {
    const isComplex = COMPLEXITY_COMPLEX_PATTERNS.some((p) => p.test(fullText));
    if (isComplex) complexity = "complex";
  }

  // Short messages without complexity indicators are simple
  if (inputLength < 50 && complexity === "medium" && maxScore <= 1) {
    complexity = "simple";
  }

  // Estimate tokens
  const estimatedInputTokens = Math.ceil(inputLength / 4);
  let estimatedOutputTokens: number;

  switch (detectedType) {
    case "classification":
      estimatedOutputTokens = 50;
      break;
    case "extraction":
      estimatedOutputTokens = Math.min(estimatedInputTokens * 0.3, 2000);
      break;
    case "summarization":
      estimatedOutputTokens = Math.min(estimatedInputTokens * 0.2, 1000);
      break;
    case "translation":
      estimatedOutputTokens = estimatedInputTokens * 1.2;
      break;
    case "writing":
      estimatedOutputTokens =
        complexity === "simple" ? 500 : complexity === "complex" ? 3000 : 1500;
      break;
    case "coding":
      estimatedOutputTokens = complexity === "simple" ? 300 : complexity === "complex" ? 2000 : 800;
      break;
    case "build":
      estimatedOutputTokens =
        complexity === "simple" ? 1500 : complexity === "complex" ? 5000 : 3000;
      break;
    case "deploy":
      estimatedOutputTokens = complexity === "simple" ? 200 : complexity === "complex" ? 1000 : 500;
      break;
    case "workflow":
      estimatedOutputTokens =
        complexity === "simple" ? 500 : complexity === "complex" ? 3000 : 1500;
      break;
    default:
      estimatedOutputTokens = complexity === "simple" ? 200 : complexity === "complex" ? 2000 : 800;
  }

  return {
    type: detectedType,
    complexity,
    estimatedInputTokens,
    estimatedOutputTokens,
    requiresReasoning:
      ["analysis", "coding", "build", "workflow"].includes(detectedType) &&
      complexity === "complex",
    requiresCreativity: ["writing", "build"].includes(detectedType),
    requiresAccuracy: ["extraction", "translation", "coding", "deploy"].includes(detectedType),
    confidence: maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.5,
  };
}

/** Quick classification using heuristics only (no LLM) */
export function quickClassify(prompt: string): {
  type: TaskType;
  complexity: "simple" | "medium" | "complex";
} {
  const c = classifyTask(prompt);
  return { type: c.type, complexity: c.complexity };
}
