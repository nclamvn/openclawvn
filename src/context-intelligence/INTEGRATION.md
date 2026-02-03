# Hướng dẫn tích hợp Context Intelligence Engine

## Tổng quan

Context Intelligence Engine giúp giảm 50-80% chi phí API token bằng cách:
1. **Fingerprinting** - Tạo hash cho mỗi context chunk để detect trùng lặp
2. **Smart Compression** - Nén thông minh dựa trên importance
3. **Intelligent Orchestration** - Chọn và phân bổ context tối ưu

## Quick Start

### 1. Import module

```typescript
import {
  ContextOrchestrator,
  optimizeContext,
  estimateTokens,
  needsOptimization,
} from "../context-intelligence/index.js";
```

### 2. Sử dụng cơ bản

```typescript
// Kiểm tra có cần optimize không
const systemTokens = estimateTokens(systemPrompt);
const messageTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

if (needsOptimization(systemTokens, messageTokens)) {
  const result = optimizeContext(
    systemPrompt,
    workspaceFiles,
    messages,
    "anthropic/claude-sonnet-4-5"
  );

  console.log(`Original: ${result.budget.total} tokens`);
  console.log(`Optimized: ${result.actualTokens} tokens`);
  console.log(`Saved: ${result.budget.total - result.actualTokens} tokens`);

  // Sử dụng messages đã optimize
  const optimizedMessages = result.messages.map((msg) => ({
    role: msg.role,
    content: msg.compressedContent ?? msg.content,
  }));
}
```

### 3. Sử dụng nâng cao với Orchestrator

```typescript
const orchestrator = new ContextOrchestrator({
  // Token limits
  maxContextTokens: 200000,     // Hard limit từ model
  targetContextTokens: 150000,  // Target để có headroom
  reserveTokens: 10000,         // Reserve cho response

  // Compression settings
  compression: {
    maxTokenBudget: 100000,
    targetCompressionRatio: 0.5,
    preserveRecent: 5,          // Giữ 5 messages gần nhất
    preserveImportance: 0.8,    // Giữ messages có importance >= 0.8
    enableSummarization: true,
  },

  // Progressive compression (nén theo thời gian)
  progressiveThresholds: [
    { minutes: 5, compressionLevel: 0 },    // 0-5m: không nén
    { minutes: 30, compressionLevel: 1 },   // 5-30m: nén 20%
    { minutes: 60, compressionLevel: 2 },   // 30-60m: nén 40%
    { minutes: 180, compressionLevel: 3 },  // 1-3h: nén 60%
  ],

  // Cache settings
  enablePromptCaching: true,
  cacheWarmupInterval: 55,  // Warmup trước khi cache TTL hết
});

// Orchestrate
const result = orchestrator.orchestrate(
  systemPrompt,
  { "AGENTS.md": agentsContent, "SOUL.md": soulContent },
  messages,
  modelId
);

// Xem decisions
for (const decision of result.decisions) {
  console.log(`${decision.type}: ${decision.reason} (${decision.tokenImpact} tokens)`);
}
```

## Tích hợp vào OpenClaw

### 1. Tích hợp vào pi-embedded-runner

File: `src/agents/pi-embedded-runner.ts`

```typescript
import { ContextOrchestrator, needsOptimization, estimateTokens } from "../context-intelligence/index.js";

// Trong function run agent
async function runAgent(params) {
  const orchestrator = new ContextOrchestrator(getOrchestratorConfig());

  // Check if optimization needed
  const systemTokens = estimateTokens(systemPrompt);
  const messageTokens = params.messages.reduce(
    (sum, m) => sum + estimateTokens(m.content), 0
  );

  if (needsOptimization(systemTokens, messageTokens, params.contextWindow * 0.75)) {
    const optimized = orchestrator.orchestrate(
      systemPrompt,
      workspaceFiles,
      params.messages,
      params.modelId
    );

    // Use optimized context
    params.messages = optimized.messages.map(m => ({
      ...m,
      content: m.compressedContent ?? m.content,
    }));

    // Set cache control header if caching enabled
    if (optimized.cacheKey) {
      params.cacheControlTtl = "1h";
    }
  }

  // Continue with API call...
}
```

### 2. Tích hợp vào compaction

File: `src/agents/compaction.ts`

```typescript
import { ContextCompressor } from "../context-intelligence/index.js";

// Thay thế summarizeInStages bằng smart compression
async function smartCompact(messages, contextWindow) {
  const compressor = new ContextCompressor({
    maxTokenBudget: Math.floor(contextWindow * 0.5),
    targetCompressionRatio: 0.4,
  });

  const { compressed, compressionStats } = compressor.compressBatch(
    messages.map((m, i) => ({
      id: m.id ?? `msg-${i}`,
      role: m.role,
      content: m.content,
      fingerprint: createFingerprint(m.content, {
        importance: m.role === "user" ? 0.7 : 0.5,
      }),
    })),
    contextWindow
  );

  return compressed;
}
```

### 3. Tích hợp vào session pruning

File: `src/agents/pi-extensions/context-pruning/pruner.ts`

```typescript
import { FingerprintManager, createFingerprint } from "../../../context-intelligence/index.js";

// Track fingerprints để detect duplicates
const fpManager = new FingerprintManager();

function shouldPrune(message, allMessages) {
  const fp = createFingerprint(message.content);

  // Check for duplicates
  const duplicates = findDuplicates(allMessages.map(fingerprintMessage));
  if (duplicates.has(fp.hash)) {
    return true; // Prune duplicate content
  }

  // Check importance
  if (fp.importance < 0.3 && message.age > 30 * 60 * 1000) {
    return true; // Prune old low-importance content
  }

  return false;
}
```

## Config mẫu cho Vietnam Edition

```json
{
  "agents": {
    "defaults": {
      "contextIntelligence": {
        "enabled": true,
        "maxContextTokens": 200000,
        "targetContextTokens": 150000,
        "reserveTokens": 10000,

        "compression": {
          "enabled": true,
          "targetRatio": 0.5,
          "preserveRecent": 5,
          "preserveImportance": 0.8
        },

        "progressive": {
          "enabled": true,
          "thresholds": [
            { "minutes": 5, "level": 0 },
            { "minutes": 30, "level": 1 },
            { "minutes": 60, "level": 2 },
            { "minutes": 180, "level": 3 }
          ]
        },

        "caching": {
          "enabled": true,
          "warmupInterval": 55
        }
      }
    }
  }
}
```

## Metrics và Monitoring

```typescript
// Track savings
const result = orchestrator.orchestrate(...);

// Log metrics
console.log({
  originalTokens: result.budget.total,
  actualTokens: result.actualTokens,
  tokensSaved: result.budget.total - result.actualTokens,
  savingsPercent: ((result.budget.total - result.actualTokens) / result.budget.total * 100).toFixed(1),
  compressionApplied: result.compressionApplied,
  cacheKeyUsed: !!result.cacheKey,
  decisionsCount: result.decisions.length,
});
```

## Best Practices

1. **Luôn preserve recent messages** - Messages gần đây quan trọng cho context
2. **Set importance cho system content** - AGENTS.md, SOUL.md nên có importance cao
3. **Enable progressive compression** - Nén dần theo thời gian tự nhiên hơn
4. **Monitor savings** - Track metrics để tune config
5. **Test với real conversations** - Đảm bảo không mất context quan trọng
