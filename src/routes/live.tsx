import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATORS, LIVE_TITLES, fhash, useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, SIZES, Verified, mediaFor, poolFor } from "@/lib/ui";

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

      {/* Thumbnail carries only the LIVE badge and the viewer count — every
          other real streaming directory (Twitch's included) puts the title,
          streamer and category below the frame rather than washed over it,
          which is what lets a dense grid stay scannable at a glance.

          `auto-fill`/`minmax` rather than a fixed `g4` — the column count is
          however many 220px cards fit the row, so collapsing the sidebar
          (see `_shell.tsx`) fits more per row, and expanding it wraps cards
          onto the next line instead of squeezing four narrower ones in.

          `minWidth: 0` overrides a grid item's default `min-width: auto` —
          without it, the one card whose title is too long to wrap (it's
          `white-space: nowrap`, truncated with an ellipsis) forces its own
          track wider than the others instead of actually shrinking to fit,
          which is what the ellipsis is there for. */}
      <div className="grid gap20" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {list.map((c) => (
          <div key={c.id} className="col gap10" style={{ cursor: "pointer", minWidth: 0 }}
            onClick={() => navigate(`/live/${c.handle}`)}>
            <div style={{ height: 160, borderRadius: 12, position: "relative", overflow: "hidden" }}>
              <Photo sizes={SIZES.g4} src={mediaFor(poolFor(c.handle), 0)} seed={c.id} />
              <div className="badge-live" style={{ position: "absolute", top: 10, left: 10 }}><span className="dot" />LIVE</div>
              <div className="pill t11 onart" style={{ position: "absolute", left: 10, bottom: 10 }}>
                <Icon n="eye" s={11} /> {((fhash(c.id) % 800) / 10 + 5).toFixed(1)}K
              </div>
            </div>
            <div className="row gap8" style={{ alignItems: "flex-start" }}>
              <Avatar name={c.name} size={36} />
              <div className="col" style={{ minWidth: 0 }}>
                <div className="t14 b6" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {LIVE_TITLES[c.id] ?? `${c.name} is live`}
                </div>
                <div className="row gap4 t13 uname" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name} {c.v && <Verified s={11} />}
                </div>
                <div className="muted2 t12">{c.tag}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
