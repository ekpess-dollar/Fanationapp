import { useEffect, useRef, useState } from "react";
import { LIVE_LINES, LIVE_NAMES, useAppStore } from "@/lib/core";
import { Avatar, Icon, Loop, Photo, SIZES, Verified, reelFor } from "@/lib/ui";
import { FollowBtn } from "@/components/post-card";

type ChatLine = [string, string, string];
interface Fly { id: string; txt: string; x: number }

/** Live viewer — full simulation: chat streams, viewers/earnings tick, gifts fly.
    Production: feed this state machine from the RTC data channel (Agora/LiveKit). */
export default function LivePage() {
  const S = useAppStore();
  const [chat, setChat] = useState<ChatLine[]>([
    ["@marcus_t", "joined the stream", ""],
    ["@jayden", "sent 500 coins", "coin"],
    ["@priscilla", "sent a $25 gift 🎁", "gift"],
    ["@superfan", "sent 200 coins", "coin"],
    ["@zara_ali", "this set is insane 😍", "msg"],
  ]);
  const [viewers, setViewers] = useState(4218);
  const [earned, setEarned] = useState(1240);
  const [likes, setLikes] = useState(28400);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [dur, setDur] = useState(2645);
  const [msg, setMsg] = useState("");
  const [heart, setHeart] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const n = useRef(6);

  useEffect(() => {
    const id = setInterval(() => {
      n.current++;
      const k = n.current;
      const name = LIVE_NAMES[(k * 7) % LIVE_NAMES.length];
      const line = LIVE_LINES[(k * 3 + (k % 4)) % LIVE_LINES.length];
      setChat((c) => [...c, [name, line[0], line[1]] as ChatLine].slice(-24));
      setViewers((v) => Math.max(3600, v + ((k * 17) % 94) - 40));
      setLikes((l) => l + ((k * 11) % 40) + 3);
      if (line[1] === "coin") setEarned((e) => +(e + [50, 200, 500, 1000][k % 4] * 0.012).toFixed(2));
      if (line[1] === "gift") {
        const g = [10, 25, 50][k % 3];
        setEarned((e) => +(e + g).toFixed(2));
        setFlies((f) => [...f, { id: `s${k}`, txt: `🎁 $${g}`, x: 12 + ((k * 29) % 64) }].slice(-5));
      }
    }, 1900);
    const tick = setInterval(() => setDur((d) => d + 1), 1000);
    return () => { clearInterval(id); clearInterval(tick); };
  }, []);
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [chat]);

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const tone = (t: string): [string, string, string] =>
    t === "coin" ? ["rgba(252,164,75,.13)", "rgba(252,164,75,.34)", "var(--amber-ink)"]
      : t === "gift" ? ["rgba(93,221,144,.14)", "rgba(93,221,144,.36)", "var(--mint-ink)"]
        : t === "sub" || t === "me" ? ["rgba(37,153,246,.14)", "rgba(37,153,246,.36)", "var(--blueL-ink)"]
          : ["", "", "var(--text)"];
  /* The stream itself: Elena's own 9:16 footage, the same reel her story and
     her card draw from — one creator, one look. */
  const { still, loop } = reelFor("elenalive");
  const sendChat = () => {
    const v = msg.trim();
    if (!v) return;
    setChat((c) => [...c, ["@you", v, "me"] as ChatLine].slice(-24));
    setMsg("");
  };
  const sendGift = (emoji: string, cost: number) => {
    if (!S.spend(cost, `Live gift ${emoji} to Elena`)) { S.openModal("coins"); return; }
    n.current++;
    const k = n.current;
    setChat((c) => [...c, ["@you", `sent ${emoji} · ${cost} coins`, "gift"] as ChatLine].slice(-24));
    setFlies((f) => [...f, { id: `m${k}`, txt: `${emoji} ${cost}`, x: 12 + ((k * 29) % 64) }].slice(-5));
    setEarned((e) => +(e + cost * 0.01).toFixed(2));
    S.toast(`Gift ${emoji} sent to Elena`, "ok");
  };

  return (
    <div className="content" style={{ maxWidth: "none" }}>
      <div className="row between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div className="col">
          <h2 className="display t26" style={{ marginBottom: 2 }}>Live now</h2>
          <div className="muted t13">Watching Elena Rusk · streaming to {viewers.toLocaleString()} fans</div>
        </div>
        <div className="row gap10">
          <span className="chip-coin"><Icon n="coin" s={13} />{S.coins.toLocaleString()}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => S.openModal("coins")}><Icon n="coin" s={15} c="var(--amber-ink)" />Top up</button>
          <button className="btn btn-grad btn-sm" onClick={() => sendGift("🎁", 200)}><Icon n="gift" s={15} />Send gift</button>
        </div>
      </div>
      <div className="split" style={{ alignItems: "stretch", gap: 20 }}>
        <div className="grow stage">
          <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative", height: 520 }}>
            {/* Elena streams from a phone, so the source is 9:16 sitting inside
                a wide player. Every real platform fills the dead space with a
                blown-up blur of the same frame — black bars read as a broken
                player, not as a stream. */}
            {loop ? (
              <>
                <Photo sizes={SIZES.stage} src={still} seed="liveelena" blur={30} scale={1.2} />
                <Loop src={loop} poster={still} fit="contain" priority style={{ background: "transparent" }} />
              </>
            ) : (
              <Photo sizes={SIZES.stage} src={still} seed="liveelena" />
            )}
            <div className="badge-live" style={{ position: "absolute", top: 16, left: 16, animation: "pulseglow 2s infinite" }}>
              <span className="dot" />LIVE · {mmss(dur)}
            </div>
            <div className="pill t12 onart" style={{ position: "absolute", top: 16, right: 16 }}><Icon n="eye" s={13} /> {viewers.toLocaleString()} watching</div>
            {flies.map((f) => <div key={f.id} className="giftfly" style={{ left: `${f.x}%`, bottom: 96 }}>{f.txt}</div>)}
            <div className="glass onart row gap6" style={{ position: "absolute", right: 16, bottom: 92, padding: "7px 11px" }}>
              <Icon n="heart" s={14} c="var(--coral)" fill="var(--coral)" />
              <span className="b7 t13">{likes.toLocaleString()}</span>
            </div>
            <div className="glass onart row gap10" style={{ position: "absolute", left: 16, bottom: 16, padding: "10px 14px" }}>
              <div className="feature-ic" style={{ width: 34, height: 34, background: "rgba(93,221,144,.15)" }}><Icon n="dollar" s={15} c="var(--mint)" /></div>
              <div className="col">
                <span className="muted2 t12">Earned this stream</span>
                <span className="display t18 mint">${earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div className="row between" style={{ marginTop: 14, flexWrap: "wrap", gap: 10 }}>
            <div className="row gap12">
              <Avatar name="Elena Rusk" size={44} ring="var(--coral)" />
              <div className="col">
                <div className="row gap6 b7">Elena Rusk <Verified s={14} /></div>
                <div className="muted t13">Streamer · Live now</div>
              </div>
            </div>
            <div className="row gap10">
              <button className="btn btn-ghost btn-sm" onClick={() => { setHeart(!heart); setLikes((l) => l + (heart ? -1 : 1)); }}
                style={heart ? { color: "var(--coral-ink)", borderColor: "rgba(243,106,70,.4)" } : {}}>
                <Icon n="heart" s={15} fill={heart ? "var(--coral-ink)" : undefined} />{heart ? "Liked" : "Like"}
              </button>
              <FollowBtn handle="elenalive" />
              <button className="btn btn-grad btn-sm" onClick={() => sendGift("🎁", 200)}><Icon n="gift" s={15} />Send gift</button>
            </div>
          </div>
        </div>
        <div className="card col rail" style={{ padding: 0, maxHeight: 648 }}>
          <div className="row between" style={{ padding: "14px 16px" }}>
            <span className="b7">Live chat</span>
            <span className="pill t11"><span className="dot" style={{ background: "var(--mint)" }} />{viewers.toLocaleString()}</span>
          </div>
          <hr className="divider" />
          <div ref={boxRef} className="grow col gap8" style={{ padding: 16, overflowY: "auto" }}>
            {chat.map((m, i) => {
              const tn = tone(m[2]);
              return (
                <div key={i} className={"chatmsg" + (m[2] ? "" : " muted")}
                  style={m[2] ? { background: tn[0], border: `1px solid ${tn[1]}`, padding: "9px 12px", borderRadius: 12 } : { fontSize: 13, padding: "3px 4px" }}>
                  <b style={{ color: tn[2] }}>{m[0]}</b> <span className="t13">{m[1]}</span>
                </div>
              );
            })}
          </div>
          <div className="row gap6" style={{ padding: "10px 12px 4px", flexWrap: "wrap" }}>
            {([["🌹", 50], ["🎁", 200], ["💎", 500], ["🚀", 1000]] as Array<[string, number]>).map((g) => (
              <button key={g[0]} className="pill t12" style={{ cursor: "pointer" }} onClick={() => sendGift(g[0], g[1])}>{g[0]} {g[1]}</button>
            ))}
          </div>
          <div className="row gap8" style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
            <input className="input" placeholder="Say something…" value={msg}
              onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }} />
            <button className="btn btn-blue btn-sm" disabled={!msg.trim()} onClick={sendChat}><Icon n="send" s={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
