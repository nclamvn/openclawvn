# BÀ NỘI CARE — Eldercare AI Module

Hệ thống chăm sóc bà nội bằng AI, tích hợp vào OpenClaw + Bờm ecosystem.

## Tổng quan

Module gồm 3 lớp:

| Lớp | Thành phần | Vai trò |
|-----|-----------|---------|
| **Extension** | home-assistant-mcp | Kết nối Home Assistant qua REST + WebSocket |
| **Skills** | eldercare-monitor, eldercare-sos, eldercare-videocall, eldercare-companion, eldercare-daily-report | Logic AI chăm sóc bà |
| **UI** | eldercare-dashboard, eldercare-config | Giao diện web giám sát & cấu hình |

## Kiến trúc

```
┌──────────────────────────────────────────────┐
│              Bờm Control UI                   │
│  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Eldercare Dash   │  │ Eldercare Config │   │
│  └────────┬────────┘  └────────┬─────────┘   │
│           │                     │              │
│           └──────────┬──────────┘              │
│                      │ WebSocket RPC           │
├──────────────────────┼───────────────────────┤
│              OpenClaw Gateway                  │
│  ┌─────────────────────────────────────────┐  │
│  │ Memory (SQLite + sqlite-vec)            │  │
│  │  eldercare_check_*, eldercare_sos_*...  │  │
│  └─────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐    │
│  │ Skills Engine (Cron + AI Execution)   │    │
│  │  monitor │ sos │ videocall │ ...      │    │
│  └───────────────────┬───────────────────┘    │
│                      │                         │
│  ┌───────────────────┴───────────────────┐    │
│  │ home-assistant-mcp Extension          │    │
│  └───────────────────┬───────────────────┘    │
├──────────────────────┼───────────────────────┤
│        Home Assistant (Raspberry Pi)           │
│  sensors │ media_player │ lights │ TTS         │
└──────────────────────────────────────────────┘
```

## Chức năng

### 1. Giám sát (eldercare-monitor)
- Kiểm tra bà mỗi 5 phút qua motion/presence sensors
- 4 mức cảnh báo: Bình thường → Chú ý → Cảnh báo → Khẩn cấp
- Chống false alarm: nap time, post-call cooldown, 15 phút giữa cảnh báo
- Cron: `*/5 * * * *`

### 2. SOS (eldercare-sos)
- Trigger: nút bấm (Zigbee), AI detect, voice command "SOS"
- Escalation 3 cấp: Zalo → Telegram → ALL
- Auto-escalate nếu không ai phản hồi
- Cancel bằng "OK" / "đã xử lý"

### 3. Video Call (eldercare-videocall)
- Gọi Zalo video qua tablet bên giường bà
- Check bà thức → bật đèn → TTS báo trước → hướng dẫn gọi
- Whitelist contacts, quiet hours 22h-6h
- Nhắc gia đình gọi bà mỗi sáng

### 4. Bạn đồng hành (eldercare-companion)
- Phát nhạc bolero/cải lương qua loa phòng bà
- Đọc truyện TTS (tốc độ chậm, nhớ bookmark)
- Nhắc sinh hoạt mỗi 2h: uống nước, đổi tư thế, ăn
- Voice command đơn giản (fuzzy match cho giọng yếu)

### 5. Báo cáo ngày (eldercare-daily-report)
- Tổng hợp toàn bộ dữ liệu lúc 21:00
- Viết báo cáo tiếng Việt tự nhiên
- Gửi Zalo group gia đình

## Thông tin bà

- **Tuổi:** Cao tuổi
- **Tình trạng:** Nằm giường, tỉnh táo, nặng tai
- **Địa điểm:** (cấu hình theo gia đình)
- **Không dùng thuốc** (không cần nhắc thuốc)
- **Ông nội:** Người chăm phụ, biết dùng Zalo
- **WiFi:** Ổn định

## Xem thêm

- [ELDERCARE-SETUP.md](./ELDERCARE-SETUP.md) — Hướng dẫn cài đặt chi tiết
- [.env.eldercare.example](./.env.eldercare.example) — Template biến môi trường
