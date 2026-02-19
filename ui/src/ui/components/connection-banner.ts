// ═══════════════════════════════════════════════════════════════
// CONNECTION BANNER
// Shows connection status at top of page
// ═══════════════════════════════════════════════════════════════

import { html, type TemplateResult } from 'lit';
import { type ConnectionState } from '../connection/connection-manager.js';
import { icons } from '../icons.js';

export function renderConnectionBanner(
  state: ConnectionState,
  onRetry: () => void,
  onShowGuide: () => void
): TemplateResult | null {
  // Don't show banner when connected
  if (state.status === 'connected') {
    return null;
  }

  const bannerClass = state.status === 'connecting' ? 'warning' : 'error';

  return html`
    <div class="connection-banner ${bannerClass}">
      <div class="connection-banner-content">
        ${state.status === 'connecting' ? html`
          <div class="spinner spinner-sm"></div>
          <span>Đang kết nối tới Gateway...</span>
          ${state.retryCount > 0 ? html`
            <span class="connection-retry-info">
              (Lần thử ${state.retryCount}/5)
            </span>
          ` : ''}
        ` : html`
          ${icons.wifiOff}
          <span class="connection-error-text">
            ${state.lastError || 'Mất kết nối Gateway'}
          </span>
        `}
      </div>

      <div class="connection-banner-actions">
        ${state.status !== 'connecting' ? html`
          <button class="connection-btn-retry" @click=${onRetry}>
            ${icons.refreshCw}
            Kết nối lại
          </button>
          <button class="connection-btn-guide" @click=${onShowGuide}>
            ${icons.helpCircle}
            Hướng dẫn
          </button>
        ` : state.nextRetryIn ? html`
          <span class="connection-countdown">
            Thử lại sau ${Math.ceil(state.nextRetryIn / 1000)}s
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderSidebarConnectionStatus(
  state: ConnectionState,
  onRetry: () => void,
  onShowGuide: () => void
): TemplateResult {
  const statusText = {
    connected: 'Đã kết nối',
    connecting: 'Đang kết nối...',
    disconnected: 'Mất kết nối',
    error: 'Lỗi kết nối',
  }[state.status];

  return html`
    <div
      class="sidebar-connection-status ${state.status}"
      @click=${state.status !== 'connected' ? onShowGuide : undefined}
      title=${state.lastError || statusText}
    >
      <div class="sidebar-connection-dot"></div>
      <span class="sidebar-connection-text">${statusText}</span>
      ${state.status !== 'connected' && state.status !== 'connecting' ? html`
        <span class="sidebar-connection-action" @click=${(e: Event) => { e.stopPropagation(); onRetry(); }}>
          Thử lại
        </span>
      ` : ''}
    </div>
  `;
}
