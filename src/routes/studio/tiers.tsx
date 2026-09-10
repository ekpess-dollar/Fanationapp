import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const FEATS: Record<string, string[]> = {
  Basic: ["Feed access", "Direct messages"],
  Premium: ["Everything in Basic", "Exclusive drops", "Live streams"],
  VIP: ["Everything in Premium", "Priority DMs", "Monthly video call", "Custom requests"],
};
const COLORS: Record<string, string> = { Basic: "var(--blue-ink)", Premium: "var(--coral-ink)", VIP: "var(--amber-ink)" };

export default function TiersPage() {
  const S = useAppStore();
  const [prices, setPrices] = useState<Record<string, number>>({ Basic: 8, Premium: 12, VIP: 25 });
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [bundles, setBundles] = useState<Array<[string, string]>>([["3 months", "Save 17%"], ["6 months", "Save 25%"], ["12 months", "Save 30%"]]);
  const save = (t: string) => {
    const p = parseInt(val, 10) || 0;
    if (p < 5) { S.toast("Minimum tier price is $5", "err"); return; }
    setPrices((x) => ({ ...x, [t]: p }));
    setEdit(null);
    S.toast(`${t} price updated to $${p} — applies to new subscribers only`, "ok");
  };
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 6 }}>Subscriptions & tiers</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Offer levels of access. Fans always see the exact price and what's included.</p>
      <div className="grid g3 gap16" style={{ marginBottom: 24 }}>
        {Object.keys(prices).map((t) => (
          <div key={t} className="card" style={{ padding: 20, borderColor: t === "Premium" ? "var(--coral)" : "var(--line)" }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span className="b7 t18">{t}</span>
              {t === "Premium" && <span className="chip-mint">Popular</span>}
            </div>
            {edit === t ? (
              <div className="row gap8" style={{ marginBottom: 14 }}>
                <div className="row hair grow gap4" style={{ padding: "0 12px", borderRadius: 12 }}>
                  <span className="muted t18">$</span>
                  <input className="input" style={{ border: "none", background: "none", padding: "9px 6px" }} value={val} autoFocus
                    onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ""))} />
                </div>
                <button className="btn btn-blue btn-sm" onClick={() => save(t)}>Save</button>
              </div>
            ) : (
              <div className="row" style={{ alignItems: "flex-end", gap: 4, marginBottom: 14 }}>
                <span className="display t32" style={{ color: COLORS[t] }}>${prices[t]}</span>
                <span className="muted t13" style={{ marginBottom: 5 }}>/mo</span>
              </div>
            )}
            {FEATS[t].map((f) => (
              <div key={f} className="row gap8 t14" style={{ marginBottom: 8 }}><Icon n="check" s={15} c="var(--mint-ink)" />{f}</div>
            ))}
            <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }} onClick={() => { setEdit(t); setVal(String(prices[t])); }}>
              {edit === t ? "Editing…" : "Edit tier"}
            </button>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div><div className="b7">Bundles</div><div className="muted t13">Discounted multi-month plans.</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (bundles.length >= 4) { S.toast("Maximum of 4 bundles", "err"); return; }
            setBundles((b) => [...b, ["24 months", "Save 35%"]]);
            S.toast("Bundle added — fans see it at checkout", "ok");
          }}><Icon n="plus" s={15} />Add bundle</button>
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
