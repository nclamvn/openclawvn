---
name: eldercare-daily-report
description: |
  Báo cáo tình trạng bà mỗi ngày lúc 21:00. Tổng hợp dữ liệu từ
  tất cả eldercare skills: hoạt động, cuộc gọi, cảnh báo, môi trường phòng.
  Viết tự nhiên bằng tiếng Việt, gửi Zalo group gia đình.
  Data sources: eldercare-monitor, eldercare-sos, eldercare-videocall,
  eldercare-companion, Home Assistant sensors.
metadata:
  {
    "openclaw":
      {
        "emoji": "📊",
        "schedule":
          [
            {
              "kind": "cron",
              "expr": "0 21 * * *",
              "tz": "Asia/Ho_Chi_Minh",
              "description": "Báo cáo ngày lúc 21h",
            },
          ],
      },
  }
---

# Eldercare Daily Report — Báo cáo ngày

Skill này chạy lúc 21:00 mỗi ngày, tổng hợp toàn bộ dữ liệu eldercare
từ ngày hôm nay, viết thành báo cáo tiếng Việt tự nhiên, gửi Zalo group gia đình.

## Khi trigger (21:00 mỗi ngày)

### Bước 1: Thu thập dữ liệu từ memory

Tìm trong memory tất cả entries có prefix `eldercare_` với timestamp NGÀY HÔM NAY.

**1a. Monitoring data** (từ skill eldercare-monitor):
- Tìm keys: `eldercare_check_*`
- Tổng hợp: tổng số lần check, số lần mỗi mức (normal/attention/warning/emergency)
- Mức cao nhất trong ngày

**1b. SOS events** (từ skill eldercare-sos):
- Tìm keys: `eldercare_sos_active`, `eldercare_sos_*`
- Có SOS nào hôm nay? Bao nhiêu lần?
- Chi tiết: nguồn trigger, mức escalation cao nhất, ai xử lý, thời gian phản hồi

**1c. Video calls** (từ skill eldercare-videocall):
- Tìm keys: `eldercare_call_*`
- Bao nhiêu cuộc gọi, ai gọi, mấy giờ
- Tổng thời gian ước tính

**1d. Companion activity** (từ skill eldercare-companion):
- `eldercare_music_played_*` → bà nghe nhạc mấy lần, playlist nào
- `eldercare_story_bookmark` → bà nghe truyện không, đến đâu
- `eldercare_reminder_*` → nhắc nhở gì, bao nhiêu lần
- `eldercare_voice_command_*` → bà dùng voice command gì

### Bước 2: Thu thập sensor history từ Home Assistant

Dùng tool `home_assistant` với action `get_history`:

**Nhiệt độ phòng:**
```
action: get_history
entity_id: sensor.grandma_room_temperature
start_time: {00:00 hôm nay ISO}
end_time: {21:00 hôm nay ISO}
```
Tính: min, max, trung bình

**Độ ẩm:**
```
action: get_history
entity_id: sensor.grandma_room_humidity
start_time: {00:00 hôm nay ISO}
end_time: {21:00 hôm nay ISO}
```
Tính: trung bình

**Motion pattern** (ước tính giờ thức/ngủ):
```
action: get_history
entity_id: sensor.grandma_room_motion_minutes
start_time: {00:00 hôm nay ISO}
```
- Giờ thức ước tính: thời điểm đầu tiên motion reset về 0 sau 6h sáng
- Giờ ngủ trưa: khoảng thời gian motion > 30 phút liên tục trong 13h-15h
- Hoạt động chung: bao nhiêu % thời gian có motion trong giờ thức

### Bước 3: Viết report tiếng Việt

Dùng dữ liệu thu thập, viết báo cáo tiếng Việt TỰ NHIÊN.
KHÔNG dùng bảng hay JSON. Viết như người thật nhắn tin báo cáo cho gia đình.

**Template (điều chỉnh tùy data):**

```
📊 BÁO CÁO NGÀY {ngày/tháng/năm}

🛏️ Sinh hoạt:
Bà thức khoảng {giờ thức ước tính}h sáng. {Có/Không} ngủ trưa
{từ giờ đến giờ nếu có}. Nhìn chung bà {mô tả hoạt động}.

📞 Kết nối gia đình:
{X} cuộc gọi hôm nay: {liệt kê ai gọi, mấy giờ}.
{Hoặc nếu không có: "Chưa ai gọi bà hôm nay 😢"}

⚠️ Cảnh báo:
{Nếu có: liệt kê cảnh báo + mức + kết quả xử lý}
{Nếu không có: "Không có cảnh báo bất thường ✅"}

🎵 Giải trí:
{Bà nghe nhạc X lần (playlist Y). Nghe truyện đến chương Z.}
{Voice commands bà dùng: liệt kê}
{Hoặc: "Bà không yêu cầu giải trí hôm nay"}

🌡️ Phòng bà:
Nhiệt độ trung bình {avg}°C (thấp nhất {min}°C, cao nhất {max}°C).
Độ ẩm trung bình {avg}%.
{Cảnh báo nếu ngoài ngưỡng thoải mái 20-35°C hoặc 40-80%}

💡 Ghi chú AI:
{1-2 câu nhận xét tự động dựa trên data: trend, pattern, suggestion}
```

### Quy tắc viết report

1. **Ngắn gọn:** Mỗi section 1-3 câu. Tổng report không quá 300 từ.
2. **Tự nhiên:** Viết như người nhắn tin, không formal quá.
3. **Highlight SOS:** Nếu có SOS hôm nay → đưa LÊN ĐẦU report, trước mọi section khác.
4. **Nhắc gọi:** Nếu không ai gọi bà → thêm cuối: "💬 Nhắc: Bà chưa được gọi hôm nay. Gọi chào bà khi có thể nhé!"
5. **Ngày yên bình:** Nếu không có gì đặc biệt → report rút gọn:
   "📊 Ngày {date}: Một ngày bình thường, bà khỏe, không có gì đặc biệt ✅"

### Bước 4: Gửi Zalo group

Gửi report vào Zalo group gia đình (đọc từ memory `eldercare_contacts`).
Nếu chưa có group config → gửi vào channel hiện tại.

### Bước 5: Lưu report vào memory

```
eldercare_daily_report_{YYYY-MM-DD}: { "report": "{full text}", "sent_at": "{timestamp}" }
```

Để có thể tra cứu lại: "báo cáo ngày hôm qua", "xem lại báo cáo tuần trước".

## Xử lý trường hợp đặc biệt

**Mới cài, chưa có data:**
→ Gửi: "📊 Hệ thống mới hoạt động, đang thu thập dữ liệu. Báo cáo chi tiết sẽ có từ ngày mai."

**Có SOS hôm nay:**
→ Đưa SOS event lên ĐẦU TIÊN:
```
🚨 SỰ KIỆN QUAN TRỌNG:
SOS lúc {giờ} — nguồn: {nút bấm/AI detect/manual}.
Mức escalation: Level {X}. Xử lý bởi: {tên}. Thời gian phản hồi: {X} phút.
```
Rồi mới đến các section bình thường.

**HA không kết nối:**
→ Bỏ qua section sensor, ghi chú: "⚠️ Không đọc được dữ liệu sensor hôm nay (HA offline)."

**Không ai gọi bà:**
→ Thêm cuối report:
"💬 Nhắc: Bà chưa được gọi hôm nay. Gọi chào bà khi có thể nhé!"
