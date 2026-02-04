# Vibecode Methodology - OpenClaw Vietnam

## Triết lý cốt lõi

```
"Đơn giản ở HÌNH THỨC, sâu sắc ở BẢN CHẤT"

Vibecode không phải prompt framework - nó là ARCHITECTURAL PATTERN
khai thác sự khác biệt system prompt giữa các sản phẩm AI.
```

## Tại sao tách Architect + Builder?

### System Prompt khác biệt cơ bản

| Claude Chat (Architect) | Claude Code (Builder) |
|------------------------|----------------------|
| Semantic richness | Speed optimization |
| Deep reasoning | Action-oriented |
| Thorough exploration | Concise execution |
| Verbose, complete | Minimal explanation |
| Ask to clarify | Assume & execute |

### Multi-Agent vs Vibecode

```
Multi-Agent (AutoGPT, CrewAI):
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Agent 1 │ │ Agent 2 │ │ Agent 3 │
└────┬────┘ └────┬────┘ └────┬────┘
     └───────────┼───────────┘
          SAME SYSTEM PROMPT
          = Role-playing
          = Fake specialization

Vibecode:
┌─────────────┐         ┌─────────────┐
│ Claude Chat │ ──────▶ │ Claude Code │
│ Architect   │Blueprint│ Builder     │
├─────────────┤         ├─────────────┤
│ PROMPT A    │         │ PROMPT B    │
└─────────────┘         └─────────────┘
= True specialization
= Different DNA
```

---

## Quy trình chuẩn

### PHASE 1: ARCHITECT (Claude Chat)

**Mở claude.ai/chat và paste prompt sau:**

```markdown
# Vibecode Architect Mode

Bạn là KIẾN TRÚC SƯ trong hệ thống Vibecode.
Nhiệm vụ: Tạo BLUEPRINT hoàn chỉnh cho Builder.

## Quy tắc
1. THINK thoroughly - suy nghĩ kỹ trước khi output
2. ASK to clarify - hỏi khi chưa rõ
3. VERIFY resources - kiểm tra URLs, images trước khi đưa vào Blueprint
4. COMPLETE spec - Blueprint phải self-contained

## Output format
Blueprint PHẢI ở dạng JSON để Builder đọc được.

---

Ý tưởng của tôi: [MÔ TẢ Ý TƯỞNG]
```

**Architect sẽ:**
1. Detect project type
2. Hỏi context details
3. Verify image sources (test URLs trước)
4. Generate complete Blueprint (JSON)

### PHASE 2: BLUEPRINT HANDOFF

**Blueprint format (JSON):**

```json
{
  "project": {
    "name": "Project Name",
    "type": "landing|saas|dashboard|blog|portfolio",
    "description": "..."
  },
  "design": {
    "theme": "dark|light",
    "primaryColor": "#0071e3",
    "font": "Inter"
  },
  "structure": {
    "pages": ["page1", "page2"],
    "components": ["Header", "Hero", "..."]
  },
  "assets": {
    "images": [
      {
        "id": "hero-image",
        "url": "https://verified-url.com/image.jpg",
        "verified": true,
        "fallback": "https://fallback-url.com/image.jpg"
      }
    ]
  },
  "tech": {
    "framework": "Next.js 14",
    "styling": "Tailwind CSS",
    "dependencies": ["framer-motion", "lucide-react"]
  },
  "files": [
    {
      "path": "src/app/page.tsx",
      "description": "Main page with Hero, Products, Features sections"
    }
  ]
}
```

### PHASE 3: BUILDER (Claude Code)

**Copy Blueprint JSON và paste vào Claude Code với prompt:**

```markdown
# Vibecode Builder Mode

Bạn là THỢ XÂY trong hệ thống Vibecode.
Blueprint đã được Kiến trúc sư approve.

## Quy tắc tuyệt đối
1. KHÔNG thay đổi architecture
2. KHÔNG thêm features ngoài Blueprint
3. KHÔNG thay thế URLs/images đã verified
4. Gặp conflict → BÁO CÁO, không tự quyết

## Blueprint:
[PASTE JSON HERE]

## Output location:
[PATH TO CREATE PROJECT]
```

### PHASE 4: VERIFICATION

**Trước khi "Done", Builder PHẢI verify:**

```markdown
## Verification Checklist

- [ ] Dev server starts without errors
- [ ] All images load (check browser console)
- [ ] No TypeScript errors
- [ ] Responsive: mobile, tablet, desktop
- [ ] All links work
- [ ] Animations run smoothly

Nếu BẤT KỲ item nào FAIL → Không được báo "Done"
```

---

## Định nghĩa DONE

```
DONE =
  ✅ Tasks completed (Điều kiện CẦN)
  + ✅ Product runs without errors (Điều kiện ĐỦ)
  + ✅ All assets load (Điều kiện ĐỦ)
  + ✅ UI renders correctly (Điều kiện ĐỦ)
  + ✅ Verification checklist passed (Điều kiện ĐỦ)
```

---

## Tại sao KHÔNG gộp Architect + Builder?

```
Claude Code làm Architect:
System Prompt: "Be concise, use tools, execute fast"
Architect cần: "Think deep, explore, verify"

→ COGNITIVE DISSONANCE
→ Rush to completion
→ Skip verification
→ Broken products
```

**Kết luận: Dùng đúng tool cho đúng việc.**

- Claude Chat = Thinking, Planning, Designing
- Claude Code = Executing, Building, Coding

---

## Quick Reference

| Phase | Tool | Purpose |
|-------|------|---------|
| 1. Architect | Claude Chat | Create Blueprint |
| 2. Handoff | Copy/Paste | Transfer Blueprint |
| 3. Builder | Claude Code | Execute Blueprint |
| 4. Verify | Claude Code | Check product works |

```
claude.ai/chat → Blueprint.json → Claude Code → Verified Product
     ↑                                              ↑
 THINK mode                                   EXECUTE mode
```
