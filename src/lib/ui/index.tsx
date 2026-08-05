/** Fanation UI primitives — presentational, store-free. */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fhash } from "@/lib/core";
import type { ToastMsg } from "@/lib/core";
import { avatarFor, rungFor, srcsetFor } from "./media";

/* ---------------- Icons ---------------- */
const P: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  discover: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15.5 8.5l-2 5-5 2 2-5 5-2Z",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M9.5 20a2.5 2.5 0 0 0 5 0",
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  user: "M4 20a8 8 0 0 1 16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6H8.9l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 4 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4.2l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  wallet: "M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11M17 13h.01",
  live: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM10 9l5 3-5 3V9Z",
  msg: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 4V6a1 1 0 0 1 1-1Z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  dollar: "M12 2v20M17 6a5 3.5 0 0 0-5-2.5C9 3.5 7 5 7 7s2 3 5 3.5 5 1.5 5 3.5-2 3.5-5 3.5A5 3.5 0 0 1 7 18",
  coin: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 7v10M14.5 9.2c0-1.2-1.1-1.7-2.5-1.7s-2.5.6-2.5 1.7S10.6 11 12 11s2.5.6 2.5 1.8-1.1 1.7-2.5 1.7-2.5-.6-2.5-1.7",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S11 2 8 3s0 4 4 4M12 7s1-5 4-4 0 4-4 4",
  heart: "M12 21S3 14.5 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8C21 14.5 12 21 12 21Z",
  plus: "M12 5v14M5 12h14",
  check: "M20 6 9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  lock: "M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3ZM9 12l2 2 4-4",
  users: "M16 20a6 6 0 0 0-12 0M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20a5 5 0 0 0-6-4.9M17 4.2a4 4 0 0 1 0 7.6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  play: "M6 4v16l14-8L6 4Z",
  star: "M12 3l2.9 6 6.6.8-4.8 4.5 1.3 6.5L12 17.8 6 20.8l1.3-6.5L2.5 9.8 9 9 12 3Z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  cal: "M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 9h18M8 3v4M16 3v4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  flag: "M5 21V4M5 4s2-1.5 5-1.5S14 4 17 4s3-.6 3-.6v10s-1 .6-3 .6-4-1.5-7-1.5S5 14 5 14",
  verified: "M12 2l2.4 1.8 3-.2 1 2.8 2.4 1.7-1 2.9 1 2.9-2.4 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3.2 16l1-2.9-1-2.9 2.4-1.7 1-2.8 3 .2L12 2Z",
  camera: "M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  repost: "M4 9l3-3 3 3M7 6v9a3 3 0 0 0 3 3h4M20 15l-3 3-3-3M17 18V9a3 3 0 0 0-3-3h-4",
  comment: "M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  menu: "M4 6h16M4 12h16M4 18h16",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  x: "M6 6l12 12M18 6 6 18",
  sun: "M12 3V1M12 23v-2M5 5 3.5 3.5M20.5 20.5 19 19M3 12H1M23 12h-2M5 19l-1.5 1.5M20.5 3.5 19 5M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  send: "M4 12l16-8-5 16-3-6-8-2Z",
  doc: "M6 2h9l5 5v15H6zM14 2v6h6M10 13h6M10 17h6",
};

export function Icon({ n, s = 20, c = "currentColor", sw = 1.8, fill }: { n: string; s?: number; c?: string; sw?: number; fill?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill || "none"} stroke={fill ? "none" : c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <path d={P[n] || P.grid} />
    </svg>
  );
}

/* ---------------- Mesh placeholder art ---------------- */
export function bg(seed: string): string {
  const h = fhash(seed);
  const H = (k: number) => (h * (k * 49 + 13)) % 360;
  const X = (k: number) => 8 + ((h * (k * 23 + 5)) % 84);
  const Y = (k: number) => 6 + ((h * (k * 31 + 7)) % 88);
  const blob = (k: number, a: number) =>
    `radial-gradient(ellipse ${46 + ((h * k) % 26)}% ${50 + ((h * k) % 22)}% at ${X(k)}% ${Y(k)}%, hsla(${H(k)},74%,60%,${a}) 0%, transparent 60%)`;
  return `${blob(1, 0.95)}, ${blob(2, 0.88)}, ${blob(3, 0.82)}, ${blob(4, 0.72)}, linear-gradient(140deg, hsl(${H(5)},48%,20%), hsl(${H(6)},52%,12%))`;
}

/* ---------------- Primitives ---------------- */

/**
 * Is this element on screen?
 *
 * Nine video posts all decoding at once because they happen to exist in the
 * DOM is how a demo laptop starts sounding like a hairdryer. The feed uses
 * this to hand `Loop` an `active` flag, so only the clips a person can
 * actually see are running.
 *
 * `amount` is the fraction of the element that has to be visible before it
 * counts, and the observer is torn down on unmount. It reports `false` until
 * the first callback, which is the honest answer during SSR and the first
 * paint — a poster frame showing for one tick is invisible, a video that
 * autoplayed off screen is not.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(amount = 0.55) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: amount });
    io.observe(el);
    return () => io.disconnect();
  }, [amount]);
  return [ref, seen] as const;
}

/**
 * Has this element come close enough to be worth the bytes?
 *
 * A sibling of `useInView`, and deliberately not the same hook. `useInView`
 * answers "is it on screen right now", which is the question playback asks —
 * it has to be able to go false again so a clip that scrolls away stops
 * decoding. This one answers "has it ever come close", which is the question
 * the network asks, and that answer must never go back: dropping a poster the
 * moment it leaves the fold would just re-fetch it on the way back up. So this
 * one latches, and disconnects the observer the first time it fires.
 *
 * `margin` is how far ahead of the fold to arm. Two hundred pixels is about one
 * flick of a trackpad, which is enough for a still to have decoded by the time
 * it matters and little enough that a nine-post feed does not fetch all nine.
 *
 * `now` is the escape hatch for the places where the deferral is pure cost —
 * a screen that renders exactly one clip and that clip is the reason you opened
 * the screen. It is folded into the returned value rather than the initial
 * state so a call site that computes it can still change its mind.
 *
 * The initial value is a fallback, not optimism: where there is no
 * IntersectionObserver there is no signal to wait for, so the answer is yes and
 * everything loads exactly as it did before this hook existed. Starting false
 * there would be a browser that never loads a poster at all.
 */
export function useNear<T extends HTMLElement = HTMLDivElement>(margin = 200, now = false) {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  const on = near || now;
  useEffect(() => {
    if (on) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setNear(true);
      io.disconnect();
    }, { rootMargin: `${margin}px` });
    io.observe(el);
    return () => io.disconnect();
  }, [on, margin]);
  return [ref, on] as const;
}

/**
 * A person.
 *
 * The initials disc is not gone — it is the floor. The gradient paints first
 * and stays visible behind the photograph while it decodes, so a face arrives
 * over a coloured tile rather than over a hole, and it is what remains if the
 * file 404s. Pass `src` to override the lookup; leave it off and the component
 * resolves the name itself, which is what almost every call site wants.
 *
 * The `sizes` here is the one place in the app where it is not a judgement
 * call: the component is handed its own pixel size, so it declares exactly the
 * box the browser is choosing for and cannot reach past it. A 40px disc on a
 * retina screen asks for the 112px rung instead of the 320px original, which is
 * most of what the admin user table was paying for.
 */
export function Avatar({ name = "", size = 40, ring, src }: { name?: string; size?: number; ring?: string; src?: string }) {
  const h = fhash(name);
  const init = (name.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
  const url = src ?? avatarFor(name);
  const [broken, setBroken] = useState(false);
  return (
    <div className="av" style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg,hsl(${h % 360},66%,55%),hsl(${(h + 50) % 360},66%,42%))`, boxShadow: ring ? `0 0 0 2px ${ring}` : "none" }}>
      {url && !broken ? (
        <img src={url} srcSet={srcsetFor(url)} sizes={`${size}px`}
          alt="" width={size} height={size} loading="lazy" decoding="async"
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        init
      )}
    </div>
  );
}

/**
 * A photograph, wherever a `bg()` mesh used to stand in for one.
 *
 * The mesh moves underneath as the loading colour, so the frame is never white
 * and never empty — it fades from a plausible colour into the real picture. By
 * default the photograph fills its parent absolutely, which is how every media
 * frame in the app is built; pass `fill={false}` for the handful of places that
 * want the photograph to size itself.
 *
 * `blur` is a CSS filter rather than a second, pre-blurred file: a locked post
 * and the same post unlocked must be the same photograph, and shipping two
 * copies of every PPV image to achieve that would be silly. `scale` pairs with
 * it — a blur samples past the edge of the element and leaves a soft rim, so
 * the image is pushed slightly oversize to keep the corners honest.
 *
 * `srcSet` only ships when a `sizes` comes with it, and that guard is the whole
 * design. A srcset without sizes is worse than no srcset at all: the browser
 * has to choose a candidate before layout exists, so absent a hint it assumes
 * the picture fills the viewport and takes the widest rung on the ladder — on a
 * 216px vault thumbnail that is a straight regression. Gating on `sizes` means
 * a call site nobody has annotated yet paints exactly what it paints today.
 *
 * The strings live in `SIZES` in `lib/ui/media`, keyed by layout rather than by
 * page, because collections and explore put a photograph in the same box and
 * naming the box is what keeps one string true for both.
 */
export function Photo({ src, seed, alt = "", radius, blur, scale, priority, sizes, fill = true, style, children }: {
  src: string; seed?: string; alt?: string; radius?: number | string; blur?: number;
  scale?: number; priority?: boolean; sizes?: string; fill?: boolean;
  style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return (
    <div style={{
      position: fill ? "absolute" : "relative",
      ...(fill ? { inset: 0 } : null),
      borderRadius: radius,
      overflow: "hidden",
      background: bg(seed || src),
      ...style,
    }}>
      <img src={src} srcSet={sizes ? srcsetFor(src) : undefined} sizes={sizes}
        alt={alt} loading={priority ? "eager" : "lazy"} decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          filter: blur ? `blur(${blur}px)` : undefined,
          transform: scale ? `scale(${scale})` : undefined,
        }} />
      {children}
    </div>
  );
}

/**
 * The dark wash that keeps white text legible over an arbitrary photograph.
 *
 * A mesh placeholder was always dark, so every caption laid over one was
 * readable by accident. A real photograph is not — a third of the pool is a
 * bright sky or a white studio wall. This is bottom-weighted rather than a
 * flat tint, so it darkens the corner the caption actually sits in and leaves
 * the middle of the picture alone. Pass `top` for the chrome that hangs off
 * the top edge instead.
 *
 * `hold` is the fraction of the band that stays at full strength before the
 * decay starts. Without it the wash is already a third of the way down by the
 * time it reaches a two-line caption, which is how a name over a bright frame
 * ends up at 2.35. Holding first and decaying after covers the whole caption
 * without having to darken the entire card to get there. It emits no extra
 * colour stop at `hold=0`, so every call site that does not ask for it paints
 * exactly the gradient string it painted before.
 */
export function Scrim({ from = 0.8, height = "58%", top = false, hold = 0 }: { from?: number; height?: number | string; top?: boolean; hold?: number }) {
  const knee = hold + (1 - hold) * 0.44;
  const stops = [
    `rgba(6,8,16,${from}) 0%`,
    ...(hold > 0 ? [`rgba(6,8,16,${from}) ${(hold * 100).toFixed(0)}%`] : []),
    `rgba(6,8,16,${(from * 0.42).toFixed(3)}) ${(knee * 100).toFixed(0)}%`,
    `rgba(6,8,16,0) 100%`,
  ];
  return (
    <div aria-hidden style={{
      position: "absolute", left: 0, right: 0, height,
      ...(top ? { top: 0 } : { bottom: 0 }),
      background: `linear-gradient(${top ? 180 : 0}deg, ${stops.join(", ")})`,
      pointerEvents: "none",
    }} />
  );
}

/**
 * A silent, looping video with its own still behind it.
 *
 * `poster` is the photograph the loop was synthesised from, so the swap from
 * still to motion is invisible — same framing, same colour. Autoplay only ever
 * works muted, and these clips carry no audio track at all, so `muted` is not
 * a preference here: it is the only state that plays.
 *
 * `active` is what a snap feed drives. Only the reel on screen should be
 * decoding; the rest hold their poster frame.
 *
 * `active` governs playback; whether anything is fetched at all is a separate
 * question, and one the platform gives no help with. An `<img>` carries
 * `loading="lazy"` and the browser honours it. A `<video poster>` has no such
 * attribute — the poster is a full image fetched the moment the element parses,
 * so nine posts in a feed paid for nine photographs before a person had scrolled
 * past the first. So the element is handed nothing until `useNear` says it is
 * close, and `src` goes with `poster`: a poster with no video is a still that
 * never moves, a video with no poster is a hole while it buffers, and holding
 * both back also spares nine `preload="metadata"` range requests.
 *
 * Nothing goes blank in the meantime. The wrapper's gradient is seeded from the
 * path rather than fetched from it, so it is already painted, costs no network,
 * and is the same floor that has always been there behind a decoding poster —
 * which is why it reads the props and not the deferred values.
 *
 * `priority` is for a screen that renders exactly one clip and that clip is the
 * reason the screen was opened — a reel, a live stage. There is nothing below
 * the fold to save, and waiting a frame for the observer would put a gradient
 * where a cached still could have painted immediately.
 *
 * The poster is also sized, which `<video>` gives no help with at all: there is
 * no srcset and no sizes on the element, so a full-width photograph goes into
 * whatever box it is given. `rungFor` picks the rung instead, off a measured
 * width rather than a declared one, and the measuring is why `near` alone is no
 * longer enough to arm the element — the box has to exist first. That happens
 * in a layout effect, so the measure-then-arm round trip completes before the
 * browser paints: nothing flashes, and no poster is fetched at two sizes.
 */
export function Loop({ src, poster, active = true, sound = false, radius, fit = "cover", priority, style, children }: {
  src: string; poster?: string; active?: boolean; sound?: boolean; radius?: number | string;
  fit?: "cover" | "contain"; priority?: boolean; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [box, near] = useNear<HTMLDivElement>(200, priority);

  /* The box's own width, once there is a box. `null` means not yet measured;
     0 means measured and genuinely zero, which a hidden ancestor produces and
     which `rungFor` answers with the original file. Measured once — a resize
     that crossed a rung boundary would only ever re-fetch a poster the video
     is about to cover. */
  const [pw, setPw] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!near || pw !== null) return;
    setPw(box.current ? box.current.getBoundingClientRect().width : 0);
  }, [near, pw, box]);

  const armed = near && pw !== null;
  const vsrc = armed ? src : undefined;
  const vposter = armed ? rungFor(poster, pw as number) : undefined;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && vsrc) {
      const p = v.play();
      // A rejected play() is normal — a background tab, or a browser that has
      // not seen a gesture yet. The poster stays up and nothing is broken.
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, vsrc]);

  useEffect(() => {
    if (ref.current) ref.current.muted = !sound;
  }, [sound]);

  return (
    <div ref={box} style={{
      position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden",
      background: bg(poster || src), ...style,
    }}>
      <video ref={ref} src={vsrc} poster={vposter} muted={!sound} loop playsInline preload="metadata"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, display: "block" }} />
      {children}
    </div>
  );
}

export function Verified({ s = 15 }: { s?: number }) {
  return (
    <span style={{ color: "var(--blue-ink)", display: "inline-flex" }}>
      <Icon n="verified" s={s} fill="var(--blue-ink)" />
    </span>
  );
}

export function CoinBadge({ v, mint }: { v: string | number; mint?: boolean }) {
  return (
    <span className={mint ? "chip-mint" : "chip-coin"}>
      <Icon n={mint ? "dollar" : "coin"} s={13} />
      {v}
    </span>
  );
}

export function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row between">
        <span className="up muted">{label}</span>
        <span style={{ color: color || "var(--muted)" }}><Icon n={icon} /></span>
      </div>
      <div className="statnum" style={{ marginTop: 12, color: color || "var(--text)", fontSize: 34 }}>{value}</div>
      {sub && <div className="muted t13" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ---------------- Dropdown menu (overflow-safe: fixed positioning) ---------------- */
export interface MenuItem {
  ic?: string;
  t: string;
  danger?: boolean;
  off?: boolean;
  fn?: () => void;
}

export function Menu({ items, trigger }: { items: Array<MenuItem | "-" | false | null | undefined>; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const s = () => setOpen(false);
    document.addEventListener("mousedown", h);
    window.addEventListener("scroll", s, true);
    return () => { document.removeEventListener("mousedown", h); window.removeEventListener("scroll", s, true); };
  }, []);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: Math.max(10, window.innerWidth - r.right) });
    }
    setOpen((o) => !o);
  };
  return (
    <div className="menuwrap" ref={ref}>
      <div onClick={toggle} style={{ cursor: "pointer", display: "inline-flex" }}>
        {trigger || <button className="muted" style={{ padding: 4 }}><Icon n="menu" s={18} /></button>}
      </div>
      {open && pos && (
        <div className="menu" style={{ position: "fixed", top: pos.top, right: pos.right }}>
          {items.filter(Boolean).map((it, i) =>
            it === "-" ? (
              <hr key={i} className="divider" style={{ margin: "5px 4px" }} />
            ) : (
              <div key={i} className={"mi" + ((it as MenuItem).danger ? " danger" : "") + ((it as MenuItem).off ? " off" : "")}
                onClick={() => { const m = it as MenuItem; if (m.off) return; setOpen(false); m.fn?.(); }}>
                <Icon n={(it as MenuItem).ic || "arrow"} s={15} />
                {(it as MenuItem).t}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Toast stack ---------------- */
export function ToastStack({ list }: { list: ToastMsg[] }) {
  return (
    <div className="toastwrap">
      {list.map((t) => (
        <div key={t.id} className={"toast " + (t.tone || "")}>
          <Icon n={t.tone === "err" ? "x" : t.tone === "ok" ? "check" : "bell"} s={15}
            c={t.tone === "err" ? "var(--coral-ink)" : t.tone === "ok" ? "var(--mint-ink)" : "var(--blueL-ink)"} />
          <span>{t.msg}</span>
          {t.actionLabel && <button onClick={t.action}>{t.actionLabel}</button>}
        </div>
      ))}
    </div>
  );
}

/**
 * The logo is not defined here. It lives in `lib/brand`, which is the single source
 * for the mark's geometry, the palette and the lockup ratios — the same source the
 * favicons, the Apple touch icon and the Open Graph card are generated from.
 *
 * Re-exported rather than re-implemented so pages import everything they render from
 * one place, and so the ratios exist once per project rather than twice.
 *
 * `Logo` is the horizontal lockup — mark, gap, wordmark. `FanationMark` is the tile on
 * its own, for anywhere the wordmark would not fit.
 */
export { FanationLogo as Logo, FanationMark } from "@/lib/brand";
export type { FanationLogoProps as LogoProps, FanationMarkProps } from "@/lib/brand";

/**
 * The picture resolvers, and the brand tables they read.
 *
 * Same reasoning as the logo above: this re-export is the only route from a page
 * to a photograph, so `lib/brand` stays an implementation detail of `lib/ui`.
 * `Avatar` and `Photo` already resolve internally,
 * so most call sites never touch these directly — the ones that do are the
 * surfaces that need a picture without a component around it: a cover, a grid
 * tile, a reel loop, an admin exhibit.
 */
export * from "./media";
