import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { SlackStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import { t } from "../i18n";

export function renderSlackCard(params: {
  props: ChannelsProps;
  slack?: SlackStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, slack, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">Slack</div>
      <div class="card-sub">${t().channelsView.slackDesc}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t().channelsView.configured}</span>
          <span>${slack?.configured ? t().common.yes : t().common.no}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.running}</span>
          <span>${slack?.running ? t().common.yes : t().common.no}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastStart}</span>
          <span>${slack?.lastStartAt ? formatAgo(slack.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastProbe}</span>
          <span>${slack?.lastProbeAt ? formatAgo(slack.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        slack?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${slack.lastError}
          </div>`
          : nothing
      }

      ${
        slack?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t().channelsView.probe} ${slack.probe.ok ? t().channelsView.probeOk : t().channelsView.probeFailed} ·
            ${slack.probe.status ?? ""} ${slack.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({ channelId: "slack", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${t().channelsView.probe}
        </button>
      </div>
    </div>
  `;
}
