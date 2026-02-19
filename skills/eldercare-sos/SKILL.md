---
name: eldercare-sos
description: |
  Hệ thống SOS khẩn cấp cho bà nội. Nhận trigger từ: nút vật lý Zigbee
  (qua Home Assistant), AI detection (từ eldercare-monitor), hoặc gia đình
  gõ "SOS" trong Zalo/Telegram. Escalation chain tự động:
  Level 1 (Zalo) → Level 2 (Phone) → Level 3 (gọi tất cả).
  Gửi kèm camera snapshot. Có cancel mechanism.
metadata:
  {
    "openclaw":
      {
        "emoji": "🆘",
        "requires":
          {
            "config": ["plugins.entries.home-assistant-mcp.enabled"],
          },
      },
  }
---

# Eldercare SOS — Hệ thống khẩn cấp

Skill này xử lý tình huống khẩn cấp cho bà nội. Khi được trigger, nó thực hiện escalation chain tự động: Zalo → Phone → gọi tất cả gia đình.

## Khi nào skill này được trigger

### 1. Nút SOS vật lý (qua Home Assistant)

Bà hoặc ông bấm nút Zigbee. Kiểm tra entity `sensor.sos_button_action`:

| Hành động | Giá trị sensor | Xử lý |
|-----------|---------------|-------|
| Bấm 1 lần | `single` | Bắt đầu từ **Level 1** (Zalo trước) |
| Bấm 2 lần | `double` | Skip Level 1, vào thẳng **Level 2** (gọi điện) |
| Giữ 3 giây | `long` | Skip Level 1+2, vào thẳng **Level 3** (gọi TẤT CẢ) |

### 2. AI auto-detect (từ eldercare-monitor)

Khi skill eldercare-monitor phân loại mức KHẨN CẤP → trigger SOS bắt đầu từ **Level 2** (vì AI đã xác nhận nghiêm trọng).

### 2b. Fall Detection (từ eldercare-fall-detect)

Khi skill eldercare-fall-detect phát hiện ngã VÀ bà không phản hồi TTS xác nhận (2 lần, tổng 45 giây) → trigger SOS bắt đầu từ **Level 2**. Source = `"fall_detect"`. Kèm theo 2 ảnh camera snapshot (trước và sau TTS).

### 3. Manual (gia đình gõ chat)

Khi ai đó gõ "SOS", "cứu", "khẩn cấp" trong Zalo hoặc Telegram → trigger từ **Level 1**.

## QUAN TRỌNG: Kiểm tra duplicate

**Trước khi bắt đầu SOS mới**, kiểm tra memory `eldercare_sos_active`:
- Nếu đã có SOS active (`resolved` = false) → KHÔNG tạo SOS mới
- Log: "SOS đã active từ {triggered_at}. Không tạo duplicate."
- Nếu SOS cũ đã resolve → tiếp tục tạo mới

## Hành động tức thì (T+0, MỌI level)

Ngay khi SOS trigger, thực hiện ĐỒNG THỜI:

### 1. Bật đèn phòng bà sáng tối đa

Dùng tool `home_assistant`:
```
action: call_service
domain: light
service: turn_on
target_entity_id: light.grandma_room
service_data: { "brightness": 255 }
```

### 2. TTS thông báo cho bà qua loa (VOLUME CAO)

Dùng tool `home_assistant`:
```
action: call_service
domain: tts
service: speak
target_entity_id: media_player.grandma_room
service_data: {
  "message": "Bà ơi, đã gửi tín hiệu cho người nhà rồi ạ. Người nhà sẽ liên lạc ngay!",
  "language": "vi"
}
```

Nếu TTS service không available, dùng `media_player.volume_set` với volume 1.0 trước, rồi phát audio.

### 3. Chụp camera snapshot

Dùng tool `camsnap` hoặc `home_assistant`:
```
action: call_service
domain: camera
service: snapshot
target_entity_id: camera.grandma_room
service_data: { "filename": "/config/www/sos_snapshot.jpg" }
```

Lưu path ảnh để gửi kèm message.

### 4. Lưu trạng thái SOS vào memory

```
eldercare_sos_active: {
  "triggered_at": "{ISO timestamp}",
  "source": "button_single | button_double | button_long | ai_detect | manual",
  "start_level": 1 | 2 | 3,
  "current_level": 1,
  "resolved": false
}
```

## Level 1: Zalo Alert (T+3 giây)

Gửi tin nhắn Zalo cho contact ưu tiên #1 (đọc từ memory `eldercare_contacts`):

```
🆘 SOS — BÀ NỘI CẦN HỖ TRỢ!

📍 Thời gian: {giờ:phút ngày/tháng}
📸 [Ảnh camera phòng bà]
🔊 Nguồn: {nút bấm / AI phát hiện / manual}

Reply "OK" hoặc "đã xử lý" để xác nhận.
⏰ Nếu không phản hồi trong 3 phút → hệ thống sẽ tự gọi điện.
```

Đồng thời gửi Zalo group gia đình cùng nội dung.

**Chờ 3 phút (180 giây).** Trong thời gian chờ, kiểm tra reply:
- Nếu ai đó reply "OK", "đã xử lý", "ổn rồi", "cancel" → Chuyển đến phần **Cancel SOS** bên dưới
- Nếu không ai reply → Tiếp tục **Level 2**

## Level 2: Phone Call (T+180 giây)

Nếu Level 1 không có phản hồi, hoặc SOS bắt đầu từ Level 2:

1. Gửi Zalo: `⚠️ Không ai phản hồi Zalo. Đang gọi điện cho {contact #1}...`
2. Dùng tool `voice_call` (skill voice-call):
   ```
   action: initiate_call
   to: "{phone contact #1}"
   message: "Khẩn cấp! Bà nội cần hỗ trợ. Vui lòng kiểm tra ngay. Bấm phím bất kỳ để xác nhận."
   ```
3. Nếu contact #1 không nghe (30 giây timeout) → gọi contact #2
4. **Chờ 3 phút (180 giây)**
5. Nếu không ai phản hồi → Tiếp tục **Level 3**

## Level 3: ALL (T+360 giây)

Nếu Level 2 không có phản hồi, hoặc SOS bắt đầu từ Level 3 (nút giữ 3s):

1. Gọi điện ĐỒNG THỜI tất cả contacts trong danh sách
2. Chụp thêm 1 camera snapshot mới
3. Gửi Zalo + Telegram cho TẤT CẢ:
   ```
   🚨 KHẨN CẤP: CHƯA AI PHẢN HỒI SAU 6 PHÚT!
   📸 [Ảnh camera mới nhất]
   📞 Đang gọi tất cả người thân.
   Vui lòng liên hệ ngay!
   ```
4. Log: `eldercare_sos_level3: {timestamp} — no response after 6 minutes, calling all contacts`

## Cancel SOS

Khi ai đó phản hồi (Zalo/Telegram) với các từ: **"OK"**, **"đã xử lý"**, **"ổn rồi"**, **"cancel"**, **"hủy"**:

1. **Cancel ngay** mọi timer/escalation đang chờ
2. **Gửi cho TẤT CẢ contacts:**
   ```
   ✅ SOS đã được xử lý bởi {tên người reply}.
   🕐 Lúc: {giờ:phút}
   ⏱️ Thời gian phản hồi: {số phút} phút
   📊 Mức escalation cao nhất: Level {X}
   ```
3. **HA: Đèn về bình thường**
   ```
   action: call_service
   domain: light
   service: turn_on
   target_entity_id: light.grandma_room
   service_data: { "brightness": 100 }
   ```
4. **Cập nhật memory:**
   ```
   eldercare_sos_active: {
     ...previous,
     "resolved": true,
     "resolved_by": "{tên}",
     "resolved_at": "{timestamp}",
     "max_level_reached": {1|2|3},
     "response_time_seconds": {số giây từ trigger đến resolve}
   }
   ```

## Nút SOS mapping tóm tắt

```
Bấm 1 lần (single):
  T+0s   → Đèn + TTS + Snapshot
  T+3s   → Zalo Level 1
  T+183s → Phone Level 2 (nếu chưa OK)
  T+363s → ALL Level 3 (nếu chưa OK)

Bấm 2 lần (double):
  T+0s   → Đèn + TTS + Snapshot
  T+3s   → Zalo + Phone Level 2 ngay
  T+183s → ALL Level 3 (nếu chưa OK)

Giữ 3 giây (long):
  T+0s   → Đèn + TTS + Snapshot
  T+3s   → Gọi TẤT CẢ + Zalo + Telegram Level 3 ngay
```

## Quy tắc an toàn

- **KHÔNG** tự động gọi 115 (cấp cứu) — chỉ gia đình tự quyết định
- **KHÔNG** tạo SOS mới khi đã có SOS active
- **PHẢI** có cancel mechanism
- **PHẢI** log đầy đủ cho daily report
- **PHẢI** gửi camera snapshot kèm mọi message cảnh báo
- TTS cho bà phải **CHẬM, RÕ RÀNG, VOLUME CAO**

## Contacts

Đọc từ memory `eldercare_contacts`. Sắp xếp theo `priority` (1 = cao nhất).

Nếu chưa có contacts, gửi message cảnh báo vào channel hiện tại:
"⚠️ SOS triggered nhưng chưa có contacts! Cần config eldercare_contacts trong memory."

## Config Override (đọc từ memory)

Trước khi dùng giá trị mặc định, **PHẢI** kiểm tra memory:

1. Dùng memory search query `eldercare_sos_config`
2. Nếu tìm thấy → parse JSON, dùng config từ memory
3. Nếu KHÔNG tìm thấy → dùng defaults trong SKILL.md này

Các field có thể override:
- `escalation.level1_wait_seconds` (mặc định: 180)
- `escalation.level2_wait_seconds` (mặc định: 180)
- `tts.message` (custom message TTS cho bà)
- `tts.volume` (mặc định: 1.0)

## Offline Queue Integration

Khi gửi alert thất bại (Zalo hoặc Telegram error):

1. Lưu message vào memory với key: `eldercare_queue_{timestamp}`
2. Format:
   ```json
   {
     "id": "queue_{timestamp}_{random}",
     "created_at": "ISO timestamp",
     "source_skill": "eldercare-sos",
     "priority": "EMERGENCY",
     "channels": ["zalo", "telegram"],
     "message": "Nội dung SOS alert gốc",
     "target": "all",
     "retry_count": 0,
     "max_retries": 10,
     "last_retry_at": null,
     "status": "pending",
     "metadata": {
       "sos_level": 1,
       "source": "button_single | ai_detect | manual"
     }
   }
   ```
3. Skill eldercare-offline-queue sẽ retry mỗi phút
4. EMERGENCY messages retry không backoff 3 lần đầu
5. Nếu Zalo fail → tự động thử Telegram
6. Nếu mất mạng > 30 phút → TTS local + đèn flash qua HA LAN

**QUAN TRỌNG:** Mỗi level escalation (Level 1, 2, 3) nếu gửi thất bại
đều tạo queue entry riêng. Ví dụ Level 1 fail → queue entry priority EMERGENCY.
Level 2 fail → thêm 1 queue entry nữa.
