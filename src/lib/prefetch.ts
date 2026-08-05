/* Split the routes out of the entry bundle, then quietly put them back.
 *
 * Code splitting on its own is a trade, not a win. The cold load stops carrying
 * twenty-odd screens nobody asked for, which is the point — but every later
 * navigation now costs a network round trip that used to cost nothing, and on a
 * slow connection that is a visible stall on a click that used to be instant.
 * Traded one number for another.
 *
 * So the chunks are fetched back during idle time, one at a time, after the
 * first screen has settled. By the time anyone clicks a nav item the module is
 * already in the registry and `lazy()` resolves in the same tick. The user sees
 * a smaller first paint and no slower anything else.
 *
 * One at a time matters. Firing twenty imports at once puts twenty requests in
 * front of whatever the visible page is still loading — the feed's images, say
 * — on a connection that has room for six. Serialising them means the warmer
 * always yields to real work.
 *
 * `requestIdleCallback` is not in Safari before 17, so there is a timeout
 * fallback. The consequence of getting this wrong is a slightly later prefetch,
 * which is why it is worth about four lines and no more.
 */

import { useEffect } from "react";

type Loader = () => Promise<unknown>;

const idle = (fn: () => void, timeout = 2000): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const ric = (window as unknown as { requestIdleCallback?: (cb: IdleRequestCallback, o?: IdleRequestOptions) => number }).requestIdleCallback;
  if (ric) {
    const id = ric(() => fn(), { timeout });
    const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
    return () => cic?.(id);
  }
  const id = window.setTimeout(fn, 300);
  return () => window.clearTimeout(id);
};

/**
 * Warm every route chunk in the background once the app has drawn.
 *
 * Pass the same loader functions given to `lazy()`. Calling a dynamic import
 * twice is free — the module registry returns the settled promise — so there is
 * no bookkeeping to keep the two in step.
 */
export function useIdlePrefetch(loaders: Record<string, Loader>, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    /* Nobody on a metered or slow connection asked to download the whole app on
       spec. Both properties are Chromium-only; absent means proceed. */
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

    let cancelled = false;
    let cancelIdle = () => {};
    const queue = Object.values(loaders);

    const next = () => {
      if (cancelled) return;
      const loader = queue.shift();
      if (!loader) return;
      loader()
        .catch(() => {
          /* A failed prefetch is not an error the user should ever learn about.
             The real navigation will retry and can fail loudly then. */
        })
        .then(() => {
          cancelIdle = idle(next);
        });
    };

    cancelIdle = idle(next);
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [loaders, enabled]);
}
