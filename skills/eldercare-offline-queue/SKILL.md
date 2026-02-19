---
name: eldercare-offline-queue
description: |
  Hàng đợi cảnh báo offline cho Bà Nội Care. Khi gửi Zalo/Telegram
  thất bại (network error, API error, timeout), alert được lưu vào
  memory queue. Cron mỗi 1 phút kiểm tra queue và retry.

  CRITICAL: Đảm bảo SOS alert KHÔNG BAO GIỜ mất.
  Queue persist qua restart (dùng memory, không RAM).
metadata:
  {
    "openclaw":
      {
        "emoji": "📨",
        "requires":
          {
            "config": ["plugins.entries.zalo.enabled"],
          },
        "schedule":
          [
            {
              "kind": "cron",
              "expr": "* * * * *",
              "tz": "Asia/Ho_Chi_Minh",
              "description": "Check queue mỗi 1 phút, retry pending alerts",
            },
          ],
      },
  }
---

# Eldercare Offline Queue — Đảm bảo không mất alert

## Tổng quan

Skill này hoạt động như safety net cho tất cả eldercare alerts.
Khi bất kỳ skill nào gửi alert thất bại, message được queue trong memory.
Cron mỗi phút kiểm tra và retry.

## Cách hoạt động

### Quy trình gửi alert (áp dụng cho TẤT CẢ eldercare skills)

Các skill khác (monitor, sos, videocall) khi cần gửi alert:
1. Gửi qua Zalo/Telegram như bình thường
2. NẾU gửi thành công → done
3. NẾU gửi thất bại (bất kỳ error nào) → lưu vào queue:
   - Lưu memory: `eldercare_queue_{timestamp}`
   - Value: JSON object chứa message details

### Queue entry format

```json
{
  "id": "queue_{timestamp}_{random}",
  "created_at": "ISO timestamp",
  "source_skill": "eldercare-sos | eldercare-monitor | eldercare-videocall",
  "priority": "EMERGENCY | WARNING | ATTENTION | INFO",
  "channels": ["zalo", "telegram"],
  "message": "Nội dung alert gốc",
  "target": "group | contact_1 | all",
  "retry_count": 0,
  "max_retries": 10,
  "last_retry_at": null,
  "status": "pending | retrying | sent | failed_permanent",
  "metadata": {
    "sos_level": 2,
    "sensor_data": {}
  }
}
```

### Cron handler (mỗi 1 phút)

Khi cron trigger, thực hiện các bước sau:

#### Bước 1: Tìm pending entries

Dùng memory_search với query `eldercare_queue_`:
- Tìm tất cả memory keys matching `eldercare_queue_*`
- Filter: chỉ lấy entries có `"status": "pending"` hoặc `"status": "retrying"`
- Sort: EMERGENCY trước, rồi WARNING, ATTENTION, INFO

#### Bước 2: Kiểm tra network health

Trước khi retry batch, kiểm tra network:
1. Thử gửi 1 message test nhỏ qua Zalo (lightweight health check)
   - Nếu có tool zalouser → dùng action "status" để check
   - Hoặc thử gọi Zalo API endpoint bất kỳ
2. Nếu Zalo UP → đánh dấu zalo_available = true
3. Nếu Zalo DOWN → zalo_available = false
4. Tương tự cho Telegram (nếu có entries cần gửi Telegram)
5. Nếu CẢ HAI DOWN → skip toàn bộ batch, chờ cron tiếp

#### Bước 3: Retry từng entry

Với mỗi pending entry (đã sort theo priority):

**a. Kiểm tra retry_count < max_retries**
- Nếu retry_count >= max_retries → set status = "failed_permanent", skip

**b. Kiểm tra backoff schedule**
Đọc từ queue-config.json:
- Retry 1-3: mỗi phút (mỗi lần cron chạy)
- Retry 4-6: mỗi 5 phút (skip nếu chưa đủ 5 phút từ last_retry_at)
- Retry 7-10: mỗi 15 phút (skip nếu chưa đủ 15 phút từ last_retry_at)

**ĐẶC BIỆT cho EMERGENCY:** 3 lần retry đầu tiên KHÔNG áp dụng backoff — retry NGAY mỗi phút.

**c. Thử gửi lại**
- Nếu channel chính (thường Zalo) available → gửi qua Zalo
- Nếu Zalo DOWN và priority = EMERGENCY hoặc WARNING → thử Telegram
- Nếu cả hai DOWN → skip, giữ status "retrying"

**d. Kết quả retry**

NẾU gửi THÀNH CÔNG:
- Update entry: `status = "sent"`, `sent_at = now()`
- Thêm prefix "[Gửi trễ]" vào message nếu retry_count > 0
- Lưu log: `eldercare_queue_sent_{timestamp}` với nội dung tóm tắt

NẾU gửi THẤT BẠI:
- Tăng retry_count
- Update last_retry_at = now()
- Giữ status = "retrying"
- Nếu retry_count >= max_retries → status = "failed_permanent"
  → Log warning: "Alert failed permanently after {max_retries} attempts"

### Priority handling

**EMERGENCY (SOS):**
- Retry NGAY mỗi phút, không backoff 3 lần đầu
- Nếu Zalo fail → thử Telegram ngay
- Nếu cả 2 fail → vẫn queue, retry mỗi phút
- KHÔNG BAO GIỜ bỏ — retry cho đến khi gửi được hoặc hết max_retries

**WARNING:**
- Retry theo backoff bình thường
- Nếu Zalo fail → thử Telegram

**ATTENTION / INFO:**
- Retry theo backoff bình thường
- Chỉ retry qua Zalo (không escalate sang Telegram)

### Local fallback (khi mất mạng hoàn toàn)

Kiểm tra: có EMERGENCY entry nào pending > 30 phút không?
(created_at so với now, chênh lệch > 30 phút)

Nếu CÓ EMERGENCY pending > 30 phút VÀ network vẫn down:

Dùng tool home_assistant (kết nối LOCAL qua LAN, không cần internet):

1. **TTS qua loa phòng bà:**
```
action: call_service
domain: tts
service: speak
target_entity_id: media_player.grandma_room
service_data: {
  "message": "Cảnh báo! Hệ thống mất mạng. Đang cố gửi thông báo cho gia đình. Ông ơi kiểm tra bà giúp!",
  "language": "vi"
}
```

2. **Bật đèn nhấp nháy (flash effect):**
```
action: call_service
domain: light
service: turn_on
target_entity_id: light.grandma_room
service_data: { "brightness": 255, "flash": "long" }
```

Nếu HA light entity không hỗ trợ flash → bật sáng tối đa:
```
action: call_service
domain: light
service: turn_on
target_entity_id: light.grandma_room
service_data: { "brightness": 255 }
```

Đây là fallback cuối cùng — ít nhất ông biết có vấn đề và kiểm tra bà.

**Chỉ trigger local fallback 1 lần mỗi 30 phút** (tránh spam TTS).
Lưu memory `eldercare_queue_local_fallback_at` với timestamp.

### Cleanup

Piggyback vào cron handler (chạy cuối mỗi lần cron):

1. Tìm tất cả `eldercare_queue_*` entries
2. Entries có `status = "sent"` VÀ `sent_at` > 24 giờ trước → XÓA
3. Entries có `status = "failed_permanent"` VÀ `created_at` > 7 ngày trước → XÓA
4. Entries `eldercare_queue_sent_*` > 24 giờ → XÓA

### Tích hợp với skills khác

Các skill monitor, sos ĐÃ ĐƯỢC CẬP NHẬT (xem section cuối SKILL.md của chúng).

Khi skill gửi alert thất bại → lưu entry vào memory với format ở trên.
Skill eldercare-offline-queue sẽ tự động pickup và retry.

### Monitoring

Daily report (eldercare-daily-report) nên check:
- Số entries "failed_permanent" → nếu > 0, ghi vào report
- Số entries "sent" với retry_count > 0 → ghi "X alerts bị trễ do mạng"
- Network downtime: tính từ first failed attempt đến last successful retry

### Tóm tắt flow

```
Skill gửi alert
  │
  ├── Thành công → Done
  │
  └── Thất bại → Lưu eldercare_queue_{ts}
                      │
                      ▼
              Cron mỗi 1 phút
                      │
                ┌─────┴─────┐
                │            │
          Network UP    Network DOWN
                │            │
          Retry entries  Skip (chờ tiếp)
                │            │
          ┌─────┴─────┐     └── > 30 phút + EMERGENCY?
          │           │              │
       Success     Fail         Local fallback
          │           │         (TTS + đèn flash)
    status=sent  retry_count++
    "[Gửi trễ]"     │
                 > max_retries?
                     │
              failed_permanent
```
