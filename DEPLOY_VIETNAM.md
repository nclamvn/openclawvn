# OpenClaw Vietnam - Hướng dẫn Triển khai

## Yêu cầu hệ thống

- **Node.js**: 22+
- **RAM**: 2GB+ (4GB khuyến nghị)
- **Disk**: 500MB+
- **OS**: macOS, Linux, Windows

## Bước 1: Clone và Setup

```bash
# Clone repo
git clone https://github.com/openclaw/openclaw.git openclaw-vietnam
cd openclaw-vietnam

# Tạo branch riêng cho Vietnam
git checkout -b vietnam-edition

# Install dependencies
pnpm install
```

## Bước 2: Áp dụng Config Vietnam

```bash
# Copy config Vietnam
cp openclaw.config.vietnam.json ~/.openclaw/config.json

# Hoặc sử dụng CLI
openclaw config set agents.defaults.userTimezone "Asia/Ho_Chi_Minh"
openclaw config set messages.tts.provider "edge"
openclaw config set messages.tts.edge.voice "vi-VN-HoaiMyNeural"
```

## Bước 3: Cleanup (Tùy chọn)

Nếu muốn giảm kích thước, chạy cleanup script:

```bash
# Tạo script
chmod +x cleanup-vietnam.sh

# Chạy cleanup
./cleanup-vietnam.sh

# Rebuild
pnpm install
pnpm build
```

## Bước 4: Cấu hình Zalo Bot

### 4.1 Tạo Zalo Official Account (OA)

1. Truy cập [Zalo for Developers](https://developers.zalo.me/)
2. Đăng ký OA (Official Account)
3. Lấy **App ID** và **Secret Key**

### 4.2 Cấu hình trong OpenClaw

```bash
# Set Zalo credentials
openclaw config set channels.zalo.appId "YOUR_ZALO_APP_ID"
openclaw config set channels.zalo.secretKey "YOUR_ZALO_SECRET_KEY"
openclaw config set channels.zalo.enabled true

# Hoặc qua environment variables
export ZALO_APP_ID="your_app_id"
export ZALO_SECRET_KEY="your_secret_key"
```

### 4.3 Cấu hình Webhook

```bash
# OpenClaw sẽ expose webhook endpoint tại:
# https://your-domain.com/webhook/zalo

# Cấu hình URL này trong Zalo Developer Console
```

## Bước 5: Cấu hình Telegram Bot

### 5.1 Tạo Bot qua BotFather

1. Mở Telegram, tìm @BotFather
2. Gửi `/newbot`
3. Đặt tên và username cho bot
4. Copy **Bot Token**

### 5.2 Cấu hình trong OpenClaw

```bash
# Set Telegram token
openclaw config set channels.telegram.botToken "YOUR_BOT_TOKEN"
openclaw config set channels.telegram.enabled true

# Hoặc
export TELEGRAM_BOT_TOKEN="your_bot_token"
```

## Bước 6: Cấu hình Anthropic API

```bash
# Set API key
export ANTHROPIC_API_KEY="your_api_key"

# Hoặc qua config
openclaw config set auth.profiles.anthropic.apiKey "YOUR_API_KEY"
```

## Bước 7: Cấu hình TTS (Tùy chọn)

### Edge TTS (Miễn phí - Khuyến nghị)

```bash
# Đã cấu hình sẵn trong config Vietnam
# Voice tiếng Việt: vi-VN-HoaiMyNeural (nữ), vi-VN-NamMinhNeural (nam)

openclaw config set messages.tts.edge.voice "vi-VN-HoaiMyNeural"
```

### ElevenLabs (Chất lượng cao)

```bash
export ELEVENLABS_API_KEY="your_api_key"
openclaw config set messages.tts.provider "elevenlabs"
openclaw config set messages.tts.elevenlabs.languageCode "vi"
```

## Bước 8: Cấu hình Memory (LanceDB)

```bash
# Enable memory
openclaw config set tools.memorySearch.enabled true
openclaw config set tools.memorySearch.provider "lancedb"

# Memory sẽ lưu tại ~/.openclaw/memory/
```

## Bước 9: Chạy Gateway

### Development

```bash
# Chạy dev mode
pnpm dev

# Hoặc
openclaw gateway run --port 18789
```

### Production

```bash
# Build production
pnpm build

# Chạy production
NODE_ENV=production openclaw gateway run --bind 0.0.0.0 --port 18789
```

### Background (Server)

```bash
# Sử dụng nohup
nohup openclaw gateway run --bind loopback --port 18789 > /tmp/openclaw.log 2>&1 &

# Hoặc systemd service (xem bên dưới)
```

## Bước 10: Systemd Service (Linux Server)

Tạo file `/etc/systemd/system/openclaw.service`:

```ini
[Unit]
Description=OpenClaw Vietnam Gateway
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/home/your_user/openclaw-vietnam
Environment=NODE_ENV=production
Environment=ANTHROPIC_API_KEY=your_key
Environment=TELEGRAM_BOT_TOKEN=your_token
ExecStart=/usr/bin/node dist/cli.js gateway run --bind 0.0.0.0 --port 18789
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable và start
sudo systemctl daemon-reload
sudo systemctl enable openclaw
sudo systemctl start openclaw

# Check status
sudo systemctl status openclaw
```

## Bước 11: Nginx Reverse Proxy (Production)

```nginx
# /etc/nginx/sites-available/openclaw

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhook endpoints
    location /webhook/ {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Bước 12: Verify Installation

```bash
# Check channels status
openclaw channels status --probe

# Check gateway
curl http://localhost:18789/health

# Test Telegram
# Gửi tin nhắn cho bot trên Telegram

# Test Zalo
# Gửi tin nhắn cho OA trên Zalo

# Check logs
tail -f /tmp/openclaw.log
```

## Troubleshooting

### Zalo không nhận webhook

```bash
# Kiểm tra webhook URL đã đăng ký đúng chưa
# Đảm bảo server có SSL certificate (HTTPS required)
```

### Telegram bot không phản hồi

```bash
# Kiểm tra bot token
openclaw channels status telegram

# Restart gateway
openclaw gateway restart
```

### TTS không hoạt động

```bash
# Test Edge TTS
openclaw tts test "Xin chào Việt Nam"

# Check provider
openclaw config get messages.tts.provider
```

### Memory không lưu

```bash
# Check LanceDB
ls -la ~/.openclaw/memory/

# Rebuild index
openclaw memory rebuild
```

## Cấu trúc thư mục sau triển khai

```
~/.openclaw/
├── config.json              # Config chính
├── credentials/             # API keys (encrypted)
├── agents/
│   └── main/
│       └── sessions/        # Session history
├── memory/                  # LanceDB vector store
├── plugins/                 # Installed plugins
│   ├── zalo/
│   └── zalouser/
└── logs/                    # Application logs
```

## Chi phí vận hành ước tính

| Thành phần | Chi phí/tháng |
|------------|---------------|
| Anthropic API (light use) | $10-30 |
| Anthropic API (heavy use) | $50-150 |
| VPS (2GB RAM) | $5-10 |
| Domain + SSL | $0-5 |
| Zalo OA | Miễn phí |
| Telegram Bot | Miễn phí |
| Edge TTS | Miễn phí |
| **TỔNG (light)** | **$15-45/tháng** |
| **TỔNG (heavy)** | **$55-165/tháng** |

## Tối ưu thêm

### Giảm token usage

```bash
# Bật aggressive compaction
openclaw config set agents.defaults.compaction.mode "safeguard"
openclaw config set agents.defaults.contextTokens 80000

# Reset session thường xuyên
openclaw session reset

# Dùng model rẻ hơn cho task đơn giản
openclaw config set agents.defaults.model.primary "anthropic/claude-haiku-4-5"
```

### Monitor usage

```bash
# Check usage
openclaw usage

# Check cost
openclaw usage --cost
```

## Hỗ trợ

- GitHub Issues: https://github.com/openclaw/openclaw/issues
- Discord: https://discord.gg/openclaw
- Documentation: https://docs.openclaw.ai
