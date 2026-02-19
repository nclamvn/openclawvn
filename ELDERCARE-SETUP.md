# Hướng dẫn cài đặt BÀ NỘI CARE

## Yêu cầu phần cứng

| Thiết bị | Ghi chú |
|----------|---------|
| Raspberry Pi 4 (4GB+) | Chạy Home Assistant + OpenClaw Gateway |
| Aqara FP2 (mmWave) | Cảm biến hiện diện phòng bà |
| Aqara Temperature/Humidity | Nhiệt độ + độ ẩm phòng bà |
| Loa thông minh (Google/Sonos) | TTS + phát nhạc (volume cao) |
| Tablet Android 10" | Zalo video call bên giường bà |
| Zigbee button (tùy chọn) | Nút SOS vật lý |
| Zigbee coordinator (CC2652) | Cho Aqara sensors |

## Bước 1: Cài Home Assistant

```bash
# Trên Raspberry Pi
curl -sL https://install.hass.io | bash
```

Sau khi HA chạy:
1. Thêm integration Zigbee (ZHA hoặc Zigbee2MQTT)
2. Pair sensors: FP2, temperature, humidity
3. Pair nút SOS nếu có
4. Thêm media_player cho loa phòng bà

**Entity IDs cần có:**
```
binary_sensor.grandma_room_presence
sensor.grandma_room_temperature
sensor.grandma_room_humidity
sensor.grandma_room_motion_minutes
media_player.grandma_room
light.grandma_room
```

## Bước 2: Cấu hình biến môi trường

```bash
cp .env.eldercare.example .env.eldercare
nano .env.eldercare
```

Điền thông tin thực:
- `HA_URL`: URL Home Assistant (e.g. `http://192.168.1.100:8123`)
- `HA_TOKEN`: Long-lived access token từ HA
- `ZALO_FAMILY_GROUP_ID`: ID group Zalo gia đình
- `TELEGRAM_FAMILY_CHAT_ID`: Chat ID Telegram backup

## Bước 3: Cài extension Home Assistant MCP

```bash
cd extensions/home-assistant-mcp
npm install
```

Extension tự động load khi Gateway khởi động nếu `HA_URL` và `HA_TOKEN` có trong env.

## Bước 4: Khởi động Gateway

```bash
# Docker
docker compose --env-file .env.eldercare up -d

# Hoặc trực tiếp
source .env.eldercare
node dist/index.js gateway --bind lan
```

## Bước 5: Kiểm tra kết nối

1. Mở Bờm Control UI: `http://<raspberry-pi-ip>:18789`
2. Vào tab **Bà nội care** → kiểm tra:
   - HA Connected: Yes
   - Presence sensor: có data
   - Temperature: có số
3. Vào **Eldercare Config** → cấu hình:
   - Ngưỡng cảnh báo (mặc định OK cho hầu hết trường hợp)
   - Danh bạ SOS
   - IP tablet

## Bước 6: Cài tablet cho bà

1. Cài Zalo + đăng nhập tài khoản bà (hoặc tạo riêng)
2. Cài [Fully Kiosk Browser](https://www.fully-kiosk.com/)
3. Cấu hình Fully Kiosk:
   - Kiosk mode: ON
   - Remote admin: ON (cần IP + password)
   - Screen saver: OFF
   - Auto-start Zalo on boot
4. Cập nhật IP tablet trong Eldercare Config

## Bước 7: Test toàn bộ

### Test giám sát
- Đợi 5 phút → check memory có `eldercare_check_*`
- Block sensor → đợi cảnh báo

### Test SOS
- Bấm nút SOS (nếu có) hoặc nói "SOS"
- Check Zalo group nhận được thông báo
- Trả lời "OK" → check SOS resolved

### Test video call
- Nhắn Zalo group "gọi bà"
- Check tablet bật Zalo
- Check TTS báo trước cho bà

### Test companion
- Nói "mở nhạc" → check loa phát
- Nói "đọc truyện" → check TTS đọc
- Đợi đến giờ chẵn → check nhắc sinh hoạt

### Test báo cáo
- Đợi 21:00 hoặc trigger manual
- Check Zalo group nhận báo cáo tiếng Việt

## Xử lý sự cố

| Vấn đề | Giải pháp |
|--------|-----------|
| HA không kết nối | Check HA_URL, HA_TOKEN trong .env |
| Sensor không có data | Check Zigbee pairing, entity_id |
| TTS không phát | Check media_player entity, volume |
| Zalo không gửi được | Check Zalo extension config |
| Tablet không bật Zalo | Check Fully Kiosk password, IP |
| Cảnh báo quá nhiều | Tăng ngưỡng trong Eldercare Config |
| Bà không nghe TTS | Tăng volume lên 1.0, check loa |

## Bảo trì

- **Hàng tuần:** Check pin nút SOS, check tablet charged
- **Hàng tháng:** Review báo cáo, adjust thresholds nếu cần
- **Khi thay đổi WiFi:** Cập nhật IP trong config
