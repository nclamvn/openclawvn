// ═══════════════════════════════════════════════════════════════
// EMPTY STATE TEMPLATES
// Consistent empty states across all sections
// ═══════════════════════════════════════════════════════════════

import { html, type TemplateResult } from 'lit';
import { icons, type IconName } from '../icons.js';

export interface EmptyStateConfig {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function renderEmptyState(config: EmptyStateConfig): TemplateResult {
  return html`
    <div class="empty-state">
      <div class="empty-state-icon">
        ${icons[config.icon]}
      </div>
      <h3 class="empty-state-title">${config.title}</h3>
      <p class="empty-state-description">${config.description}</p>

      ${config.actionLabel ? html`
        <button
          class="empty-state-action"
          @click=${config.onAction}
        >
          ${config.actionIcon ? icons[config.actionIcon] : ''}
          ${config.actionLabel}
        </button>
      ` : ''}

      ${config.secondaryLabel ? html`
        <span
          class="empty-state-link"
          @click=${config.onSecondary}
        >
          ${config.secondaryLabel}
        </span>
      ` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// PRE-CONFIGURED EMPTY STATES
// ═══════════════════════════════════════════════════════════════

export const emptyStates = {
  conversations: {
    icon: 'messageSquare' as IconName,
    title: 'No conversations yet',
    description: 'Start chatting with users from Zalo, Facebook, Telegram and more. Connect a channel to get started.',
    actionLabel: 'Connect Channel',
    actionIcon: 'plus' as IconName,
  },

  connections: {
    icon: 'plug' as IconName,
    title: 'No connections configured',
    description: 'Connect your messaging channels and AI providers to start using the assistant.',
    actionLabel: 'Add Connection',
    actionIcon: 'plus' as IconName,
  },

  activity: {
    icon: 'activity' as IconName,
    title: 'No activity yet',
    description: 'Activity will appear here once you start receiving messages and running tasks.',
  },

  scheduledTasks: {
    icon: 'clock' as IconName,
    title: 'No scheduled tasks',
    description: 'Create automated tasks that run on a schedule to handle repetitive work.',
    actionLabel: 'Create Task',
    actionIcon: 'plus' as IconName,
  },

  searchResults: {
    icon: 'search' as IconName,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
    secondaryLabel: 'Clear search',
  },

  logs: {
    icon: 'fileText' as IconName,
    title: 'No logs available',
    description: 'System logs will appear here once there\'s activity to record.',
  },

  offline: {
    icon: 'wifiOff' as IconName,
    title: 'You\'re offline',
    description: 'Check your internet connection and try again.',
    actionLabel: 'Retry',
    actionIcon: 'refreshCw' as IconName,
  },
};
