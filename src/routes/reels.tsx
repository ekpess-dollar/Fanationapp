import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CREATORS, SEED_FEED, fhash, useAppStore } from "@/lib/core";
import { Avatar, Icon, Loop, Photo, Scrim, SIZES, Verified, reelFor } from "@/lib/ui";
import { FollowBtn } from "@/components/post-card";

/**
 * Reels.
 *
 * The layout is Instagram's desktop one, deliberately: a single 9:16 frame that
 * takes the height of the window, the caption in a column to its left, the
 * actions in a column to its right, and the arrows pinned to the right edge of
 * the viewport rather than to the video. The sizing lives in `.reelframe` in
 * styles.css — height first, width derived from it, so nothing here needs to
 * measure anything or listen for a resize.
 *
 * Three deliberate departures from a straight copy, all of them removals:
 * there is no "Reel 3/16" counter, no "scroll or ↑ ↓" hint and no up-next
 * thumbnail. None of the three exist in any version of Instagram and each one
 * reads as scaffolding. The up-next *prefetch* those visuals were doing is
 * kept below, just without a picture of itself on screen.
 *
 * One thing Instagram has that this does not: a mute button. Our clips carry no
 * audio track at all, so it would be a control wired to nothing.
 */

/**
 * Copy for a reel.
 *
 * A creator who has posted in the feed speaks in their own words here — the
 * caption is their first post, which keeps one voice per creator across the
 * app. The rest draw from a small deck by hash. Sixteen reels carrying one
 * identical line is the single loudest tell that a demo is a mock.
 */
const FALLBACK_CAPS = [
  "Behind the scenes from Friday's shoot 🎬",
  "Raw take, no edits. Subscribers get the full cut.",
  "This one took four hours and I'd do it again ✨",
  "Testing something new — tell me if it lands.",
  "Two minutes of what the last two weeks looked like.",
];

function captionFor(handle: string): string {
  const own = SEED_FEED.find((p) => p.h === handle && p.text);
  return own?.text || FALLBACK_CAPS[fhash(handle) % FALLBACK_CAPS.length];
}

/** Counts that differ per creator. Deterministic, so they survive a reload. */
const kfmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
const likesFor = (h: string) => 6200 + (fhash(`l${h}`) % 46000);
const cmtsFor = (h: string) => 140 + (fhash(`c${h}`) % 1900);

export default function ReelsPage() {
  const S = useAppStore();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const ix = ((i % CREATORS.length) + CREATORS.length) % CREATORS.length;
  const c = CREATORS[ix];
  const isLiked = !!liked[ix];
  const { still, loop } = reelFor(c.handle);
  const likes = likesFor(c.handle);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setI((v) => v + 1);
      if (e.key === "ArrowUp") setI((v) => v - 1);
      if (e.key === " ") { e.preventDefault(); setPaused((v) => !v); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* Warm the next frame. The old build did this with a visible thumbnail in the
     rail; the thumbnail was the part that had to go, not the prefetch. */
  useEffect(() => {
    const im = new Image();
    im.src = reelFor(CREATORS[(ix + 1) % CREATORS.length].handle).still;
  }, [ix]);

  /* The seek line reads the real <video>. `Loop` is vendored and shared with the
     admin build, and it exposes no ref — so rather than add a prop to a file that
     has to stay byte-identical in two places, the element is found underneath the
     card. `key` on the Loop remounts it per reel, so this re-runs and re-binds. */
  const cardRef = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);
  useEffect(() => {
    setProg(0);
    const v = cardRef.current?.querySelector("video");
    if (!v) return;
    const on = () => { if (v.duration) setProg(v.currentTime / v.duration); };
    v.addEventListener("timeupdate", on);
    return () => v.removeEventListener("timeupdate", on);
  }, [ix, loop]);

  /* A snap feed answers the wheel — that is the desktop gesture, and a trackpad
     is what most people will use. The cooldown is what stops one flick of an
     inertial scroll from firing through six reels. */
  const cool = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 12) return;
    const now = Date.now();
    if (now - cool.current < 420) return;
    cool.current = now;
    setI((v) => v + (e.deltaY > 0 ? 1 : -1));
  };

  /* …and the touch equivalent, which the page did not have at all: on a phone
     there was previously no gesture that moved between reels, only arrows. A
     drag past 45px inside 700ms is a swipe; anything shorter or slower is a tap
     and falls through to the pause handler. `swiped` is reset on touchstart so
     the tap that ends a swipe never also toggles playback. */
  const touch = useRef<{ y: number; t: number } | null>(null);
  const swiped = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => {
    swiped.current = false;
    touch.current = { y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dy) < 45 || Date.now() - s.t > 700) return;
    swiped.current = true;
    setI((v) => v + (dy < 0 ? 1 : -1));
  };
  const onCardClick = () => { if (!swiped.current) setPaused((v) => !v); };

  const act = (n: string, label: string, on: () => void, extra?: React.CSSProperties) => (
    <div className="reelact" onClick={on}>
      <div className="reelic"><Icon n={n} s={20} {...(extra || {})} /></div>
      <span className="reelnum">{label}</span>
    </div>
  );

  return (
    <div className="reelroot" onWheel={onWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="reelframe">
        <div className="reelcard" ref={cardRef} onClick={onCardClick}>
          {/* `key` forces a fresh <video> per reel: without it React reuses the
              element and the old frame hangs for a beat over the new source. */}
          {loop
            ? <Loop key={c.id} src={loop} poster={still} active={!paused} priority />
            : <Photo sizes={SIZES.reel} src={still} seed={c.id} />}

          {/* The frames are real photographs and a third of them are bright, so
              the top wash is unconditional — the live badge sits in it. The
              bottom wash only exists when the caption is over the video, which
              below 1360px it is; `.reelscrim` is display:none above that. */}
          <Scrim from={0.42} height="20%" top />
          <div className="reelscrim"><Scrim from={0.85} height="46%" /></div>

          {c.live && (
            <div className="badge-live" style={{ position: "absolute", top: 14, left: 14, zIndex: 3 }}>
              <span className="dot" />LIVE
            </div>
          )}

          {paused && (
            <div className="row center" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
              <div className="feature-ic" style={{ width: 62, height: 62, background: "rgba(0,0,0,.42)" }}>
                <Icon n="play" s={26} c="#fff" fill="#fff" />
              </div>
            </div>
          )}

          <div className="reelseek" aria-hidden><i style={{ width: `${Math.round(prog * 100)}%` }} /></div>
        </div>

        {/* Sibling of the card, not a child: a click here cannot bubble into the
            pause handler, so none of this needs stopPropagation. */}
        <div className="reelmeta">
          <div className="row gap8" style={{ marginBottom: 9 }}>
            <Link to={`/creator/${c.handle}`}><Avatar name={c.name} size={38} /></Link>
            <Link to={`/creator/${c.handle}`} className="row gap6 b7 t14 reelname">
              {c.name.split(" ")[0]} {c.v && <Verified s={13} />}
            </Link>
            <FollowBtn handle={c.handle} />
          </div>
          <div className="t14 reelcap">{captionFor(c.handle)}</div>
        </div>

        <div className="reelacts">
          <div className="reelact" onClick={() => setLiked((m) => ({ ...m, [ix]: !m[ix] }))}>
            <div className="reelic">
              <Icon n="heart" s={20} {...(isLiked ? { c: "var(--coral)", fill: "var(--coral)" } : {})} />
            </div>
            <span className="reelnum">{kfmt(likes + (isLiked ? 1 : 0))}</span>
          </div>
          {act("comment", kfmt(cmtsFor(c.handle)), () => S.toast("Comments open on the post view"))}
          {act("gift", "Gift", () => S.openModal("gift", c))}
          {act("repost", "Share", () => S.toast(`Link copied — fanation.app/r/${c.handle}`))}
          {act("more", "More", () => S.openModal("report", { id: `reel-${c.handle}`, h: c.handle }))}
        </div>
      </div>

      {/* Pinned to the right edge of the window, not to the video — the same
          place Instagram puts them. Hidden on a phone, where the swipe is the
          gesture and a floating control would sit over the action rail. */}
      <div className="reelnav">
        <button aria-label="Previous reel" onClick={() => setI(i - 1)}>
          <span style={{ transform: "rotate(-90deg)", display: "flex" }}><Icon n="arrow" s={18} /></span>
        </button>
        <button aria-label="Next reel" onClick={() => setI(i + 1)}>
          <span style={{ transform: "rotate(90deg)", display: "flex" }}><Icon n="arrow" s={18} /></span>
        </button>
      </div>
    </div>
  );
}
