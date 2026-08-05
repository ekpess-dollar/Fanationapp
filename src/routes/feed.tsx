import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATORS, useAppStore } from "@/lib/core";
import { Avatar, CoinBadge, Icon, Loop, Photo, SIZES, Verified, reelFor } from "@/lib/ui";
import { FollowBtn, PostCard } from "@/components/post-card";

function StoryViewer({ idx, close }: { idx: number; close: () => void }) {
  const [i, setI] = useState(idx);
  const c = CREATORS[((i % CREATORS.length) + CREATORS.length) % CREATORS.length];
  /* A story is vertical, so it draws the creator's 9:16 frame — the same
     footage their reel is cut from, which is what a story actually is. */
  const { still, loop } = reelFor(c.handle);
  useEffect(() => {
    const t = setTimeout(() => setI((v) => v + 1), 4000);
    return () => clearTimeout(t);
  }, [i]);
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
  return (
    <div className="overlay" style={{ background: "rgba(2,4,12,.9)" }} onClick={close}>
      <div style={{ width: 380, height: 640, borderRadius: 22, overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        {loop ? <Loop key={c.id} src={loop} poster={still} radius={22} /> : <Photo sizes={SIZES.story} src={still} seed={c.id} radius={22} />}
        <div style={{ position: "absolute", top: 10, left: 12, right: 12, height: 3, borderRadius: 9, background: "rgba(255,255,255,.25)" }}>
          <div key={i} style={{ height: "100%", borderRadius: 9, background: "#fff", animation: "storyprog 4s linear forwards" }} />
        </div>
        <div className="row between" style={{ position: "absolute", top: 22, left: 12, right: 12 }}>
          <div className="row gap10">
            <Avatar name={c.name} size={36} ring="#fff" />
            <div className="col"><span className="b7 t13" style={{ color: "#fff" }}>{c.name}</span><span style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>2h ago</span></div>
          </div>
          <button onClick={close} style={{ color: "#fff" }}><Icon n="x" s={20} /></button>
        </div>
        <div onClick={() => setI(i - 1)} style={{ position: "absolute", left: 0, top: 60, bottom: 60, width: "35%", cursor: "pointer" }} />
        <div onClick={() => setI(i + 1)} style={{ position: "absolute", right: 0, top: 60, bottom: 60, width: "35%", cursor: "pointer" }} />
        <div className="row gap8" style={{ position: "absolute", left: 12, right: 12, bottom: 14 }}>
          <input className="input" placeholder={`Reply to ${c.name.split(" ")[0]}…`} onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(0,0,0,.4)", borderColor: "rgba(255,255,255,.3)", color: "#fff" }} />
          <button className="btn btn-grad btn-sm" style={{ flex: "none" }}><Icon n="heart" s={15} /></button>
        </div>
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
  return (
    <div className="content">
      <div className="split">
        <div className="grow col gap16 feedcol">
          <div className="card" style={{ padding: 14, overflowX: "auto" }}>
            <div className="row gap16" style={{ minWidth: "max-content" }}>
              <div className="col center gap6" style={{ width: 66, cursor: "pointer" }}
                onClick={() => S.toast("Add to your story from the Create button", "ok")}>
                <div style={{ padding: 2.5, borderRadius: "50%", background: "var(--line2)" }}>
                  <div style={{ padding: 2, borderRadius: "50%", background: "var(--bg)" }}><Avatar name="You" size={52} /></div>
                </div>
                <span className="t12 muted">Your story</span>
              </div>
              {CREATORS.map((c, i) => (
                <div key={c.id} className="col center gap6" style={{ width: 66, cursor: "pointer" }}
                  onClick={() => (c.live ? navigate("/live") : setStory(i))}>
                  <div style={{ padding: 2.5, borderRadius: "50%", background: c.live ? "var(--red)" : "var(--grad)" }}>
                    <div style={{ padding: 2, borderRadius: "50%", background: "var(--bg)" }}><Avatar name={c.name} size={52} /></div>
                  </div>
                  <span className="t12 muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 64 }}>{c.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
          {story != null && <StoryViewer idx={story} close={() => setStory(null)} />}
          <div className="card" style={{ padding: 16 }}>
            <div className="row gap12">
              <Avatar name="You" size={40} />
              <input className="input" placeholder="Share something with your fans…" readOnly style={{ cursor: "pointer" }}
                onClick={() => S.openModal("compose")} />
            </div>
            <div className="row between" style={{ marginTop: 12 }}>
              <div className="row gap16 muted">
                {["camera", "play", "gift", "cal"].map((i) => (
                  <span key={i} style={{ cursor: "pointer" }} onClick={() => S.openModal("compose")}><Icon n={i} s={19} /></span>
                ))}
              </div>
              <div className="row gap10">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("/live")}>
                  <Icon n="live" s={15} c="var(--coral-ink)" />Go Live
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
            <button className="btn btn-grad btn-block btn-sm" onClick={() => S.openModal("coins")}>
              <Icon n="plus" s={15} />Buy coins
            </button>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="up muted" style={{ marginBottom: 12 }}>Suggested creators</div>
            {suggested.map((c) => (
              <div key={c.id} className="row between" style={{ padding: "8px 0" }}>
                <div className="row gap10" style={{ cursor: "pointer" }} onClick={() => navigate(`/creator/${c.handle}`)}>
                  <Avatar name={c.name} size={38} />
                  <div className="col">
                    <div className="row gap4 t14 b6">{c.name.split(" ")[0]} {c.v && <Verified s={13} />}</div>
                    <div className="muted t12">@{c.handle}</div>
                  </div>
                </div>
                <FollowBtn handle={c.handle} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
