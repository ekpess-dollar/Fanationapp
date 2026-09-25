import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const TX: Array<[string, string, string, string, string]> = [
  ["user", "Subscription — @superfan", "VIP tier · monthly", "+$12.00", "2m ago"],
  ["gift", "Live gift — @priscilla", "🌹 Rose on live", "+$25.00", "18m ago"],
  ["lock", "PPV unlocked — @mikew", "Coins", "+150 coins", "32m ago"],
  ["dollar", "Tip — @zara_ali", "Coins", "+1,000 coins", "51m ago"],
  ["user", "Subscription — @noahk", "Basic tier · monthly", "+$9.00", "2h ago"],
  ["gift", "Live gift — @jayden", "🎁 Gift box", "+50 coins", "5h ago"],
  ["wallet", "Payout — Visa ·· 6411", "Auto-payout", "-$2,480.00", "1d ago"],
];

export default function EarningsPage() {
  const S = useAppStore();
  const rows: Array<[string, string, string, string]> = [
    ["Subscriptions", "$2,640", "62%", "var(--blue)"],
    ["Live gifts", "$980", "23%", "var(--amber)"],
    ["PPV & drops", "$430", "10%", "var(--coral)"],
    ["Tips", "$230", "5%", "var(--mint)"],
  ];
  return (
    <div className="content">
      <div className="row between wrap" style={{ marginBottom: 20, gap: 12 }}>
        <div className="col gap4">
          <h2 className="display t32">Earnings</h2>
          <span className="muted">Where your money comes from.</span>
        </div>
        <button className="btn btn-grad" onClick={() => S.openModal("payout")}><Icon n="dollar" s={16} />Withdraw $4,280</button>
      </div>
      <div className="grid grail-14 gap16">
        <div className="card" style={{ padding: 22 }}>
          <span className="up muted">Available balance</span>
          <div className="statnum mint" style={{ fontSize: 44, margin: "12px 0 4px" }}>$4,280.00</div>
          <div className="muted t13" style={{ marginBottom: 16 }}>Next auto-payout in 24h</div>
          <button className="btn btn-blue btn-block" onClick={() => S.openModal("payout")}>Withdraw now</button>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 16 }}>Revenue by source</div>
          {rows.map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div className="row between t14" style={{ marginBottom: 6 }}>
                <span className="b6">{s[0]}</span>
                <span className="b7">{s[1]} <span className="muted t12">· {s[2]}</span></span>
              </div>
              <div className="progress"><i style={{ width: s[2], background: s[3] }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 16 }}>
        <div className="row between" style={{ padding: "16px 18px" }}>
          <span className="b7">Transaction history</span>
          <span className="muted t13">{TX.length} records</span>
        </div>
        <hr className="divider" />
        {TX.map(([ic, t, s, amt, d], i) => (
          <div key={i}>
            <div className="row between" style={{ padding: "14px 18px" }}>
              <div className="row gap12">
                <div className="feature-ic" style={{ width: 38, height: 38, background: "var(--fill)" }}>
                  <Icon n={ic} s={17} c="var(--muted)" solid />
                </div>
                <div className="col">
                  <span className="b6 t14">{t}</span>
                  <span className="muted t12">{s} · {d}</span>
                </div>
              </div>
              <span className="b7 t14" style={{ color: amt.startsWith("+") ? "var(--mint-ink)" : "var(--coral-ink)" }}>{amt}</span>
            </div>
            {i < TX.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}
