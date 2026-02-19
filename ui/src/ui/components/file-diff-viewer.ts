import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";

export type DiffLine = {
  type: "add" | "remove" | "context";
  lineOld?: number;
  lineNew?: number;
  content: string;
};

export type FileDiffProps = {
  filename: string;
  lines: DiffLine[];
  mode?: "inline" | "split";
};

/**
 * Renders a file diff viewer with line numbers and color-coded changes.
 */
export function renderFileDiff(props: FileDiffProps): TemplateResult {
  const { filename, lines } = props;

  if (lines.length === 0) {
    return html`
      <div class="diff-viewer">
        <div class="diff-viewer__header">${filename}</div>
        <div class="diff-viewer__empty muted">${t().deploy.empty}</div>
      </div>
    `;
  }

  return html`
    <div class="diff-viewer">
      <div class="diff-viewer__header">${filename}</div>
      <div class="diff-viewer__body">
        ${lines.map(
          (line) => html`
            <div class="diff-line diff-line--${line.type}">
              <span class="diff-line__gutter diff-line__gutter--old">${line.lineOld ?? ""}</span>
              <span class="diff-line__gutter diff-line__gutter--new">${line.lineNew ?? ""}</span>
              <span class="diff-line__marker">${line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}</span>
              <span class="diff-line__content">${line.content}</span>
            </div>
          `,
        )}
      </div>
    </div>
  `;
}
