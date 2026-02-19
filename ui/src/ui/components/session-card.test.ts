import { render } from "lit";
import { describe, expect, it, vi } from "vitest";

import { t } from "../i18n";
import type { GatewaySessionRow } from "../types";
import { renderSessionCard, type SessionCardProps } from "./session-card";

function createSession(overrides: Partial<GatewaySessionRow> = {}): GatewaySessionRow {
  return {
    key: "test-session",
    kind: "direct",
    updatedAt: Date.now() - 60_000,
    totalTokens: 1234,
    model: "opus-4.5",
    label: "My session",
    ...overrides,
  };
}

function createProps(overrides: Partial<SessionCardProps> = {}): SessionCardProps {
  return {
    session: createSession(),
    currentSessionKey: "other-session",
    basePath: "/",
    onResume: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

function renderToContainer(props: SessionCardProps): HTMLDivElement {
  const container = document.createElement("div");
  render(renderSessionCard(props), container);
  return container;
}

describe("session-card", () => {
  it("renders session title from label", () => {
    const container = renderToContainer(createProps());
    const title = container.querySelector(".session-card__title");
    expect(title?.textContent?.trim()).toBe("My session");
  });

  it("falls back to displayName when no label", () => {
    const container = renderToContainer(
      createProps({ session: createSession({ label: undefined, displayName: "Display" }) }),
    );
    const title = container.querySelector(".session-card__title");
    expect(title?.textContent?.trim()).toBe("Display");
  });

  it("falls back to key when no label or displayName", () => {
    const container = renderToContainer(
      createProps({
        session: createSession({ label: undefined, displayName: undefined }),
      }),
    );
    const title = container.querySelector(".session-card__title");
    expect(title?.textContent?.trim()).toBe("test-session");
  });

  it("shows model badge when model is set", () => {
    const container = renderToContainer(createProps());
    const model = container.querySelector(".session-card__model");
    expect(model?.textContent?.trim()).toBe("opus-4.5");
  });

  it("hides model badge when model is empty", () => {
    const container = renderToContainer(
      createProps({ session: createSession({ model: undefined }) }),
    );
    const model = container.querySelector(".session-card__model");
    expect(model).toBeNull();
  });

  it("shows kind badge when not unknown", () => {
    const container = renderToContainer(createProps());
    const kind = container.querySelector(".session-card__kind");
    expect(kind?.textContent?.trim()).toBe("direct");
  });

  it("hides kind badge when unknown", () => {
    const container = renderToContainer(
      createProps({ session: createSession({ kind: "unknown" }) }),
    );
    const kind = container.querySelector(".session-card__kind");
    expect(kind).toBeNull();
  });

  it("shows token count when > 0", () => {
    const container = renderToContainer(createProps());
    const tokens = container.querySelector(".session-card__tokens");
    expect(tokens?.textContent).toContain("1,234");
  });

  it("hides tokens when 0", () => {
    const container = renderToContainer(
      createProps({ session: createSession({ totalTokens: 0 }) }),
    );
    const tokens = container.querySelector(".session-card__tokens");
    expect(tokens).toBeNull();
  });

  it("shows current badge for current session", () => {
    const container = renderToContainer(
      createProps({ currentSessionKey: "test-session" }),
    );
    const badge = container.querySelector(".session-card__current-badge");
    expect(badge?.textContent?.trim()).toBe(t().sessions.switcher.current);
    const resume = container.querySelector(".session-card__resume");
    expect(resume).toBeNull();
  });

  it("shows resume button for non-current, non-global sessions", () => {
    const container = renderToContainer(createProps());
    const resume = container.querySelector(".session-card__resume");
    expect(resume?.textContent?.trim()).toBe(t().sessions.card.resume);
  });

  it("hides resume button for global sessions", () => {
    const container = renderToContainer(
      createProps({ session: createSession({ kind: "global" }) }),
    );
    const resume = container.querySelector(".session-card__resume");
    expect(resume).toBeNull();
  });

  it("calls onResume when resume button clicked", () => {
    const onResume = vi.fn();
    const container = renderToContainer(createProps({ onResume }));
    const resume = container.querySelector<HTMLButtonElement>(".session-card__resume");
    resume?.click();
    expect(onResume).toHaveBeenCalledWith("test-session");
  });

  it("calls onDelete when delete dropdown item clicked", () => {
    const onDelete = vi.fn();
    const container = renderToContainer(createProps({ onDelete }));
    const items = container.querySelectorAll(".session-card__dropdown-item");
    const deleteItem = items[1] as HTMLButtonElement;
    deleteItem?.click();
    expect(onDelete).toHaveBeenCalledWith("test-session");
  });

  it("applies current class for current session", () => {
    const container = renderToContainer(
      createProps({ currentSessionKey: "test-session" }),
    );
    const card = container.querySelector(".session-card");
    expect(card?.classList.contains("session-card--current")).toBe(true);
  });

  it("does not apply current class for other sessions", () => {
    const container = renderToContainer(createProps());
    const card = container.querySelector(".session-card");
    expect(card?.classList.contains("session-card--current")).toBe(false);
  });

  it("shows session key", () => {
    const container = renderToContainer(createProps());
    const key = container.querySelector(".session-card__key");
    expect(key?.textContent?.trim()).toBe("test-session");
  });

  it("toggles dropdown menu on trigger click", () => {
    const container = renderToContainer(createProps());
    const trigger = container.querySelector<HTMLButtonElement>(".session-card__menu-trigger");
    const dropdown = container.querySelector(".session-card__dropdown");
    expect(dropdown?.classList.contains("open")).toBe(false);
    trigger?.click();
    expect(dropdown?.classList.contains("open")).toBe(true);
    trigger?.click();
    expect(dropdown?.classList.contains("open")).toBe(false);
  });
});
