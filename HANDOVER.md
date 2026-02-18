# OpenClaw Vietnam - Handover Document

## Tong quan du an

**Repo goc (upstream):** https://github.com/openclaw/openclaw
**Repo Vietnam (fork):** https://github.com/nclamvn/openclawvn

OpenClaw Vietnam la ban fork da duoc:
- Viet hoa hoan toan (song ngu VI/EN)
- Gian luoc tinh nang (giu lai core features)
- Tich hop Vibecode methodology
- Tich hop Bom Platform Strategy v2.0 (Smart Routing, Cost Transparency, Intent Detection)

---

## Kien truc

```
github.com/openclaw/openclaw     <- Upstream (source)
            |
            | fork & customize
            v
github.com/nclamvn/openclawvn    <- Vietnam fork
            |
            |-- ui/              <- Control UI (Lit + TypeScript)
            |-- vibecode/        <- Vibecode methodology
            |-- skills/          <- Custom skills (vibecode-build, etc.)
            |-- src/bom-optimizer/  <- Token Optimization Engine
            +-- src/telegram/    <- Telegram bot enhancements
```

---

## Bom Platform Strategy v2.0

### Tong quan

6 phase da hoan thanh, deployed len VPS (76.13.197.14):

| Phase | Ten | Trang thai |
|-------|-----|-----------|
| 1 | Core bom-optimizer (router, cache, checkpoint, tracker) | Done |
| 1.5 | Smart Routing bridge (gateway <-> optimizer) | Done |
| 2 | Smart Auto-Detection (intent, skill boost, suggestions) | Done |
| 3 | Cost Transparency (estimator, budget, alerts, subscription) | Done |
| 4 | Integration & Polish (Vietnamese messages, analytics, /budget) | Done |
| 5 | Deploy to VPS | Done |

### Phase 2: Smart Auto-Detection

Intent-aware skill boost va post-reply suggestions.

**Pipeline:**
```
User message -> classifier.ts (detect build/deploy/workflow)
  -> intent.ts (resolve boostSkills, contextHints)
  -> smart-routing.ts (include intentMetadata in result)
  -> agent-runner-execution.ts (call applySkillBoost)
  -> system prompt gets "Recommended skills: vibecode-build" + context hints
  -> post-reply-suggestions.ts (append suggestions after reply)
```

**Config (openclaw.json):**
```json
{
  "agents": {
    "defaults": {
      "smartRouting": {
        "enabled": true,
        "intentDetection": true,
        "skillBoost": true,
        "postReplySuggestions": true
      }
    }
  }
}
```

**Files:**
- `src/bom-optimizer/router/classifier.ts` - Task classification (10+ types incl. build/deploy/workflow)
- `src/bom-optimizer/router/intent.ts` - Intent -> skill boost mapping
- `src/auto-reply/reply/smart-routing.ts` - Gateway <-> optimizer bridge
- `src/auto-reply/reply/post-reply-suggestions.ts` - After-reply suggestions
- `src/agents/skills/workspace.ts` - `applySkillBoost()` function
- `src/config/zod-schema.agent-defaults.ts` - Zod validation for smartRouting

**Tests:** 77 passing (classifier, intent, smart-routing, post-reply-suggestions)

### Phase 3: Cost Transparency

Pre-execution cost estimation, budget management, subscription recommendations.

**Files:**
- `src/bom-optimizer/cost/pricing.ts` - Model pricing (Haiku/Sonnet/Opus + long-context tiers)
- `src/bom-optimizer/cost/estimator.ts` - Token estimation + cost calculation
- `src/bom-optimizer/cost/budget-manager.ts` - Daily/weekly/monthly budget tracking with auto-reset
- `src/bom-optimizer/cost/subscription-advisor.ts` - Pro/Max5x/Max20x recommendations
- `src/bom-optimizer/cost/alerts.ts` - Alert system with handler registration
- `src/bom-optimizer/cost/types.ts` - All cost-related types
- `src/bom-optimizer/middleware/cost-gate.ts` - Request gating middleware

**Tests:** 68 passing (estimator, budget-manager, subscription-advisor, alerts)

### Phase 4: Integration & Polish

Vietnamese messages, analytics, Telegram /budget command, cost-aware handler.

**Files:**
- `src/bom-optimizer/cost/messages-vi.ts` - Vietnamese cost messages (10+ format functions)
- `src/bom-optimizer/cost/analytics.ts` - Usage analytics aggregation (by model, task, hour)
- `src/bom-optimizer/integration/request-wrapper.ts` - Full lifecycle wrapper (pre-check, execute, record)
- `src/telegram/commands/budget.ts` - `/budget` command (status, stats, set, help)
- `src/telegram/handlers/cost-aware-handler.ts` - Cost-aware message handler with confirmation flow

**Tests:** 39 passing (analytics, request-wrapper, budget command)

### Phase 5: VPS Deployment

**VPS:** 76.13.197.14, user: bom
**Stack:** Docker Compose (node:22-alpine, Redis 7, Cloudflare tunnel)

```
~/bom-deploy/
  |-- docker-compose.yml
  |-- gateway/          <- Full openclaw repo (src/ + dist/)
  |-- data/gateway/     <- Persistent data
  |-- config/gateway.env
  +-- logs/gateway/
```

**Deployment notes:**
- Build locally with `npx tsc --noEmitOnError false` (pre-existing TS errors in skills.ts, fact-extractor.ts, slots.ts)
- rsync full `dist/` to VPS
- `docker compose restart bom-gateway`
- `/root/.openclaw/` inside container (persists on restart, lost on recreate)
- vibecode-build SKILL.md deployed to `/root/.openclaw/workspace/skills/vibecode-build/`

---

## Infrastructure Enhancements

### Device Guard
- `src/infra/device-pairing.ts` - Device pairing with trust levels
- `src/infra/device-pairing.test.ts` - 130+ lines of tests

### Audit Log
- `src/infra/audit-log.ts` - Audit logging system
- `src/gateway/server-methods/audit.ts` - Gateway audit RPC

### Rate Limiter
- `src/infra/rate-limiter.ts` - Request rate limiting

### Memory System
- `src/memory/fact-extractor.ts` - Extract facts from conversations
- `src/memory/user-fact-store.ts` - Persistent user fact storage
- `src/memory/user-facts.types.ts` - Type definitions
- `src/gateway/server-methods/memory.ts` - Gateway memory RPC

---

## Thay doi truoc do

### Vibecode Methodology (`vibecode/`)

```
Claude Chat (Architect) -> Blueprint.json -> Claude Code (Builder)
      ^                                          ^
  THINK mode                               EXECUTE mode
```

**Files:**
- `vibecode/METHODOLOGY.md` - Core documentation
- `vibecode/prompts/architect-chat.md` - Claude Chat prompt
- `vibecode/schemas/blueprint.schema.json` - JSON Schema
- `vibecode/templates/*.blueprint.json` - Pre-built templates
- `vibecode/tools/verify-blueprint.ts` - URL verification
- `skills/vibecode-build/SKILL.md` - Skill file for gateway integration

### Navigation Simplification

5 tabs (chat, overview, channels, sessions, config). Hidden tabs accessible via URL.

### Update Indicator

Auto-check upstream releases, red dot indicator.

### Localization

Full VI/EN bilingual support:
- `ui/src/ui/i18n/vi.ts` / `en.ts`
- All cost messages in Vietnamese (`messages-vi.ts`)
- `/budget` command outputs in Vietnamese

---

## Cach cap nhat tu Upstream

1. **Check releases:** UI red dot or https://github.com/openclaw/openclaw/releases
2. **Cherry-pick:**
   ```bash
   git remote add upstream https://github.com/openclaw/openclaw.git
   git fetch upstream
   git cherry-pick <commit-hash>
   ```
3. **Post cherry-pick:** Check for missing exports/types, `git checkout <tag> -- <file>` if needed
4. **Build:** `npx tsc --noEmitOnError false` (bypass pre-existing errors)

---

## Version hien tai

```
Current: 2026.2.6
VPS: 2026.1.30 (dist updated to 2026.2.6 code)
```

### Upstream sync 2026.2.6 (cherry-picked)

- Claude Opus 4.6 model catalog + default
- pi-mono 0.52.5, gpt-5.3-codex fallback
- exec-approvals: coerce bare string allowlist
- skill/plugin code safety scanner
- gateway: require auth for canvas/A2UI assets
- redact credentials from config.get responses
- Cap sessions_history payloads to prevent context overflow

---

## Test Summary

| Module | Tests | Status |
|--------|-------|--------|
| Phase 2 (classifier, intent, smart-routing) | 77 | Pass |
| Phase 3 (estimator, budget, alerts, subscription) | 68 | Pass |
| Phase 4 (analytics, request-wrapper, budget cmd) | 39 | Pass |
| Full suite | 5084 | 4 pre-existing failures (msteams catalog) |

---

## Known Issues

1. **Pre-existing TS errors:** `skills.ts` (TS7053), `fact-extractor.ts` (TS2339), `slots.ts` (TS2739) - unrelated to new code
2. **Pre-existing test failures:** `catalog.test.ts` (msteams plugin removed), ~11 infra-level timeouts
3. **VPS container filesystem:** `/root/.openclaw/` not volume-mounted - config/skills lost on `docker compose down && up`
4. **Watchtower:** Restarting loop on VPS (pre-existing, not affecting gateway)
5. **better-sqlite3:** Not installed on VPS - CostTracker uses lazy dynamic import to avoid crash

---

## Commands

```bash
# Development
pnpm install
pnpm dev

# Build (with pre-existing errors)
npx tsc -p tsconfig.json --noEmit false --noEmitOnError false

# Tests
pnpm test                    # Full suite
pnpm test -- src/bom-optimizer  # Cost/routing tests only

# Deploy to VPS
rsync -avz dist/ bom@76.13.197.14:~/bom-deploy/gateway/dist/
ssh bom@76.13.197.14 "cd ~/bom-deploy && docker compose restart bom-gateway"

# VPS logs
ssh bom@76.13.197.14 "docker logs bom-gateway --tail 50"
```

---

## Commits quan trong

| Commit | Mo ta |
|--------|-------|
| `04cd0ab` | feat: Bom Platform Strategy v2.0 (Smart Routing, Cost, Intent) |
| `0b1d8db` | fix(ui): guard stale WS callbacks, redesign API key button |
| `3aa5c8b` | docs: update HANDOVER.md for v2026.2.6 upstream sync |
| `32e1f1d` | chore: sync dependency files to v2026.2.6 |
| `d616693` | Add Vibecode automation tools and templates |
| `80bafbe` | Simplify navigation: keep only essential tabs |

---

## Maintainer

OpenClaw Vietnam Team
