import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { DiscordStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import { t } from "../i18n";

export function renderDiscordCard(params: {
  props: ChannelsProps;
  discord?: DiscordStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, discord, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">Discord</div>
      <div class="card-sub">${t().channelsView.discordDesc}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t().channelsView.configured}</span>
          <span>${discord?.configured ? t().common.yes : t().common.no}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.running}</span>
          <span>${discord?.running ? t().common.yes : t().common.no}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastStart}</span>
          <span>${discord?.lastStartAt ? formatAgo(discord.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastProbe}</span>
          <span>${discord?.lastProbeAt ? formatAgo(discord.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        discord?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${discord.lastError}
          </div>`
          : nothing
      }

      ${
        discord?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t().channelsView.probe} ${discord.probe.ok ? t().channelsView.probeOk : t().channelsView.probeFailed} ·
            ${discord.probe.status ?? ""} ${discord.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({ channelId: "discord", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${t().channelsView.probe}
        </button>
      </div>
    </div>
  `;
}
