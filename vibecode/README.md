# Vibecode Methodology

> **"Đơn giản ở HÌNH THỨC, sâu sắc ở BẢN CHẤT"**

Vibecode là architectural pattern khai thác sự khác biệt system prompt giữa Claude Chat và Claude Code để tạo ra sản phẩm chất lượng cao.

## Quick Start

### 1. Architect Phase (Claude Chat)

Mở https://claude.ai/chat và paste nội dung từ:
```
vibecode/prompts/architect-chat.md
```

### 2. Verify Blueprint

```bash
npx ts-node vibecode/tools/verify-blueprint.ts blueprint.json
```

### 3. Builder Phase (Claude Code)

```
/build execute

[PASTE BLUEPRINT JSON]
```

### 4. QA Check

```bash
npx ts-node vibecode/tools/qa-check.ts /path/to/project
```

---

## Cấu trúc thư mục

```
vibecode/
├── README.md              # Tài liệu này
├── METHODOLOGY.md         # Methodology chi tiết
├── LESSONS-LEARNED.md     # Feedback loop documentation
├── prompts/
│   └── architect-chat.md  # Prompt cho Claude Chat Architect
├── schemas/
│   └── blueprint.schema.json  # JSON Schema cho Blueprint
├── templates/
│   ├── landing.blueprint.json   # Template Landing Page
│   ├── saas.blueprint.json      # Template SaaS
│   └── portfolio.blueprint.json # Template Portfolio
└── tools/
    ├── verify-blueprint.ts  # Verify URLs trong Blueprint
    ├── validate-blueprint.ts # Validate Blueprint schema
    └── qa-check.ts          # Post-build QA automation
```

---

## Workflow

```
┌─────────────────┐         ┌─────────────────┐
│  Claude Chat    │         │  Claude Code    │
│  (Architect)    │         │  (Builder)      │
├─────────────────┤         ├─────────────────┤
│ • Think deep    │ ──────▶ │ • Execute fast  │
│ • Verify URLs   │Blueprint│ • Follow spec   │
│ • Complete spec │         │ • No questions  │
└─────────────────┘         └─────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ verify-blueprint│         │    qa-check     │
│ (Pre-handoff)   │         │ (Post-build)    │
└─────────────────┘         └─────────────────┘
```

---

## Tools

### verify-blueprint.ts

Kiểm tra tất cả URLs trong Blueprint trước khi handoff cho Builder.

```bash
# From file
npx ts-node vibecode/tools/verify-blueprint.ts blueprint.json

# From stdin
cat blueprint.json | npx ts-node vibecode/tools/verify-blueprint.ts
```

### validate-blueprint.ts

Validate Blueprint theo JSON Schema.

```bash
npx ts-node vibecode/tools/validate-blueprint.ts blueprint.json
```

### qa-check.ts

Automated post-build verification.

```bash
npx ts-node vibecode/tools/qa-check.ts /path/to/project
```

---

## Templates

| Template | Use Case |
|----------|----------|
| `landing.blueprint.json` | Marketing landing pages |
| `saas.blueprint.json` | SaaS marketing sites |
| `portfolio.blueprint.json` | Personal portfolios |

---

## Định nghĩa DONE

```
DONE =
  ✅ Tasks completed (Điều kiện CẦN)
  + ✅ Dev server runs (Điều kiện ĐỦ)
  + ✅ All assets load (Điều kiện ĐỦ)
  + ✅ No TypeScript errors (Điều kiện ĐỦ)
  + ✅ qa-check passes (Điều kiện ĐỦ)
```
