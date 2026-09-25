import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FAN_SEED, useAppStore } from "@/lib/core";
import { Avatar, Icon } from "@/lib/ui";

const FAN_LINES = [
  "hey! loved the last drop 🔥",
  "when's the next live?",
  "just resubscribed, keep it up!",
  "can you do a shoutout sometime?",
  "worth every coin tbh 😍",
  "any merch coming soon?",
];

/** One floating window — Messenger's own popup shape: avatar + name, a couple
    of decorative action icons, minimize, close, and a plain thread below. */
function ChatPopup({ handle }: { handle: string }) {
  const S = useAppStore();
  const popup = S.chatPopups.find((p) => p.handle === handle);
  const fan = FAN_SEED.find((f) => f[1] === handle);
  const name = fan?.[0] ?? handle;
  const [msg, setMsg] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const thread = S.studioChats[handle] ?? [];
  const minimized = !!popup?.minimized;

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [thread.length, minimized]);

  if (!popup) return null;
  const send = () => {
    const v = msg.trim();
    if (!v) return;
    S.sendStudioChat(handle, v);
    setMsg("");
  };

  return (
    <div className="card" style={{ width: 280, flex: "none", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 12px 34px rgba(0,0,0,.45)", height: minimized ? "auto" : 380 }}>
      <div className="row between" style={{ padding: "10px 12px", borderBottom: minimized ? "none" : "1px solid var(--line)" }}>
        <div className="row gap8" style={{ minWidth: 0 }}>
          <Avatar name={name} size={28} />
          <span className="b6 t14 uname" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        </div>
        <div className="row gap4">
          <button className="muted" style={{ padding: 4 }} onClick={() => S.toast("Voice calls aren't available in this preview")} aria-label="Call">
            <Icon n="call" s={15} solid />
          </button>
          <button className="muted" style={{ padding: 4 }} onClick={() => S.toast("Video calls aren't available in this preview")} aria-label="Video call">
            <Icon n="live" s={15} solid />
          </button>
          <button className="muted" style={{ padding: 4 }} onClick={() => S.toggleMinimizeChatPopup(handle)} aria-label={minimized ? "Expand" : "Minimize"}>
            <span className="row" style={{ transform: minimized ? "rotate(180deg)" : "rotate(-90deg)" }}><Icon n="chevronRight" s={15} /></span>
          </button>
          <button className="muted" style={{ padding: 4 }} onClick={() => S.closeChatPopup(handle)} aria-label="Close">
            <Icon n="x" s={16} />
          </button>
        </div>
      </div>
      {!minimized && (
        <>
          <div ref={boxRef} className="grow col gap8" style={{ padding: 12, overflowY: "auto" }}>
            {thread.length === 0 && (
              <div className="muted t12" style={{ textAlign: "center", marginTop: 20 }}>
                Start the conversation with {name.split(" ")[0]}.
              </div>
            )}
            {thread.map((m, i) => (
              <div key={i} className="chatmsg t13" style={{
                alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "80%", padding: "8px 12px", borderRadius: 14,
                background: m.me ? "var(--blue)" : "var(--fill)", color: m.me ? "#04122a" : "var(--text)", fontWeight: m.me ? 600 : 400,
              }}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="row gap6" style={{ padding: 10, borderTop: "1px solid var(--line)" }}>
            <input className="input" placeholder="Aa" value={msg}
              onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
            <button className="btn btn-blue btn-sm" disabled={!msg.trim()} onClick={send} aria-label="Send"><Icon n="send" s={14} /></button>
          </div>
        </>
      )}
    </div>
  );
}

/** Studio-only — a fan can't message themselves, so this stays off the fan
    side of the app entirely rather than gating each popup individually. */
export function ChatPopups() {
  const S = useAppStore();
  const { pathname } = useLocation();
  const studio = pathname.startsWith("/studio");

  // A fan "messaging in" every so often, the same way a real inbox would —
  // pops the thread open unprompted, exactly like receiving one for real.
  useEffect(() => {
    if (!studio) return;
    const id = setInterval(() => {
      const openHandles = new Set(S.chatPopups.map((p) => p.handle));
      const candidates = FAN_SEED.filter((f) => !openHandles.has(f[1]));
      if (!candidates.length || Math.random() > 0.4) return;
      const f = candidates[Math.floor(Math.random() * candidates.length)];
      const line = FAN_LINES[Math.floor(Math.random() * FAN_LINES.length)];
      S.receiveStudioChat(f[1], line);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 25000);
    return () => clearInterval(id);
  }, [studio]);

  if (!studio || S.chatPopups.length === 0) return null;
  return (
    <div className="row gap12" style={{ position: "fixed", right: 20, bottom: 0, zIndex: 80, alignItems: "flex-end" }}>
      {S.chatPopups.map((p) => <ChatPopup key={p.handle} handle={p.handle} />)}
    </div>
  );
}
