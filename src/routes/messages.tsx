import { useState } from "react";
import { DM_OPENERS, DM_THREADS, byHandle, useAppStore } from "@/lib/core";
import { Avatar, Icon, Menu, Photo, SIZES, Verified, mediaFor, poolFor } from "@/lib/ui";

export default function MessagesPage() {
  const S = useAppStore();
  const [active, setActive] = useState(0);
  const [txt, setTxt] = useState("");
  /* Which pane is showing on a phone. Ignored above 900px, where both are on
     screen at once and the stylesheet never reads the attribute. */
  const [pane, setPane] = useState<"list" | "chat">("list");
  const t = DM_THREADS[active];
  const key = t.handle;
  const mine = S.dms[key] ?? [];
  const unlocked = !!S.dmUnlocked[key];
  const creator = byHandle(key);
  /* The paid attachment in the thread. One photograph, resolved once, so the
     blurred teaser and the unlocked card are the same picture — paying has to
     reveal what the blur was hiding, not swap in something else (D17). */
  const dmShot = mediaFor(poolFor(key), 2);
  const send = () => {
    const v = txt.trim();
    if (!v) return;
    S.sendDm(key, v);
    setTxt("");
  };
  return (
    <div className="content" style={{ maxWidth: "none", padding: 0 }}>
      {/* Two panes side by side on a desktop, one at a time on a phone. `data-pane`
          is what the stylesheet reads to decide which — picking a thread moves you
          to the conversation, the back arrow in its header brings you back. */}
      <div className="dm" data-pane={pane}>
        <div className="dm-list col">
          <div className="row between" style={{ padding: "16px 18px" }}>
            <span className="b7 t18">Messages</span>
            <span style={{ cursor: "pointer" }} onClick={() => S.toast("Start a chat from any creator's profile")}><Icon n="plus" c="var(--muted)" /></span>
          </div>
          {DM_THREADS.map((c, i) => (
            <div key={c.handle} className="row gap12" onClick={() => { setActive(i); setPane("chat"); }}
              style={{ padding: "12px 18px", background: i === active ? "rgba(37,153,246,.08)" : "", cursor: "pointer" }}>
              <Avatar name={c.name} size={44} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="b6 t14 row gap4">{c.name} <Verified s={12} /></div>
                <div className="row gap6 muted t13" style={{ maxWidth: 190 }}>
                  {c.locked && !S.dmUnlocked[c.handle] && <Icon n="lock" s={12} c="var(--amber-ink)" />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(S.dms[c.handle] ?? []).length ? `You: ${(S.dms[c.handle] ?? []).slice(-1)[0]}` : c.preview}
                  </span>
                </div>
              </div>
              {c.unread && <span className="dot" style={{ background: "var(--blue)", flex: "none" }} />}
            </div>
          ))}
        </div>
        <div className="dm-thread">
          <div className="row between" style={{ padding: "13px 18px", borderBottom: "1px solid var(--line)" }}>
            <div className="row gap12">
              {/* `arrow` points right; the button is what gets turned around. */}
              <button className="only-mobile" style={{ transform: "rotate(180deg)" }}
                onClick={() => setPane("list")} aria-label="Back to conversations">
                <Icon n="arrow" s={19} c="var(--muted)" />
              </button>
              <Avatar name={t.name} size={38} />
              <div className="col">
                <span className="b6 t14 row gap6">{t.name} <Verified s={13} /></span>
                <span className="muted t12">Subscriber · active now</span>
              </div>
            </div>
            <div className="row gap8">
              <button className="btn btn-ghost btn-sm" onClick={() => S.openModal("tip", creator)}><Icon n="dollar" s={14} />Tip</button>
              <Menu items={[
                { ic: "bell", t: "Mute conversation", fn: () => S.toast("Conversation muted") },
                { ic: "flag", t: "Report conversation", danger: true, fn: () => S.toast("Report submitted — Trust & Safety will review", "ok") },
                { ic: "shield", t: `Block @${key}`, danger: true, fn: () => S.block(key) },
              ]} />
            </div>
          </div>
          <div className="grow col gap12" style={{ padding: 20, justifyContent: "flex-end", overflowY: "auto" }}>
            <div className="glass" style={{ alignSelf: "flex-start", maxWidth: "70%", padding: "11px 15px", borderRadius: "14px 14px 14px 4px" }}>
              {DM_OPENERS[key] ?? t.preview}
            </div>
            {t.locked && (unlocked ? (
              <div className="card" style={{ alignSelf: "flex-start", width: 280, padding: 0, overflow: "hidden" }}>
                <div style={{ height: 170, position: "relative", overflow: "hidden" }}>
                  <Photo sizes={SIZES.dm} src={dmShot} seed={`dm${creator.id}`} />
                  <span className="chip-mint onart" style={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}><Icon n="check" s={12} />Unlocked · 200</span>
                </div>
                <div className="t13" style={{ padding: "9px 12px" }}>Full BTS set from Friday&apos;s shoot 📸</div>
              </div>
            ) : (
              <div className="card locked" style={{ alignSelf: "flex-start", width: 280, height: 180 }}>
                <Photo sizes={SIZES.dm} src={dmShot} seed={`dm${creator.id}`} blur={9} scale={1.12} />
                <div className="lockcover">
                  <Icon n="lock" c="var(--amber-ink)" />
                  <div className="b7 t14" style={{ color: "#fff" }}>Locked message</div>
                  <button className="btn btn-grad btn-sm" onClick={() => S.openModal("paidmsg", key)}>Unlock · 200 coins</button>
                </div>
              </div>
            ))}
            {mine.map((m, i) => (
              <div key={i} className="chatmsg" style={{ alignSelf: "flex-end", maxWidth: "70%", padding: "11px 15px", borderRadius: "14px 14px 4px 14px", background: "var(--blue)", color: "#04122a", fontWeight: 600 }}>
                {m}
              </div>
            ))}
          </div>
          <div className="row gap10" style={{ padding: "14px 18px", borderTop: "1px solid var(--line)" }}>
            <button className="muted" onClick={() => S.toast("Attach photos or video")}><Icon n="camera" s={20} /></button>
            <input className="input" placeholder="Message…" value={txt}
              onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
            <button className="btn btn-blue btn-sm" disabled={!txt.trim()} onClick={send}><Icon n="send" s={15} />Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
