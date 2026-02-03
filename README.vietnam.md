# OpenClaw Vietnam Edition

Phiên bản OpenClaw tối ưu cho người dùng Việt Nam với các tính năng:

- **Zalo** - Hỗ trợ Zalo Bot API và Zalo Personal Account
- **Telegram** - Đầy đủ tính năng
- **iMessage** - Cho người dùng Apple
- **TTS tiếng Việt** - Edge TTS miễn phí với giọng Việt Nam

## Cài đặt nhanh

```bash
# Clone repo
git clone https://github.com/your-repo/openclaw-vietnam.git
cd openclaw-vietnam

# Install dependencies
pnpm install

# Copy config
cp config.default.json ~/.openclaw/config.json

# Copy env example
cp .env.example .env
# Edit .env with your API keys

# Build
pnpm build

# Run
pnpm start gateway run --port 18789
```

## Cấu hình

### Telegram Bot

1. Tạo bot qua @BotFather trên Telegram
2. Copy bot token vào `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

### Zalo Official Account

1. Đăng ký tại [developers.zalo.me](https://developers.zalo.me)
2. Tạo Official Account
3. Copy App ID và Secret Key vào `.env`:
   ```
   ZALO_APP_ID=your_app_id
   ZALO_SECRET_KEY=your_secret_key
   ```

### Anthropic API

1. Đăng ký tại [console.anthropic.com](https://console.anthropic.com)
2. Tạo API key
3. Copy vào `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```

## Tính năng đã loại bỏ

Để giảm kích thước và tối ưu cho VN:

- WhatsApp (không phổ biến tại VN)
- Discord (chỉ gaming niche)
- Signal (gần như không dùng)
- Slack (chỉ enterprise)
- LINE (Nhật/Thái/Đài)
- MS Teams, Matrix, Nostr, Twitch...

## TTS tiếng Việt

Mặc định sử dụng Edge TTS miễn phí với giọng:
- `vi-VN-HoaiMyNeural` (nữ)
- `vi-VN-NamMinhNeural` (nam)

Có thể nâng cấp lên ElevenLabs hoặc OpenAI TTS nếu cần chất lượng cao hơn.

## Bảo mật

- Tất cả API keys được lưu trong `.env` (không commit!)
- Gateway mặc định bind localhost only
- Sandbox mode cho code execution
- Session data mã hóa local

## Hỗ trợ

- Docs: Xem thư mục `docs/`
- Issues: Báo lỗi qua GitHub Issues

## License

MIT License - Dựa trên OpenClaw open source
