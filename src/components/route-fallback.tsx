import { useEffect, useState } from "react";

/**
 * What sits in the content area while a split route chunk is in flight.
 *
 * Almost nobody should ever see this. The chunks are warmed during idle time
 * (see `lib/prefetch.ts`), so by the time a nav item is clicked the module is
 * usually already resolved and React never suspends at all. This is the case
 * where the click beat the warmer, or the connection is bad enough that it is
 * still working through the queue.
 *
 * Which is exactly why it waits before showing anything. A spinner that appears
 * for 40ms and vanishes is worse than no spinner — it reads as a glitch rather
 * than as loading. Below the delay the area simply stays empty, which on a
 * transition that fast is indistinguishable from an instant one.
 *
 * The reserved height keeps the page from collapsing to nothing and bouncing
 * the footer up, which would be a layout shift on a route change.
 */
export default function RouteFallback({ delay = 160 }: { delay?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        opacity: show ? 1 : 0,
        transition: "opacity .18s ease",
      }}
    >
      {/* `blink` is already in the stylesheet and already covered by the
          reduced-motion block, so this borrows it rather than adding a second
          spinner nobody would maintain. */}
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--muted)",
          display: "block",
          animation: "blink 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
