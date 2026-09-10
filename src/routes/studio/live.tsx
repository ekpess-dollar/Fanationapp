import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon, Loop, Photo, SIZES, loopFor, mediaFor } from "@/lib/ui";

export default function GoLivePage() {
  const S = useAppStore();
  const [live, setLive] = useState(false);
  const [subsOnly, setSubsOnly] = useState(true);
  const [v, setV] = useState(0);
  const [g, setG] = useState(0);
  const [sec, setSec] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  /* Your own camera. Landscape footage, unlike Elena's phone stream — this is
     the desk setup a creator broadcasts from, and it fills the preview. */
  const camStill = mediaFor("life", 0);
  const camLoop = loopFor(camStill);
  const start = () => {
    setLive(true); setV(12); setG(0); setSec(0);
    S.toast("You're live — fans are being notified", "ok");
    timer.current = setInterval(() => {
      setSec((s) => s + 1);
      setV((x) => x + 1 + ((x * 7) % 9));
      setG((x) => x + ((x * 3) % 40) + 2);
    }, 1000);
  };
  const end = () => {
    if (timer.current) clearInterval(timer.current);
    S.toast(`Stream ended · ${v.toLocaleString()} viewers · ${g.toLocaleString()} coins in gifts · replay saved to Vault`, "ok");
    setLive(false);
  };
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 18 }}>Go Live</h2>
      <div className="grid gmain-15 gap16">
        <div className="card" style={{ padding: 0, height: 420, position: "relative", overflow: "hidden", background: "var(--card2)" }}>
          {live && (camLoop
            ? <Loop src={camLoop} poster={camStill} active={live} priority />
            : <Photo sizes={SIZES.studioStage} src={camStill} seed="mystream" />)}
          {!live && (
            <div className="col center gap8" style={{ position: "absolute", inset: 0 }}>
              <div className="feature-ic" style={{ width: 60, height: 60, background: "var(--fill)" }}><Icon n="camera" s={28} c="var(--muted)" /></div>
              <div className="muted">Camera preview</div>
            </div>
          )}
          {live && (
            <>
              <div className="badge-live" style={{ position: "absolute", top: 16, left: 16, animation: "pulseglow 2s infinite" }}><span className="dot" />LIVE · {mmss(sec)}</div>
              <div className="pill t12 onart" style={{ position: "absolute", top: 16, right: 16 }}><Icon n="eye" s={13} />{v.toLocaleString()} watching</div>
              <span className="chip-coin onart" style={{ position: "absolute", bottom: 16, left: 16 }}>{g.toLocaleString()} coins gifted</span>
            </>
          )}
          <div style={{ position: "absolute", bottom: 16, right: 16 }}>
            {live
              ? <button className="btn btn-red" onClick={end}><Icon n="x" s={16} />End stream</button>
              : <button className="btn btn-grad" onClick={start}><Icon n="live" s={16} />Start streaming</button>}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 14 }}>Stream setup</div>
          <label className="label">Title</label>
          <input className="input" defaultValue="Friday night Q&A 🎥" disabled={live} style={{ marginBottom: 14, opacity: live ? 0.6 : 1 }} />
          <label className="label">Category</label>
          <input className="input" defaultValue="Lifestyle" disabled={live} style={{ marginBottom: 14, opacity: live ? 0.6 : 1 }} />
          <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 10 }}>
            <span className="t14 b6">Subscribers only</span>
            <div className={"sw" + (subsOnly ? " on" : "")} onClick={() => {
              if (live) { S.toast("Can't change access mid-stream", "err"); return; }
              setSubsOnly((x) => !x);
            }} />
          </div>
          <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12 }}>
            <span className="t14 b6">Entry gift goal</span>
            <span className="amber b7">5,000 coins</span>
          </div>
          {live && <div className="chip-mint" style={{ marginTop: 12 }}><span className="dot" style={{ background: "var(--mint)" }} />Streaming · settings locked</div>}
        </div>
      </div>
    </div>
  );
}
