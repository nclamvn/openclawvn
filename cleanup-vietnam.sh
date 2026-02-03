#!/bin/bash
# ============================================
# OpenClaw Vietnam Cleanup Script
# Loại bỏ các tính năng không cần thiết cho VN
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== OpenClaw Vietnam Cleanup ===${NC}"
echo ""

# Confirm before proceeding
read -p "Script này sẽ xóa các channels và features không dùng tại VN. Tiếp tục? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Đã hủy."
    exit 1
fi

echo ""
echo -e "${YELLOW}[1/5] Xóa Core Channels không dùng...${NC}"

# WhatsApp - Không phổ biến tại VN
if [ -d "src/whatsapp" ]; then
    rm -rf src/whatsapp/
    echo "  ✓ Đã xóa src/whatsapp/"
fi

# Discord - Chỉ gaming niche
if [ -d "src/discord" ]; then
    rm -rf src/discord/
    echo "  ✓ Đã xóa src/discord/"
fi

# Signal - Gần như không dùng
if [ -d "src/signal" ]; then
    rm -rf src/signal/
    echo "  ✓ Đã xóa src/signal/"
fi

# Slack - Chỉ enterprise
if [ -d "src/slack" ]; then
    rm -rf src/slack/
    echo "  ✓ Đã xóa src/slack/"
fi

# LINE - Không phổ biến VN
if [ -d "src/line" ]; then
    rm -rf src/line/
    echo "  ✓ Đã xóa src/line/"
fi

echo ""
echo -e "${YELLOW}[2/5] Xóa Extension Channels không dùng...${NC}"

# MS Teams
if [ -d "extensions/msteams" ]; then
    rm -rf extensions/msteams/
    echo "  ✓ Đã xóa extensions/msteams/"
fi

# Matrix
if [ -d "extensions/matrix" ]; then
    rm -rf extensions/matrix/
    echo "  ✓ Đã xóa extensions/matrix/"
fi

# Nostr
if [ -d "extensions/nostr" ]; then
    rm -rf extensions/nostr/
    echo "  ✓ Đã xóa extensions/nostr/"
fi

# Tlon/Urbit
if [ -d "extensions/tlon" ]; then
    rm -rf extensions/tlon/
    echo "  ✓ Đã xóa extensions/tlon/"
fi

# Twitch
if [ -d "extensions/twitch" ]; then
    rm -rf extensions/twitch/
    echo "  ✓ Đã xóa extensions/twitch/"
fi

# BlueBubbles
if [ -d "extensions/bluebubbles" ]; then
    rm -rf extensions/bluebubbles/
    echo "  ✓ Đã xóa extensions/bluebubbles/"
fi

# Mattermost
if [ -d "extensions/mattermost" ]; then
    rm -rf extensions/mattermost/
    echo "  ✓ Đã xóa extensions/mattermost/"
fi

# Nextcloud Talk
if [ -d "extensions/nextcloud-talk" ]; then
    rm -rf extensions/nextcloud-talk/
    echo "  ✓ Đã xóa extensions/nextcloud-talk/"
fi

# Voice Call (Twilio/Plivo)
if [ -d "extensions/voice-call" ]; then
    rm -rf extensions/voice-call/
    echo "  ✓ Đã xóa extensions/voice-call/"
fi

# Google Chat
if [ -d "extensions/googlechat" ]; then
    rm -rf extensions/googlechat/
    echo "  ✓ Đã xóa extensions/googlechat/"
fi

echo ""
echo -e "${YELLOW}[3/5] Xóa Skills không dùng...${NC}"

# Apple ecosystem
for skill in apple-notes apple-reminders bear-notes things-mac; do
    if [ -d "skills/$skill" ]; then
        rm -rf "skills/$skill/"
        echo "  ✓ Đã xóa skills/$skill/"
    fi
done

# Messaging skills không dùng
for skill in discord slack bluebubbles imsg; do
    if [ -d "skills/$skill" ]; then
        rm -rf "skills/$skill/"
        echo "  ✓ Đã xóa skills/$skill/"
    fi
done

# Entertainment/Gaming
for skill in spotify-player gog songsee; do
    if [ -d "skills/$skill" ]; then
        rm -rf "skills/$skill/"
        echo "  ✓ Đã xóa skills/$skill/"
    fi
done

# macOS/Niche
for skill in bird blucli wacli eightctl ordercli mcporter peekaboo; do
    if [ -d "skills/$skill" ]; then
        rm -rf "skills/$skill/"
        echo "  ✓ Đã xóa skills/$skill/"
    fi
done

echo ""
echo -e "${YELLOW}[4/5] Xóa Docs không dùng...${NC}"

for doc in discord signal slack whatsapp line msteams matrix googlechat; do
    if [ -f "docs/channels/$doc.md" ]; then
        rm -f "docs/channels/$doc.md"
        echo "  ✓ Đã xóa docs/channels/$doc.md"
    fi
done

echo ""
echo -e "${YELLOW}[5/5] Thống kê...${NC}"

# Count remaining
channels_count=$(ls -d src/*/ 2>/dev/null | wc -l)
extensions_count=$(ls -d extensions/*/ 2>/dev/null | wc -l)
skills_count=$(ls -d skills/*/ 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}=== Cleanup hoàn tất ===${NC}"
echo ""
echo "Còn lại:"
echo "  - Channels (core): $channels_count"
echo "  - Extensions: $extensions_count"
echo "  - Skills: $skills_count"
echo ""
echo -e "${YELLOW}Bước tiếp theo:${NC}"
echo "  1. Chạy: pnpm install"
echo "  2. Chạy: pnpm build"
echo "  3. Test: pnpm test"
echo ""
echo -e "${RED}LƯU Ý:${NC} Có thể cần sửa imports trong các file còn lại nếu có lỗi build."
