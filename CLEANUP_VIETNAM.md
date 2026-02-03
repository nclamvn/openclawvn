# OpenClaw Vietnam Edition - Cleanup Guide

Hướng dẫn loại bỏ các tính năng không cần thiết cho người dùng Việt Nam.

## 1. KÊNH LIÊN LẠC CẦN XÓA

### Core Channels (trong /src/)

```bash
# WhatsApp - Không phổ biến tại VN
rm -rf src/whatsapp/

# Discord - Chỉ gaming niche
rm -rf src/discord/

# Signal - Gần như không dùng
rm -rf src/signal/

# Slack - Chỉ enterprise
rm -rf src/slack/

# LINE - Không phổ biến VN (Nhật/Thái/Đài)
rm -rf src/line/
```

### Extension Channels (trong /extensions/)

```bash
# MS Teams - Enterprise only
rm -rf extensions/msteams/

# Matrix - Quá niche
rm -rf extensions/matrix/

# Nostr - Quá niche
rm -rf extensions/nostr/

# Tlon/Urbit - Quá niche
rm -rf extensions/tlon/

# Twitch - Gaming streaming
rm -rf extensions/twitch/

# BlueBubbles - iMessage alternative (giữ lại nếu dùng iMessage)
rm -rf extensions/bluebubbles/

# Mattermost - Self-hosted enterprise
rm -rf extensions/mattermost/

# Nextcloud Talk - Self-hosted
rm -rf extensions/nextcloud-talk/

# Voice Call (Twilio/Plivo) - Đắt, không cần
rm -rf extensions/voice-call/

# Google Chat - Ít dùng VN
rm -rf extensions/googlechat/
```

## 2. SKILLS CẦN XÓA

```bash
# Apple ecosystem (ít phổ biến VN)
rm -rf skills/apple-notes/
rm -rf skills/apple-reminders/
rm -rf skills/bear-notes/
rm -rf skills/things-mac/

# Messaging skills không dùng
rm -rf skills/discord/
rm -rf skills/slack/
rm -rf skills/bluebubbles/
rm -rf skills/imsg/

# Entertainment phương Tây
rm -rf skills/spotify-player/
rm -rf skills/gog/

# macOS specific
rm -rf skills/bird/
rm -rf skills/blucli/
rm -rf skills/tmux/  # Nếu không dùng server

# Niche tools
rm -rf skills/songsee/
rm -rf skills/peekaboo/
rm -rf skills/wacli/
rm -rf skills/eightctl/
rm -rf skills/ordercli/
rm -rf skills/mcporter/
```

## 3. DEPENDENCIES CẦN XÓA TỪ package.json

```json
{
  "dependencies": {
    // XÓA các dependencies sau:
    "@whiskeysockets/baileys": "^7.0.0-rc.9",     // WhatsApp
    "discord-api-types": "^0.38.38",              // Discord
    "signal-utils": "^0.21.1",                    // Signal
    "@slack/bolt": "^4.6.0",                      // Slack
    "@slack/web-api": "^7.13.0",                  // Slack
    "@line/bot-sdk": "^10.6.0",                   // LINE
    "@microsoft/agents-hosting": "^1.2.3",        // MS Teams
    "@microsoft/agents-hosting-extensions-teams": "^1.2.3",
    "@matrix-org/matrix-sdk-crypto-nodejs": "^0.4.0",  // Matrix
    "@vector-im/matrix-bot-sdk": "^0.8.0",        // Matrix
    "nostr-tools": "^2.22.1",                     // Nostr
    "@urbit/aura": "^3.0.0",                      // Tlon
    "@urbit/http-api": "^3.0.0",                  // Tlon
    "@twurple/api": "^8.0.3",                     // Twitch
    "@twurple/auth": "^8.0.3",
    "@twurple/chat": "^8.0.3"
  }
}
```

## 4. CONFIG FILES CẦN XÓA

```bash
# Type definitions cho channels không dùng
rm src/config/types.discord.ts
rm src/config/types.signal.ts
rm src/config/types.slack.ts
rm src/config/types.whatsapp.ts
rm src/config/types.googlechat.ts
rm src/config/types.msteams.ts
```

## 5. DOCS CẦN XÓA

```bash
rm -rf docs/channels/discord.md
rm -rf docs/channels/signal.md
rm -rf docs/channels/slack.md
rm -rf docs/channels/whatsapp.md
rm -rf docs/channels/line.md
rm -rf docs/channels/msteams.md
rm -rf docs/channels/matrix.md
```

## 6. TỔNG KẾT DUNG LƯỢNG TIẾT KIỆM

| Thành phần | Dung lượng ước tính |
|------------|---------------------|
| WhatsApp (Baileys) | ~15 MB |
| Discord | ~5 MB |
| Signal | ~3 MB |
| Slack | ~8 MB |
| LINE | ~4 MB |
| MS Teams | ~10 MB |
| Matrix | ~12 MB |
| Twitch | ~6 MB |
| Other extensions | ~5 MB |
| Skills | ~10 MB |
| **TỔNG** | **~78 MB** |

## 7. SCRIPT TỰ ĐỘNG XÓA

Tạo file `cleanup-vietnam.sh`:

```bash
#!/bin/bash
# OpenClaw Vietnam Cleanup Script

set -e

echo "=== OpenClaw Vietnam Cleanup ==="
echo "Removing unused channels and features..."

# Core channels
rm -rf src/whatsapp/ 2>/dev/null || true
rm -rf src/discord/ 2>/dev/null || true
rm -rf src/signal/ 2>/dev/null || true
rm -rf src/slack/ 2>/dev/null || true
rm -rf src/line/ 2>/dev/null || true

# Extensions
rm -rf extensions/msteams/ 2>/dev/null || true
rm -rf extensions/matrix/ 2>/dev/null || true
rm -rf extensions/nostr/ 2>/dev/null || true
rm -rf extensions/tlon/ 2>/dev/null || true
rm -rf extensions/twitch/ 2>/dev/null || true
rm -rf extensions/bluebubbles/ 2>/dev/null || true
rm -rf extensions/mattermost/ 2>/dev/null || true
rm -rf extensions/nextcloud-talk/ 2>/dev/null || true
rm -rf extensions/voice-call/ 2>/dev/null || true
rm -rf extensions/googlechat/ 2>/dev/null || true

# Skills
rm -rf skills/apple-notes/ 2>/dev/null || true
rm -rf skills/apple-reminders/ 2>/dev/null || true
rm -rf skills/bear-notes/ 2>/dev/null || true
rm -rf skills/things-mac/ 2>/dev/null || true
rm -rf skills/discord/ 2>/dev/null || true
rm -rf skills/slack/ 2>/dev/null || true
rm -rf skills/bluebubbles/ 2>/dev/null || true
rm -rf skills/spotify-player/ 2>/dev/null || true
rm -rf skills/gog/ 2>/dev/null || true

echo "=== Cleanup complete ==="
echo "Please run 'pnpm install' to update dependencies"
```

## 8. GIỮ LẠI (QUAN TRỌNG)

### Channels:
- ✅ `/extensions/zalo/` - Zalo Bot API
- ✅ `/extensions/zalouser/` - Zalo Personal
- ✅ `/src/telegram/` - Telegram
- ✅ `/src/imessage/` - iMessage (cho Apple users)
- ✅ `/src/web/` - Web chat UI

### Features:
- ✅ `/src/tts/` - TTS (ElevenLabs + OpenAI + Edge)
- ✅ `/src/browser/` - Browser automation
- ✅ `/extensions/memory-lancedb/` - Long-term memory
- ✅ `/src/media/` - Media processing

### Skills:
- ✅ `github`, `notion`, `obsidian`, `trello`
- ✅ `summarize`, `coding-agent`
- ✅ `weather`, `local-places`
- ✅ `openai-image-gen`, `openai-whisper-api`

## 9. SAU KHI XÓA

1. Cập nhật `src/config/types.ts` - Xóa imports không dùng
2. Cập nhật `src/config/types.channels.ts` - Xóa channel types
3. Chạy `pnpm install` để rebuild
4. Chạy `pnpm build` để verify
5. Test với `pnpm test`

## 10. LƯU Ý

- **BACKUP** trước khi xóa
- Một số file có thể có dependencies chéo, cần kiểm tra kỹ
- Sau khi xóa cần update imports trong các file còn lại
- Nên tạo branch riêng cho Vietnam edition
