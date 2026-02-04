# Vibecode Integration for OpenClaw Vietnam

Tích hợp methodology từ Vibecode Kit v4.0 để build ứng dụng lớn.

## Workflow

```
VISION → CONTEXT → BLUEPRINT → BUILD → REFINE
  AI      Human      Both       AI      Both
```

## Cách sử dụng

### Qua Chat (Zalo/Web)
```
/build landing    → Tạo landing page
/build saas       → Tạo SaaS application
/build dashboard  → Tạo dashboard/admin
/build blog       → Tạo blog/docs
/build portfolio  → Tạo portfolio
```

### Qua CLI
```bash
openclaw build --type landing --name "My Project"
```

## Cấu trúc thư mục

```
vibecode/
├── README.md           # File này
├── prompts/
│   ├── architect.md    # Prompt cho Kiến trúc sư (Vision + Blueprint)
│   ├── builder.md      # Prompt cho Thợ xây (Code generation)
│   └── refiner.md      # Prompt cho Refine phase
├── templates/
│   ├── landing.md      # Template Landing Page
│   ├── saas.md         # Template SaaS App
│   ├── dashboard.md    # Template Dashboard
│   ├── blog.md         # Template Blog/Docs
│   └── portfolio.md    # Template Portfolio
└── blueprints/         # Generated blueprints (gitignored)
```

## Nguyên tắc

1. **AI đề xuất trước** - Không chờ user mô tả chi tiết
2. **Human cung cấp context** - Business goals, audience, constraints
3. **Blueprint là khế ước** - Sau khi approve, không thay đổi kiến trúc
4. **Context Intelligence** - Giữ context xuyên suốt project
