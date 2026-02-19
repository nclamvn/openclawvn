// ═══════════════════════════════════════════════════════════════
// SETUP GUIDE MODAL
// Step-by-step connection guide for new users
// ═══════════════════════════════════════════════════════════════

import { html, type TemplateResult } from 'lit';
import { icons } from '../icons.js';

export interface SetupGuideState {
  isOpen: boolean;
  currentStep: number;
  gatewayRunning: boolean;
  checkingGateway: boolean;
  copiedCommand: string | null;
}

const STEPS = [
  {
    title: 'Kiểm tra Gateway',
    description: 'Gateway là server điều khiển. Đảm bảo nó đang chạy.',
  },
  {
    title: 'Khởi động Gateway',
    description: 'Nếu Gateway chưa chạy, mở Terminal và chạy lệnh.',
  },
  {
    title: 'Kết nối',
    description: 'Sau khi Gateway chạy, nhấn nút kết nối.',
  },
];

export function createSetupGuideState(): SetupGuideState {
  return {
    isOpen: false,
    currentStep: 0,
    gatewayRunning: false,
    checkingGateway: false,
    copiedCommand: null,
  };
}

export function renderSetupGuide(
  state: SetupGuideState,
  handlers: {
    onClose: () => void;
    onCheckGateway: () => void;
    onConnect: () => void;
    onNextStep: () => void;
    onPrevStep: () => void;
    onCopyCommand: (cmd: string) => void;
  }
): TemplateResult | null {
  if (!state.isOpen) {
    return null;
  }

  return html`
    <div class="modal-overlay" @click=${handlers.onClose}>
      <div class="setup-guide-modal" @click=${(e: Event) => e.stopPropagation()}>
        <!-- Header -->
        <div class="setup-guide-header">
          <div class="setup-guide-title">
            ${icons.rocket}
            <span>Hướng dẫn kết nối nhanh</span>
          </div>
          <button class="setup-guide-close" @click=${handlers.onClose}>
            ${icons.x}
          </button>
        </div>

        <!-- Progress -->
        <div class="setup-guide-progress">
          ${STEPS.map((step, idx) => html`
            <div class="progress-step ${idx === state.currentStep ? 'active' : ''} ${idx < state.currentStep ? 'completed' : ''}">
              <div class="progress-step-number">
                ${idx < state.currentStep ? icons.check : idx + 1}
              </div>
              <span class="progress-step-label">${step.title}</span>
            </div>
            ${idx < STEPS.length - 1 ? html`<div class="progress-line ${idx < state.currentStep ? 'completed' : ''}"></div>` : ''}
          `)}
        </div>

        <!-- Content -->
        <div class="setup-guide-content">
          ${state.currentStep === 0 ? renderStep1(state, handlers) : ''}
          ${state.currentStep === 1 ? renderStep2(state, handlers) : ''}
          ${state.currentStep === 2 ? renderStep3(state, handlers) : ''}
        </div>

        <!-- Footer -->
        <div class="setup-guide-footer">
          ${state.currentStep > 0 ? html`
            <button class="setup-btn-secondary" @click=${handlers.onPrevStep}>
              ${icons.arrowLeft}
              Quay lại
            </button>
          ` : html`<div></div>`}

          ${state.currentStep < STEPS.length - 1 ? html`
            <button class="setup-btn-primary" @click=${handlers.onNextStep}>
              Tiếp theo
              ${icons.arrowRight}
            </button>
          ` : html`
            <button class="setup-btn-primary" @click=${handlers.onConnect}>
              ${icons.plug}
              Kết nối ngay
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// STEP RENDERS
// ─────────────────────────────────────────────────────────────

function renderStep1(
  state: SetupGuideState,
  handlers: { onCheckGateway: () => void }
): TemplateResult {
  return html`
    <div class="step-content animate-fade-in-up">
      <div class="step-icon">
        ${icons.server}
      </div>

      <h3 class="step-title">Kiểm tra Gateway đang chạy</h3>

      <p class="step-description">
        Gateway là trung tâm điều khiển của Moltbot. UI cần kết nối tới Gateway để hoạt động.
      </p>

      <div class="check-gateway-box">
        <div class="check-gateway-status">
          ${state.checkingGateway ? html`
            <div class="spinner"></div>
            <span>Đang kiểm tra...</span>
          ` : state.gatewayRunning ? html`
            <span class="status-success">
              ${icons.checkCircle}
              Gateway đang chạy!
            </span>
          ` : html`
            <span class="status-error">
              ${icons.xCircle}
              Gateway chưa chạy
            </span>
          `}
        </div>

        <button
          class="check-gateway-btn"
          @click=${handlers.onCheckGateway}
          ?disabled=${state.checkingGateway}
        >
          ${icons.refreshCw}
          Kiểm tra lại
        </button>
      </div>

      <div class="step-info">
        <div class="info-icon">${icons.info}</div>
        <p>
          Gateway mặc định chạy tại <code>ws://127.0.0.1:18789</code>
        </p>
      </div>
    </div>
  `;
}

function renderStep2(
  state: SetupGuideState,
  handlers: { onCopyCommand: (cmd: string) => void }
): TemplateResult {
  const commands = [
    { label: 'macOS / Linux', cmd: 'openclaw gateway' },
    { label: 'Hoặc dùng npm', cmd: 'npx openclaw gateway' },
  ];

  return html`
    <div class="step-content animate-fade-in-up">
      <div class="step-icon">
        ${icons.terminal}
      </div>

      <h3 class="step-title">Khởi động Gateway</h3>

      <p class="step-description">
        Mở Terminal và chạy một trong các lệnh sau để khởi động Gateway:
      </p>

      <div class="command-list">
        ${commands.map(({ label, cmd }) => html`
          <div class="command-item">
            <span class="command-label">${label}</span>
            <div class="command-box">
              <code class="command-text">${cmd}</code>
              <button
                class="command-copy ${state.copiedCommand === cmd ? 'copied' : ''}"
                @click=${() => handlers.onCopyCommand(cmd)}
                title="Copy"
              >
                ${state.copiedCommand === cmd ? icons.check : icons.copy}
              </button>
            </div>
          </div>
        `)}
      </div>

      <div class="step-info success">
        <div class="info-icon">${icons.lightbulb}</div>
        <p>
          <strong>Mẹo:</strong> Để Gateway tự động chạy khi khởi động máy,
          chạy <code>openclaw onboard --install-daemon</code>
        </p>
      </div>
    </div>
  `;
}

function renderStep3(
  state: SetupGuideState,
  handlers: { onConnect: () => void; onCheckGateway: () => void }
): TemplateResult {
  return html`
    <div class="step-content animate-fade-in-up">
      <div class="step-icon success">
        ${icons.checkCircle}
      </div>

      <h3 class="step-title">Sẵn sàng kết nối!</h3>

      <p class="step-description">
        Nếu Gateway đã chạy, nhấn nút bên dưới để kết nối.
      </p>

      <div class="connect-box">
        <div class="connect-status">
          ${state.gatewayRunning ? html`
            <span class="status-success">
              ${icons.checkCircle}
              Gateway sẵn sàng
            </span>
          ` : html`
            <span class="status-warning">
              ${icons.alertTriangle}
              Chưa phát hiện Gateway
            </span>
            <button class="recheck-btn" @click=${handlers.onCheckGateway}>
              Kiểm tra lại
            </button>
          `}
        </div>
      </div>

      <div class="step-info">
        <div class="info-icon">${icons.info}</div>
        <p>
          Sau khi kết nối, bạn có thể bắt đầu chat với AI qua Zalo, Facebook, Telegram và nhiều kênh khác.
        </p>
      </div>
    </div>
  `;
}
