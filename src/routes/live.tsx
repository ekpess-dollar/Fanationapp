import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATORS, LIVE_TITLES, fhash, useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, Scrim, SIZES, Verified, mediaFor, poolFor } from "@/lib/ui";

/**
 * Who's live, browsable by category. Categories are derived from the live
 * creators themselves rather than Explore's full list — a chip for a
 * category nobody is currently streaming in is just a dead end.
 */
export default function LivePage() {
  const S = useAppStore();
  const navigate = useNavigate();
  const [cat, setCat] = useState("All");

  const liveCreators = CREATORS.filter((c) => c.live && !S.blocked[c.handle]);
  const cats = ["All", ...Array.from(new Set(liveCreators.map((c) => c.tag)))];
  const list = cat === "All" ? liveCreators : liveCreators.filter((c) => c.tag === cat);

  return (
    <div className="content">
      <h2 className="display t26" style={{ marginBottom: 2 }}>Live now</h2>
      <div className="muted t13" style={{ marginBottom: 20 }}>
        {liveCreators.length} creator{liveCreators.length === 1 ? "" : "s"} streaming right now
      </div>

      {cats.length > 1 && (
        <div className="row gap8 wrap" style={{ marginBottom: 22 }}>
          {cats.map((t) => (
            <span key={t} className={"tag" + (cat === t ? " on" : "")} style={{ cursor: "pointer", border: "none" }} onClick={() => setCat(t)}>
              {t}
            </span>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="card col center gap10" style={{ padding: 52, textAlign: "center" }}>
          <div className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="live" c="var(--muted)" /></div>
          <div className="b7">No one's live in {cat}</div>
          <div className="muted t13">Check back later, or browse another category.</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCat("All")}>Show all live</button>
        </div>
      )}

      <div className="grid g3 gap20">
        {list.map((c) => (
          <div key={c.id} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
            onClick={() => navigate(`/live/${c.handle}`)}>
            <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
              <Photo sizes={SIZES.g3} src={mediaFor(poolFor(c.handle), 0)} seed={c.id} />
              <Scrim from={0.86} height="62%" hold={0.34} />
              <Scrim from={0.45} height="38%" top />
              <div className="badge-live" style={{ position: "absolute", top: 12, left: 12 }}><span className="dot" />LIVE</div>
              <div className="pill t12 onart" style={{ position: "absolute", top: 12, right: 12 }}>
                <Icon n="eye" s={12} /> {((fhash(c.id) % 800) / 10 + 5).toFixed(1)}K
              </div>
              <div className="row gap8" style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
                <Avatar name={c.name} size={34} />
                <div className="col" style={{ minWidth: 0 }}>
                  <div className="t14 b6 uname" style={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {LIVE_TITLES[c.id] ?? `${c.name} is live`}
                  </div>
                  <div className="row gap4 t12" style={{ color: "rgba(255,255,255,.75)" }}>
                    {c.name} {c.v && <Verified s={11} />}
                  </div>
                </div>
              </div>
            </div>
            <div className="row between" style={{ padding: 14 }}>
              <span className="muted t13">{c.tag}</span>
              <span className="muted t13">@{c.handle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
