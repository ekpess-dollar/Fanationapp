import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon, MOTION_STILLS, Photo, SIZES, mediaFor, myMediaFor } from "@/lib/ui";

/**
 * `n` is the item's position within its own kind, fixed when the item is
 * created. Hashing the id instead collided — two photographs appeared twice
 * inside the same twenty-five — and hashing the row index would redeal the
 * whole wall every time a filter chip is tapped. An ordinal does neither.
 */
interface VaultItem { id: string; kind: string; n: number; used: boolean }

/** An audio file has no frame of its own, so it borrows one: mics, decks,
    monitors. Two pools interleaved gives ten distinct covers. */
const AUDIO_CATS = ["music", "pod"];
const audioCover = (n: number) => mediaFor(AUDIO_CATS[n % AUDIO_CATS.length], Math.floor(n / AUDIO_CATS.length));

function coverFor(x: VaultItem): string {
  if (x.kind === "Videos") return MOTION_STILLS[x.n % MOTION_STILLS.length];
  if (x.kind === "Audio") return audioCover(x.n);
  return myMediaFor(x.n);
}

export default function VaultPage() {
  const S = useAppStore();
  const [tab, setTab] = useState("All");
  const [items, setItems] = useState<VaultItem[]>(() => {
    const seen: Record<string, number> = {};
    return Array.from({ length: 25 }).map((_, i) => {
      const kind = i % 4 === 1 ? "Videos" : i % 4 === 3 ? "Audio" : "Photos";
      return { id: String(i), kind, n: (seen[kind] = (seen[kind] ?? -1) + 1), used: i % 3 !== 0 };
    });
  });
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const list = items.filter((x) => tab === "All" || x.kind === tab || (tab === "Used" && x.used) || (tab === "Unused" && !x.used));
  const nSel = Object.keys(sel).filter((k) => sel[k]).length;
  return (
    <div className="content">
      <div className="row between" style={{ marginBottom: 18 }}>
        <div className="col gap4">
          <h2 className="display t32">Vault</h2>
          <span className="muted">All your media in one place · {items.length} items.</span>
        </div>
        <button className="btn btn-grad" onClick={() => {
          setItems((x) => [{ id: `n${x.length}`, kind: "Photos", n: x.filter((it) => it.kind === "Photos").length, used: false }, ...x]);
          S.toast("Upload complete — added to your vault", "ok");
        }}>
          <Icon n="upload" s={16} />Upload
        </button>
      </div>
      <div className="row gap8 wrap" style={{ marginBottom: 18 }}>
        {["All", "Photos", "Videos", "Audio", "Used", "Unused"].map((t) => (
          <span key={t} className={"tag" + (tab === t ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setTab(t)}>{t}</span>
        ))}
      </div>
      {nSel > 0 && (
        <div className="card row gap12" style={{ padding: "10px 16px", marginBottom: 14, borderColor: "var(--blue-ink)" }}>
          <span className="b7 t14">{nSel} selected</span>
          <div className="grow" />
          <button className="btn btn-ghost btn-sm" onClick={() => { S.toast("Sent as PPV message to VIP fans · 150 coins to unlock", "ok"); setSel({}); }}>
            <Icon n="lock" s={14} />Send as PPV
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--coral-ink)" }}
            onClick={() => { setItems((x) => x.filter((it) => !sel[it.id])); S.toast(`${nSel} item${nSel > 1 ? "s" : ""} deleted`); setSel({}); }}>
            <Icon n="x" s={14} />Delete
          </button>
          <button className="muted t13" onClick={() => setSel({})}>Clear</button>
        </div>
      )}
      {list.length === 0 && (
        <div className="card col center gap8" style={{ padding: 44 }}>
          <div className="b7">Nothing in "{tab}"</div>
          <div className="muted t13">Upload media or switch filters.</div>
        </div>
      )}
      <div className="grid g5 gap12">
        {list.map((x) => (
          <div key={x.id} onClick={() => setSel((m) => ({ ...m, [x.id]: !m[x.id] }))}
            style={{ aspectRatio: "1", borderRadius: 12, position: "relative", cursor: "pointer", outline: sel[x.id] ? "2px solid var(--blue-ink)" : "none", outlineOffset: -2 }}>
            {/* A video item shows a frame that actually has footage behind it,
                so the play badge is not a lie. */}
            <Photo sizes={SIZES.g5} radius={12} seed={`v${x.id}`} src={coverFor(x)} />
            {!x.used && !sel[x.id] && <span className="chip-coin onart" style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px" }}>Unused</span>}
            {x.kind === "Videos" && <span className="pill t12 onart" style={{ position: "absolute", bottom: 8, right: 8 }}><Icon n="play" s={11} /></span>}
            {sel[x.id] && (
              <span className="feature-ic" style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, background: "var(--blue)" }}>
                <Icon n="check" s={13} c="#04122a" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
