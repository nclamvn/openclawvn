/**
 * Home Assistant MCP Extension — Type Definitions
 * Eldercare: Eldercare monitoring integration
 */

export interface HAConfig {
  url: string;
  token: string;
  cacheTtlMs: number;
}

export interface HAEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HAServiceCall {
  domain: string;
  service: string;
  data?: Record<string, unknown>;
  target?: {
    entity_id?: string | string[];
    area_id?: string | string[];
  };
}

export interface HAEvent {
  event_type: string;
  data: Record<string, unknown>;
  origin: string;
  time_fired: string;
}

export interface HAWebSocketMessage {
  id?: number;
  type: string;
  [key: string]: unknown;
}

export type AlertLevel = "normal" | "attention" | "warning" | "emergency";
