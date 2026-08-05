import { TX_SEED, useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

export default function WalletPage() {
  const S = useAppStore();
  const tx = [...S.walletTx, ...TX_SEED];
  return (
    <div className="content">
      <div className="row between wrap" style={{ marginBottom: 20, gap: 12 }}>
        <div className="col gap4">
          <h2 className="display t32">Wallet</h2>
          <span className="muted">Coins, cards, and your gifting history.</span>
        </div>
        <div className="row gap10">
          <button className="btn btn-ghost" onClick={() => S.openModal("payout")}><Icon n="dollar" s={16} />Withdraw</button>
          <button className="btn btn-grad" onClick={() => S.openModal("coins")}><Icon n="plus" s={16} />Buy coins</button>
        </div>
      </div>
      <div className="grid g3 gap16" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row between"><span className="up muted">Coin balance</span><Icon n="coin" c="var(--amber-ink)" /></div>
          <div className="statnum amber" style={{ marginTop: 12 }}>{S.coins.toLocaleString()}</div>
          <div className="muted t13">≈ ${(S.coins / 100).toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="row between"><span className="up muted">Earnings</span><Icon n="dollar" c="var(--mint-ink)" /></div>
          <div className="statnum mint" style={{ marginTop: 12 }}>$4,280</div>
          <div className="muted t13">available to withdraw</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="row between"><span className="up muted">This month</span><Icon n="gift" c="var(--coral-ink)" /></div>
          <div className="statnum" style={{ marginTop: 12 }}>$612</div>
          <div className="muted t13">gifted to creators</div>
        </div>
      </div>
      {S.payoutReqs.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="up muted" style={{ marginBottom: 10 }}>Payout requests</div>
          {S.payoutReqs.map((r, i) => (
            <div key={i} className="row gap10" style={{ padding: "6px 0" }}>
              <Icon n="dollar" s={16} c="var(--mint-ink)" />
              <span className="b7 t14">${r.amt.toLocaleString()}</span>
              <span className="muted t12">GTBank · {r.d}</span>
              <div className="grow" />
              <span className="chip-coin">{r.st}</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid gmain-14 gap16">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="row between" style={{ padding: "16px 18px" }}>
            <span className="b7">Transaction history</span>
            <span className="muted t13">{tx.length} records</span>
          </div>
          <hr className="divider" />
          {tx.map((t, i) => (
            <div key={i}>
              <div className="row between" style={{ padding: "14px 18px", background: t.d === "Just now" ? "rgba(93,221,144,.05)" : "" }}>
                <div className="row gap12">
                  <div className="feature-ic" style={{ width: 38, height: 38, background: "var(--fill)" }}>
                    <Icon n={t.coin.startsWith("+") ? "coin" : t.a ? "dollar" : "gift"} s={17} c="var(--muted)" />
                  </div>
                  <div className="col">
                    <span className="b6 t14">{t.t}</span>
                    <span className="muted t12">{t.s} · {t.d}</span>
                  </div>
                </div>
                <div className="col" style={{ alignItems: "flex-end" }}>
                  {t.a && <span className="b7 t14">{t.a}</span>}
                  {t.coin && <span className="t13 b6" style={{ color: t.coin.startsWith("+") ? "var(--mint-ink)" : "var(--amber-ink)" }}>{t.coin} coins</span>}
                </div>
              </div>
              {i < tx.length - 1 && <hr className="divider" />}
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 14 }}>Payment methods</div>
          <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 10 }}>
            <div className="row gap10"><Icon n="wallet" s={18} /><span className="t14 b6">Visa ·· 6411</span></div>
            <span className="chip-mint">Default</span>
          </div>
          <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 14 }}>
            <div className="row gap10"><Icon n="dollar" s={18} /><span className="t14 b6">Paystack</span></div>
            <span className="muted t12">Connected</span>
          </div>
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => S.toast("Card form opens here — Paystack tokenised, we never store PANs")}>
            <Icon n="plus" s={15} />Add method
          </button>
        </div>
      </div>
    </div>
  );
}
