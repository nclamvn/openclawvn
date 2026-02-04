---
name: build
description: "Build ứng dụng web với Vibecode methodology. Claude Code = Builder, Claude Chat = Architect."
metadata:
  {
    "openclaw":
      {
        "emoji": "🏗️",
        "skillKey": "vibecode-build",
        "userInvocable": true,
      },
  }
invocation:
  userInvocable: true
  disableModelInvocation: false
---

# Vibecode Build Skill

Build ứng dụng web với chất lượng cao theo Vibecode methodology.

## ⚠️ QUAN TRỌNG: Kiến trúc đúng

```
Claude Chat (Architect) → Blueprint.json → Claude Code (Builder)
      ↑                                          ↑
  THINK mode                               EXECUTE mode
  Semantic-rich                            Speed-optimized
```

**Tại sao không gộp?** System prompts khác biệt cơ bản:
- Claude Chat: Tối ưu cho suy nghĩ sâu, chi tiết
- Claude Code: Tối ưu cho thực thi nhanh, gọn

Gộp = Role-playing trên system prompt không phù hợp = Chất lượng thấp.

---

## Quy trình chuẩn

### PHASE 1: ARCHITECT (Claude Chat)

**Mở https://claude.ai/chat và dùng prompt:**

```markdown
# Vibecode Architect Mode

Bạn là KIẾN TRÚC SƯ. Tạo BLUEPRINT hoàn chỉnh cho Builder.

Quy tắc:
1. THINK thoroughly - suy nghĩ kỹ
2. ASK to clarify - hỏi khi chưa rõ
3. VERIFY resources - test URLs trước khi đưa vào Blueprint
4. OUTPUT JSON - Blueprint phải machine-readable

---

Ý tưởng: [MÔ TẢ DỰ ÁN]
```

**Architect sẽ tạo Blueprint.json với:**
- Project info, design system
- Verified image URLs (đã test)
- File structure chi tiết
- Dependencies

### PHASE 2: BUILDER (Claude Code)

**Quay lại Claude Code với Blueprint:**

```
/build execute

[PASTE BLUEPRINT.JSON]
```

**Hoặc:**

```
Tôi có Blueprint từ Architect. Hãy build theo spec này:

[PASTE BLUEPRINT.JSON]
```

---

## Nếu bạn KHÔNG có Blueprint

Nếu muốn build nhanh mà không qua Architect (chấp nhận risk):

```
/build quick [type]
```

⚠️ **Cảnh báo:** Quick mode bỏ qua Architect phase, chất lượng có thể không đạt.

---

## Commands

| Command | Mô tả |
|---------|-------|
| `/build` | Hướng dẫn quy trình đúng |
| `/build execute` | Builder mode - cần Blueprint |
| `/build quick [type]` | Quick mode - bỏ qua Architect (risky) |
| `/build verify` | Verify project sau khi build |

---

## Project Types

| Type | Mô tả |
|------|-------|
| `landing` | Landing Page - marketing, conversion |
| `saas` | SaaS Application - auth, dashboard |
| `dashboard` | Dashboard - analytics, admin |
| `blog` | Blog/Docs - content, MDX |
| `portfolio` | Portfolio - showcase, creative |

---

## Verification Checklist

Trước khi "Done", PHẢI verify:

```
- [ ] Dev server starts without errors
- [ ] All images load (check console)
- [ ] No TypeScript errors
- [ ] Responsive works
- [ ] All links functional
```

**DONE = Tasks completed + Verification passed**

---

## Tại sao Vibecode hoạt động?

```
Multi-Agent Systems:
Same model + Same prompt + Different roles = Role-playing = Fake specialization

Vibecode:
Different products + Different prompts = True specialization = Real quality
```

Claude Chat và Claude Code có SYSTEM PROMPTS khác biệt cơ bản.
Vibecode khai thác sự khác biệt này thay vì chống lại nó.

---

## Quick Reference

1. **Architect (Claude Chat):** https://claude.ai/chat
2. **Builder (Claude Code):** `/build execute [blueprint]`
3. **Verify:** `/build verify`
