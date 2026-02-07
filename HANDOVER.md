# OpenClaw Vietnam - Handover Document

## Tổng quan dự án

**Repo gốc (upstream):** https://github.com/openclaw/openclaw
**Repo Vietnam (fork):** https://github.com/nclamvn/openclawvn

OpenClaw Vietnam là bản fork đã được:
- Việt hóa hoàn toàn (song ngữ VI/EN)
- Giản lược tính năng (giữ lại core features)
- Tích hợp Vibecode methodology

---

## Kiến trúc

```
github.com/openclaw/openclaw     ← Upstream (source)
            │
            │ fork & customize
            ▼
github.com/nclamvn/openclawvn    ← Vietnam fork
            │
            ├── ui/              ← Control UI (Lit + TypeScript)
            ├── vibecode/        ← Vibecode methodology
            └── skills/          ← Custom skills
```

---

## Thay đổi chính

### 1. Vibecode Methodology (`vibecode/`)

Tích hợp quy trình build ứng dụng chất lượng cao:

```
Claude Chat (Architect) → Blueprint.json → Claude Code (Builder)
      ↑                                          ↑
  THINK mode                               EXECUTE mode
```

**Files:**
- `vibecode/METHODOLOGY.md` - Tài liệu core
- `vibecode/README.md` - Quick start guide
- `vibecode/LESSONS-LEARNED.md` - Feedback loop
- `vibecode/prompts/architect-chat.md` - Prompt cho Claude Chat
- `vibecode/schemas/blueprint.schema.json` - JSON Schema
- `vibecode/templates/*.blueprint.json` - Pre-built templates
- `vibecode/tools/verify-blueprint.ts` - URL verification
- `vibecode/tools/validate-blueprint.ts` - Schema validation
- `vibecode/tools/qa-check.ts` - Post-build QA

### 2. Navigation Simplification

Giảm từ 11 tabs xuống 5 tabs:

**Giữ lại:**
- chat - Trò chuyện
- overview - Tổng quan
- channels - Kênh kết nối
- sessions - Phiên làm việc
- config - Cấu hình

**Đã ẩn (vẫn hoạt động qua URL):**
- instances, cron, skills, nodes, debug, logs

**File:** `ui/src/ui/navigation.ts`

### 3. Update Indicator

Tự động kiểm tra update từ upstream khi app khởi động:

- Fetch GitHub Releases API
- So sánh version
- Hiển thị chấm đỏ nhấp nháy nếu có update mới

**Files:**
- `ui/src/ui/app-update.ts` - Logic check version
- `ui/src/ui/app-lifecycle.ts` - Trigger on startup
- `ui/src/ui/app-render.ts` - Render indicator
- `ui/src/styles/layout.css` - CSS animation

### 4. UI Fixes

**Mobile:**
- Fix status pill bị bóp méo → hình tròn hoàn hảo
- Giảm padding logo trên mobile

**File:** `ui/src/styles/layout.mobile.css`

### 5. Localization

Việt hóa đầy đủ với song ngữ VI/EN:

**Files:**
- `ui/src/ui/i18n/vi.ts` - Bản dịch tiếng Việt
- `ui/src/ui/i18n/en.ts` - English translations

---

## Cách cập nhật từ Upstream

1. **Kiểm tra releases mới:**
   - UI sẽ hiển thị chấm đỏ nếu có update
   - Hoặc xem: https://github.com/openclaw/openclaw/releases

2. **Merge selective:**
   ```bash
   git remote add upstream https://github.com/openclaw/openclaw.git
   git fetch upstream
   git cherry-pick <commit-hash>  # Chọn commits phù hợp
   ```

3. **Chỉ merge features đã giữ lại:**
   - chat, overview, channels, sessions, config
   - Bỏ qua: instances, cron, skills, nodes, debug, logs

---

## Version hiện tại

```
Current: 2026.2.6
```

Cập nhật version trong:
- `package.json`
- `ui/src/ui/app-update.ts` (CURRENT_VERSION)
- `ui/src/ui/app.ts` (currentVersion state)

### Upstream sync 2026.2.6 (cherry-picked)

Cherry-picked 10 priority commits from upstream v2026.2.6:

**Model Support:**
- Claude Opus 4.6 model catalog + default
- pi-mono 0.52.5
- gpt-5.3-codex fallback
- Opus 4.6 forward-compat fallback

**Security:**
- exec-approvals: coerce bare string allowlist
- skill/plugin code safety scanner
- gateway: require auth for canvas/A2UI assets
- redact credentials from config.get responses

**Stability:**
- Cap sessions_history payloads to prevent context overflow

---

## Commands

```bash
# Development
pnpm install
pnpm dev

# Build
pnpm build

# Vibecode tools
npx ts-node vibecode/tools/verify-blueprint.ts <blueprint.json>
npx ts-node vibecode/tools/validate-blueprint.ts <blueprint.json>
npx ts-node vibecode/tools/qa-check.ts /path/to/project
```

---

## Commits quan trọng

| Commit | Mô tả |
|--------|-------|
| `d616693` | Add Vibecode automation tools and templates |
| `0b79cf6` | Fix mobile UI: status pill circle and brand padding |
| `80bafbe` | Simplify navigation: keep only essential tabs |
| `691b1fe` | Replace docs link with GitHub update check |
| `c567b5c` | Add update indicator with red dot |

---

## Maintainer

OpenClaw Vietnam Team
