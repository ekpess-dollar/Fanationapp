import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATORS, LIVE_TITLES, fhash, useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, Scrim, SIZES, Verified, mediaFor, poolFor } from "@/lib/ui";

const CATS = ["Trending", "Lifestyle", "Fitness", "Music", "Gaming", "Education", "Comedy", "Model", "Podcast", "Art"];

export default function ExplorePage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Trending");
  const match = (c: (typeof CREATORS)[number]) =>
    (cat === "Trending" || c.tag.toLowerCase().includes(cat.toLowerCase().slice(0, 5))) &&
    (!q || `${c.name}${c.handle}${c.tag}`.toLowerCase().includes(q.toLowerCase()));
  const list = CREATORS.filter((c) => !S.blocked[c.handle] && match(c));
  const liveList = list.filter((c) => c.live);
  return (
    <div className="content">
      <div className="search" style={{ maxWidth: "none", marginBottom: 20, border: "none" }}>
        <Icon n="search" s={18} />
        <input placeholder="Search creators, categories, posts…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="muted" onClick={() => setQ("")}><Icon n="x" s={15} /></button>}
      </div>
      <div className="row gap8 wrap" style={{ marginBottom: 22 }}>
        {CATS.map((t) => (
          <span key={t} className={"tag" + (cat === t ? " on" : "")} style={{ cursor: "pointer", border: "none" }} onClick={() => setCat(t)}>{t}</span>
        ))}
      </div>
      {liveList.length > 0 && (
        <>
          <div className="up" style={{ marginBottom: 10, color: "var(--gray-11)" }}>Live now</div>
          <div className="row gap16" style={{ overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
            {liveList.map((c) => (
              <div key={c.id} style={{ height: 140, width: 240, borderRadius: 12, overflow: "hidden", position: "relative", flex: "none", cursor: "pointer" }}
                onClick={() => navigate(`/live/${c.handle}`)}>
                {/* A live thumbnail is the creator's own frame, not a generic
                    tile — same pool their posts are dealt from. */}
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
        </>
      )}
      <div className="up" style={{ marginBottom: 12, color: "var(--gray-11)" }}>
        {cat === "Trending" ? "Top creators this week" : `${cat} creators`}
      </div>
      {list.length === 0 && (
        <div className="card col center gap10" style={{ padding: 52, textAlign: "center" }}>
          <div className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="search" c="var(--muted)" /></div>
          <div className="b7">No creators match</div>
          <div className="muted t13">Try a different category or clear your search.</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setQ(""); setCat("Trending"); }}>Clear filters</button>
        </div>
      )}
      <div className="grid g3 gap20">
        {list.map((c) => (
          <div key={c.id} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
            onClick={() => navigate(`/creator/${c.handle}`)}>
            <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
              <Photo sizes={SIZES.g3} src={mediaFor(poolFor(c.handle), 1)} seed={c.id} />
              {/* The name sits in white on this frame, so the wash is not
                  decoration — half the pool is a bright room. The top wash
                  carries the live badge for the same reason: a badge on a
                  white studio wall is unreadable. Earnings stay out of this
                  card entirely — another creator's income isn't something a
                  browsing fan should be able to read off a thumbnail. */}
              <Scrim from={0.86} height="62%" hold={0.34} />
              <Scrim from={0.45} height="38%" top />
              {c.live && <div className="badge-live" style={{ position: "absolute", top: 12, left: 12 }}><span className="dot" />LIVE</div>}
              <div style={{ position: "absolute", left: 14, bottom: 12 }}>
                <div className="row gap6 b7" style={{ color: "#fff" }}>{c.name} {c.v && <Verified s={14} />}</div>
                <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>{c.tag}</div>
              </div>
            </div>
            <div className="row between" style={{ padding: 14 }}>
              <span className="muted t13">@{c.handle}</span>
              {S.subs[c.handle]
                ? <span className="chip-mint" style={{ border: "none" }}><Icon n="check" s={12} />Subscribed</span>
                : <button className="btn btn-blue btn-sm" onClick={(e) => { e.stopPropagation(); S.openModal("subscribe", c); }}>
                    Subscribe · ${c.price}
                  </button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
