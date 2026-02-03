import type { GatewayBrowserClient } from "../gateway";
import type { PresenceEntry } from "../types";
import { t } from "../i18n";

export type PresenceState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  presenceLoading: boolean;
  presenceEntries: PresenceEntry[];
  presenceError: string | null;
  presenceStatus: string | null;
};

export async function loadPresence(state: PresenceState) {
  if (!state.client || !state.connected) return;
  if (state.presenceLoading) return;
  state.presenceLoading = true;
  state.presenceError = null;
  state.presenceStatus = null;
  try {
    const res = (await state.client.request("system-presence", {})) as PresenceEntry[] | undefined;
    if (Array.isArray(res)) {
      state.presenceEntries = res;
      state.presenceStatus = res.length === 0 ? t().controllers.noPresenceYet : null;
    } else {
      state.presenceEntries = [];
      state.presenceStatus = t().controllers.noPresenceData;
    }
  } catch (err) {
    state.presenceError = String(err);
  } finally {
    state.presenceLoading = false;
  }
}
