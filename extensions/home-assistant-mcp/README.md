# Home Assistant MCP Extension

Connects OpenClaw gateway to Home Assistant for the eldercare monitoring project.

## Setup

1. Install Home Assistant on Raspberry Pi (or any host)
2. Create Long-lived Access Token: Profile > Security > Long-lived tokens
3. Add environment variables:
   ```bash
   HA_URL=http://100.x.x.x:8123       # Tailscale IP or local
   HA_TOKEN=eyJhbGciOiJIUzI1NiIs...    # HA long-lived access token
   HA_CACHE_TTL=60000                  # Cache TTL in ms (default 60000)
   ```
4. Restart gateway

## Agent Tool: `home_assistant`

Skills can use the `home_assistant` tool with these actions:

| Action | Params | Description |
|--------|--------|-------------|
| `get_state` | `entity_id` | Read state of a sensor/device |
| `get_states` | — | List all entity states |
| `call_service` | `domain`, `service`, `service_data`, `target_entity_id` | Control a device |
| `get_history` | `entity_id`, `start_time`, `end_time` | Query state history |
| `fire_event` | `event_type`, `event_data` | Fire a HA event |
| `check_connection` | — | Health check |

## Key Entities (Eldercare)

| Entity ID | Purpose |
|-----------|---------|
| `binary_sensor.grandma_room_presence` | mmWave presence detection |
| `sensor.grandma_room_motion_minutes` | Minutes since last motion |
| `sensor.grandma_room_temperature` | Room temperature (C) |
| `sensor.grandma_room_humidity` | Room humidity (%) |
| `binary_sensor.grandma_room_camera_motion` | Camera motion detection |
| `light.grandma_room` | Room light |
| `media_player.grandma_room` | Room speaker |
| `sensor.sos_button_action` | SOS button (single/double/long) |

## Architecture

```
OpenClaw Gateway
  |
  +-- home-assistant-mcp extension
  |     |-- HAClient (REST API)
  |     |-- HAEntityCache (in-memory, 60s TTL)
  |     +-- HAEventListener (WebSocket, state_changed)
  |
  +-- Agent tool "home_assistant"
        |-- Skills call this tool to interact with HA
        +-- Responses in JSON format
```

## Graceful Failure

- Missing `HA_URL` or `HA_TOKEN`: Extension skips, gateway runs normally
- HA unreachable: Extension disabled, gateway runs normally
- WebSocket disconnected: Auto-reconnect with exponential backoff (5s..300s, max 10 attempts)
- REST API timeout: 10s timeout, 1 automatic retry
