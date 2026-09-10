import { useState } from "react";
import { fhash, useAppStore } from "@/lib/core";
import { Icon, Menu, Photo, SIZES, myMediaFor } from "@/lib/ui";

export default function ContentStudioPage() {
  const S = useAppStore();
  const [vis, setVis] = useState("Subscribers");
  const [cap, setCap] = useState("");
  const [mediaOn, setMediaOn] = useState(false);
  const [price, setPrice] = useState("150");
  const [drafts, setDrafts] = useState<string[]>(["New drop teaser — copy WIP"]);
  const [sched, setSched] = useState<Array<[string, string]>>([["Sunset vlog", "Tomorrow · 6pm"], ["Weekly Q&A", "Fri · 8pm"]]);
  const [published, setPublished] = useState<Array<[string, string, string]>>([
    ["Behind the scenes", "Public", "842 views"],
    ["Full photo set", "PPV · 150", "Locked"],
    ["Workout wk1", "Subscribers", "1.2K views"],
    ["Q&A replay", "Tier: VIP", "Locked"],
  ]);
  const can = cap.trim().length > 0 || mediaOn;
  const clear = () => { setCap(""); setMediaOn(false); };
  const publish = () => {
    if (!can) return;
    setPublished((x) => [[cap.trim() || "Untitled media post", vis === "Pay-per-view" ? `PPV · ${price}` : vis, "Just now"], ...x]);
    S.addPost({ text: cap.trim() || "New drop 🔥", media: mediaOn, vis, price: Number(price) || 150 });
    clear();
  };
  const draft = () => {
    if (!can) return;
    setDrafts((x) => [cap.trim() || "Untitled draft", ...x]);
    clear();
    S.toast("Draft saved");
  };
  const schedule = () => {
    if (!can) { S.toast("Write a caption or attach media first", "err"); return; }
    setSched((x) => [...x, [cap.trim() || "Media post", "Tomorrow · 9am"]]);
    clear();
    S.toast("Scheduled for tomorrow · 9am", "ok");
  };
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 18 }}>Content studio</h2>
      <div className="grid gmain-14 gap16">
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 12 }}>New post</div>
          <textarea className="input" rows={3} maxLength={500} placeholder="Write a caption…" value={cap}
            onChange={(e) => setCap(e.target.value)} style={{ resize: "none", marginBottom: 4 }} />
          <div className="row between muted2 t12" style={{ marginBottom: 8 }}><span /><span>{cap.length}/500</span></div>
          <div onClick={() => setMediaOn((v) => !v)}
            style={{ border: `1px dashed ${mediaOn ? "var(--mint-ink)" : "var(--line2)"}`, borderRadius: 14, marginBottom: 14, cursor: "pointer", height: mediaOn ? 110 : undefined, position: "relative", overflow: "hidden", padding: mediaOn ? 0 : 20 }}>
            {mediaOn ? (
              <>
                <Photo sizes={SIZES.feedCard} src={myMediaFor(0)} seed="studioMedia" />
                <span className="chip-mint onart" style={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}><Icon n="check" s={12} />Media attached</span>
              </>
            ) : (
              <div className="row center gap8 muted"><Icon n="upload" s={18} />Drag media or click to upload</div>
            )}
          </div>
          <label className="label">Who can see this</label>
          <div className="row gap8 wrap" style={{ marginBottom: 14 }}>
            {["Public", "Subscribers", "Tier: VIP", "Pay-per-view"].map((v) => (
              <span key={v} className={"tag" + (vis === v ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setVis(v)}>{v}</span>
            ))}
          </div>
          {vis === "Pay-per-view" && (
            <div className="row hair gap8" style={{ padding: "0 14px", borderRadius: 14, marginBottom: 14 }}>
              <Icon n="coin" s={16} c="var(--amber-ink)" />
              <input className="input" style={{ border: "none", background: "none" }} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} />
              <span className="muted t13">coins to unlock</span>
            </div>
          )}
          <div className="row gap16 muted" style={{ marginBottom: 14 }}>
            <button className="row gap6 t13 muted" onClick={schedule}><Icon n="cal" s={16} />Schedule</button>
            <button className="row gap6 t13 muted" onClick={() => S.toast("Add polls from the Create button — option fields included")}><Icon n="chart" s={16} />Poll</button>
          </div>
          <div className="row gap10">
            <button className="btn btn-ghost btn-sm" disabled={!can} onClick={draft}>Save draft</button>
            <button className="btn btn-blue grow" disabled={!can} onClick={publish}>Publish</button>
          </div>
          {!can && <div className="muted2 t12" style={{ marginTop: 8 }}>Caption or media required to publish.</div>}
        </div>
        <div className="col gap16">
          <div className="card" style={{ padding: 18 }}>
            <div className="b7" style={{ marginBottom: 12 }}>Scheduled · {sched.length}</div>
            {sched.map((s, i) => (
              <div key={i} className="row gap12" style={{ padding: "9px 0" }}>
                <div className="feature-ic" style={{ width: 36, height: 36, background: "var(--fill)" }}><Icon n="cal" s={16} c="var(--muted)" /></div>
                <div className="grow"><div className="b6 t14">{s[0]}</div><div className="muted t12">{s[1]}</div></div>
                <Menu items={[
                  { ic: "upload", t: "Publish now", fn: () => { setSched((x) => x.filter((_, j) => j !== i)); setPublished((p) => [[s[0], "Subscribers", "Just now"], ...p]); S.toast("Published now", "ok"); } },
                  { ic: "x", t: "Remove", danger: true, fn: () => { setSched((x) => x.filter((_, j) => j !== i)); S.toast("Removed from schedule"); } },
                ]} />
              </div>
            ))}
            {sched.length === 0 && <div className="muted t13">Nothing scheduled.</div>}
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div className="b7" style={{ marginBottom: 12 }}>Drafts · {drafts.length}</div>
            {drafts.map((d, i) => (
              <div key={i} className="row gap12" style={{ padding: "9px 0" }}>
                <div className="feature-ic" style={{ width: 36, height: 36, background: "var(--fill)" }}><Icon n="upload" s={16} c="var(--muted)" /></div>
                <div className="grow b6 t14">{d}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setCap(d); setDrafts((x) => x.filter((_, j) => j !== i)); S.toast("Draft loaded into the editor"); }}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="b7" style={{ margin: "22px 0 14px" }}>Your content · {published.length}</div>
      <div className="grid g4 gap16">
        {published.map((c, i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Keyed off the caption, not the row index — publishing unshifts a
                new card onto the front, and index-keyed pictures would shuffle
                every existing thumbnail down one. */}
            <div style={{ height: 118, position: "relative", overflow: "hidden" }}>
              <Photo sizes={SIZES.g4} src={myMediaFor(fhash(c[0]))} seed={`pub${i}${c[0]}`} />
              <div className="tag onart" style={{ position: "absolute", top: 10, left: 10, fontSize: 11, zIndex: 1 }}>{c[1]}</div>
              {c[2] === "Just now" && <span className="chip-mint onart" style={{ position: "absolute", top: 10, right: 10, padding: "2px 7px", zIndex: 1 }}>New</span>}
            </div>
            <div style={{ padding: 12 }}>
              <div className="b6 t14" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c[0]}</div>
              <div className="muted t12" style={{ marginTop: 4 }}>{c[2]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
