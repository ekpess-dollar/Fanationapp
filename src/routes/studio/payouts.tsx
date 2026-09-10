import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

export default function PayoutsPage() {
  const S = useAppStore();
  const hist: Array<[string, string, string]> = [
    ...S.payoutReqs.map((r): [string, string, string] => [`$${r.amt.toLocaleString()}`, r.d, r.st]),
    ["$2,480", "Jul 1", "Paid"],
    ["$1,920", "Jun 1", "Paid"],
    ["$2,140", "May 1", "Paid"],
  ];
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
            <div className="row gap10"><Icon n="wallet" s={18} /><span className="t14 b6">GTBank ·· 4021</span></div>
            <span className="chip-mint">Default</span>
          </div>
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => S.toast("Bank picker opens here — verified accounts only")}>Change method</button>
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
    </div>
  );
}
