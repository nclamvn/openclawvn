/**
 * Home Assistant MCP Extension for OpenClaw
 * Eldercare: Eldercare monitoring integration
 *
 * Bridges OpenClaw gateway with Home Assistant REST API + WebSocket,
 * enabling eldercare skills to read sensors, control devices, and
 * receive real-time state change events.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

import { HAClient } from "./ha-client.js";
import { HAEntityCache } from "./ha-entities.js";
import { HAEventListener } from "./ha-events.js";
import type { HAConfig, HAEntityState, HAEvent, HAServiceCall } from "./types.js";

// Shared instances for skills to access
let haClient: HAClient | null = null;
let haCache: HAEntityCache | null = null;
let haEvents: HAEventListener | null = null;
let extensionEnabled = false;

// Public getters for use by other modules
export function getHAClient(): HAClient | null {
  return haClient;
}
export function getHACache(): HAEntityCache | null {
  return haCache;
}
export function getHAEvents(): HAEventListener | null {
  return haEvents;
}
export function isHAEnabled(): boolean {
  return extensionEnabled;
}

/** Tool parameter schema for the HA MCP agent tool */
const HAToolSchema = {
  type: "object" as const,
  properties: {
    action: {
      type: "string" as const,
      enum: [
        "get_state",
        "get_states",
        "call_service",
        "get_history",
        "fire_event",
        "check_connection",
      ],
      description: "The Home Assistant action to perform",
    },
    entity_id: {
      type: "string" as const,
      description: "Entity ID (e.g., sensor.grandma_room_temperature)",
    },
    domain: {
      type: "string" as const,
      description: "Service domain (e.g., light, media_player, tts)",
    },
    service: {
      type: "string" as const,
      description: "Service name (e.g., turn_on, play_media)",
    },
    service_data: {
      type: "object" as const,
      description: "Service call data (e.g., { brightness: 150 })",
    },
    target_entity_id: {
      type: "string" as const,
      description: "Target entity ID for service call",
    },
    start_time: {
      type: "string" as const,
      description: "ISO timestamp for history start",
    },
    end_time: {
      type: "string" as const,
      description: "ISO timestamp for history end",
    },
    event_type: {
      type: "string" as const,
      description: "Event type to fire",
    },
    event_data: {
      type: "object" as const,
      description: "Event data payload",
    },
  },
  required: ["action"],
};

/** Execute HA tool actions */
async function executeHATool(params: Record<string, unknown>): Promise<string> {
  if (!haClient || !extensionEnabled) {
    return "Home Assistant is not connected. Check HA_URL and HA_TOKEN configuration.";
  }

  const action = params.action as string;

  try {
    switch (action) {
      case "check_connection": {
        const ok = await haClient.checkConnection();
        return ok ? "Connected to Home Assistant." : "Cannot reach Home Assistant.";
      }

      case "get_state": {
        const entityId = params.entity_id as string;
        if (!entityId) return "Error: entity_id is required for get_state";
        const state = await haCache!.get(entityId, haClient);
        return JSON.stringify(state, null, 2);
      }

      case "get_states": {
        const states = await haClient.getStates();
        // Return summary to avoid overwhelming context
        const summary = states.map((s) => ({
          entity_id: s.entity_id,
          state: s.state,
          last_changed: s.last_changed,
        }));
        return JSON.stringify(summary, null, 2);
      }

      case "call_service": {
        const domain = params.domain as string;
        const service = params.service as string;
        if (!domain || !service) return "Error: domain and service are required";
        const call: HAServiceCall = {
          domain,
          service,
          data: (params.service_data as Record<string, unknown>) ?? undefined,
          target: params.target_entity_id
            ? { entity_id: params.target_entity_id as string }
            : undefined,
        };
        await haClient.callService(call);
        return `Service ${domain}.${service} called successfully.`;
      }

      case "get_history": {
        const entityId = params.entity_id as string;
        const startTime = params.start_time as string;
        if (!entityId || !startTime) return "Error: entity_id and start_time required";
        const history = await haClient.getHistory(
          entityId,
          new Date(startTime),
          params.end_time ? new Date(params.end_time as string) : undefined,
        );
        return JSON.stringify(history, null, 2);
      }

      case "fire_event": {
        const eventType = params.event_type as string;
        if (!eventType) return "Error: event_type is required";
        await haClient.fireEvent(
          eventType,
          (params.event_data as Record<string, unknown>) ?? undefined,
        );
        return `Event ${eventType} fired.`;
      }

      default:
        return `Unknown action: ${action}`;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return `HA Error: ${msg}`;
  }
}

const plugin = {
  id: "home-assistant-mcp",
  name: "Home Assistant MCP",
  description:
    "Home Assistant integration for eldercare monitoring. " +
    "Read sensors, control devices, subscribe to events.",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    const haUrl = process.env.HA_URL;
    const haToken = process.env.HA_TOKEN;

    if (!haUrl || !haToken) {
      api.logger.warn("HA MCP: Missing HA_URL or HA_TOKEN, skipping");
      return;
    }

    const cacheTtl = parseInt(process.env.HA_CACHE_TTL ?? "60000", 10);

    const config: HAConfig = {
      url: haUrl,
      token: haToken,
      cacheTtlMs: isNaN(cacheTtl) ? 60_000 : cacheTtl,
    };

    // Initialize client, cache, and event listener
    haClient = new HAClient(config);
    haCache = new HAEntityCache(config.cacheTtlMs);
    haEvents = new HAEventListener();
    extensionEnabled = true;

    // Register agent tool so skills can call HA through the LLM
    api.registerTool({
      name: "home_assistant",
      label: "Home Assistant",
      description:
        "Control Home Assistant smart home devices. " +
        "Actions: get_state (read sensor/device), get_states (list all), " +
        "call_service (control device — light, media_player, tts, etc.), " +
        "get_history (sensor history), fire_event (trigger automation), " +
        "check_connection (health check). " +
        "Key entities for Eldercare: " +
        "binary_sensor.grandma_room_presence, sensor.grandma_room_motion_minutes, " +
        "sensor.grandma_room_temperature, sensor.grandma_room_humidity, " +
        "light.grandma_room, media_player.grandma_room, sensor.sos_button_action.",
      parameters: HAToolSchema,
      execute: executeHATool,
    });

    // Update cache when state changes arrive via WebSocket
    haEvents.on("state_changed", (event: HAEvent) => {
      const newState = (event.data as { new_state?: HAEntityState }).new_state;
      if (newState && haCache) {
        haCache.onStateChanged(newState.entity_id, newState);
      }
    });

    // Check connection and start event listener asynchronously
    (async () => {
      const connected = await haClient!.checkConnection();
      if (connected) {
        api.logger.info(`HA MCP: Connected to Home Assistant at ${haUrl}`);
        try {
          await haEvents!.connect(haUrl, haToken);
          api.logger.info("HA MCP: WebSocket event listener active");
        } catch (err) {
          api.logger.warn("HA MCP: WebSocket connection failed, REST API still available");
        }
      } else {
        api.logger.warn(`HA MCP: Cannot connect to ${haUrl}, extension disabled`);
        extensionEnabled = false;
      }
    })();

    // Register shutdown hook
    api.on("shutdown", () => {
      if (haEvents) {
        haEvents.disconnect();
      }
      extensionEnabled = false;
    });
  },
};

export default plugin;
