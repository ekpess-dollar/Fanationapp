import { useState } from "react";
import { byHandle, seedCommentsFor, useAppStore } from "@/lib/core";
import type { Post } from "@/lib/core";
import { Avatar, Icon, Loop, Menu, Photo, SIZES, Verified, postMediaFor, postVideoFor, useInView } from "@/lib/ui";

const EMOJIS = ["❤️", "🔥", "😂", "😍", "👏"];

/**
 * The feed column is 640 wide and the photographs are cropped 3:2, so 420 is
 * very close to the height the picture wants to be — the frame crops a sliver
 * off the top and bottom rather than slicing the subject in half. The lock is
 * shorter on purpose: it is a teaser, and a shorter frame reads as one.
 */
const MEDIA_H = 420;
const LOCKED_H = 320;

/**
 * The media on a post.
 *
 * Video posts autoplay muted, the way Instagram's web feed does, but only
 * while they are on screen — `useInView` is what keeps the other eight clips
 * paused on their poster frame. Clicking toggles play, so a person who wants a
 * still can have one. There is no sound control here: the loops carry no audio
 * track, and a speaker button that does nothing is worse than no button.
 */
function PostMedia({ p, onToggle, playing }: { p: Post; playing: boolean; onToggle: () => void }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const src = postMediaFor(p);
  const loop = postVideoFor(p);
  const isVideo = p.type === "video" && !!loop;

  return (
    <div ref={ref} onClick={isVideo ? onToggle : undefined}
      style={{ height: MEDIA_H, borderRadius: 14, position: "relative", overflow: "hidden", cursor: isVideo ? "pointer" : "default" }}>
      {isVideo ? (
        <Loop src={loop} poster={src} active={inView && playing} radius={14} />
      ) : (
        <Photo sizes={SIZES.feedCard} src={src} seed={p.seed} alt="" radius={14} />
      )}
      {isVideo && !playing && (
        <div className="row center" style={{ position: "absolute", inset: 0 }}>
          <div className="feature-ic" style={{ width: 56, height: 56, background: "rgba(0,0,0,.42)" }}>
            <Icon n="play" s={24} c="#fff" fill="#fff" />
          </div>
        </div>
      )}
      {p.dur && (
        <div className="pill t12 onart" style={{ position: "absolute", bottom: 10, right: 10 }}>
          {p.dur}
        </div>
      )}
    </div>
  );
}

export function FollowBtn({ handle }: { handle: string }) {
  const on = useAppStore((s) => !!s.follows[handle]);
  const toggleFollow = useAppStore((s) => s.toggleFollow);
  return (
    <button className={"btn btn-sm " + (on ? "btn-ghost" : "btn-blue")}
      onClick={(e) => { e.stopPropagation(); toggleFollow(handle); }}>
      {on ? "Following" : "Follow"}
    </button>
  );
}

/** Full-action post card — the atom of the fan experience. */
export function PostCard({ p }: { p: Post }) {
  const S = useAppStore();
  const [showC, setShowC] = useState(false);
  const [showR, setShowR] = useState(false);
  const [ctext, setCtext] = useState("");
  const [playing, setPlaying] = useState(true);
  const liked = !!S.liked[p.id];
  const savedP = !!S.saved[p.id];
  const isSub = !!S.subs[p.h];
  const isUnlocked = !!S.unlocked[p.id];
  const voted = S.votes[p.id];
  const rx = S.reacts[p.id];
  const myC = S.comments[p.id] ?? [];
  const seeds = p.mine ? [] : seedCommentsFor(p.id);
  const sendC = () => {
    const v = ctext.trim();
    if (!v) return;
    S.addComment(p.id, v);
    setCtext("");
  };
  const menu = p.mine
    ? [
        { ic: "repost", t: "Copy link", fn: () => S.toast(`Link copied — fanation.app/p/${p.id}`) },
        "-" as const,
        { ic: "x", t: "Delete post", danger: true, fn: () => S.delPost(p.id) },
      ]
    : [
        { ic: "bookmark", t: savedP ? "Remove from collection" : "Save to collection", fn: () => S.toggleSave(p.id) },
        { ic: "repost", t: "Copy link", fn: () => S.toast(`Link copied — fanation.app/p/${p.id}`) },
        "-" as const,
        { ic: "eye", t: "Not interested", fn: () => S.hide(p.id) },
        { ic: "bell", t: `Mute @${p.h}`, fn: () => S.mute(p.h) },
        { ic: "shield", t: `Block @${p.h}`, danger: true, fn: () => S.block(p.h) },
        S.reported[p.id]
          ? { ic: "flag", t: "Reported ✓", off: true }
          : { ic: "flag", t: "Report post", danger: true, fn: () => S.openModal("report", p) },
      ];

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row between">
        <div className="row gap12">
          <Avatar name={p.who} size={44} />
          <div className="col">
            <div className="row gap6">
              <span className="b7 t14">{p.who}</span>
              {p.v && <Verified />}
              {isSub && !p.mine && <span className="tag" style={{ padding: "1px 8px", fontSize: 10.5, color: "var(--blueL-ink)", borderColor: "rgba(37,153,246,.35)" }}>Subscribed</span>}
              {p.mine && p.vis && <span className="tag" style={{ padding: "1px 8px", fontSize: 10.5 }}>{p.vis}</span>}
            </div>
            <div className="muted t13">@{p.h} · {p.t}</div>
          </div>
        </div>
        <Menu items={menu} />
      </div>
      <div className="t14" style={{ margin: "13px 0", lineHeight: 1.55 }}>{p.text}</div>

      {(p.type === "image" || p.type === "video") && (
        <PostMedia p={p} playing={playing} onToggle={() => setPlaying((v) => !v)} />
      )}

      {p.poll && (
        <div className="col gap8" style={{ marginBottom: 4 }}>
          {p.poll.map((o, i) => {
            const pct = voted == null ? o.pct : voted === i ? Math.min(99, o.pct + 1) : Math.max(1, o.pct - 1);
            return (
              <div key={i} className="hair" onClick={() => { if (voted == null) S.vote(p.id, i); }}
                style={{ position: "relative", padding: "11px 14px", borderRadius: 12, overflow: "hidden", cursor: voted == null ? "pointer" : "default", borderColor: voted === i ? "var(--blue-ink)" : "var(--line)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: voted === i ? "rgba(37,153,246,.3)" : "rgba(37,153,246,.14)", transition: ".4s" }} />
                <div className="row between" style={{ position: "relative" }}>
                  <span className="row gap8 b6 t14">{voted === i && <Icon n="check" s={14} c="var(--blueL-ink)" />}{o.label}</span>
                  <span className="muted t13">{pct}%</span>
                </div>
              </div>
            );
          })}
          <div className="muted t12">{voted == null ? "1,204 votes · 2 days left" : "1,205 votes · you voted · 2 days left"}</div>
        </div>
      )}

      {p.type === "locked" && !isUnlocked && (
        <div className="locked" style={{ height: LOCKED_H }}>
          {/* Same photograph the unlocked branch shows, blurred in CSS rather
              than pre-blurred into a second file — unlocking has to reveal the
              picture the blur was hiding, not swap in a different one. The
              oversize scale covers the soft rim a blur leaves at the edges. */}
          <Photo sizes={SIZES.feedCard} src={postMediaFor(p)} seed={p.seed} blur={10} scale={1.12} />
          <div className="lockcover">
            <div className="feature-ic" style={{ background: "rgba(37,153,246,.16)" }}><Icon n="lock" c="var(--blueL)" /></div>
            <div className="b7" style={{ color: "#fff" }}>{isSub ? "Pay-per-view drop" : "Exclusive locked content"}</div>
            <div className="row gap8">
              {!isSub && <button className="btn btn-ghost btn-sm" onClick={() => S.openModal("subscribe", byHandle(p.h))}>Subscribe</button>}
              <button className="btn btn-blue btn-sm" onClick={() => S.openModal("ppv", p)}>Unlock · {p.price} coins</button>
            </div>
          </div>
        </div>
      )}
      {p.type === "locked" && isUnlocked && (
        <div style={{ height: MEDIA_H, borderRadius: 14, position: "relative", overflow: "hidden" }}>
          <Photo sizes={SIZES.feedCard} src={postMediaFor(p)} seed={p.seed} radius={14} />
          <span className="chip-mint onart" style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}><Icon n="check" s={12} />Unlocked</span>
        </div>
      )}

      {/* `postbar`/`postacts` exist only so the phone breakpoint can tighten these
          gaps — at 390px the default 20px spacing runs the row past the card. */}
      <div className="row between postbar" style={{ marginTop: 14 }}>
        <div className="row gap20 postacts" style={{ position: "relative" }}>
          <button className="row gap6 muted" onClick={() => S.toggleLike(p.id)} style={{ color: liked ? "var(--coral-ink)" : "" }}>
            <Icon n="heart" s={19} fill={liked ? "var(--coral-ink)" : undefined} />
            {(p.likes + (liked ? 1 : 0)).toLocaleString()}
          </button>
          <button className="row gap6 muted" onClick={() => setShowC((v) => !v)} style={{ color: showC ? "var(--blueL-ink)" : "" }}>
            <Icon n="comment" s={19} />{p.comments + myC.length}
          </button>
          <button className="row gap6 muted" onClick={() => S.toast("Reposted to your profile", "ok")}>
            <Icon n="repost" s={19} />
          </button>
          <button className="row gap4 muted" onClick={() => setShowR((v) => !v)} style={{ fontSize: 15 }}>
            {rx || "🙂"}<Icon n="plus" s={12} />
          </button>
          {showR && (
            <div className="menu row gap4" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 120, minWidth: 0, padding: "7px 9px" }}>
              {EMOJIS.map((e) => (
                <span key={e} onClick={() => { S.setReact(p.id, e); setShowR(false); }}
                  style={{ fontSize: 20, cursor: "pointer", padding: "2px 4px", transform: rx === e ? "scale(1.25)" : "none" }}>
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="row gap12">
          <span className="chip-coin"><Icon n="coin" s={13} />{p.coins}</span>
          {!p.mine && (
            <button className="btn btn-ghost btn-sm" onClick={() => S.openModal("gift", byHandle(p.h))}>
              <Icon n="gift" s={15} />Gift
            </button>
          )}
        </div>
      </div>

      {showC && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {seeds.map((c, i) => (
            <div key={i} className="row gap10" style={{ padding: "7px 0", alignItems: "flex-start" }}>
              <Avatar name={c[0]} size={30} />
              <div className="col">
                <span className="t13"><b>{c[0]}</b> <span className="muted2">@{c[1]}</span></span>
                <span className="t14">{c[2]}</span>
              </div>
            </div>
          ))}
          {myC.map((c, i) => (
            <div key={`m${i}`} className="row gap10" style={{ padding: "7px 0", alignItems: "flex-start" }}>
              <Avatar name="You" size={30} />
              <div className="col">
                <span className="t13"><b>You</b> <span className="muted2">@yourhandle · now</span></span>
                <span className="t14">{c}</span>
              </div>
            </div>
          ))}
          <div className="row gap10" style={{ marginTop: 8 }}>
            <Avatar name="You" size={32} />
            <input className="input" placeholder="Add a comment…" value={ctext} style={{ padding: "9px 13px" }}
              onChange={(e) => setCtext(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendC(); }} />
            <button className="btn btn-blue btn-sm" disabled={!ctext.trim()} onClick={sendC}><Icon n="send" s={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
