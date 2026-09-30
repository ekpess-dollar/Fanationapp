import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

interface BankAccount {
  id: number;
  bank: string;
  number: string; // last 4 digits stored after masking
  accountName: string;
}

const BANKS = [
  "GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA",
  "Stanbic IBTC", "Fidelity Bank", "Union Bank", "Ecobank", "Paystack",
];

let nextId = 2;

export default function PayoutsPage() {
  const S = useAppStore();

  const hist: Array<[string, string, string]> = [
    ...S.payoutReqs.map((r): [string, string, string] => [`$${r.amt.toLocaleString()}`, r.d, r.st]),
    ["$2,480", "Jul 1", "Paid"],
    ["$1,920", "Jun 1", "Paid"],
    ["$2,140", "May 1", "Paid"],
  ];

  const [accounts, setAccounts] = useState<BankAccount[]>([
    { id: 1, bank: "GTBank", number: "4021", accountName: S.profile.name },
  ]);
  const [defaultId, setDefaultId] = useState(1);

  // modal state
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newBank, setNewBank] = useState(BANKS[0]);
  const [newNumber, setNewNumber] = useState("");
  // resolved by the simulated API — not typed by the user
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveErr, setResolveErr] = useState("");

  const closeModal = () => { setOpen(false); setAdding(false); resetForm(); };
  const resetForm = () => {
    setNewBank(BANKS[0]); setNewNumber("");
    setResolvedName(null); setResolving(false); setResolveErr("");
  };

  // Simulate the bank account-name resolution API (Paystack /bank/resolve).
  // In production this is a single GET with account_number + bank_code.
  // We mimic the ~1s round-trip and always return the creator's verified name
  // (real banks reject mismatches before the response ever reaches us).
  useEffect(() => {
    const digits = newNumber.replace(/\D/g, "");
    if (digits.length !== 10) { setResolvedName(null); setResolveErr(""); return; }
    setResolving(true);
    setResolvedName(null);
    setResolveErr("");
    const t = setTimeout(() => {
      setResolving(false);
      // Simulate: account found and name matches the verified profile
      setResolvedName(S.profile.name);
    }, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNumber, newBank]);

  const addAccount = () => {
    if (!resolvedName) { S.toast("Wait for account name to resolve", "err"); return; }
    const last4 = newNumber.replace(/\D/g, "").slice(-4);
    const id = ++nextId;
    setAccounts((a) => [...a, { id, bank: newBank, number: last4, accountName: resolvedName }]);
    S.toast("Bank account added", "ok");
    setAdding(false);
    resetForm();
  };

  const removeAccount = (id: number) => {
    if (id === defaultId) { S.toast("Set another account as default before removing this one", "err"); return; }
    setAccounts((a) => a.filter((x) => x.id !== id));
    S.toast("Account removed", "ok");
  };

  const defaultAccount = accounts.find((a) => a.id === defaultId);

  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <h2 className="display t32" style={{ marginBottom: 18 }}>Payouts</h2>
      <div className="grid g2 gap16" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <span className="up muted">Available</span>
          <div className="statnum mint" style={{ margin: "10px 0 14px" }}>$4,280</div>
          <button className="btn btn-blue btn-block" onClick={() => S.openModal("payout")}>Withdraw</button>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <span className="up muted">Payout method</span>
          <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, margin: "12px 0 10px" }}>
            <div className="row gap10"><Icon n="wallet" s={18} /><span className="t14 b6">{defaultAccount?.bank} ·· {defaultAccount?.number}</span></div>
            <span className="chip-mint">Default</span>
          </div>
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => setOpen(true)}>Change method</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="b7" style={{ padding: "14px 18px" }}>Payout history</div>
        <hr className="divider" />
        {hist.map((p, i) => (
          <div key={i}>
            <div className="row between" style={{ padding: "13px 18px", background: p[1] === "Just now" ? "rgba(93,221,144,.05)" : "" }}>
              <div className="row gap12">
                <Icon n="dollar" s={17} c="var(--mint-ink)" />
                <div className="col"><span className="b6 t14">{p[0]}</span><span className="muted t12">GTBank · {p[1]}</span></div>
              </div>
              {p[2] === "Paid" ? <span className="chip-mint">Paid</span> : <span className="chip-coin">{p[2]}</span>}
            </div>
            {i < hist.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>

      {/* ── bank accounts modal ─────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={closeModal}>
          <div className="card col gap0" style={{ padding: 0, maxWidth: 420, width: "92%", background: "var(--card2)", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}>

            {/* header */}
            <div className="row between" style={{ padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
              <span className="b7 t16">Payout accounts</span>
              <button className="muted" onClick={closeModal}><Icon n="x" s={18} /></button>
            </div>

            {/* account list */}
            <div className="col" style={{ padding: "14px 20px", gap: 10 }}>
              {accounts.map((a) => (
                <div key={a.id} className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, gap: 8 }}>
                  <div className="row gap10">
                    <Icon n="wallet" s={18} />
                    <div className="col gap2">
                      <span className="b6 t14">{a.bank} ·· {a.number}</span>
                      <span className="muted t12">{a.accountName}</span>
                    </div>
                  </div>
                  <div className="row gap8">
                    {a.id === defaultId
                      ? <span className="chip-mint">Default</span>
                      : <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                          onClick={() => { setDefaultId(a.id); S.toast(`${a.bank} ·· ${a.number} set as default`, "ok"); }}>
                          Set default
                        </button>
                    }
                    {accounts.length > 1 && a.id !== defaultId && (
                      <button className="muted" onClick={() => removeAccount(a.id)} aria-label="Remove account">
                        <Icon n="x" s={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* add account form */}
              {adding ? (
                <div className="col gap10 hair" style={{ padding: 14, borderRadius: 12, marginTop: 4 }}>
                  <div className="b6 t13">Add bank account</div>
                  <div className="col gap4">
                    <span className="muted t11 up">Bank</span>
                    <select className="input" value={newBank} onChange={(e) => setNewBank(e.target.value)}
                      style={{ padding: "9px 12px" }}>
                      {BANKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col gap4">
                    <span className="muted t11 up">Account number</span>
                    <input className="input" placeholder="0000000000" maxLength={10}
                      value={newNumber} onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ""))} />
                  </div>
                  {/* Account name — resolved automatically once 10 digits are entered */}
                  <div className="col gap4">
                    <span className="muted t11 up">Account name</span>
                    <div className="row hair gap10" style={{ padding: "10px 14px", borderRadius: 12, minHeight: 42 }}>
                      {resolving ? (
                        <span className="muted t13" style={{ fontStyle: "italic" }}>Resolving account name…</span>
                      ) : resolvedName ? (
                        <>
                          <Icon n="check" s={14} c="var(--mint-ink)" />
                          <span className="b6 t14">{resolvedName}</span>
                        </>
                      ) : resolveErr ? (
                        <span className="t13" style={{ color: "var(--coral-ink)" }}>{resolveErr}</span>
                      ) : (
                        <span className="muted t13">Filled automatically after account number</span>
                      )}
                    </div>
                  </div>
                  <div className="row gap8" style={{ justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); resetForm(); }}>Cancel</button>
                    <button className="btn btn-blue btn-sm" onClick={addAccount}>Add account</button>
                  </div>
                </div>
              ) : accounts.length < 3 ? (
                <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 4 }} onClick={() => setAdding(true)}>
                  <Icon n="plus" s={15} />Add another account
                </button>
              ) : (
                <div className="muted t12" style={{ textAlign: "center", marginTop: 4 }}>
                  Maximum of 3 accounts on file.
                </div>
              )}
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="btn btn-blue btn-block btn-sm" onClick={closeModal}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
