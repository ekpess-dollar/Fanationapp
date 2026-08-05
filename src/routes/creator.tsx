import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEED_FEED, byHandle, useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, SIZES, Verified, coverFor, gridFor } from "@/lib/ui";
import { FollowBtn, PostCard } from "@/components/post-card";

/**
 * `/creator/:handle`. The handle comes off the URL, so it is `string | undefined`
 * until the router has matched — `byHandle` falls back to the first seeded creator
 * rather than throwing, which keeps a hand-typed or stale link on a real page.
 */
export default function CreatorProfilePage() {
  const { handle = "" } = useParams<{ handle: string }>();
  const S = useAppStore();
  const navigate = useNavigate();
  const c = byHandle(handle);
  const [tab, setTab] = useState("Posts");
  const isSub = !!S.subs[c.handle];
  const posts = SEED_FEED.filter((p) => p.h === c.handle).slice(0, 6);
  return (
    <div>
      {/* The covers are cropped 3:1 (1500×500) for exactly this strip. Nothing
          is written on it — the avatar is the only thing that overlaps it — so
          it needs no scrim. */}
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        <Photo sizes={SIZES.cover} src={coverFor(c.handle)} seed={c.id} />
      </div>
      {/* The avatar alone rides up into the photograph; the name, handle and
          counts sit below it on the page background. Pulling the whole header
          block up put the name inside the cover, and a third of the covers are
          near-white — no amount of scrim makes white type readable there. */}
      <div className="content" style={{ marginTop: -52 }}>
        <div style={{ width: 112, height: 112, boxSizing: "border-box", border: "4px solid var(--bg)", borderRadius: "50%" }}>
          <Avatar name={c.name} size={104} />
        </div>
        <div className="row between wrap" style={{ alignItems: "flex-end", gap: 16, marginTop: 14 }}>
          <div className="col gap4">
            <div className="row gap8 t24 b7">{c.name} {c.v && <Verified s={18} />} {c.live && <span className="badge-live"><span className="dot" />LIVE</span>}</div>
            <div className="muted">@{c.handle} · {c.tag}</div>
            <div className="row gap16 muted t13" style={{ marginTop: 4 }}>
              <span><b className="mint">8,412</b> subscribers</span><span><b>326</b> posts</span><span><b>1.2M</b> likes</span>
            </div>
          </div>
          <div className="row gap10">
            <FollowBtn handle={c.handle} />
            <button className="btn btn-ghost" onClick={() => navigate("/messages")}><Icon n="msg" s={16} />Message</button>
            {isSub ? (
              <button className="btn btn-ghost" style={{ color: "var(--mint-ink)", borderColor: "var(--mint-edge)" }} onClick={() => navigate("/subscriptions")}>
                <Icon n="check" s={16} />Subscribed
              </button>
            ) : (
              <button className="btn btn-blue" onClick={() => S.openModal("subscribe", c)}>Subscribe · ${c.price}/mo</button>
            )}
          </div>
        </div>
        <div className="row gap24" style={{ margin: "22px 0 0", borderBottom: "1px solid var(--line)" }}>
          {["Posts", "Media"].map((t) => (
            <div key={t} onClick={() => setTab(t)}
              style={{ padding: "12px 2px", cursor: "pointer", fontWeight: 600, color: tab === t ? "var(--text)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--blue-ink)" : "2px solid transparent" }}>
              {t}
            </div>
          ))}
        </div>
        <div className="split" style={{ marginTop: 20 }}>
          <div className="grow col gap16" style={{ maxWidth: 620 }}>
            {tab === "Media" ? (
              <div className="grid g3 gap10">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="card" style={{ padding: 0, overflow: "hidden", aspectRatio: "1", position: "relative", cursor: "pointer" }}
                    onClick={() => { if (i % 4 === 0) S.openModal("ppv", { id: `pm${i}`, price: 150, who: c.name }); }}>
                    <Photo sizes={SIZES.profileGrid} src={gridFor(c.handle, i)} seed={`prof${i}`} />
                    {i % 4 === 0 && <div className="chip-coin onart" style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px" }}><Icon n="lock" s={11} />PPV</div>}
                    {i % 5 === 2 && <div className="pill t12 onart" style={{ position: "absolute", bottom: 8, right: 8 }}><Icon n="play" s={11} /></div>}
                  </div>
                ))}
              </div>
            ) : posts.map((p) => <PostCard key={p.id} p={p} />)}
            {tab === "Posts" && posts.length === 0 && (
              <div className="card col center gap8" style={{ padding: 40 }}>
                <div className="b7">No posts in this seed</div>
                <div className="muted t13">This creator&apos;s posts populate from the API at integration.</div>
              </div>
            )}
          </div>
          <div className="col gap16 rail">
            <div className="card" style={{ padding: 18 }}>
              <div className="b7 t18" style={{ marginBottom: 4 }}>Subscribe to {c.name.split(" ")[0]}</div>
              <div className="muted t13" style={{ marginBottom: 14 }}>Unlock all posts, live streams, and DMs.</div>
              {([["1 month", `$${c.price}`], ["3 months", `$${Math.round(c.price * 2.5)} · save 17%`], ["12 months", `$${Math.round(c.price * 9.2)} · save 24%`]] as const).map((b, i) => (
                <div key={i} className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8, cursor: "pointer" }}
                  onClick={() => S.openModal("subscribe", c)}>
                  <span className="b6 t14">{b[0]}</span><span className="blue b7">{b[1]}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div className="row gap10" style={{ marginBottom: 10 }}>
                <button className="btn btn-ghost btn-sm grow" onClick={() => S.openModal("gift", c)}><Icon n="gift" s={14} />Gift</button>
                <button className="btn btn-ghost btn-sm grow" onClick={() => S.openModal("tip", c)}><Icon n="dollar" s={14} />Tip</button>
              </div>
              <div className="muted2 t12">Gifts and tips go 80% to the creator.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
