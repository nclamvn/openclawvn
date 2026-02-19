import { html, nothing, type TemplateResult } from "lit";
import { t } from "../i18n";

export type TerminalOutputProps = {
  lines: string[];
  autoScroll?: boolean;
  maxLines?: number;
  loading?: boolean;
  onCopy?: () => void;
};

/**
 * Renders a terminal-style output panel with monospace text.
 * Supports ANSI color stripping and auto-scroll.
 */
export function renderTerminalOutput(props: TerminalOutputProps): TemplateResult {
  const { lines, loading = false, onCopy } = props;
  const maxLines = props.maxLines ?? 1000;
  const displayLines = lines.length > maxLines ? lines.slice(-maxLines) : lines;

  return html`
    <div class="terminal-output" role="region" aria-label="${t().deploy.log.title}">
      <div class="terminal-output__header">
        <span class="terminal-output__title">${t().deploy.log.title}</span>
        <div class="terminal-output__actions">
          ${onCopy
            ? html`<button class="btn btn--sm" @click=${onCopy} aria-label="${t().deploy.log.copy}">${t().deploy.log.copy}</button>`
            : nothing}
        </div>
      </div>
      <div class="terminal-output__body" role="log" aria-live="polite">
        ${displayLines.length === 0 && !loading
          ? html`<div class="terminal-output__empty muted">${t().deploy.log.empty}</div>`
          : nothing}
        ${displayLines.map(
          (line) => html`<div class="terminal-output__line">${stripAnsi(line)}</div>`,
        )}
        ${loading
          ? html`<div class="terminal-output__line terminal-output__line--loading">
              <span class="spinner spinner-sm" role="status" aria-label="${t().common.loading}"></span>
            </div>`
          : nothing}
      </div>
    </div>
  `;
}

/** Strip basic ANSI escape codes for display. */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
