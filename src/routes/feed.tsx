import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATORS, LIVE_TITLES, useAppStore } from "@/lib/core";
import { Avatar, CoinBadge, Icon, Loop, Photo, Scrim, SIZES, Verified, mediaFor, poolFor, reelFor } from "@/lib/ui";
import { fhash } from "@/lib/core";
import { FollowBtn, PostCard } from "@/components/post-card";

/* Each person's story is a short reel, not one frame — 2 to 4 segments,
   picked deterministically per handle so the count doesn't reshuffle on
   every render. The first segment is their reel highlight (motion, if they
   have one); the rest are dealt from the same photo pool their grid posts
   come from. */
const segCountFor = (handle: string) => 2 + (fhash(handle) % 3);
const segSrcFor = (handle: string, seg: number): { still: string; loop?: string } =>
  seg === 0 ? reelFor(handle) : { still: mediaFor(poolFor(handle), seg) };

function StoryViewer({ idx, close }: { idx: number; close: () => void }) {
  const [ci, setCi] = useState(idx);
  const [si, setSi] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const c = CREATORS[((ci % CREATORS.length) + CREATORS.length) % CREATORS.length];
  const segCount = segCountFor(c.handle);
  /* A story is vertical, so it draws the creator's 9:16 frame — the same
     footage their reel is cut from, which is what a story actually is. */
  const { still, loop } = segSrcFor(c.handle, si);

  const next = () => {
    if (si < segCount - 1) { setSi(si + 1); return; }
    setCi(ci + 1);
    setSi(0);
  };
  const prev = () => {
    if (si > 0) { setSi(si - 1); return; }
    const pi = ((ci - 1) % CREATORS.length + CREATORS.length) % CREATORS.length;
    setCi(ci - 1);
    setSi(segCountFor(CREATORS[pi].handle) - 1);
  };

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci, si, paused]);
  /* `close` is an inline arrow in the parent, so it is a new function on every
     render of the feed. Depending on it would re-register this listener each
     time, and a listener removed while a keydown is being dispatched never
     runs — which is how a store write elsewhere on the page can swallow the
     key. Register once, read the current `close` through a ref. */
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  /* The peeked neighbour only ever shows its still frame — Instagram doesn't
     autoplay the cards either side, and decoding two more videos for a strip
     the person cannot interact with yet would be pure waste. */
  const Peek = ({ at }: { at: number }) => {
    const n = CREATORS[((at % CREATORS.length) + CREATORS.length) % CREATORS.length];
    const { still: nStill } = reelFor(n.handle);
    return (
      <div onClick={() => { setCi(at); setSi(0); }} style={{
        width: 140, height: "74vh", maxHeight: 680, borderRadius: 12, overflow: "hidden",
        position: "relative", cursor: "pointer", opacity: 0.45, flex: "none",
      }}>
        <Photo sizes={SIZES.story} src={nStill} seed={n.id} radius={12} />
      </div>
    );
  };
  return (
    <div className="overlay" style={{ background: "rgba(2,4,12,.9)" }} onClick={close}>
      <button onClick={close} style={{ position: "absolute", top: 24, right: 28, color: "#fff", zIndex: 1 }}>
        <Icon n="x" s={26} />
      </button>
      <div className="row gap16" style={{ alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={prev} style={{ color: "#fff", flex: "none" }}>
          <span style={{ display: "flex", transform: "rotate(180deg)" }}><Icon n="chevronRight" s={22} c="#fff" /></span>
        </button>
        <Peek at={ci - 2} />
        <Peek at={ci - 1} />

        <div className="col gap10" style={{ flex: "none" }}>
        <div style={{ width: "40vw", maxWidth: 460, height: "85vh", maxHeight: 800, borderRadius: 12, overflow: "hidden", position: "relative", flex: "none" }}>
          {loop
            ? <Loop key={`${c.id}-${si}`} src={loop} poster={still} radius={12} active={!paused} sound={!muted} />
            : <Photo sizes={SIZES.story} src={still} seed={`${c.id}-${si}`} radius={12} />}
          <div className="row gap4" style={{ position: "absolute", top: 10, left: 12, right: 12 }}>
            {Array.from({ length: segCount }).map((_, seg) => (
              <div key={seg} style={{ flex: 1, height: 3, borderRadius: 9, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
                {seg < si && <div style={{ height: "100%", background: "#fff" }} />}
                {seg === si && (
                  <div key={`${ci}-${si}`} style={{
                    height: "100%", background: "#fff", animation: "storyprog 4s linear forwards",
                    animationPlayState: paused ? "paused" : "running",
                  }} />
                )}
              </div>
            ))}
          </div>
          <div className="row between" style={{ position: "absolute", top: 22, left: 12, right: 12 }}>
            <div className="row gap10">
              <Avatar name={c.name} size={30} ring="#fff" />
              <div className="col"><span className="b7 t13" style={{ color: "#fff" }}>{c.name}</span><span style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>2h ago</span></div>
            </div>
            <div className="row gap6">
              <button style={{ color: "#fff" }} onClick={() => setMuted((m) => !m)}><Icon n={muted ? "volumeMute" : "volumeHigh"} s={17} /></button>
              <button style={{ color: "#fff" }} onClick={() => setPaused((p) => !p)}><Icon n={paused ? "play" : "pause"} s={17} /></button>
              <button style={{ color: "#fff" }}><Icon n="more" s={17} /></button>
            </div>
          </div>
          <div onClick={prev} style={{ position: "absolute", left: 0, top: 60, bottom: 60, width: "35%", cursor: "pointer" }} />
          <div onClick={next} style={{ position: "absolute", right: 0, top: 60, bottom: 60, width: "35%", cursor: "pointer" }} />
        </div>
        <div className="row gap8" onClick={(e) => e.stopPropagation()}>
          <input className="input" placeholder={`Reply to ${c.name.split(" ")[0]}…`}
            style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.16)", color: "#fff" }} />
          <button style={{ color: "#fff", flex: "none" }}><Icon n="heart" s={20} /></button>
          <button style={{ color: "#fff", flex: "none" }}><Icon n="send" s={20} /></button>
        </div>
        </div>

        <Peek at={ci + 1} />
        <Peek at={ci + 2} />
        <button onClick={next} style={{ color: "#fff", flex: "none" }}>
          <Icon n="chevronRight" s={22} c="#fff" />
        </button>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const [story, setStory] = useState<number | null>(null);
  const feed = S.feed();
  const suggested = CREATORS.filter((c) => !S.blocked[c.handle] && !S.muted[c.handle]).slice(0, 4);
  const liveNow = CREATORS.filter((c) => c.live && !S.blocked[c.handle]);
  return (
    <div className="content">
      <div className="split">
        <div className="grow col gap16 feedcol">
          <div className="card no-scrollbar" style={{ padding: 14, position: "relative", overflowX: "auto" }}>
            <div className="row gap16" style={{ minWidth: "max-content" }}>
              <div className="col center gap6" style={{ width: 66, cursor: "pointer" }}
                onClick={() => S.toast("Add to your story from the Create button", "ok")}>
                <div style={{ padding: 3, borderRadius: "50%", background: "var(--line2)" }}>
                  <div style={{ padding: 3, borderRadius: "50%", background: "var(--bg)" }}><Avatar name="You" size={56} /></div>
                </div>
                <span className="t12 muted">Your story</span>
              </div>
              {CREATORS.map((c, i) => ({ c, i })).filter(({ c }) => !c.live).map(({ c, i }) => (
                <div key={c.id} className="col center gap6" style={{ width: 66, cursor: "pointer" }}
                  onClick={() => setStory(i)}>
                  <div style={{ padding: 3, borderRadius: "50%", background: "var(--pink)" }}>
                    <div style={{ padding: 3, borderRadius: "50%", background: "var(--bg)" }}><Avatar name={c.name} size={56} /></div>
                  </div>
                  <span className="t12 muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 64 }}>{c.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            {/* Scroll affordance, not a control — the row itself is what scrolls.
                Sits over the last visible avatar the way the reference shows it,
                centered on the avatar row rather than the card (which also carries
                the caption line below). */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: 8,
                top: 14 + 28,
                transform: "translateY(-50%)",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--gray-12)",
                border: "1px solid var(--line2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              <Icon n="chevronRight" s={13} c="var(--gray-1)" />
            </div>
          </div>
          {story != null && <StoryViewer key={story} idx={story} close={() => setStory(null)} />}
          <div className="card" style={{ padding: 16 }}>
            <div className="row gap12">
              <Avatar name="You" size={40} />
              <input className="input" placeholder="Share something with your fans…" readOnly style={{ cursor: "pointer" }}
                onClick={() => S.openModal("compose")} />
            </div>
            <div className="row between" style={{ marginTop: 12 }}>
              <div className="row gap16 muted">
                {["camera", "play", "gift", "cal"].map((i) => (
                  <span key={i} style={{ cursor: "pointer" }} onClick={() => S.openModal("compose")}><Icon n={i} s={19} solid /></span>
                ))}
              </div>
              <div className="row gap10">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("/studio/live")}>
                  <Icon n="live" s={15} c="var(--coral-ink)" solid />Go Live
                </button>
                <button className="btn btn-blue btn-sm" onClick={() => S.openModal("compose")}>Post</button>
              </div>
            </div>
          </div>
          {feed.length === 0 && (
            <div className="card col center gap10" style={{ padding: 48, textAlign: "center" }}>
              <div className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="eye" c="var(--muted)" /></div>
              <div className="b7">You&apos;re all caught up</div>
              <div className="muted t13">You&apos;ve hidden or muted everything here. Undo from the toasts, or find creators in Explore.</div>
              <button className="btn btn-blue btn-sm" onClick={() => navigate("/explore")}>Open Explore</button>
            </div>
          )}
          {feed.map((p) => <PostCard key={p.id} p={p} />)}
        </div>
        <div className="col gap16 rail">
          <div className="card" style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="up muted">Your wallet</span>
              <CoinBadge v={S.coins.toLocaleString()} />
            </div>
            <div className="statnum mint" style={{ fontSize: 30 }}>$4,280.00</div>
            <div className="muted t13" style={{ margin: "4px 0 12px" }}>Balance this month</div>
            <button className="btn btn-coin btn-block btn-sm" onClick={() => S.openModal("coins")}>
              <Icon n="plus" s={15} />Buy coins
            </button>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="up muted" style={{ marginBottom: 12 }}>Suggested creators</div>
            {suggested.map((c) => (
              <div key={c.id} className="row between" style={{ padding: "8px 0" }}>
                <div className="row gap10" style={{ cursor: "pointer" }} onClick={() => navigate(`/creator/${c.handle}`)}>
                  <Avatar name={c.name} size={38} ring={c.live ? "var(--coral)" : undefined}
                    onClick={c.live ? (e) => { e.stopPropagation(); navigate(`/live/${c.handle}`); } : undefined} />
                  <div className="col">
                    <div className="row gap4 t14 b6 uname">{c.name.split(" ")[0]} {c.v && <Verified s={13} />}</div>
                    <div className="muted t12">@{c.handle}</div>
                  </div>
                </div>
                <FollowBtn handle={c.handle} />
              </div>
            ))}
          </div>
          {liveNow.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div className="up muted" style={{ marginBottom: 12 }}>Live feed</div>
              <div className="col gap16">
                {liveNow.map((c) => (
                  <div key={c.id} style={{ height: 140, borderRadius: 12, position: "relative", overflow: "hidden", cursor: "pointer" }}
                    onClick={() => navigate(`/live/${c.handle}`)}>
                    <Photo sizes={SIZES.rail} src={mediaFor(poolFor(c.handle), 0)} seed={c.id} />
                    <Scrim from={0.5} height="46%" top />
                    <Scrim from={0.75} height="68%" />
                    <div className="badge-live" style={{ position: "absolute", top: 10, left: 10 }}><span className="dot" />LIVE</div>
                    <div className="pill t12 onart" style={{ position: "absolute", top: 10, right: 10 }}>
                      {((fhash(c.id) % 800) / 10 + 5).toFixed(1)}K viewers
                    </div>
                    <div className="row gap8" style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
                      <Avatar name={c.name} size={32} />
                      <div className="col" style={{ minWidth: 0 }}>
                        <div className="t14 b6 uname" style={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {LIVE_TITLES[c.id] ?? `${c.name} is live`}
                        </div>
                        <div className="row gap4 t12" style={{ color: "rgba(255,255,255,.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.name} {c.v && <Verified s={11} />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
