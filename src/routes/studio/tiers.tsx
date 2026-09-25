import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const FEATURES = ["Feed access", "Direct messages", "Exclusive drops", "Live streams"];
// Candidates a new bundle draws from, in order — keeps a fresh bundle from
// colliding with whatever's already there without the creator having to pick.
const MONTH_POOL = [3, 6, 12, 24, 36];
const PCT_POOL = [17, 25, 30, 35, 40];

interface Bundle { months: number; pct: number }

export default function TiersPage() {
  const S = useAppStore();
  const [price, setPrice] = useState(12);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [bundles, setBundles] = useState<Bundle[]>([{ months: 3, pct: 17 }, { months: 6, pct: 25 }, { months: 12, pct: 30 }]);
  const [pctEdit, setPctEdit] = useState<number | null>(null);
  const [pctVal, setPctVal] = useState("");

  const save = () => {
    const p = parseInt(val, 10) || 0;
    if (p < 5) { S.toast("Minimum price is $5", "err"); return; }
    setPrice(p);
    setEditing(false);
    S.toast(`Price updated to $${p} — applies to new subscribers only`, "ok");
  };

  const addBundle = () => {
    if (bundles.length >= 4) { S.toast("Maximum of 4 bundles", "err"); return; }
    const months = MONTH_POOL.find((m) => !bundles.some((b) => b.months === m)) ?? Math.max(...bundles.map((b) => b.months)) + 3;
    const pct = PCT_POOL.find((p) => !bundles.some((b) => b.pct === p)) ?? Math.max(...bundles.map((b) => b.pct)) + 5;
    setBundles((b) => [...b, { months, pct }]);
    S.toast("Bundle added — fans see it at checkout", "ok");
  };

  const savePct = (i: number) => {
    const p = parseInt(pctVal, 10);
    if (!p || p < 1 || p > 90) { S.toast("Enter a discount between 1–90%", "err"); return; }
    if (bundles.some((b, j) => j !== i && b.pct === p)) { S.toast("Another bundle already uses that discount", "err"); return; }
    setBundles((bs) => bs.map((b, j) => (j === i ? { ...b, pct: p } : b)));
    setPctEdit(null);
    S.toast("Bundle discount updated", "ok");
  };

  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 6 }}>Subscriptions</h2>
      <p className="muted" style={{ marginBottom: 20 }}>One plan, one price. Fans always see exactly what's included.</p>
      <div className="card" style={{ padding: 20, maxWidth: 340, marginBottom: 24 }}>
        <span className="b7 t18">Subscription</span>
        {editing ? (
          <div className="row gap8" style={{ margin: "6px 0 14px" }}>
            <div className="row hair grow gap4" style={{ padding: "0 12px", borderRadius: 12 }}>
              <span className="muted t18">$</span>
              <input className="input" style={{ border: "none", background: "none", padding: "9px 6px" }} value={val} autoFocus
                onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
            <button className="btn btn-blue btn-sm" onClick={save}>Save</button>
          </div>
        ) : (
          <div className="row" style={{ alignItems: "flex-end", gap: 4, margin: "6px 0 14px" }}>
            <span className="display t32 amber">${price}</span>
            <span className="muted t13" style={{ marginBottom: 5 }}>/mo</span>
          </div>
        )}
        {FEATURES.map((f) => (
          <div key={f} className="row gap8 t14" style={{ marginBottom: 8 }}><Icon n="check" s={15} c="var(--mint-ink)" />{f}</div>
        ))}
        <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }} onClick={() => { setEditing(true); setVal(String(price)); }}>
          {editing ? "Editing…" : "Edit price"}
        </button>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div><div className="b7">Bundles</div><div className="muted t13">Discounted multi-month plans, on top of the monthly default.</div></div>
          <button className="btn btn-ghost btn-sm" onClick={addBundle}><Icon n="plus" s={15} />Add bundle</button>
        </div>
        <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8 }}>
          <span className="b6">Monthly</span>
          <span className="muted t13">Default</span>
        </div>
        {bundles.map((b, i) => (
          <div key={i} className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8 }}>
            <span className="b6">{b.months} months</span>
            {pctEdit === i ? (
              <div className="row gap6">
                <div className="row hair" style={{ padding: "0 8px", borderRadius: 8, gap: 2 }}>
                  <span className="muted t12">Save</span>
                  <input className="input" style={{ border: "none", background: "none", padding: "4px", width: 40, textAlign: "right" }}
                    value={pctVal} autoFocus onChange={(e) => setPctVal(e.target.value.replace(/[^0-9]/g, ""))} />
                  <span className="muted t12">%</span>
                </div>
                <button onClick={() => savePct(i)} aria-label="Save discount"><Icon n="check" s={14} c="var(--mint-ink)" /></button>
                <button className="muted" onClick={() => setPctEdit(null)} aria-label="Cancel"><Icon n="x" s={14} /></button>
              </div>
            ) : (
              <div className="row gap10">
                <span className="chip-mint" style={{ cursor: "pointer" }} onClick={() => { setPctEdit(i); setPctVal(String(b.pct)); }}>
                  Save {b.pct}%
                </span>
                <button className="muted" onClick={() => { setBundles((x) => x.filter((_, j) => j !== i)); S.toast("Bundle removed"); }}><Icon n="x" s={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
