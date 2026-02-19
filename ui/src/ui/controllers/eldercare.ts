import type { GatewayBrowserClient } from "../gateway";

// ── Types ────────────────────────────────────────────

export type AlertLevel = "normal" | "attention" | "warning" | "emergency";

export type EldercareCheck = {
  timestamp: string;
  level: AlertLevel;
  details?: string;
};

export type EldercareSosEvent = {
  timestamp: string;
  source: string;
  escalationLevel: number;
  resolved: boolean;
  resolvedBy?: string;
  responseMinutes?: number;
};

export type EldercareCall = {
  timestamp: string;
  caller: string;
  duration?: string;
};

export type EldercareRoomData = {
  temperature: number | null;
  humidity: number | null;
  motionMinutes: number | null;
  presence: boolean | null;
};

export type EldercareDailySummary = {
  checksToday: number;
  alertsToday: number;
  highestLevel: AlertLevel;
  callsToday: EldercareCall[];
  musicPlayed: number;
  remindersDelivered: number;
  storyActive: boolean;
  sosEvents: EldercareSosEvent[];
  lastReport: string | null;
  lastReportDate: string | null;
};

// ── State shape (added to app.ts) ───────────────────

export type EldercareState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  eldercareLoading: boolean;
  eldercareError: string | null;
  eldercareHaConnected: boolean;
  eldercareRoom: EldercareRoomData;
  eldercareSummary: EldercareDailySummary;
  eldercareLastCheck: EldercareCheck | null;
  eldercareSosActive: boolean;
};

const EMPTY_SUMMARY: EldercareDailySummary = {
  checksToday: 0,
  alertsToday: 0,
  highestLevel: "normal",
  callsToday: [],
  musicPlayed: 0,
  remindersDelivered: 0,
  storyActive: false,
  sosEvents: [],
  lastReport: null,
  lastReportDate: null,
};

const EMPTY_ROOM: EldercareRoomData = {
  temperature: null,
  humidity: null,
  motionMinutes: null,
  presence: null,
};

// ── Loader ──────────────────────────────────────────

export async function loadEldercare(state: EldercareState) {
  if (!state.client || !state.connected) return;
  if (state.eldercareLoading) return;
  state.eldercareLoading = true;
  state.eldercareError = null;
  try {
    // Fetch eldercare memory entries
    const memRes = (await state.client.request("memory.search", {
      query: "eldercare_",
      limit: 200,
    })) as Array<{ id: string; content: string; metadata?: Record<string, unknown> }> | undefined;

    const facts = Array.isArray(memRes) ? memRes : [];
    const today = new Date().toISOString().slice(0, 10);

    // Parse monitoring checks
    const checks: EldercareCheck[] = [];
    const calls: EldercareCall[] = [];
    const sosEvents: EldercareSosEvent[] = [];
    let musicPlayed = 0;
    let remindersDelivered = 0;
    let storyActive = false;
    let sosActive = false;
    let lastReport: string | null = null;
    let lastReportDate: string | null = null;

    for (const fact of facts) {
      const content = fact.content;
      try {
        // Check entries
        if (fact.id?.startsWith("eldercare_check_") && content.includes(today)) {
          const data = JSON.parse(content);
          checks.push({
            timestamp: data.timestamp ?? fact.id,
            level: data.level ?? "normal",
            details: data.details,
          });
        }
        // SOS
        if (fact.id === "eldercare_sos_active") {
          const data = JSON.parse(content);
          sosActive = data.resolved === false;
          if (content.includes(today)) {
            sosEvents.push({
              timestamp: data.timestamp ?? "",
              source: data.source ?? "unknown",
              escalationLevel: data.escalation_level ?? 1,
              resolved: data.resolved ?? false,
              resolvedBy: data.resolved_by,
              responseMinutes: data.response_minutes,
            });
          }
        }
        // Calls
        if (fact.id?.startsWith("eldercare_call_") && content.includes(today)) {
          const data = JSON.parse(content);
          calls.push({
            timestamp: data.timestamp ?? fact.id,
            caller: data.caller ?? data.family_member ?? "unknown",
            duration: data.duration,
          });
        }
        // Music
        if (fact.id?.startsWith("eldercare_music_played_") && content.includes(today)) {
          musicPlayed++;
        }
        // Reminders
        if (fact.id?.startsWith("eldercare_reminder_") && content.includes(today)) {
          remindersDelivered++;
        }
        // Story bookmark
        if (fact.id === "eldercare_story_bookmark") {
          storyActive = true;
        }
        // Daily report
        if (fact.id?.startsWith("eldercare_daily_report_")) {
          const data = JSON.parse(content);
          if (!lastReportDate || fact.id > `eldercare_daily_report_${lastReportDate}`) {
            lastReport = data.report ?? content;
            lastReportDate = fact.id.replace("eldercare_daily_report_", "");
          }
        }
      } catch {
        // Skip unparseable entries
      }
    }

    const alertChecks = checks.filter((c) => c.level !== "normal");
    const levelOrder: AlertLevel[] = ["normal", "attention", "warning", "emergency"];
    const highestLevel = checks.reduce<AlertLevel>((max, c) => {
      return levelOrder.indexOf(c.level) > levelOrder.indexOf(max) ? c.level : max;
    }, "normal");

    state.eldercareSummary = {
      checksToday: checks.length,
      alertsToday: alertChecks.length,
      highestLevel,
      callsToday: calls,
      musicPlayed,
      remindersDelivered,
      storyActive,
      sosEvents,
      lastReport,
      lastReportDate,
    };
    state.eldercareLastCheck = checks.length > 0 ? checks[checks.length - 1] : null;
    state.eldercareSosActive = sosActive;

    // Try to fetch room sensor data from HA via tool call
    try {
      const haRes = (await state.client.request("tools.call", {
        tool: "home_assistant",
        input: {
          action: "get_states",
          entity_ids: [
            "sensor.grandma_room_temperature",
            "sensor.grandma_room_humidity",
            "sensor.grandma_room_motion_minutes",
            "binary_sensor.grandma_room_presence",
          ],
        },
      })) as Array<{ entity_id: string; state: string }> | undefined;

      if (Array.isArray(haRes)) {
        const room: EldercareRoomData = { ...EMPTY_ROOM };
        for (const entity of haRes) {
          switch (entity.entity_id) {
            case "sensor.grandma_room_temperature":
              room.temperature = parseFloat(entity.state) || null;
              break;
            case "sensor.grandma_room_humidity":
              room.humidity = parseFloat(entity.state) || null;
              break;
            case "sensor.grandma_room_motion_minutes":
              room.motionMinutes = parseFloat(entity.state) || null;
              break;
            case "binary_sensor.grandma_room_presence":
              room.presence = entity.state === "on";
              break;
          }
        }
        state.eldercareRoom = room;
        state.eldercareHaConnected = true;
      }
    } catch {
      state.eldercareHaConnected = false;
      state.eldercareRoom = { ...EMPTY_ROOM };
    }
  } catch (err) {
    state.eldercareError = String(err);
    state.eldercareSummary = { ...EMPTY_SUMMARY };
    state.eldercareRoom = { ...EMPTY_ROOM };
  } finally {
    state.eldercareLoading = false;
  }
}

export { EMPTY_SUMMARY, EMPTY_ROOM };
