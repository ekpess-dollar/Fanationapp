import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const FEATURES = ["Feed access", "Direct messages", "Exclusive drops", "Live streams"];

interface Bundle { months: number; pct: number }

export default function TiersPage() {
  const S = useAppStore();
  const [price, setPrice] = useState(12);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [bundles, setBundles] = useState<Bundle[]>([{ months: 3, pct: 17 }, { months: 6, pct: 25 }, { months: 12, pct: 30 }]);

  // inline add-bundle form
  const [adding, setAdding] = useState(false);
  const [newMonths, setNewMonths] = useState("");
  const [newPct, setNewPct] = useState("");

  // single edit form per row (both fields at once)
  const [rowEdit, setRowEdit] = useState<number | null>(null);
  const [editMonths, setEditMonths] = useState("");
  const [editPct, setEditPct] = useState("");

  const save = () => {
    const p = parseInt(val, 10) || 0;
    if (p < 5) { S.toast("Minimum price is $5", "err"); return; }
    setPrice(p);
    setEditing(false);
    S.toast(`Price updated to $${p} — applies to new subscribers only`, "ok");
  };

  const confirmAdd = () => {
    const mo = parseInt(newMonths, 10);
    const pc = parseInt(newPct, 10);
    if (!mo || mo < 2 || mo > 36) { S.toast("Enter a duration between 2–36 months", "err"); return; }
    if (!pc || pc < 1 || pc > 90) { S.toast("Enter a discount between 1–90%", "err"); return; }
    if (bundles.some((b) => b.months === mo)) { S.toast("A bundle with that duration already exists", "err"); return; }
    if (bundles.some((b) => b.pct === pc)) { S.toast("A bundle with that discount already exists", "err"); return; }
    setBundles((b) => [...b, { months: mo, pct: pc }]);
    setAdding(false);
    setNewMonths("");
    setNewPct("");
    S.toast("Bundle added — fans see it at checkout", "ok");
  };

  const openRowEdit = (i: number) => {
    setRowEdit(i);
    setEditMonths(String(bundles[i].months));
    setEditPct(String(bundles[i].pct));
  };

  const saveRow = (i: number) => {
    const mo = parseInt(editMonths, 10);
    const pc = parseInt(editPct, 10);
    if (!mo || mo < 2 || mo > 36) { S.toast("Enter a duration between 2–36 months", "err"); return; }
    if (!pc || pc < 1 || pc > 90) { S.toast("Enter a discount between 1–90%", "err"); return; }
    if (bundles.some((b, j) => j !== i && b.months === mo)) { S.toast("Another bundle already uses that duration", "err"); return; }
    if (bundles.some((b, j) => j !== i && b.pct === pc)) { S.toast("Another bundle already uses that discount", "err"); return; }
    setBundles((bs) => bs.map((b, j) => (j === i ? { months: mo, pct: pc } : b)));
    setRowEdit(null);
    S.toast("Bundle updated", "ok");
  };

  return (
    <div className="content">
      <h1 className="display t32" style={{ marginBottom: 6 }}>Subscriptions</h1>
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
          {!adding && bundles.length < 4 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}><Icon n="plus" s={15} />Add bundle</button>
          )}
        </div>

        {/* default row */}
        <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8 }}>
          <span className="b6">Monthly</span>
          <span className="muted t13">Default</span>
        </div>

        {/* existing bundles */}
        {bundles.map((b, i) => (
          <div key={i}>
            {rowEdit === i ? (
              /* edit form — same inline layout as add-bundle */
              <div className="col gap10 hair" style={{ padding: 14, borderRadius: 12, marginBottom: 8 }}>
                <div className="row gap10">
                  <div className="col gap4 grow">
                    <span className="muted t11 up">Months</span>
                    <div className="row hair gap4" style={{ padding: "0 10px", borderRadius: 10 }}>
                      <input className="input" style={{ border: "none", background: "none", padding: "8px 4px", width: "100%" }}
                        value={editMonths} autoFocus onChange={(e) => setEditMonths(e.target.value.replace(/[^0-9]/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Escape") setRowEdit(null); }} />
                    </div>
                  </div>
                  <div className="col gap4 grow">
                    <span className="muted t11 up">Discount %</span>
                    <div className="row hair gap4" style={{ padding: "0 10px", borderRadius: 10 }}>
                      <input className="input" style={{ border: "none", background: "none", padding: "8px 4px", width: "100%" }}
                        value={editPct} onChange={(e) => setEditPct(e.target.value.replace(/[^0-9]/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Enter") saveRow(i); if (e.key === "Escape") setRowEdit(null); }} />
                    </div>
                  </div>
                </div>
                <div className="row gap8" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setRowEdit(null)}>Cancel</button>
                  <button className="btn btn-blue btn-sm" onClick={() => saveRow(i)}>Save</button>
                </div>
              </div>
            ) : (
              /* view row */
              <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8 }}>
                <span className="b6">{b.months} months</span>
                <div className="row gap8">
                  <span className="chip-mint">Save {b.pct}%</span>
                  <button className="muted" onClick={() => openRowEdit(i)} aria-label="Edit bundle"><Icon n="edit" s={14} /></button>
                  <button className="muted" onClick={() => { setBundles((x) => x.filter((_, j) => j !== i)); S.toast("Bundle removed"); }}
                    aria-label="Remove bundle"><Icon n="x" s={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* inline add form */}
        {adding && (
          <div className="col gap10 hair" style={{ padding: 14, borderRadius: 12, marginTop: 4 }}>
            <div className="b6 t13">New bundle</div>
            <div className="row gap10">
              <div className="col gap4 grow">
                <span className="muted t11 up">Months</span>
                <div className="row hair gap4" style={{ padding: "0 10px", borderRadius: 10 }}>
                  <input className="input" placeholder="e.g. 6" style={{ border: "none", background: "none", padding: "8px 4px", width: "100%" }}
                    value={newMonths} autoFocus onChange={(e) => setNewMonths(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Escape") { setAdding(false); setNewMonths(""); setNewPct(""); } }} />
                </div>
              </div>
              <div className="col gap4 grow">
                <span className="muted t11 up">Discount %</span>
                <div className="row hair gap4" style={{ padding: "0 10px", borderRadius: 10 }}>
                  <input className="input" placeholder="e.g. 20" style={{ border: "none", background: "none", padding: "8px 4px", width: "100%" }}
                    value={newPct} onChange={(e) => setNewPct(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmAdd(); if (e.key === "Escape") { setAdding(false); setNewMonths(""); setNewPct(""); } }} />
                </div>
              </div>
            </div>
            <div className="row gap8" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setNewMonths(""); setNewPct(""); }}>Cancel</button>
              <button className="btn btn-blue btn-sm" onClick={confirmAdd}>Add</button>
            </div>
          </div>
        )}

        {bundles.length >= 4 && !adding && (
          <div className="muted t12" style={{ textAlign: "center", marginTop: 6 }}>Maximum of 4 bundles reached.</div>
        )}
      </div>
    </div>
  );
}
