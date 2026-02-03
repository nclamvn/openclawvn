# BỜM Control UI

Giao diện điều khiển cho OpenClaw Gateway - chạy trực tiếp trên máy của bạn.

## Tính năng

- **Chat trực tiếp** với AI (Anthropic, OpenAI, Google)
- **Quản lý kênh** (WhatsApp, Telegram, Discord, Nostr, v.v.)
- **Theo dõi sessions** và instances
- **Cấu hình gateway** an toàn
- **Hỗ trợ song ngữ** Tiếng Việt / English

## Cài đặt

```bash
# Clone repo
git clone https://github.com/nclamvn/Vibeclaw.git
cd Vibeclaw/ui

# Cài dependencies
pnpm install

# Chạy development server
pnpm dev
```

## Build production

```bash
pnpm build
```

Output sẽ được tạo trong thư mục `dist/control-ui/`.

## Yêu cầu

- Node.js 18+
- pnpm (hoặc npm/yarn)

## Cấu trúc thư mục

```
ui/
├── public/           # Static assets (favicon, logo)
├── src/
│   ├── styles/       # CSS styles
│   └── ui/
│       ├── i18n/     # Translations (en.ts, vi.ts)
│       ├── views/    # Page components
│       ├── chat/     # Chat components
│       └── controllers/  # API controllers
├── index.html
└── vite.config.ts
```

## Bảo mật

- API keys được lưu trong browser localStorage của bạn
- Không có dữ liệu nhạy cảm nào được gửi đến server bên thứ ba
- Tất cả xử lý chạy local trên máy của bạn

## Giấy phép

MIT License

---

**BỜM** - OpenClaw Control UI
