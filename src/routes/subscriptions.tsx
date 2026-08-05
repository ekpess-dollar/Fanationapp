import { CREATORS, useAppStore } from "@/lib/core";
import { Avatar, Menu, Verified } from "@/lib/ui";

export default function SubscriptionsPage() {
  const S = useAppStore();
  const active = CREATORS.filter((c) => S.subs[c.handle]);
  const expired = CREATORS.filter((c) => !S.subs[c.handle]).slice(0, 2);
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 6 }}>Subscriptions</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Manage the creators you support · {active.length} active.</p>
      {active.length === 0 && (
        <div className="card col center gap10" style={{ padding: 44, textAlign: "center", marginBottom: 24 }}>
          <div className="b7">No active subscriptions</div>
          <div className="muted t13">Explore creators and subscribe — everything you unlock lives here.</div>
        </div>
      )}
      <div className="grid g3 gap16" style={{ marginBottom: 24 }}>
        {active.map((c, i) => (
          <div key={c.id} className="card" style={{ padding: 16 }}>
            <div className="row between">
              <div className="row gap12">
                <Avatar name={c.name} size={46} />
                <div className="col grow">
                  <div className="row gap6 b7 t14">{c.name} {c.v && <Verified s={13} />}</div>
                  <div className="muted t12"><span className="tag" style={{ padding: "2px 8px" }}>{["Premium", "Basic", "VIP"][i % 3]}</span> ${c.price}/mo</div>
                </div>
              </div>
              <Menu items={[
                { ic: "star", t: "Change tier", fn: () => S.openModal("subscribe", c) },
                { ic: "bell", t: "Pause renewal", fn: () => S.toast(`Renewal paused for @${c.handle} — resumes anytime`) },
                "-",
                { ic: "x", t: "Cancel subscription", danger: true, fn: () => S.unsub(c.handle) },
              ]} />
            </div>
            <div className="row between" style={{ marginTop: 14 }}>
              <span className="chip-mint">Renews Aug 17</span>
              <span className="muted t12">since Mar 2026</span>
            </div>
          </div>
        ))}
      </div>
      <div className="up muted" style={{ marginBottom: 12 }}>Expired</div>
      <div className="grid g3 gap16">
        {expired.map((c) => (
          <div key={c.id} className="card" style={{ padding: 16, opacity: 0.8 }}>
            <div className="row gap12">
              <Avatar name={c.name} size={46} />
              <div className="col grow"><div className="b7 t14">{c.name}</div><div className="muted t12">Expired Jul 2</div></div>
            </div>
            <button className="btn btn-blue btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => S.openModal("subscribe", c)}>
              Resubscribe · ${c.price}/mo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
