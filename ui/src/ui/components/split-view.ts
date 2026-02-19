import { html, type TemplateResult } from "lit";
import "../components/resizable-divider";

export type SplitViewProps = {
  leftPane: TemplateResult;
  rightPane: TemplateResult;
  splitRatio: number; // 0.3–0.7, default 0.5
  focusedPane: "left" | "right";
  onResize: (ratio: number) => void;
  onPaneFocus: (pane: "left" | "right") => void;
};

export function renderSplitView(props: SplitViewProps): TemplateResult {
  const ratio = Math.max(0.3, Math.min(0.7, props.splitRatio));
  const leftPercent = ratio * 100;
  const rightPercent = (1 - ratio) * 100;

  return html`
    <div class="split-view">
      <div
        class="split-view__pane split-view__pane--left ${props.focusedPane === "left" ? "split-view__pane--focused" : ""}"
        style="flex: 0 0 ${leftPercent}%"
        @click=${() => props.onPaneFocus("left")}
      >
        ${props.leftPane}
      </div>
      <resizable-divider
        .splitRatio=${ratio}
        .minRatio=${0.3}
        .maxRatio=${0.7}
        @resize=${(e: CustomEvent) => props.onResize(e.detail.splitRatio)}
      ></resizable-divider>
      <div
        class="split-view__pane split-view__pane--right ${props.focusedPane === "right" ? "split-view__pane--focused" : ""}"
        style="flex: 0 0 ${rightPercent}%"
        @click=${() => props.onPaneFocus("right")}
      >
        ${props.rightPane}
      </div>
    </div>
  `;
}
