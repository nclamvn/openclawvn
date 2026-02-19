// ═══════════════════════════════════════════════════════════════
// ERROR STATE TEMPLATES
// Consistent error handling across all sections
// ═══════════════════════════════════════════════════════════════

import { html, type TemplateResult } from 'lit';
import { icons } from '../icons.js';

export interface ErrorStateConfig {
  title: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export function renderErrorState(config: ErrorStateConfig): TemplateResult {
  return html`
    <div class="error-state">
      <div class="error-state-icon">
        ${icons.alertCircle}
      </div>
      <h3 class="error-state-title">${config.title}</h3>
      <p class="error-state-message">${config.message}</p>

      ${config.code ? html`
        <code class="error-state-code">${config.code}</code>
      ` : ''}

      <div class="error-state-actions">
        ${config.onRetry ? html`
          <button class="error-state-retry" @click=${config.onRetry}>
            ${icons.refreshCw}
            ${config.retryLabel || 'Try Again'}
          </button>
        ` : ''}

        ${config.onSecondary ? html`
          <button class="error-state-secondary" @click=${config.onSecondary}>
            ${config.secondaryLabel || 'Get Help'}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderInlineError(message: string): TemplateResult {
  return html`
    <div class="inline-error">
      ${icons.alertCircle}
      <span>${message}</span>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// PRE-CONFIGURED ERROR STATES
// ═══════════════════════════════════════════════════════════════

export const errorStates = {
  connectionFailed: {
    title: 'Connection Failed',
    message: 'Unable to connect to the gateway. Please check if the gateway is running.',
    retryLabel: 'Reconnect',
  },

  apiFailed: {
    title: 'API Error',
    message: 'Something went wrong while communicating with the server. Please try again.',
    secondaryLabel: 'View Logs',
  },

  rateLimited: {
    title: 'Rate Limited',
    message: 'You\'ve made too many requests. Please wait a moment before trying again.',
    retryLabel: 'Retry',
  },

  authFailed: {
    title: 'Authentication Failed',
    message: 'Your session has expired or your credentials are invalid.',
    retryLabel: 'Re-authenticate',
  },

  networkError: {
    title: 'Network Error',
    message: 'Unable to reach the server. Please check your internet connection.',
    retryLabel: 'Retry',
  },

  notFound: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    secondaryLabel: 'Go Back',
  },

  serverError: {
    title: 'Server Error',
    message: 'An unexpected error occurred on the server. Our team has been notified.',
    retryLabel: 'Retry',
    secondaryLabel: 'Report Issue',
  },
};
