/** Fanation UI primitives — presentational, store-free. */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fhash } from "@/lib/core";
import type { ToastMsg } from "@/lib/core";
import { avatarFor, rungFor, srcsetFor } from "./media";

/* ---------------- Icons ---------------- */
/* Ionicons outline (plus three solid pairs, for the spots that toggle a filled
   state), self-hosted under `src/assets/icons`. Raw-imported so each SVG's markup
   bundles as a plain string — Vite resolves exactly the ~40 files named below,
   not the 1,300+ the library ships.

   Outline files hardcode `stroke:#000` per shape; `outline()` swaps that for
   `currentColor` once here at module load, so colour then comes for free from
   the wrapping `<svg>`'s inherited `color` — the same way the old hand-drawn set
   took its colour from `stroke={c}`. Solid files carry no colour of their own —
   they inherit `fill` directly — so they skip that swap. */
import homeOutline from "@/assets/icons/home-outline.svg?raw";
import compassOutline from "@/assets/icons/compass-outline.svg?raw";
import notificationsOutline from "@/assets/icons/notifications-outline.svg?raw";
import bookmarkOutline from "@/assets/icons/bookmark-outline.svg?raw";
import personOutline from "@/assets/icons/person-outline.svg?raw";
import settingsOutline from "@/assets/icons/settings-outline.svg?raw";
import walletOutline from "@/assets/icons/wallet-outline.svg?raw";
import videocamOutline from "@/assets/icons/videocam-outline.svg?raw";
import chatbubblesOutline from "@/assets/icons/chatbubbles-outline.svg?raw";
import statsChartOutline from "@/assets/icons/stats-chart-outline.svg?raw";
import cashOutline from "@/assets/icons/cash-outline.svg?raw";
import discOutline from "@/assets/icons/disc-outline.svg?raw";
import giftOutline from "@/assets/icons/gift-outline.svg?raw";
import heartOutline from "@/assets/icons/heart-outline.svg?raw";
import addOutline from "@/assets/icons/add-outline.svg?raw";
import checkmarkOutline from "@/assets/icons/checkmark-outline.svg?raw";
import arrowForwardOutline from "@/assets/icons/arrow-forward-outline.svg?raw";
import lockClosedOutline from "@/assets/icons/lock-closed-outline.svg?raw";
import shieldCheckmarkOutline from "@/assets/icons/shield-checkmark-outline.svg?raw";
import peopleOutline from "@/assets/icons/people-outline.svg?raw";
import logOutOutline from "@/assets/icons/log-out-outline.svg?raw";
import playOutline from "@/assets/icons/play-outline.svg?raw";
import starOutline from "@/assets/icons/star-outline.svg?raw";
import eyeOutline from "@/assets/icons/eye-outline.svg?raw";
import cloudUploadOutline from "@/assets/icons/cloud-upload-outline.svg?raw";
import calendarOutline from "@/assets/icons/calendar-outline.svg?raw";
import gridOutline from "@/assets/icons/grid-outline.svg?raw";
import flagOutline from "@/assets/icons/flag-outline.svg?raw";
import checkmarkCircleOutline from "@/assets/icons/checkmark-circle-outline.svg?raw";
import cameraOutline from "@/assets/icons/camera-outline.svg?raw";
import repeatOutline from "@/assets/icons/repeat-outline.svg?raw";
import chatbubbleOutline from "@/assets/icons/chatbubble-outline.svg?raw";
import searchOutline from "@/assets/icons/search-outline.svg?raw";
import menuOutline from "@/assets/icons/menu-outline.svg?raw";
import ellipsisHorizontalOutline from "@/assets/icons/ellipsis-horizontal-outline.svg?raw";
import closeOutline from "@/assets/icons/close-outline.svg?raw";
import sunnyOutline from "@/assets/icons/sunny-outline.svg?raw";
import moonOutline from "@/assets/icons/moon-outline.svg?raw";
import paperPlaneOutline from "@/assets/icons/paper-plane-outline.svg?raw";
import documentOutline from "@/assets/icons/document-outline.svg?raw";
import chevronForwardOutline from "@/assets/icons/chevron-forward-outline.svg?raw";
import volumeMuteOutline from "@/assets/icons/volume-mute-outline.svg?raw";
import volumeHighOutline from "@/assets/icons/volume-high-outline.svg?raw";
import pauseOutline from "@/assets/icons/pause-outline.svg?raw";
import playBackOutline from "@/assets/icons/play-back-outline.svg?raw";
import playForwardOutline from "@/assets/icons/play-forward-outline.svg?raw";
import expandOutline from "@/assets/icons/expand-outline.svg?raw";
import contractOutline from "@/assets/icons/contract-outline.svg?raw";
import heartSolid from "@/assets/icons/heart.svg?raw";
import playSolid from "@/assets/icons/play.svg?raw";
import checkmarkCircleSolid from "@/assets/icons/checkmark-circle.svg?raw";
// Solid pairs for the side nav, which renders every destination filled rather
// than outlined — everywhere else these keys still resolve through OUTLINE.
import homeSolid from "@/assets/icons/home.svg?raw";
import compassSolid from "@/assets/icons/compass.svg?raw";
import videocamSolid from "@/assets/icons/videocam.svg?raw";
import chatbubblesSolid from "@/assets/icons/chatbubbles.svg?raw";
import notificationsSolid from "@/assets/icons/notifications.svg?raw";
import bookmarkSolid from "@/assets/icons/bookmark.svg?raw";
import starSolid from "@/assets/icons/star.svg?raw";
import walletSolid from "@/assets/icons/wallet.svg?raw";
import settingsSolid from "@/assets/icons/settings.svg?raw";
import gridSolid from "@/assets/icons/grid.svg?raw";
import cashSolid from "@/assets/icons/cash.svg?raw";
import cloudUploadSolid from "@/assets/icons/cloud-upload.svg?raw";
import peopleSolid from "@/assets/icons/people.svg?raw";
import giftSolid from "@/assets/icons/gift.svg?raw";
import statsChartSolid from "@/assets/icons/stats-chart.svg?raw";
import shieldCheckmarkSolid from "@/assets/icons/shield-checkmark.svg?raw";
import cameraSolid from "@/assets/icons/camera.svg?raw";
import calendarSolid from "@/assets/icons/calendar.svg?raw";
import personSolid from "@/assets/icons/person.svg?raw";
import discSolid from "@/assets/icons/disc.svg?raw";
import lockClosedSolid from "@/assets/icons/lock-closed.svg?raw";
import repeatSolid from "@/assets/icons/repeat.svg?raw";
import chatbubbleSolid from "@/assets/icons/chatbubble.svg?raw";

const inner = (raw: string) => raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const outline = (raw: string) => inner(raw).replace(/#000/g, "currentColor");

const OUTLINE: Record<string, string> = {
  home: outline(homeOutline),
  discover: outline(compassOutline),
  bell: outline(notificationsOutline),
  bookmark: outline(bookmarkOutline),
  user: outline(personOutline),
  gear: outline(settingsOutline),
  wallet: outline(walletOutline),
  live: outline(videocamOutline),
  msg: outline(chatbubblesOutline),
  chart: outline(statsChartOutline),
  dollar: outline(cashOutline),
  coin: outline(discOutline),
  gift: outline(giftOutline),
  heart: outline(heartOutline),
  plus: outline(addOutline),
  check: outline(checkmarkOutline),
  arrow: outline(arrowForwardOutline),
  lock: outline(lockClosedOutline),
  shield: outline(shieldCheckmarkOutline),
  users: outline(peopleOutline),
  logout: outline(logOutOutline),
  play: outline(playOutline),
  star: outline(starOutline),
  eye: outline(eyeOutline),
  upload: outline(cloudUploadOutline),
  cal: outline(calendarOutline),
  grid: outline(gridOutline),
  flag: outline(flagOutline),
  verified: outline(checkmarkCircleOutline),
  camera: outline(cameraOutline),
  repost: outline(repeatOutline),
  comment: outline(chatbubbleOutline),
  search: outline(searchOutline),
  menu: outline(menuOutline),
  more: outline(ellipsisHorizontalOutline),
  x: outline(closeOutline),
  sun: outline(sunnyOutline),
  moon: outline(moonOutline),
  send: outline(paperPlaneOutline),
  doc: outline(documentOutline),
  chevronRight: outline(chevronForwardOutline),
  volumeMute: outline(volumeMuteOutline),
  volumeHigh: outline(volumeHighOutline),
  pause: outline(pauseOutline),
  rewind: outline(playBackOutline),
  forward: outline(playForwardOutline),
  expand: outline(expandOutline),
  contract: outline(contractOutline),
};

const SOLID: Record<string, string> = {
  heart: inner(heartSolid),
  play: inner(playSolid),
  verified: inner(checkmarkCircleSolid),
  home: inner(homeSolid),
  discover: inner(compassSolid),
  live: inner(videocamSolid),
  msg: inner(chatbubblesSolid),
  bell: inner(notificationsSolid),
  bookmark: inner(bookmarkSolid),
  star: inner(starSolid),
  wallet: inner(walletSolid),
  gear: inner(settingsSolid),
  grid: inner(gridSolid),
  dollar: inner(cashSolid),
  upload: inner(cloudUploadSolid),
  users: inner(peopleSolid),
  gift: inner(giftSolid),
  chart: inner(statsChartSolid),
  shield: inner(shieldCheckmarkSolid),
  camera: inner(cameraSolid),
  cal: inner(calendarSolid),
  user: inner(personSolid),
  coin: inner(discSolid),
  lock: inner(lockClosedSolid),
  repost: inner(repeatSolid),
  comment: inner(chatbubbleSolid),
};

export function Icon({ n, s = 20, c = "currentColor", solid, fill }: { n: string; s?: number; c?: string; solid?: boolean; fill?: string }) {
  // `fill` is the older API — passing a colour used to also switch to the solid
  // glyph, which conflated "what colour" with "which variant". `solid` now
  // carries the variant; `fill` is kept as a colour-only alias so the handful
  // of existing call sites (a toggled heart, a white play triangle) still work.
  const useSolid = solid || !!fill;
  const markup = (useSolid ? SOLID[n] : undefined) ?? OUTLINE[n] ?? OUTLINE.grid;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 512 512"
      fill={useSolid && SOLID[n] ? "currentColor" : "none"}
      style={{ flex: "none", color: fill || c }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
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
export function Avatar({ name = "", size = 40, ring, src, onClick }: { name?: string; size?: number; ring?: string; src?: string; onClick?: (e: React.MouseEvent) => void }) {
  const h = fhash(name);
  const init = (name.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase();
  const url = src ?? avatarFor(name);
  const [broken, setBroken] = useState(false);
  return (
    <div className="av" onClick={onClick} style={{ width: size, height: size, fontSize: size * 0.36, cursor: onClick ? "pointer" : undefined, background: `linear-gradient(135deg,hsl(${h % 360},66%,55%),hsl(${(h + 50) % 360},66%,42%))`, boxShadow: ring ? `0 0 0 2px ${ring}` : "none" }}>
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

export function Menu({ items, trigger, placement = "bottom", align = "right", triggerClassName, triggerStyle }: { items: Array<MenuItem | "-" | false | null | undefined>; trigger?: React.ReactNode; placement?: "top" | "bottom"; align?: "left" | "right"; triggerClassName?: string; triggerStyle?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);
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
      // `align` decides which edge of the trigger the menu's own edge locks
      // to — "left" so it lines up under the avatar (a wide, left-anchored
      // row like the account card), "right" so it doesn't overshoot the
      // right edge of a narrow trigger like a "..." icon button.
      const side = align === "left" ? { left: Math.max(10, r.left) } : { right: Math.max(10, window.innerWidth - r.right) };
      // `bottom` anchors to the trigger's top edge and grows upward — unlike
      // `top`, it needs no advance knowledge of the menu's own height, which
      // React hasn't rendered yet at the moment this position is computed.
      setPos(placement === "top"
        ? { bottom: window.innerHeight - r.top + 6, ...side }
        : { top: r.bottom + 6, ...side });
    }
    setOpen((o) => !o);
  };
  return (
    <div className="menuwrap" ref={ref}>
      <div onClick={toggle} className={triggerClassName} style={triggerStyle ?? { cursor: "pointer", display: "inline-flex" }}>
        {trigger || <button className="muted" style={{ padding: 4 }}><Icon n="menu" s={18} /></button>}
      </div>
      {open && pos && (
        <div className="menu" style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right }}>
          {items.filter(Boolean).map((it, i) =>
            it === "-" ? (
              <hr key={i} className="divider" style={{ margin: "5px 4px" }} />
            ) : (
              <div key={i} className={"mi" + ((it as MenuItem).danger ? " danger" : "") + ((it as MenuItem).off ? " off" : "")}
                onClick={() => { const m = it as MenuItem; if (m.off) return; setOpen(false); m.fn?.(); }}>
                {(it as MenuItem).ic && <Icon n={(it as MenuItem).ic!} s={15} />}
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
