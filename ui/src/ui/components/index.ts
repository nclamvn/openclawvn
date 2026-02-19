// ═══════════════════════════════════════════════════════════════
// STATE COMPONENTS
// Re-export all state templates for easy importing
// ═══════════════════════════════════════════════════════════════

export {
  renderEmptyState,
  emptyStates,
  type EmptyStateConfig,
} from './empty-states.js';

export {
  renderErrorState,
  renderInlineError,
  errorStates,
  type ErrorStateConfig,
} from './error-states.js';

export {
  // Skeleton primitives
  skeletonText,
  skeletonCircle,
  skeletonRect,
  // Skeleton patterns
  skeletonSessionCard,
  skeletonConnectionCard,
  skeletonStatCard,
  skeletonActivityItem,
  skeletonLogEntry,
  // Spinner
  spinner,
  // Loading overlay
  loadingOverlay,
  // Section loaders
  loadingSessionsList,
  loadingConnectionsList,
  loadingStatCards,
  loadingActivityList,
  loadingLogsList,
} from './loading-states.js';
