---
name: eldercare-videocall
description: |
  Quản lý video call giữa gia đình và bà nội. Gia đình nhắn "gọi bà" qua Zalo
  → OpenClaw kiểm tra bà đang thức → chuẩn bị phòng (đèn, loa, tablet) →
  hướng dẫn gia đình gọi Zalo video trực tiếp → bà thấy trên tablet.
  Hỗ trợ lịch gọi cố định nhắc gia đình mỗi sáng.
  Cả bà và ông đều nặng tai → mọi audio phải VOLUME CAO.
  Tablet chạy Fully Kiosk Browser ở chế độ kiosk.
metadata:
  {
    "openclaw":
      {
        "emoji": "📞",
        "requires":
          {
            "extensions": ["home-assistant-mcp", "zalo"],
          },
        "schedule":
          [
            {
              "kind": "cron",
              "expr": "0 8 * * *",
              "tz": "Asia/Ho_Chi_Minh",
              "description": "Nhắc gia đình gọi chào bà buổi sáng",
            },
            {
              "kind": "cron",
              "expr": "0 9 * * *",
              "tz": "Asia/Ho_Chi_Minh",
              "description": "Nhắc lần 2 nếu chưa ai gọi",
            },
          ],
      },
  }
---

# Eldercare Video Call — Kết nối gia đình với bà

## Tổng quan

Video call đi qua **Zalo video call trực tiếp** (KHÔNG dùng SIP/WebRTC/Twilio).
OpenClaw đóng vai trò **điều phối**: kiểm tra bà sẵn sàng, chuẩn bị phòng,
và hướng dẫn gia đình thời điểm gọi.

Tablet đặt cạnh giường bà chạy Zalo đăng nhập sẵn (tài khoản Zalo bà/ông).
Fully Kiosk Browser giữ Zalo foreground, màn hình luôn sẵn sàng.

## Flow A: Gia đình chủ động gọi bà (on-demand)

### Bước 1: Nhận intent gọi bà

Gia đình nhắn vào Zalo group hoặc chat Bờm bot:
- "gọi bà", "gọi bà nội", "video call bà", "gọi cho bà", "muốn gọi bà"

### Bước 2: Check trạng thái bà

Dùng tool `home_assistant` đọc sensors:
- `get_state` entity `binary_sensor.grandma_room_presence` → có người?
- `get_state` entity `sensor.grandma_room_motion_minutes` → phút từ cử động cuối

**Quy tắc phân loại:**

**Bà ĐANG THỨC** (motion < 15 phút):
→ Tiếp tục chuẩn bị phòng (Bước 3)

**Bà có thể ĐANG NGỦ TRƯA** (motion > 15 phút VÀ giờ 13:00-15:00):
→ Reply: "Bà có vẻ đang nghỉ trưa 😴 Gọi sau 15h nhé? Hay bạn muốn gọi ngay?"
→ Nếu gia đình reply "gọi ngay" / "gọi luôn" → tiếp tục Bước 3
→ Nếu không reply → dừng

**Bà ĐANG NGỦ ĐÊM** (motion > 30 phút VÀ giờ 22:00-06:00):
→ Reply: "Bà đang ngủ rồi 🌙 Sáng mai gọi nhé?"
→ Chỉ tiếp tục nếu gia đình nói "khẩn cấp" / "gọi ngay"

**Bà KHÔNG TRONG PHÒNG** (presence = off):
→ Reply: "⚠️ Sensor không phát hiện người trong phòng bà. Kiểm tra lại nhé."

### Bước 3: Chuẩn bị phòng bà

Nếu OK để gọi, dùng tool `home_assistant` thực hiện tuần tự:

**3a. Bật đèn sáng vừa (không chói):**
```
action: call_service
domain: light
service: turn_on
target_entity_id: light.grandma_room
service_data: { "brightness": 150, "color_temp_kelvin": 3000 }
```

**3b. Tablet: Bật màn hình + mở Zalo:**

Nếu có Fully Kiosk Browser REST API qua HA shell_command hoặc REST command:
```
action: call_service
domain: shell_command
service: tablet_screen_on
```

Hoặc ghi chú cho gia đình tự setup HA automation để bật tablet khi trigger.

**3c. TTS thông báo cho bà (VOLUME CAO):**

Trước TTS, set volume MAX:
```
action: call_service
domain: media_player
service: volume_set
target_entity_id: media_player.grandma_room
service_data: { "volume_level": 1.0 }
```

Rồi TTS:
```
action: call_service
domain: tts
service: speak
target_entity_id: media_player.grandma_room
service_data: {
  "message": "Bà ơi, {tên người gọi} muốn gọi video cho bà nè! Bà nhìn màn hình nha!",
  "language": "vi"
}
```

**3d. Chờ 5 giây** (để bà nghe thông báo)

### Bước 4: Hướng dẫn gia đình gọi

Reply cho gia đình trong Zalo:
```
✅ Phòng bà đã sẵn sàng!

📱 Bà đã được thông báo rồi.
📞 Bạn gọi Zalo video cho bà ngay nhé!
   Zalo bà: {thông tin Zalo bà từ config}
💡 Đèn đã bật, loa đã thông báo.
🔊 Nhớ nói TO và RÕ — cả bà và ông đều nặng tai.
```

### Bước 5: Logging

Lưu memory sau khi trigger thành công:
```
eldercare_call_{timestamp}: {
  "caller": "{tên người yêu cầu}",
  "triggered_at": "{ISO timestamp}",
  "status": "room_prepared",
  "note": "Zalo video call directed"
}
```

Dữ liệu này dùng cho eldercare-daily-report skill.

## Flow B: Lịch gọi cố định (Cron)

### 8:00 sáng — Nhắc lần 1

Gửi Zalo group gia đình:
```
🌅 Chào buổi sáng!
Nhắc mọi người gọi chào bà nội nha.
Reply "gọi bà" để Bờm chuẩn bị phòng bà sẵn sàng!
```

### 9:00 sáng — Nhắc lần 2 (nếu cần)

Kiểm tra memory: có `eldercare_call_*` nào có timestamp NGÀY HÔM NAY chưa?
- Nếu **CHƯA CÓ** cuộc gọi hôm nay → nhắc lại:
  ```
  ☀️ Chưa ai gọi bà sáng nay. Bà đang thức rồi đó!
  Reply "gọi bà" nhé~
  ```
- Nếu **ĐÃ CÓ** cuộc gọi hôm nay → không nhắc nữa

## Whitelist & Security

Chỉ contacts trong whitelist mới trigger được flow gọi bà.
Đọc whitelist từ memory `eldercare_videocall_whitelist` hoặc videocall-config.json.

Khi người KHÔNG trong whitelist nhắn "gọi bà":
→ Reply: "Bạn không có quyền thực hiện lệnh này. Liên hệ admin gia đình."

## Quiet Hours

- Giờ 22:00-06:00: Từ chối gọi trừ khi gia đình nói rõ "khẩn cấp"
- Reply: "Bà đang ngủ rồi 🌙 Sáng mai gọi nhé? (Nếu khẩn cấp, reply 'khẩn cấp')"

## Config

Đọc từ videocall-config.json hoặc memory `eldercare_videocall_config`:
- `tablet.ip` — IP tablet trong mạng local
- `tablet.fully_kiosk_password` — Fully Kiosk password
- `grandma_zalo_contact` — Thông tin Zalo bà để gia đình gọi
- `whitelist` — Danh sách người được phép gọi
- `schedule.morning_reminder` — Bật/tắt nhắc sáng
- `schedule.quiet_hours_start/end` — Giờ yên lặng

## Config Override (đọc từ memory)

Trước khi dùng giá trị mặc định, **PHẢI** kiểm tra memory:

1. Dùng memory search query `eldercare_videocall_config`
2. Nếu tìm thấy → parse JSON, dùng config từ memory
3. Nếu KHÔNG tìm thấy → dùng defaults từ videocall-config.json

Các field có thể override:
- `tablet.ip` — IP tablet
- `tablet.fully_kiosk_password`
- `grandma_zalo_contact` — Zalo bà
- `whitelist` — người được phép gọi
- `schedule.morning_reminder` — bật/tắt nhắc sáng
- `schedule.quiet_hours_start` / `quiet_hours_end`
- `tts.volume` (mặc định: 1.0)

## Phụ đề (Phase 2 — ghi nhận)

Phụ đề realtime chưa khả thi qua Zalo video call (Zalo không có API overlay).
Ghi nhận cho tương lai:
- Option A: App phụ đề overlay Android chạy song song Zalo
- Option B: Micro riêng → Whisper STT → text trên second screen
Hiện tại: Gia đình nói TO + RÕ, kết hợp nhắn text Zalo chat song song.
