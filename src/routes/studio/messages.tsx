import { useRef, useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const SEGS: Array<[string, number]> = [["All subscribers", 8412], ["VIP", 126], ["Top spenders", 126], ["Expiring", 38]];
const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🔥", "🎉", "👏", "❤️", "💯", "😢", "😮", "🙏", "👍", "🎁", "💰", "⭐", "😅", "🤔", "😴", "🥳", "😇", "😭", "🤩", "🙌", "💪", "✨", "🎶", "📸", "🚀"];

export default function MassMessagingPage() {
  const S = useAppStore();
  const [seg, setSeg] = useState(0);
  const [txt, setTxt] = useState("");
  const [lock, setLock] = useState(false);
  const [media, setMedia] = useState<{ url: string; kind: "image" | "video" } | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMedia({ url: reader.result as string, kind: file.type.startsWith("video") ? "video" : "image" });
    reader.readAsDataURL(file);
  };
  const [hist, setHist] = useState<Array<[string, string, string, string]>>([
    ["New photo set is up 🔒", "VIP · locked 150 coins", "2,140 sent · 612 unlocked", "$918"],
    ["Live tonight at 8!", "All subscribers", "8,412 sent", ""],
    ["Weekend flash — 20% off", "Expiring", "38 sent · 12 renewed", ""],
  ]);
  const canSend = txt.trim().length > 0 || !!media;
  const send = () => {
    if (!canSend) return;
    const s = SEGS[seg];
    const label = (txt.trim() || (media?.kind === "video" ? "📹 Video" : "📷 Photo")) + (media && txt.trim() ? ` ${media.kind === "video" ? "📹" : "📷"}` : "");
    setHist((h) => [[label, s[0] + (lock ? " · locked 150 coins" : ""), `${s[1].toLocaleString()} queued · sending…`, ""], ...h]);
    setTxt("");
    setLock(false);
    setMedia(null);
    setShowEmoji(false);
    S.toast(`Broadcast queued to ${s[1].toLocaleString()} fans`, "ok");
  };
  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <h2 className="display t32" style={{ marginBottom: 6 }}>Mass messaging</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Broadcast to a segment. Attach a locked message to earn.</p>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="b7" style={{ marginBottom: 12 }}>New broadcast</div>
        <label className="label">Send to</label>
        <div className="row gap8 wrap" style={{ marginBottom: 14 }}>
          {SEGS.map((t, i) => (
            <span key={t[0]} className={"tag" + (seg === i ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setSeg(i)}>
              {t[0]} · {t[1].toLocaleString()}
            </span>
          ))}
        </div>
        <textarea className="input" rows={3} placeholder="Write your message…" value={txt}
          onChange={(e) => setTxt(e.target.value)} style={{ resize: "none", marginBottom: 12 }} />
        {media && (
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginBottom: 12, background: "var(--card2)" }}>
            {media.kind === "video"
              ? <video src={media.url} controls style={{ width: "100%", maxHeight: 220, display: "block" }} />
              : <img src={media.url} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />}
            <button className="glass onart" style={{ position: "absolute", top: 8, right: 8, padding: 6 }} onClick={() => setMedia(null)} aria-label="Remove media">
              <Icon n="x" s={14} />
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pickFile} />
        <div className="row between wrap gap12">
          <div className="row gap16" style={{ position: "relative" }}>
            <button className={"row gap6 t13 " + (lock ? "amber" : "muted")} onClick={() => setLock(!lock)}>
              <Icon n="lock" s={16} c={lock ? "var(--amber-ink)" : "var(--muted)"} />
              {lock ? "Locked · 150 coins ✓" : "Lock (PPV)"}
            </button>
            <button className="muted" onClick={() => fileRef.current?.click()} aria-label="Add photo or video">
              <Icon n="camera" s={17} solid />
            </button>
            <button className="muted" onClick={() => setShowEmoji((v) => !v)} aria-label="Add emoji">
              <Icon n="happy" s={17} solid />
            </button>
            {showEmoji && (
              <div className="card" style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 10, padding: 10, width: 260,
                display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, boxShadow: "0 12px 34px rgba(0,0,0,.45)",
                // `.card`'s own background is a near-transparent tint — fine sitting
                // flat on the page, not enough to occlude the broadcast history this
                // popover floats over. `--card2` is the opaque token modals already use.
                background: "var(--card2)",
              }}>
                {EMOJIS.map((e) => (
                  <button key={e} style={{ fontSize: 18, padding: 4, borderRadius: 8 }}
                    onClick={() => setTxt((t) => t + e)}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-blue" disabled={!canSend} onClick={send}>
            Send to {SEGS[seg][1].toLocaleString()} fans
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="b7" style={{ padding: "14px 18px" }}>Recent broadcasts</div>
        <hr className="divider" />
        {hist.map((b, i) => (
          <div key={i}>
            <div className="row between" style={{ padding: "13px 18px", background: b[2].includes("sending") ? "rgba(37,153,246,.05)" : "" }}>
              <div className="grow">
                <div className="b6 t14">{b[0]}</div>
                <div className="muted t12">{b[1]} · {b[2]}</div>
              </div>
              {b[3] && <span className="chip-mint">{b[3]}</span>}
            </div>
            {i < hist.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}
