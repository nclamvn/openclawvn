import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { SignalStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import { t } from "../i18n";

export function renderSignalCard(params: {
  props: ChannelsProps;
  signal?: SignalStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, signal, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">Signal</div>
      <div class="card-sub">${t().channelsView.signalDesc}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t().channelsView.configured}</span>
          <span>${signal?.configured ? t().common.yes : t().common.no}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.running}</span>
          <span>${signal?.running ? t().common.yes : t().common.no}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.baseUrl}</span>
          <span>${signal?.baseUrl ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastStart}</span>
          <span>${signal?.lastStartAt ? formatAgo(signal.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t().channelsView.lastProbe}</span>
          <span>${signal?.lastProbeAt ? formatAgo(signal.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        signal?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${signal.lastError}
          </div>`
          : nothing
      }

      ${
        signal?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t().channelsView.probe} ${signal.probe.ok ? t().channelsView.probeOk : t().channelsView.probeFailed} ·
            ${signal.probe.status ?? ""} ${signal.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({ channelId: "signal", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${t().channelsView.probe}
        </button>
      </div>
    </div>
  `;
}
