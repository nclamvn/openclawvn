import { html, render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { renderSplitView, type SplitViewProps } from "./split-view";

function createProps(overrides: Partial<SplitViewProps> = {}): SplitViewProps {
  return {
    leftPane: html`<div class="test-left">Left</div>`,
    rightPane: html`<div class="test-right">Right</div>`,
    splitRatio: 0.5,
    focusedPane: "left",
    onResize: vi.fn(),
    onPaneFocus: vi.fn(),
    ...overrides,
  };
}

function renderToContainer(props: SplitViewProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderSplitView(props), container);
  return container;
}

describe("split-view component", () => {
  it("renders two panes", () => {
    const container = renderToContainer(createProps());
    const panes = container.querySelectorAll(".split-view__pane");
    expect(panes.length).toBe(2);
    expect(container.querySelector(".test-left")).not.toBeNull();
    expect(container.querySelector(".test-right")).not.toBeNull();
  });

  it("includes resizable-divider", () => {
    const container = renderToContainer(createProps());
    const divider = container.querySelector("resizable-divider");
    expect(divider).not.toBeNull();
  });

  it("focused pane has .split-view__pane--focused class (left)", () => {
    const container = renderToContainer(createProps({ focusedPane: "left" }));
    const left = container.querySelector(".split-view__pane--left");
    const right = container.querySelector(".split-view__pane--right");
    expect(left?.classList.contains("split-view__pane--focused")).toBe(true);
    expect(right?.classList.contains("split-view__pane--focused")).toBe(false);
  });

  it("focused pane has .split-view__pane--focused class (right)", () => {
    const container = renderToContainer(createProps({ focusedPane: "right" }));
    const left = container.querySelector(".split-view__pane--left");
    const right = container.querySelector(".split-view__pane--right");
    expect(left?.classList.contains("split-view__pane--focused")).toBe(false);
    expect(right?.classList.contains("split-view__pane--focused")).toBe(true);
  });

  it("click on left pane calls onPaneFocus('left')", () => {
    const onPaneFocus = vi.fn();
    const container = renderToContainer(createProps({ focusedPane: "right", onPaneFocus }));
    const left = container.querySelector(".split-view__pane--left") as HTMLElement;
    left.click();
    expect(onPaneFocus).toHaveBeenCalledWith("left");
  });

  it("click on right pane calls onPaneFocus('right')", () => {
    const onPaneFocus = vi.fn();
    const container = renderToContainer(createProps({ focusedPane: "left", onPaneFocus }));
    const right = container.querySelector(".split-view__pane--right") as HTMLElement;
    right.click();
    expect(onPaneFocus).toHaveBeenCalledWith("right");
  });

  it("pane widths reflect splitRatio", () => {
    const container = renderToContainer(createProps({ splitRatio: 0.4 }));
    const left = container.querySelector(".split-view__pane--left") as HTMLElement;
    const right = container.querySelector(".split-view__pane--right") as HTMLElement;
    expect(left.style.flex).toContain("40%");
    expect(right.style.flex).toContain("60%");
  });

  it("clamps splitRatio to 0.3–0.7 range", () => {
    // Below min
    const c1 = renderToContainer(createProps({ splitRatio: 0.1 }));
    const left1 = c1.querySelector(".split-view__pane--left") as HTMLElement;
    expect(left1.style.flex).toContain("30%");

    // Above max
    const c2 = renderToContainer(createProps({ splitRatio: 0.9 }));
    const left2 = c2.querySelector(".split-view__pane--left") as HTMLElement;
    expect(left2.style.flex).toContain("70%");
  });
});
