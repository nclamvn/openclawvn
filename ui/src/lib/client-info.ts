// Gateway client identifiers and types
// Extracted from openclaw for standalone operation

export const GATEWAY_CLIENT_NAMES = {
  WEB: "web",
  CONTROL_UI: "control-ui",
  MOBILE_IOS: "mobile-ios",
  MOBILE_ANDROID: "mobile-android",
  DESKTOP_MAC: "desktop-mac",
  DESKTOP_WINDOWS: "desktop-windows",
  CLI: "cli",
} as const;

export type GatewayClientName = (typeof GATEWAY_CLIENT_NAMES)[keyof typeof GATEWAY_CLIENT_NAMES];

export const GATEWAY_CLIENT_MODES = {
  WEBCHAT: "webchat",
  CONTROL: "control",
  GATEWAY: "gateway",
} as const;

export type GatewayClientMode = (typeof GATEWAY_CLIENT_MODES)[keyof typeof GATEWAY_CLIENT_MODES];

export interface GatewayClientInfo {
  clientId: GatewayClientName;
  clientVersion?: string;
  deviceId?: string;
  platform?: string;
  osVersion?: string;
  appBuild?: string;
  mode?: GatewayClientMode;
}

export function isValidClientName(name: string): name is GatewayClientName {
  return Object.values(GATEWAY_CLIENT_NAMES).includes(name as GatewayClientName);
}
