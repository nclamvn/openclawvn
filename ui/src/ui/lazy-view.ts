import { html } from "lit";
import { until } from "lit/directives/until.js";

const cache: Record<string, unknown> = {};

/**
 * Lazy-load a view module and render it.
 * First call: shows a spinner while the chunk downloads, then renders.
 * Subsequent calls: renders synchronously from cache.
 */
export function lazyView<M>(
  key: string,
  importer: () => Promise<M>,
  renderer: (mod: M) => unknown,
): unknown {
  const cached = cache[key] as M | undefined;
  if (cached) return renderer(cached);
  return until(
    importer().then((mod) => {
      cache[key] = mod;
      return renderer(mod);
    }),
    html`<div class="view-loading"><span class="spinner"></span></div>`,
  );
}
