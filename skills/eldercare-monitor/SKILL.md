---
name: eldercare-monitor
description: |
  Giám sát phòng bà nội 24/7. Chạy mỗi 5 phút. Đọc sensors từ Home Assistant
  (mmWave presence, camera motion, nhiệt độ, độ ẩm). Phân tích bất thường
  dựa trên context (giờ, thói quen). Gửi cảnh báo 4 mức qua Zalo.
  Đối tượng: Người cao tuổi cần chăm sóc. Minh mẫn, nặng tai, nằm giường.
homepage: https://github.com/nclamvn/ba-noi-care
metadata:
  {
    "openclaw":
      {
        "emoji": "👵",
        "requires":
          {
            "config": ["plugins.entries.home-assistant-mcp.enabled"],
          },
        "schedule":
          [
            {
              "kind": "cron",
              "expr": "*/5 * * * *",
              "tz": "Asia/Ho_Chi_Minh",
              "description": "Check bà mỗi 5 phút",
            },
          ],
      },
  }
---

# Eldercare Monitor — Giám sát bà nội

Skill này chạy mỗi 5 phút (cron), đọc sensors từ Home Assistant, phân tích tình trạng bà, và gửi cảnh báo nếu phát hiện bất thường.

## Khi được trigger (mỗi 5 phút)

### Bước 1: Đọc sensors từ Home Assistant

Dùng tool `home_assistant` với action `get_state` để đọc từng entity:

| Entity ID | Ý nghĩa | Cách đọc |
|-----------|---------|----------|
| `binary_sensor.grandma_room_presence` | mmWave: có người trong phòng? (on/off) | `get_state` |
| `sensor.grandma_room_motion_minutes` | Số phút từ lần cử động cuối | `get_state` |
| `sensor.grandma_room_temperature` | Nhiệt độ phòng (°C) | `get_state` |
| `sensor.grandma_room_humidity` | Độ ẩm (%) | `get_state` |
| `binary_sensor.grandma_room_camera_motion` | Camera thấy cử động? (on/off) | `get_state` |

Nếu bất kỳ sensor nào không available hoặc trả lỗi, log warning và bỏ qua sensor đó. Tiếp tục với sensors còn lại.

### Bước 2: Xác định context thời gian

Lấy giờ hiện tại theo timezone **Asia/Ho_Chi_Minh** (UTC+7):

- **Giờ ngủ đêm:** 22:00 - 06:00
- **Giờ ngủ trưa (nap):** 13:00 - 15:00
- **Giờ hoạt động:** Tất cả giờ còn lại (06:00-13:00 và 15:00-22:00)

Có thể adjust giờ nap nếu memory có `eldercare_nap_pattern`.

### Bước 3: Phân tích và phân loại 4 mức

Đọc `sensor.grandma_room_motion_minutes` (gọi tắt: `motion_min`) và `binary_sensor.grandma_room_presence` (gọi tắt: `presence`).

**Mức BÌNH THƯỜNG** — Không hành động, chỉ log:
- `motion_min` < 30 (bà vừa cử động gần đây)
- HOẶC: Đang trong giờ ngủ đêm (22h-6h) VÀ `presence` = on
- HOẶC: Đang trong giờ nap (13h-15h) VÀ `presence` = on

**Mức CHÚ Ý** — Gửi Zalo cho contact ưu tiên #1:
- `motion_min` > 30, đang trong giờ hoạt động, VÀ `presence` = on
- Message: `⚠️ [Bà Nội Care] Bà bất động {motion_min} phút (lúc {giờ:phút}). Presence OK — có thể bà đang nghỉ. Nhờ kiểm tra ạ.`

**Mức CẢNH BÁO** — Gửi Zalo TẤT CẢ contacts + camera snapshot:
- `motion_min` > 60, đang trong giờ hoạt động
- HOẶC: `presence` = off liên tục > 2 giờ trong khung 6h-22h
- Message: `🔴 [Bà Nội Care] CẢNH BÁO: Bà bất động {motion_min} phút / Không phát hiện người trong phòng {X} giờ! [Ảnh camera]`
- Hành động thêm: Dùng tool `camsnap` chụp camera snapshot, gửi ảnh kèm message

**Mức KHẨN CẤP** — Trigger skill eldercare-sos:
- Camera phát hiện ngã (nếu có integration) → ưu tiên gọi skill `eldercare-fall-detect` trước (TTS xác nhận với bà). Nếu bà không phản hồi → fall-detect tự trigger SOS Level 2.
- HOẶC: AI pattern nghi ngã — camera motion spike rồi bất động > 5 phút → gọi skill `eldercare-fall-detect`
- HOẶC: `presence` = off VÀ nhiệt độ giảm bất thường (> 3°C/giờ so với giờ trước) → Gọi skill `eldercare-sos` trực tiếp
- Hành động mặc định: Gọi skill `eldercare-sos` để bắt đầu SOS protocol

### Bước 4: Quy tắc chống false alarm

**Bắt buộc kiểm tra trước khi gửi cảnh báo:**

1. **Giờ nap (13-15h):** Nếu `presence` = on và `motion_min` > 30 → đây là BÌNH THƯỜNG (bà ngủ trưa), KHÔNG gửi cảnh báo
2. **Giờ đêm (22-6h):** Nếu `presence` = on → BÌNH THƯỜNG (bà ngủ), KHÔNG gửi cảnh báo
3. **Sau cuộc gọi video:** Nếu memory cho thấy có cuộc gọi video kết thúc trong 30 phút qua → nâng ngưỡng CHÚ Ý lên 45 phút thay vì 30 (bà nghỉ sau call)
4. **Cooldown:** Nếu đã gửi cảnh báo cùng mức hoặc cao hơn trong 15 phút qua → KHÔNG gửi lại (tránh spam). Kiểm tra memory `eldercare_last_alert_time`.

### Bước 5: Gửi cảnh báo

- **Mức CHÚ Ý:** Gửi tin nhắn Zalo cho contact ưu tiên cao nhất (đọc từ memory `eldercare_contacts`)
- **Mức CẢNH BÁO:** Gửi Zalo cho TẤT CẢ contacts trong danh sách + dùng `camsnap` chụp ảnh gửi kèm
- **Mức KHẨN CẤP:** Nói rõ: "Kích hoạt skill eldercare-sos" để AI trigger SOS protocol

### Bước 6: Log vào memory

Luôn log kết quả check vào memory (dùng cho daily report):

```
eldercare_check_{HH:mm}: {level} — {summary}
```

Ví dụ:
- `eldercare_check_10:05: attention — motion 35 phút, presence on`
- `eldercare_check_14:15: normal — nap time, presence on`
- `eldercare_check_09:00: warning — presence off 2.5 giờ`

Cập nhật `eldercare_last_alert_time` khi gửi cảnh báo (để kiểm tra cooldown lần sau).

### Nhiệt độ & Độ ẩm

Kiểm tra thêm điều kiện môi trường:

- Nhiệt độ < 20°C → Gửi CHÚ Ý: `🌡️ Nhiệt độ phòng bà {X}°C — hơi lạnh. Cần đắp thêm chăn.`
- Nhiệt độ > 35°C → Gửi CHÚ Ý: `🌡️ Nhiệt độ phòng bà {X}°C — nóng quá. Cần bật quạt/điều hoà.`
- Độ ẩm < 40% → Gửi CHÚ Ý: `💧 Độ ẩm phòng bà {X}% — khô. Cần bật máy tạo ẩm.`
- Độ ẩm > 80% → Gửi CHÚ Ý: `💧 Độ ẩm phòng bà {X}% — ẩm cao. Cần thông gió.`

### Contacts

Đọc danh sách contacts từ memory key `eldercare_contacts`. Format:

```json
[
  { "name": "Contact 1", "priority": 1 },
  { "name": "Contact 2", "priority": 2 }
]
```

Nếu chưa có contacts trong memory, gửi cảnh báo vào channel hiện tại và nhắc: "Cần cấu hình contacts cho eldercare. Dùng eldercare-config để setup."

## Config Override (đọc từ memory)

Trước khi dùng thresholds mặc định từ `monitor-config.json`, **PHẢI** kiểm tra memory:

1. Dùng memory search query `eldercare_monitor_config`
2. Nếu tìm thấy → parse JSON, dùng các thresholds từ memory (gia đình đã tuỳ chỉnh qua UI)
3. Nếu KHÔNG tìm thấy → dùng giá trị mặc định từ `monitor-config.json`

Các field có thể override:
- `thresholds.no_motion_attention_minutes` (mặc định: 30)
- `thresholds.no_motion_warning_minutes` (mặc định: 60)
- `thresholds.no_presence_warning_minutes` (mặc định: 120)
- `thresholds.temp_low` / `temp_high` (mặc định: 20 / 35)
- `thresholds.humidity_low` / `humidity_high` (mặc định: 40 / 80)
- `cooldown_minutes` (mặc định: 15)

## Offline Queue Integration

Khi gửi cảnh báo thất bại (Zalo hoặc Telegram error):

1. Lưu vào memory với key: `eldercare_queue_{timestamp}`
2. Format:
   ```json
   {
     "id": "queue_{timestamp}_{random}",
     "created_at": "ISO timestamp",
     "source_skill": "eldercare-monitor",
     "priority": "ATTENTION | WARNING | EMERGENCY",
     "channels": ["zalo"],
     "message": "Nội dung cảnh báo gốc",
     "target": "contact_1 | all",
     "retry_count": 0,
     "max_retries": 10,
     "last_retry_at": null,
     "status": "pending",
     "metadata": {
       "level": "attention | warning | emergency",
       "motion_minutes": 45,
       "presence": true
     }
   }
   ```
3. Skill eldercare-offline-queue sẽ retry theo backoff schedule
4. ATTENTION/INFO: chỉ retry Zalo
5. WARNING: retry Zalo, nếu fail thử Telegram
6. EMERGENCY: retry không backoff 3 lần đầu + channel failover

### Tóm tắt flow

```
Cron 5 phút
  ├── Đọc sensors (HA)
  ├── Xác định giờ (Asia/Ho_Chi_Minh)
  ├── Kiểm tra false alarm rules
  ├── Phân loại mức
  ├── Gửi cảnh báo (nếu cần)
  └── Log vào memory
```
