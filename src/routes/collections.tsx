import { useState } from "react";
import { CREATORS, SEED_FEED, useAppStore } from "@/lib/core";
import { Avatar, Icon, Photo, SIZES, Verified, postMediaFor } from "@/lib/ui";
import { FollowBtn } from "@/components/post-card";

export default function CollectionsPage() {
  const S = useAppStore();
  const [tab, setTab] = useState("Bookmarks");
  const savedPosts = [...S.myPosts, ...SEED_FEED].filter((p) => S.saved[p.id]);
  const subCs = CREATORS.filter((c) => S.subs[c.handle]);
  const folCs = CREATORS.filter((c) => S.follows[c.handle]);
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 16 }}>Collections</h2>
      <div className="row gap24" style={{ borderBottom: "1px solid var(--line)", marginBottom: 20 }}>
        {["Bookmarks", "Subscriptions", "Following"].map((t) => (
          <div key={t} onClick={() => setTab(t)}
            style={{ padding: "10px 2px", cursor: "pointer", fontWeight: 600, color: tab === t ? "var(--text)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--blue-ink)" : "2px solid transparent" }}>
            {t}{t === "Bookmarks" && savedPosts.length > 0 && <span className="tag" style={{ marginLeft: 8, padding: "1px 8px", fontSize: 11 }}>{savedPosts.length}</span>}
          </div>
        ))}
      </div>
      {tab === "Bookmarks" && (savedPosts.length === 0 ? (
        <div className="card col center gap10" style={{ padding: 52, textAlign: "center" }}>
          <div className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="bookmark" c="var(--muted)" /></div>
          <div className="b7">Nothing saved yet</div>
          <div className="muted t13">Tap &ldquo;Save to collection&rdquo; on any post&apos;s ⋯ menu and it lands here.</div>
        </div>
      ) : (
        <div className="grid g3 gap16">
          {savedPosts.map((p) => {
            /* A saved post keeps the photograph it had in the feed. One still
               locked stays blurred here too — bookmarking a PPV drop is not a
               way to see it for free. */
            const lk = p.type === "locked" && !S.unlocked[p.id];
            return (
            <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 150, position: "relative", overflow: "hidden" }}>
                <Photo sizes={SIZES.g3} src={postMediaFor(p)} seed={`sv${p.id}`} blur={lk ? 10 : undefined} scale={lk ? 1.12 : undefined} />
                {lk && (
                  <span className="chip-coin onart" style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px", zIndex: 1 }}><Icon n="lock" s={11} />PPV</span>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <div className="b6 t13" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.text}</div>
                <div className="row between" style={{ marginTop: 6 }}>
                  <span className="muted t12">@{p.h}</span>
                  <button className="muted" onClick={() => S.toggleSave(p.id)}><Icon n="x" s={14} /></button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ))}
      {tab === "Subscriptions" && (
        <div className="grid g3 gap16">
          {subCs.map((c) => (
            <div key={c.id} className="card" style={{ padding: 16 }}>
              <div className="row gap12">
                <Avatar name={c.name} size={46} />
                <div className="col">
                  <div className="row gap6 b7 t14">{c.name} {c.v && <Verified s={13} />}</div>
                  <div className="muted t12">@{c.handle}</div>
                </div>
              </div>
              <div className="row between" style={{ marginTop: 14 }}>
                <span className="chip-mint">Active</span>
                <span className="muted t12">Renews Aug 17</span>
              </div>
            </div>
          ))}
          {subCs.length === 0 && (
            <div className="card col center gap8" style={{ padding: 40, gridColumn: "1/-1" }}>
              <div className="b7">No active subscriptions</div>
              <div className="muted t13">Subscribe to a creator and they&apos;ll appear here.</div>
            </div>
          )}
        </div>
      )}
      {tab === "Following" && (folCs.length === 0 ? (
        <div className="card col center gap10" style={{ padding: 52, textAlign: "center" }}>
          <div className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="users" c="var(--muted)" /></div>
          <div className="b7">You&apos;re not following anyone yet</div>
          <div className="muted t13">Hit Follow on any creator — free, no subscription needed.</div>
        </div>
      ) : (
        <div className="grid g3 gap16">
          {folCs.map((c) => (
            <div key={c.id} className="card row between" style={{ padding: 16 }}>
              <div className="row gap12">
                <Avatar name={c.name} size={44} />
                <div className="col">
                  <div className="row gap6 b7 t14">{c.name} {c.v && <Verified s={13} />}</div>
                  <div className="muted t12">@{c.handle}</div>
                </div>
              </div>
              <FollowBtn handle={c.handle} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
