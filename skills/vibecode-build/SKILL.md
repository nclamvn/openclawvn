---
name: build
description: "Build ứng dụng web với Vibecode methodology. Sử dụng /build [type] để tạo Landing Page, SaaS, Dashboard, Blog, hoặc Portfolio."
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

Build ứng dụng web theo Vibecode methodology - quy trình 6 bước từ Vision đến Production.

## Cách sử dụng

```
/build                    → Bắt đầu, AI sẽ hỏi bạn muốn làm gì
/build landing            → Tạo Landing Page
/build saas               → Tạo SaaS Application
/build dashboard          → Tạo Dashboard/Admin Panel
/build blog               → Tạo Blog/Documentation
/build portfolio          → Tạo Portfolio
```

## Quy trình Vibecode

```
VISION → CONTEXT → BLUEPRINT → BUILD → REFINE
  AI      Human      Both       AI      Both
```

### Bước 1: VISION (AI đề xuất)
Khi nhận yêu cầu, AI sẽ:
1. Detect loại project
2. Đề xuất layout, style, tech stack
3. Hỏi context để customize

### Bước 2: CONTEXT (Human cung cấp)
Bạn cung cấp:
- Sản phẩm/dịch vụ cụ thể
- Khách hàng mục tiêu
- Brand guidelines (nếu có)
- Yêu cầu đặc biệt

### Bước 3: BLUEPRINT (Cùng đồng thuận)
AI tạo Blueprint chi tiết:
- Structure
- Design System
- File Structure
- Deliverables

Reply "OK" để approve Blueprint.

### Bước 4: BUILD (AI code)
AI tạo code theo Blueprint:
- Setup project
- Tạo components
- Styling
- Responsive

### Bước 5: REFINE (Cùng tinh chỉnh)
Sau khi build xong:
- Điều chỉnh text/copy
- Thay đổi màu sắc nhỏ
- Thêm/bớt nội dung

## Project Types

### 🏠 Landing Page
- Bán hàng, giới thiệu sản phẩm
- Thu leads, marketing
- Tech: Next.js + Tailwind + Framer Motion

### 💼 SaaS Application
- Ứng dụng có đăng nhập
- User management, features
- Tech: Next.js + Tailwind + Supabase + NextAuth

### 📊 Dashboard
- Admin panel, analytics
- Data visualization
- Tech: Next.js + Tailwind + Recharts + Shadcn

### 📝 Blog / Documentation
- Blog, tài liệu hướng dẫn
- Content-focused
- Tech: Next.js + MDX + Tailwind

### 🎨 Portfolio
- Showcase work, personal brand
- Creative layouts
- Tech: Next.js + Tailwind + Framer Motion

## Nguyên tắc

1. **AI đề xuất trước** - Không chờ user mô tả chi tiết
2. **Human cung cấp context** - Business goals, audience, constraints
3. **Blueprint là khế ước** - Sau khi approve, không thay đổi kiến trúc
4. **Refine chỉ tinh chỉnh** - Thay đổi lớn = quay lại Vision

## Ví dụ

```
User: /build landing
AI: 🎯 PROJECT TYPE: Landing Page

📐 LAYOUT ĐỀ XUẤT
Hero → Social Proof → Features → How It Works → Testimonials → CTA → FAQ → Footer

🎨 STYLE
Modern minimalist, conversion-focused

💻 TECH STACK
Next.js 14 + Tailwind + Framer Motion

Để customize, tôi cần CONTEXT của bạn:
1. Sản phẩm/dịch vụ cụ thể?
2. Khách hàng mục tiêu?
3. Đã có brand guidelines chưa?
```

---

Bắt đầu với `/build` hoặc mô tả ý tưởng của bạn!
