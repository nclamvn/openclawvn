---
name: eldercare-fall-detect
description: |
  Phát hiện bà ngã bằng 2 layer:
  Layer 1: Aqara FP2 native fall detection entity (nếu firmware hỗ trợ)
  Layer 2: AI pattern — motion spike rồi bất động đột ngột (> 5 phút)
  Khi phát hiện → TTS hỏi bà xác nhận → chờ 30 giây → nếu bà không trả lời
  → trigger SOS Level 2.
  Đối tượng: Người cao tuổi cần chăm sóc, nằm giường.
metadata:
  {
    "openclaw":
      {
        "emoji": "🛡️",
        "requires":
          {
            "extensions": ["home-assistant-mcp"],
          },
      },
  }
---

# Eldercare Fall Detect — Phát hiện bà ngã

Skill này phát hiện té ngã bằng 2 layer và xác nhận trước khi escalate.

## Khi nào skill này chạy

Skill này KHÔNG chạy theo cron. Nó được trigger bởi:

1. **HA Event:** `state_changed` trên entity fall detection (Layer 1)
2. **Từ eldercare-monitor:** Khi monitor phát hiện pattern nghi ngờ ngã (Layer 2)

## Layer 1: Aqara FP2 Native Fall Detection

### Kiểm tra entity tồn tại

Trước tiên, kiểm tra xem firmware FP2 có hỗ trợ fall detection không:

```
action: get_state
entity_id: binary_sensor.grandma_room_fall_detected
```

- Nếu entity **TỒN TẠI** → Layer 1 active, subscribe event
- Nếu entity **KHÔNG TỒN TẠI** (unavailable / not found) → Layer 1 disabled, chỉ dùng Layer 2

### Khi FP2 báo fall detected

Khi `binary_sensor.grandma_room_fall_detected` chuyển sang `on`:

1. Log: `eldercare_fall_raw_{timestamp}: { "source": "fp2_native", "entity_state": "on" }`
2. Chuyển sang **Bước Xác Nhận** (xem bên dưới)

### False positive filtering (Layer 1)

FP2 fall detection có thể false positive khi:
- Bà nằm xuống giường bình thường (từ ngồi → nằm)
- Trẻ con/thú nuôi di chuyển nhanh

**Lọc:**
- Nếu `sensor.grandma_room_motion_minutes` < 2 VÀ `binary_sensor.grandma_room_presence` = on → có thể bà chỉ nằm xuống
- Vẫn tiếp tục TTS xác nhận, nhưng ghi note: `"likely_normal_movement": true`

## Layer 2: AI Pattern Detection

### Pattern: Motion Spike → Sudden Stillness

Được trigger từ eldercare-monitor khi phát hiện pattern sau:

1. **Motion spike:** Camera motion (`binary_sensor.grandma_room_camera_motion`) chuyển `on` đột ngột
2. **Rồi bất động:** `sensor.grandma_room_motion_minutes` tăng nhanh (> 5 phút bất động) ngay sau spike
3. **Presence vẫn on:** `binary_sensor.grandma_room_presence` = on (người vẫn trong phòng)

**Quy tắc phát hiện (eldercare-monitor gọi skill này khi):**
- Camera motion `on` → rồi `off` trong vòng 30 giây (spike ngắn)
- SAU ĐÓ: motion_minutes tăng liên tục > 5 phút
- VÀ: KHÔNG phải giờ ngủ đêm (22-6h) hoặc giờ nap (13-15h)
- VÀ: Presence = on

Khi match pattern → log + chuyển sang **Bước Xác Nhận**.

### Loại trừ false positive (Layer 2)

**KHÔNG trigger khi:**
- Giờ ngủ đêm (22:00-06:00)
- Giờ nap (13:00-15:00) VÀ no motion < 30 phút (bà vừa nằm ngủ)
- Đang có cuộc gọi video (check memory `eldercare_call_*` trong 30 phút qua)
- SOS đã active (check memory `eldercare_sos_active` → resolved=false)
- Đã có fall detect check trong 10 phút qua (cooldown — check memory `eldercare_fall_last_check`)

## Bước Xác Nhận (TTS Confirm)

**QUAN TRỌNG: KHÔNG bao giờ trigger SOS ngay. PHẢI hỏi bà trước.**

### 1. Chụp camera snapshot

```
action: call_service
domain: camera
service: snapshot
target_entity_id: camera.grandma_room
service_data: { "filename": "/config/www/fall_snapshot.jpg" }
```

### 2. TTS hỏi bà (VOLUME CAO, CHẬM)

Set volume MAX:
```
action: call_service
domain: media_player
service: volume_set
target_entity_id: media_player.grandma_room
service_data: { "volume_level": 1.0 }
```

TTS:
```
action: call_service
domain: tts
service: speak
target_entity_id: media_player.grandma_room
service_data: {
  "message": "Bà ơi, bà có ổn không ạ? Bà nói gì đi để con biết bà ổn nha!",
  "language": "vi"
}
```

### 3. Chờ 30 giây

Trong 30 giây, kiểm tra:
- **Sensor motion:** Nếu `sensor.grandma_room_motion_minutes` reset về 0 (bà cử động) → BÀ ỔN
- **Voice reply:** Nếu có voice input (qua Whisper STT) chứa "ổn", "ừ", "được", "không sao" → BÀ ỔN
- **Camera motion:** Nếu `binary_sensor.grandma_room_camera_motion` = on → BÀ CỬ ĐỘNG

### 4. Kết quả xác nhận

**Bà ỔN (có phản hồi trong 30s):**
1. TTS: "Dạ, tốt quá! Bà nghỉ ngơi nha!"
2. Log: `eldercare_fall_check_{timestamp}: { "result": "confirmed_ok", "source": "{fp2_native|ai_pattern}", "response_type": "{motion|voice|camera}" }`
3. Gửi Zalo cho contact ưu tiên #1 (nếu nguồn là fp2_native):
   `ℹ️ [Bà Nội Care] FP2 phát hiện nghi ngã lúc {giờ}. Đã hỏi bà — bà ổn. [Ảnh camera]`
4. Cập nhật `eldercare_fall_last_check` = timestamp hiện tại

**Bà KHÔNG phản hồi (hết 30s, không cử động):**
1. TTS lần 2 (lần cuối): "Bà ơi! Bà có nghe không ạ? Bà cử động tay chân giúp con!"
2. Chờ thêm 15 giây
3. Nếu VẪN không phản hồi:
   - Chụp thêm 1 snapshot mới
   - Log: `eldercare_fall_check_{timestamp}: { "result": "no_response", "source": "{fp2_native|ai_pattern}", "escalated": true }`
   - **Trigger SOS Level 2** — gọi skill eldercare-sos với source = "fall_detect"
   - Gửi kèm 2 ảnh snapshot (trước và sau TTS)
4. Cập nhật `eldercare_fall_last_check` = timestamp hiện tại

## Config Override (đọc từ memory)

Trước khi dùng giá trị mặc định, **PHẢI** kiểm tra memory:

1. Dùng memory search query `eldercare_fall_config`
2. Nếu tìm thấy → parse JSON, dùng config từ memory
3. Nếu KHÔNG tìm thấy → dùng defaults từ fall-config.json

Các field có thể override:
- `detection.stillness_threshold_minutes` (mặc định: 5)
- `detection.spike_window_seconds` (mặc định: 30)
- `confirm.tts_wait_seconds` (mặc định: 30)
- `confirm.second_tts_wait_seconds` (mặc định: 15)
- `cooldown.between_checks_minutes` (mặc định: 10)

## Cooldown

- Không trigger fall check quá 1 lần mỗi 10 phút (tránh spam TTS cho bà)
- Check memory `eldercare_fall_last_check` timestamp
- Nếu < 10 phút trước → skip, chỉ log: `eldercare_fall_skipped_cooldown_{timestamp}`

## Entities

| Entity ID | Ý nghĩa |
|-----------|---------|
| `binary_sensor.grandma_room_fall_detected` | FP2 native fall detect (nếu có) |
| `binary_sensor.grandma_room_presence` | mmWave presence |
| `sensor.grandma_room_motion_minutes` | Phút từ cử động cuối |
| `binary_sensor.grandma_room_camera_motion` | Camera phát hiện cử động |
| `camera.grandma_room` | Camera phòng bà (snapshot) |
| `media_player.grandma_room` | Loa phòng bà (TTS) |

## Offline Queue Integration

Khi gửi thông báo thất bại (Zalo error):

1. Lưu vào memory: `eldercare_queue_{timestamp}`
2. Priority: `EMERGENCY` (nếu escalated to SOS) hoặc `INFO` (nếu bà ổn)
3. Skill eldercare-offline-queue sẽ retry

## Quy tắc an toàn

- **KHÔNG** trigger SOS ngay khi phát hiện ngã — PHẢI hỏi bà trước
- **KHÔNG** trigger khi giờ ngủ/nap (trừ khi Layer 1 FP2 báo)
- **PHẢI** có cooldown 10 phút giữa các lần check
- **PHẢI** chụp camera snapshot trước và sau TTS
- **PHẢI** log mọi detection (cả true positive và false positive)
- TTS cho bà phải **CHẬM, RÕ RÀNG, VOLUME CAO**

## Tóm tắt flow

```
Trigger (FP2 event / AI pattern từ monitor)
  │
  ├── Kiểm tra cooldown (< 10 phút?) → Skip
  │
  ├── Chụp snapshot #1
  │
  ├── TTS: "Bà ơi, bà có ổn không?"
  │
  ├── Chờ 30 giây
  │    ├── Bà cử động / trả lời → ỔN → Log + Zalo info
  │    └── Không phản hồi
  │         │
  │         ├── TTS lần 2: "Bà ơi! Bà cử động tay chân giúp con!"
  │         ├── Chờ 15 giây
  │         │    ├── Bà cử động → ỔN
  │         │    └── Vẫn im
  │         │         │
  │         │         ├── Chụp snapshot #2
  │         │         └── Trigger SOS Level 2
  │         │              (kèm 2 ảnh snapshot)
  │
  └── Log + cập nhật cooldown
```
