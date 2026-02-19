// ═══════════════════════════════════════════════════════════════
// LOADING STATE TEMPLATES
// Skeleton loaders and spinners
// ═══════════════════════════════════════════════════════════════

import { html, type TemplateResult } from 'lit';

// ─────────────────────────────────────────────────────────────
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────

export function skeletonText(
  width: 'short' | 'medium' | 'long' | string = 'medium'
): TemplateResult {
  const widthClass = ['short', 'medium', 'long'].includes(width)
    ? `skeleton-text-${width}`
    : '';
  const style = widthClass ? '' : `width: ${width}`;

  return html`
    <div
      class="skeleton skeleton-text ${widthClass}"
      style=${style}
    ></div>
  `;
}

export function skeletonCircle(size: number = 40): TemplateResult {
  return html`
    <div
      class="skeleton skeleton-circle"
      style="width: ${size}px; height: ${size}px"
    ></div>
  `;
}

export function skeletonRect(
  width: string = '100%',
  height: string = '100px'
): TemplateResult {
  return html`
    <div
      class="skeleton"
      style="width: ${width}; height: ${height}; border-radius: var(--radius-md, 8px)"
    ></div>
  `;
}

// ─────────────────────────────────────────────────────────────
// SKELETON PATTERNS
// ─────────────────────────────────────────────────────────────

export function skeletonSessionCard(): TemplateResult {
  return html`
    <div class="skeleton-card-wrapper" style="display: flex; gap: 12px; align-items: center;">
      ${skeletonCircle(44)}
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
        ${skeletonText('60%')}
        ${skeletonText('80%')}
      </div>
    </div>
  `;
}

export function skeletonConnectionCard(): TemplateResult {
  return html`
    <div class="skeleton-card-wrapper" style="display: flex; gap: 16px; align-items: center;">
      ${skeletonRect('48px', '48px')}
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
        ${skeletonText('short')}
        ${skeletonText('medium')}
      </div>
      ${skeletonCircle(8)}
    </div>
  `;
}

export function skeletonStatCard(): TemplateResult {
  return html`
    <div class="skeleton-card-wrapper" style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between;">
        ${skeletonRect('40px', '40px')}
        ${skeletonText('40px')}
      </div>
      ${skeletonText('short')}
      ${skeletonText('medium')}
    </div>
  `;
}

export function skeletonActivityItem(): TemplateResult {
  return html`
    <div style="display: flex; gap: 12px; padding: 12px 0;">
      ${skeletonRect('36px', '36px')}
      <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
        ${skeletonText('short')}
        ${skeletonText('long')}
      </div>
      ${skeletonText('50px')}
    </div>
  `;
}

export function skeletonLogEntry(): TemplateResult {
  return html`
    <div style="display: flex; gap: 8px; padding: 8px 0; align-items: flex-start;">
      ${skeletonText('70px')}
      ${skeletonCircle(6)}
      <div style="flex: 1;">
        ${skeletonText('long')}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────

export function spinner(size: 'sm' | 'md' | 'lg' = 'md'): TemplateResult {
  return html`<div class="spinner spinner-${size}"></div>`;
}

// ─────────────────────────────────────────────────────────────
// LOADING OVERLAY
// ─────────────────────────────────────────────────────────────

export function loadingOverlay(message?: string): TemplateResult {
  return html`
    <div class="loading-overlay">
      <div class="loading-overlay-content">
        ${spinner('lg')}
        ${message ? html`
          <span class="loading-overlay-text">${message}</span>
        ` : ''}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// LOADING STATES FOR SECTIONS
// ─────────────────────────────────────────────────────────────

export function loadingSessionsList(count: number = 5): TemplateResult {
  return html`
    <div class="stagger-children" style="display: flex; flex-direction: column; gap: 12px;">
      ${Array.from({ length: count }, () => skeletonSessionCard())}
    </div>
  `;
}

export function loadingConnectionsList(count: number = 4): TemplateResult {
  return html`
    <div class="stagger-cards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
      ${Array.from({ length: count }, () => skeletonConnectionCard())}
    </div>
  `;
}

export function loadingStatCards(count: number = 4): TemplateResult {
  return html`
    <div class="stagger-cards" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
      ${Array.from({ length: count }, () => skeletonStatCard())}
    </div>
  `;
}

export function loadingActivityList(count: number = 6): TemplateResult {
  return html`
    <div class="stagger-children" style="display: flex; flex-direction: column;">
      ${Array.from({ length: count }, () => skeletonActivityItem())}
    </div>
  `;
}

export function loadingLogsList(count: number = 10): TemplateResult {
  return html`
    <div class="stagger-fast" style="display: flex; flex-direction: column;">
      ${Array.from({ length: count }, () => skeletonLogEntry())}
    </div>
  `;
}
