import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { GoogleChatStatus } from "../types";
import { renderChannelConfigSection } from "./channels.config";
import type { ChannelsProps } from "./channels.types";
import { t } from "../i18n";

export function renderGoogleChatCard(params: {
  props: ChannelsProps;
  googleChat?: GoogleChatStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, googleChat, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">Google Chat</div>
      <div class="card-sub">${t().channelsView.googleChatDesc}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t().channelsView.configured}</span>
          <span>${googleChat ? (googleChat.configured ? t().common.yes : t().common.no) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.running}</span>
          <span>${googleChat ? (googleChat.running ? t().common.yes : t().common.no) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.credentialSource}</span>
          <span>${googleChat?.credentialSource ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.audience}</span>
          <span>
            ${
              googleChat?.audienceType
                ? `${googleChat.audienceType}${googleChat.audience ? ` · ${googleChat.audience}` : ""}`
                : "n/a"
            }
          </span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastStart}</span>
          <span>${googleChat?.lastStartAt ? formatAgo(googleChat.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastProbe}</span>
          <span>${googleChat?.lastProbeAt ? formatAgo(googleChat.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        googleChat?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${googleChat.lastError}
          </div>`
          : nothing
      }

      ${
        googleChat?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t().channelsView.probe} ${googleChat.probe.ok ? t().channelsView.probeOk : t().channelsView.probeFailed} ·
            ${googleChat.probe.status ?? ""} ${googleChat.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({ channelId: "googlechat", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${t().channelsView.probe}
        </button>
      </div>
    </div>
  `;
}
