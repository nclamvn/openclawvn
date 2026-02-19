import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { t } from "../i18n";
import {
  renderAuditTimeline,
  type AuditEntry,
  type AuditTimelineProps,
} from "./audit-timeline";

function createEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    ts: Date.now() - 60_000,
    action: "auth.success",
    deviceId: "dev-1",
    ...overrides,
  };
}

function createProps(overrides: Partial<AuditTimelineProps> = {}): AuditTimelineProps {
  return {
    deviceId: "dev-1",
    entries: [createEntry()],
    loading: false,
    hasMore: false,
    onLoadMore: vi.fn(),
    ...overrides,
  };
}

function renderToContainer(props: AuditTimelineProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderAuditTimeline(props), container);
  return container;
}

describe("audit-timeline", () => {
  it("renders audit entries", () => {
    const container = renderToContainer(createProps());
    const entries = container.querySelectorAll(".audit-timeline__entry");
    expect(entries.length).toBe(1);
  });

  it("renders event icon", () => {
    const container = renderToContainer(createProps());
    const icon = container.querySelector(".audit-timeline__icon");
    expect(icon?.textContent?.trim()).toBe("\u{1F7E2}"); // green circle for auth.success
  });

  it("renders event label from i18n", () => {
    const container = renderToContainer(createProps());
    const label = container.querySelector(".audit-timeline__label");
    expect(label?.textContent?.trim()).toBe(t().devices.events.auth_success);
  });

  it("renders relative timestamp", () => {
    const container = renderToContainer(createProps());
    const time = container.querySelector(".audit-timeline__time");
    expect(time?.textContent?.trim()).toBeTruthy();
  });

  it("shows empty state when no entries", () => {
    const container = renderToContainer(createProps({ entries: [] }));
    expect(container.textContent).toContain(t().devices.noActivity);
  });

  it("shows loading state", () => {
    const container = renderToContainer(createProps({ loading: true }));
    expect(container.textContent).toContain(t().common.loading);
  });

  it("shows view more button when hasMore is true", () => {
    const container = renderToContainer(createProps({ hasMore: true }));
    const btn = container.querySelector(".btn");
    expect(btn?.textContent?.trim()).toBe(t().devices.viewMore);
  });

  it("hides view more button when hasMore is false", () => {
    const container = renderToContainer(createProps({ hasMore: false }));
    const btns = container.querySelectorAll(".btn");
    expect(btns.length).toBe(0);
  });

  it("calls onLoadMore when view more clicked", () => {
    const onLoadMore = vi.fn();
    const container = renderToContainer(createProps({ hasMore: true, onLoadMore }));
    const btn = container.querySelector<HTMLButtonElement>(".btn");
    btn?.click();
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("renders multiple entries in order", () => {
    const container = renderToContainer(
      createProps({
        entries: [
          createEntry({ action: "auth.success", ts: Date.now() - 1000 }),
          createEntry({ action: "device.paired", ts: Date.now() - 60_000 }),
          createEntry({ action: "token.rotate", ts: Date.now() - 3_600_000 }),
        ],
      }),
    );
    const entries = container.querySelectorAll(".audit-timeline__entry");
    expect(entries.length).toBe(3);
  });

  it("maps unknown action to raw action string", () => {
    const container = renderToContainer(
      createProps({
        entries: [createEntry({ action: "some.unknown.event" })],
      }),
    );
    const label = container.querySelector(".audit-timeline__label");
    expect(label?.textContent?.trim()).toBe("some.unknown.event");
  });
});
