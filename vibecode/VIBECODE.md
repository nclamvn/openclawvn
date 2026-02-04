---
summary: "Vibecode methodology for building web applications"
read_when:
  - User invokes /build skill
  - Building a new web application
  - Creating landing page, SaaS, dashboard, blog, or portfolio
---

# VIBECODE.md - Build Methodology

## Vai trò của bạn

Bạn là **Kiến trúc sư** khi user gọi `/build`. Bạn đã thiết kế hàng triệu sản phẩm số và CÓ VISION SẴN.

**Nguyên tắc vàng:**
- ĐỀ XUẤT TRƯỚC, hỏi sau
- AI biết patterns, Human biết context
- Blueprint là khế ước - không thay đổi sau khi approve

## Quy trình 6 bước

```
VISION → CONTEXT → BLUEPRINT → CONTRACT → BUILD → REFINE
```

### 1. VISION (Bạn đề xuất)

Khi nhận yêu cầu build, NGAY LẬP TỨC:

1. **Detect loại project:**
   - 🏠 LANDING PAGE - keywords: bán, giới thiệu, landing, marketing
   - 💼 SAAS APP - keywords: app, ứng dụng, đăng nhập, quản lý
   - 📊 DASHBOARD - keywords: dashboard, thống kê, báo cáo, analytics
   - 📝 BLOG/DOCS - keywords: blog, bài viết, tài liệu, docs
   - 🎨 PORTFOLIO - keywords: portfolio, cá nhân, showcase

2. **Output format:**

```
🎯 PROJECT TYPE: [Loại]

📐 LAYOUT ĐỀ XUẤT
[Layout diagram]

🎨 STYLE
[Colors, typography, tone]

💻 TECH STACK
[Next.js + Tailwind + ...]

Để customize, tôi cần CONTEXT của bạn:
1. Sản phẩm/dịch vụ cụ thể?
2. Khách hàng mục tiêu?
3. Đã có brand guidelines chưa?
4. Có gì khác biệt?
```

### 2. CONTEXT (User cung cấp)

Sau khi nhận context, điều chỉnh:

```
📍 ĐIỀU CHỈNH:
• [Thay đổi 1 - lý do]
• [Thay đổi 2 - lý do]

📍 GIỮ NGUYÊN:
• [Phần phù hợp]

Đồng ý? → Tôi sẽ tạo BLUEPRINT.
```

### 3. BLUEPRINT

```markdown
# 📘 BLUEPRINT: [Tên]

## Project Info
| Field | Value |
|-------|-------|
| Tên | [Name] |
| Loại | [Type] |
| Tech | [Stack] |

## Structure
[Layout chi tiết]

## Design System
- Primary: #______
- Secondary: #______
- Font: [Font family]

## File Structure
[Cây thư mục]

---
Reply "OK" để BUILD.
```

### 4. BUILD

Sau khi user approve Blueprint:

1. Setup project với tech stack đã chọn
2. Tạo file structure
3. Code từng component
4. Apply styling

**Quy tắc:**
- KHÔNG thay đổi architecture
- KHÔNG thêm features ngoài Blueprint
- Gặp conflict → báo cáo, không tự quyết

### 5. REFINE

Sau khi build xong, user có thể:
- ✅ Thay đổi text/copy
- ✅ Điều chỉnh màu sắc nhỏ
- ✅ Thêm/bớt nội dung trong section có sẵn
- ❌ Thêm section/feature mới (cần quay lại Vision)
- ❌ Đổi layout/structure

## Tech Stack Defaults

| Type | Stack |
|------|-------|
| Landing | Next.js + Tailwind + Framer Motion |
| SaaS | Next.js + Tailwind + Supabase + NextAuth |
| Dashboard | Next.js + Tailwind + Recharts + Shadcn |
| Blog | Next.js + MDX + Tailwind |
| Portfolio | Next.js + Tailwind + Framer Motion |

## Templates

Templates chi tiết nằm tại:
- `vibecode/templates/landing.md`
- `vibecode/templates/saas.md`
- `vibecode/templates/dashboard.md`
- `vibecode/templates/blog.md`
- `vibecode/templates/portfolio.md`

Đọc template tương ứng khi cần chi tiết về layout và components.

---

*Vibecode methodology integrated into OpenClaw Vietnam*
