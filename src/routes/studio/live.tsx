import { useEffect, useRef, useState } from "react";
import { LIVE_LINES, LIVE_NAMES, useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

type ChatLine = [string, string, string]; // [name, text, type]
interface Fly { id: string; txt: string; x: number }

const FIRE_STYLE = `
@keyframes fire-scroll {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes fire-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.85; }
}
`;

function GiftLine({ name, text, color }: { name: string; text: string; color: string }) {
  return (
    <div style={{
      position: "relative", borderRadius: 10, padding: 2, margin: "4px 0",
      background: "linear-gradient(90deg,#ff2200,#ff6b00,#ffcc00,#ff4500,#ff2200)",
      backgroundSize: "300% 100%",
      animation: "fire-scroll 1.8s ease infinite, fire-pulse 2s ease infinite",
      boxShadow: "0 0 12px rgba(255,100,0,.5), 0 0 24px rgba(255,60,0,.25)",
    }}>
      <div style={{ background: "var(--card2)", borderRadius: 8, padding: "8px 10px" }}>
        <div className="row gap6" style={{ alignItems: "center", marginBottom: 2 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>🎁</span>
          <b style={{ color, fontSize: 12 }}>{name}</b>
        </div>
        <div className="t13 b6" style={{ color: "#ffaa33" }}>{text}</div>
      </div>
    </div>
  );
}

const NAME_COLORS = [
  "#ff4d4f", "#ff7a45", "#ffa940", "#ffc53d", "#bae637", "#73d13d",
  "#36cfc9", "#40a9ff", "#597ef7", "#9254de", "#f759ab", "#ff85c0",
];
const nameColor = (n: string) => {
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function GoLivePage() {
  const S = useAppStore();

  // ── setup form state ──────────────────────────────────────────────────────
  const [live, setLive] = useState(false);
  const [subsOnly, setSubsOnly] = useState(true);

  // ── camera ────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState(false);
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices?.getUserMedia?.({ video: true, audio: false })
      .then((s) => {
        streamRef.current = s;
        if (!mounted) { s.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => { if (mounted) setCamError(true); });
    return () => {
      mounted = false;
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── broadcast state ───────────────────────────────────────────────────────
  const [sec, setSec] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [gifts, setGifts] = useState(0);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [msg, setMsg] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = useRef(0);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [chat]);

  const startBroadcast = () => {
    setLive(true);
    setViewers(12);
    setGifts(0);
    setSec(0);
    setChat([["@system", "You're live — fans are being notified 🎉", "info"]]);
    S.toast("You're live!", "ok");

    tickRef.current = setInterval(() => {
      setSec((s) => s + 1);
      setViewers((v) => Math.min(v + Math.floor(Math.random() * 8) + 1, 99999));
    }, 1000);

    chatRef.current = setInterval(() => {
      n.current++;
      const k = n.current;
      const name = LIVE_NAMES[(k * 7) % LIVE_NAMES.length];
      // Creators see join events; regular viewers don't
      const line = LIVE_LINES[(k * 3 + (k % 4)) % LIVE_LINES.length];
      setChat((c) => [...c, [name, line[0], line[1]] as ChatLine].slice(-60));
      if (line[1] === "gift") {
        const g = [10, 25, 50][k % 3];
        setGifts((x) => x + g * 100);
        setFlies((f) => [...f, { id: `f${k}`, txt: `🎁 $${g}`, x: 12 + ((k * 29) % 64) }].slice(-5));
      }
    }, 1900);
  };

  const endBroadcast = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (chatRef.current) clearInterval(chatRef.current);
    S.toast(`Stream ended · ${viewers.toLocaleString()} viewers · ${gifts.toLocaleString()} coins in gifts · replay saved to Vault`, "ok");
    setConfirmEnd(false);
    setLive(false);
    setChat([]);
    setFlies([]);
    setSec(0);
    setViewers(0);
    setGifts(0);
  };

  const sendChat = () => {
    const v = msg.trim(); if (!v) return;
    setChat((c) => [...c, ["@you (creator)", v, "me"] as ChatLine].slice(-60));
    setMsg("");
  };

  // ── pre-live setup view ───────────────────────────────────────────────────
  if (!live) return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 18 }}>Go Live</h2>
      <div className="grid gmain-15 gap16">
        <div className="card" style={{ padding: 0, height: 420, position: "relative", overflow: "hidden", background: "var(--card2)" }}>
          {!camError ? (
            <video ref={videoRef} autoPlay muted playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          ) : (
            <div className="col center gap8" style={{ position: "absolute", inset: 0 }}>
              <div className="feature-ic" style={{ width: 60, height: 60, background: "var(--fill)" }}><Icon n="camera" s={28} c="var(--muted)" /></div>
              <div className="muted">Camera access needed for a preview</div>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 16, right: 16 }}>
            <button className="btn btn-grad" onClick={startBroadcast}><Icon n="live" s={16} />Start streaming</button>
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 14 }}>Stream setup</div>
          <label className="label">Title</label>
          <input className="input" defaultValue="Friday night Q&A 🎥" style={{ marginBottom: 14 }} />
          <label className="label">Category</label>
          <input className="input" defaultValue="Lifestyle" style={{ marginBottom: 14 }} />
          <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 10 }}>
            <span className="t14 b6">Subscribers only</span>
            <div className={"sw" + (subsOnly ? " on" : "")} onClick={() => setSubsOnly((x) => !x)} />
          </div>
          <div className="hair" style={{ padding: "12px 14px", borderRadius: 12 }}>
            <div className="row between">
              <span className="t14 b6">Entry gift goal</span>
              <span className="amber b7">5,000 coins</span>
            </div>
            <div className="muted t12" style={{ marginTop: 4 }}>Fans see a live progress bar toward this total during your stream.</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── live broadcast view ───────────────────────────────────────────────────
  return (
    <div className="content" style={{ maxWidth: "none" }}>
      <style>{FIRE_STYLE}</style>
      <div className="split" style={{ alignItems: "stretch", gap: 16 }}>

        {/* stage */}
        <div className="grow col">
          <div ref={stageRef} className="card" style={{
            padding: 0, overflow: "hidden", position: "relative", background: "#000",
            height: fullscreen ? "100vh" : "calc(100vh - var(--topbar-h) - 80px)", minHeight: 360,
          }}>
            {/* camera feed — mirrored so it reads natural, same as FaceTime */}
            <video ref={videoRef} autoPlay muted playsInline style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", transform: "scaleX(-1)",
              display: camError ? "none" : "block",
            }} />
            {camError && (
              <div className="col center gap8" style={{ position: "absolute", inset: 0 }}>
                <Icon n="camera" s={36} c="var(--muted)" />
                <div className="muted t13">No camera feed</div>
              </div>
            )}

            {/* top badges */}
            <div className="badge-live" style={{ position: "absolute", top: 16, left: 16, animation: "pulseglow 2s infinite" }}>
              <span className="dot" />LIVE · {mmss(sec)}
            </div>
            <div className="pill t12 onart" style={{ position: "absolute", top: 16, right: 16 }}>
              <Icon n="eye" s={13} /> {viewers.toLocaleString()} watching
            </div>

            {/* gift flies */}
            {flies.map((f) => <div key={f.id} className="giftfly" style={{ left: `${f.x}%`, bottom: 60 }}>{f.txt}</div>)}

            {/* coins gifted counter */}
            {gifts > 0 && (
              <div className="glass onart row gap6" style={{ position: "absolute", right: 16, bottom: 60, padding: "7px 11px" }}>
                <span className="amber b7 t13">{gifts.toLocaleString()} coins gifted</span>
              </div>
            )}

            {/* bottom bar */}
            <div className="row between" style={{
              position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 14px",
              background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.7))",
            }}>
              <div className="col gap2">
                <span className="b7 onart">Friday night Q&A 🎥</span>
                <span className="muted t12 onart">Lifestyle · Subscribers only</span>
              </div>
              <button className="btn btn-red" onClick={() => setConfirmEnd(true)}>
                <Icon n="x" s={15} />End stream
              </button>
            </div>
          </div>

          {/* fullscreen toggle sits below stage, outside the absolute-positioned card */}
          <div className="row gap8" style={{ marginTop: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else stageRef.current?.requestFullscreen();
            }}>
              <Icon n={fullscreen ? "contract" : "expand"} s={14} />{fullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>

        {/* live chat */}
        <div className="card col rail" style={{
          padding: 0, flex: "none", width: chatOpen ? 300 : 48,
          transition: "width .15s ease", position: "sticky",
          top: "var(--topbar-h)", height: "calc(100vh - var(--topbar-h))", overflow: "hidden",
        }}>
          {chatOpen ? (
            <>
              <div className="row between" style={{ padding: "14px 16px" }}>
                <span className="b7">Live chat</span>
                <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={() => setChatOpen(false)}>
                  <Icon n="chevronRight" s={15} />
                </button>
              </div>
              <hr className="divider" />
              <div ref={boxRef} className="grow col" style={{ padding: "12px 16px", overflowY: "auto" }}>
                {chat.map((m, i) => {
                  if (m[2] === "gift") return <GiftLine key={i} name={m[0]} text={m[1]} color={nameColor(m[0])} />;
                  return (
                    <div key={i} className="t13" style={{ lineHeight: 1.5, wordBreak: "break-word", marginBottom: 4 }}>
                      {m[2] === "info"
                        ? <span className="muted">{m[1]}</span>
                        : <><b style={{ color: m[2] === "me" ? "var(--blue-ink)" : nameColor(m[0]) }}>{m[0]}</b><span className="muted">: </span><span>{m[1]}</span></>
                      }
                    </div>
                  );
                })}
              </div>
              <div className="row gap8" style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
                <input className="input" placeholder="Reply to chat…" value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }} />
                <button className="btn btn-blue btn-sm" disabled={!msg.trim()} onClick={sendChat}>
                  <Icon n="send" s={15} />
                </button>
              </div>
            </>
          ) : (
            <button className="col center grow" style={{ width: "100%" }} onClick={() => setChatOpen(true)} aria-label="Expand chat">
              <span className="row" style={{ transform: "rotate(180deg)" }}><Icon n="chevronRight" s={15} /></span>
            </button>
          )}
        </div>
      </div>

      {/* end-stream confirmation */}
      {confirmEnd && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmEnd(false)}>
          <div className="card col gap16" style={{ padding: 28, maxWidth: 360, width: "90%", background: "var(--card2)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="col gap6">
              <span className="b7 t18">End stream?</span>
              <span className="muted t14">
                You have <b style={{ color: "var(--text)" }}>{viewers.toLocaleString()} viewers</b> watching right now.
                The replay will be saved to your Vault automatically.
              </span>
            </div>
            <div className="row gap10" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmEnd(false)}>Keep streaming</button>
              <button className="btn btn-red btn-sm" onClick={endBroadcast}>End stream</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
