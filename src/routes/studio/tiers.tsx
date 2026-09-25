import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const FEATURES = ["Feed access", "Direct messages", "Exclusive drops", "Live streams"];

export default function TiersPage() {
  const S = useAppStore();
  const [price, setPrice] = useState(12);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [bundles, setBundles] = useState<Array<[string, string]>>([["3 months", "Save 17%"], ["6 months", "Save 25%"], ["12 months", "Save 30%"]]);
  const save = () => {
    const p = parseInt(val, 10) || 0;
    if (p < 5) { S.toast("Minimum price is $5", "err"); return; }
    setPrice(p);
    setEditing(false);
    S.toast(`Price updated to $${p} — applies to new subscribers only`, "ok");
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
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (bundles.length >= 4) { S.toast("Maximum of 4 bundles", "err"); return; }
            setBundles((b) => [...b, ["24 months", "Save 35%"]]);
            S.toast("Bundle added — fans see it at checkout", "ok");
          }}><Icon n="plus" s={15} />Add bundle</button>
        </div>
        <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8 }}>
          <span className="b6">Monthly</span>
          <span className="muted t13">Default</span>
        </div>
        {bundles.map((b, i) => (
          <div key={i} className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8 }}>
            <span className="b6">{b[0]}</span>
            <div className="row gap10">
              <span className="chip-mint">{b[1]}</span>
              <button className="muted" onClick={() => { setBundles((x) => x.filter((_, j) => j !== i)); S.toast("Bundle removed"); }}><Icon n="x" s={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
