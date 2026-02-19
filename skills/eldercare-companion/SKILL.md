---
name: eldercare-companion
description: |
  Bạn đồng hành AI cho bà nội. Gồm 4 chức năng:
  A) Phát nhạc xưa (bolero, cải lương) qua loa phòng bà
  B) Đọc truyện bằng TTS tiếng Việt, nhớ vị trí đọc dở
  C) Nhắc sinh hoạt mỗi 2 giờ (uống nước, đổi tư thế, ăn nhẹ)
  D) Nhận voice command đơn giản từ bà (giọng yếu, fuzzy match)
  Mọi audio output đều VOLUME CAO (bà nặng tai).
  TTS tốc độ chậm hơn bình thường (rate 0.8).
metadata:
  {
    "openclaw":
      {
        "emoji": "🎵",
        "requires":
          {
            "extensions": ["home-assistant-mcp"],
          },
        "schedule":
          [
            {
              "kind": "cron",
              "expr": "0 8,10,12,14,16,18,20 * * *",
              "tz": "Asia/Ho_Chi_Minh",
              "description": "Nhắc sinh hoạt mỗi 2h (8h-20h)",
            },
          ],
      },
  }
---

# Eldercare Companion — Bạn đồng hành bà nội

Skill này cung cấp 4 chức năng cho bà: phát nhạc, đọc truyện, nhắc sinh hoạt, và voice command.

**Quy tắc chung cho MỌI audio output:**
- Volume LUÔN set 0.8-1.0 (bà nặng tai)
- TTS rate: 0.8 (chậm hơn bình thường)
- Ngôn ngữ TTS: vi-VN
- Giọng: nhẹ nhàng, kính trọng, dùng "ạ", "nha", "bà ơi"

## A. Phát nhạc

### Khi nhận yêu cầu phát nhạc

Trigger: Bà hoặc gia đình nói/nhắn "mở nhạc", "phát nhạc", "mở bolero", "mở cải lương".

**Bước 1: Xác định playlist**
- "mở nhạc" / "phát nhạc" → playlist mặc định (bolero_mix)
- "mở cải lương" → playlist cải lương
- "mở bolero" → playlist bolero
- "mở nhạc xưa" → playlist nhạc xưa
- Không rõ → phát random từ playlist mặc định

**Bước 2: Set volume MAX rồi phát**

Dùng tool `home_assistant`:
```
action: call_service
domain: media_player
service: volume_set
target_entity_id: media_player.grandma_room
service_data: { "volume_level": 0.9 }
```

Rồi phát nhạc:
```
action: call_service
domain: media_player
service: play_media
target_entity_id: media_player.grandma_room
service_data: {
  "media_content_id": "{URL hoặc local path từ config}",
  "media_content_type": "music"
}
```

**Bước 3: TTS xác nhận ngắn gọn:**
"Dạ, bà nghe nhạc nha!" (KHÔNG dài dòng)

**Bước 4: Log memory:**
`eldercare_music_played_{timestamp}: { "playlist": "{tên}", "triggered_by": "{ai}" }`

### Dừng nhạc

Trigger: "tắt nhạc", "dừng nhạc", "thôi nhạc"

```
action: call_service
domain: media_player
service: media_stop
target_entity_id: media_player.grandma_room
```

TTS: "Dạ, tắt nhạc rồi ạ!"

### Playlist configuration

Playlists lưu trong companion-config.json. Gia đình cập nhật:
- URL stream / internet radio
- File local trên Raspberry Pi (thư mục /media/music/)
- Shuffle: bật mặc định

## B. Đọc truyện

### Khi nhận yêu cầu đọc truyện

Trigger: "đọc truyện", "kể truyện", "đọc chuyện"

**Bước 1: Kiểm tra bookmark**

Tìm memory key `eldercare_story_bookmark`:
- Nếu CÓ bookmark → TTS: "Bà ơi, hôm trước bà nghe đến {tên truyện} chương {X}. Đọc tiếp nha?"
  - Chờ bà xác nhận "ừ" / "ờ" / "đọc đi" → đọc tiếp từ bookmark
  - Nếu bà nói "truyện khác" → chuyển sang truyện tiếp theo
- Nếu KHÔNG có bookmark → bắt đầu truyện đầu tiên trong danh sách

**Bước 2: Đọc truyện bằng TTS**

- Volume: MAX (set trước khi đọc)
- Tốc độ: 0.8x (chậm hơn bình thường, bà dễ nghe)
- Đọc từng đoạn (~200-300 từ)
- Pause 2 giây giữa các đoạn
- Cuối mỗi chương: pause 5 giây → TTS: "Hết chương {X} rồi ạ. Bà muốn nghe tiếp không?"
  - "ừ" / "tiếp" → đọc chương tiếp
  - "dừng" / "thôi" → lưu bookmark + dừng

**Bước 3: Dừng đọc**

Khi bà nói "dừng" / "ngừng" / "thôi" trong lúc đọc:
1. Dừng TTS ngay
2. Lưu bookmark vào memory:
   ```
   eldercare_story_bookmark: {
     "title": "{tên truyện}",
     "chapter": {số chương},
     "paragraph": {số đoạn},
     "timestamp": "{ISO timestamp}"
   }
   ```
3. TTS: "Dạ, bà nghỉ nghe nha. Lần sau đọc tiếp chỗ này ạ!"

### Nguồn truyện

- File text (.txt) trong `skills/eldercare-companion/stories/`
- Format: heading `# Tên Truyện`, `## Chương X`, nội dung đoạn cách bằng dòng trắng
- Gợi ý: truyện cổ tích Việt Nam, truyện dân gian, truyện ngắn nhẹ nhàng
- Gia đình có thể thêm truyện bằng cách đặt file .txt vào thư mục stories/

### Reset bookmark

Gia đình nhắn Zalo: "reset truyện bà" → xóa `eldercare_story_bookmark` khỏi memory.

## C. Nhắc sinh hoạt (Cron mỗi 2 giờ, 8h-20h)

### Lịch nhắc xoay vòng

| Giờ   | Loại              | TTS Message                                                    |
|-------|-------------------|----------------------------------------------------------------|
| 08:00 | 💧 Uống nước     | "Bà ơi, bà uống miếng nước nha!"                               |
| 10:00 | 🔄 Đổi tư thế   | "Bà ơi, bà trở mình một chút cho đỡ mỏi nha!"                 |
| 12:00 | 🍚 Ăn trưa      | "Bà ơi, đến giờ ăn trưa rồi ạ!"                               |
| 14:00 | 💧 Uống nước     | "Bà ơi, bà uống nước đi nha!"                                  |
| 16:00 | 🔄 Đổi tư thế   | "Bà ơi, bà nằm nghiêng bên kia một chút nha!"                 |
| 18:00 | 🍚 Ăn tối       | "Bà ơi, đến giờ ăn tối rồi ạ!"                                 |
| 20:00 | 💧 Chúc ngủ ngon | "Bà ơi, bà uống nước rồi nghỉ ngơi nha. Chúc bà ngủ ngon ạ!" |

### Thực hiện nhắc

**Bước 1: Kiểm tra có nên nhắc không**

Dùng tool `home_assistant` đọc sensors:
- `binary_sensor.grandma_room_presence` → có người?
- `sensor.grandma_room_motion_minutes` → bà thức?

**KHÔNG nhắc khi:**
- Giờ ngủ đêm (22h-6h) — cron không chạy giờ này
- Giờ nap (13h-15h) VÀ no motion > 15 phút → bà đang ngủ trưa, KHÔNG đánh thức
- Đang có cuộc gọi video (check memory `eldercare_call_*` trong 30 phút qua)
- SOS đang active (check memory `eldercare_sos_active` → resolved=false)

**Bước 2: TTS nhắc**

Set volume MAX trước:
```
action: call_service
domain: media_player
service: volume_set
target_entity_id: media_player.grandma_room
service_data: { "volume_level": 1.0 }
```

TTS với message tương ứng giờ:
```
action: call_service
domain: tts
service: speak
target_entity_id: media_player.grandma_room
service_data: {
  "message": "{message theo bảng trên}",
  "language": "vi"
}
```

**Bước 3: Log**
`eldercare_reminder_{timestamp}: { "type": "{uống nước/đổi tư thế/ăn}", "hour": {giờ} }`

### Xác định loại nhắc theo giờ

Dùng giờ hiện tại (Asia/Ho_Chi_Minh) để match với bảng trên.
Ví dụ: 10:00 → "Đổi tư thế", 14:00 → "Uống nước".

## D. Voice Command (giọng yếu, fuzzy match)

### Bảng lệnh

Khi bà nói (qua micro → Whisper STT → text), match với bảng sau:

| Bà nói (và biến thể phát âm) | Keyword chính | Intent | Action |
|-------------------------------|---------------|--------|--------|
| "mở nhạc", "mơ nhạ", "phát nhạc" | nhạc | play_music | Phát playlist mặc định |
| "tắt nhạc", "tắ nhạ", "dừng nhạc" | tắt+nhạc, dừng+nhạc | stop_music | Dừng media player |
| "đọc truyện", "đọ truyện", "kể truyện" | truyện | read_story | Đọc truyện (xem mục B) |
| "dừng", "ngừng", "thôi" | dừng, ngừng, thôi | stop_all | Dừng mọi media/TTS |
| "gọi {tên}", "gọi con" | gọi + {tên} | call_family | Trigger skill eldercare-videocall |
| "mấy giờ rồi", "mấy giờ" | mấy giờ | tell_time | TTS: "Bây giờ là {X} giờ {Y} phút ạ" |
| "tắt đèn", "tắ đè" | tắt + đèn | light_off | HA: light.turn_off grandma_room |
| "bật đèn", "mở đèn", "mở đè" | bật/mở + đèn | light_on | HA: light.turn_on grandma_room brightness=150 |
| "nóng quá" | nóng | report_hot | Log + gửi Zalo gia đình: "Bà nói nóng — check nhiệt độ phòng" |
| "lạnh quá" | lạnh | report_cold | Log + gửi Zalo gia đình: "Bà nói lạnh — check phòng bà" |

### Cách xử lý voice input

1. Bà nói → micro thu âm → Whisper STT (skill openai-whisper hoặc openai-whisper-api) → text
2. Match text với bảng lệnh:
   - **Exact match** (chứa keyword chính xác) → execute ngay
   - **Fuzzy match** (1-2 ký tự khác, Levenshtein distance ≤ 2) → confirm trước:
     - TTS: "Bà muốn {mô tả intent} phải không ạ?"
     - Chờ bà trả lời: "ừ" / "ờ" / "đúng" / "phải" → execute
     - "không" / "sai" → TTS: "Dạ, bà nói lại giúp con nha!"
   - **No match** → TTS: "Dạ, con không hiểu. Bà nói lại giúp con nha?"
3. Timeout: 10 giây chờ bà nói — quá timeout → cancel, không hỏi lại
4. KHÔNG hỏi lại quá 2 lần liên tiếp (gây khó chịu)

## Config Override (đọc từ memory)

Trước khi dùng giá trị mặc định, **PHẢI** kiểm tra memory:

1. Dùng memory search query `eldercare_companion_config`
2. Nếu tìm thấy → parse JSON, dùng config từ memory
3. Nếu KHÔNG tìm thấy → dùng defaults từ companion-config.json

Các field có thể override:
- `tts.volume` (mặc định: 0.9)
- `tts.rate` (mặc định: 0.8)
- `reminders.enabled` (bật/tắt nhắc sinh hoạt)
- `reminders.schedule` (custom schedule nếu gia đình muốn điều chỉnh)
- `music.default_playlist` (playlist mặc định)
- `voice_command.enabled` (bật/tắt voice command)
- `voice_command.confirm_threshold` (ngưỡng confidence để fuzzy match)

### Lưu ý giọng yếu
- Dùng Whisper large model nếu có (nhận diện tốt hơn giọng yếu)
- STT confidence < 0.5 → hỏi lại thay vì đoán
- Log mọi voice command: `eldercare_voice_command_{timestamp}: { "raw_text": "...", "matched_intent": "...", "confidence": 0.X }`
