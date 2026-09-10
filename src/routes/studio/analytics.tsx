import { StatCard } from "@/lib/ui";

const GROWTH = [120, 180, 240, 300, 380, 520, 640, 780, 910, 1100, 1240, 1420];

export default function AnalyticsPage() {
  const max = Math.max(...GROWTH), min = Math.min(...GROWTH);
  const pts = GROWTH.map((v, i) => `${(i / (GROWTH.length - 1)) * 100},${100 - ((v - min) / (max - min)) * 88 - 6}`).join(" ");
  return (
    <div className="content">
      <h2 className="display t32" style={{ marginBottom: 18 }}>Analytics</h2>
      <div className="grid g4 gap16" style={{ marginBottom: 16 }}>
        <StatCard label="Subscribers" value="8,412" sub="+20% MoM" icon="users" color="var(--blue-ink)" />
        <StatCard label="Watch time" value="18.4K h" sub="live + replays" icon="live" color="var(--coral-ink)" />
        <StatCard label="Engagement" value="12.8%" sub="likes+comments" icon="heart" color="var(--mint-ink)" />
        <StatCard label="Churn" value="3.1%" sub="-0.4% MoM" icon="chart" color="var(--amber-ink)" />
      </div>
      <div className="grid gmain-15 gap16">
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 14 }}>Subscriber growth</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 170 }}>
            <polyline points={pts} fill="none" stroke="var(--mint-ink)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="b7" style={{ marginBottom: 12 }}>Top content</div>
          {([["Full photo set", "6.1K coins"], ["Q&A replay", "4.2K coins"], ["Live: Friday Q&A", "5.4K coins"], ["Workout wk1", "230 coins"]] as const).map((t, i) => (
            <div key={i} className="row between" style={{ padding: "9px 0" }}>
              <div className="row gap10"><span className="muted b7 t14">{i + 1}</span><span className="t14">{t[0]}</span></div>
              <span className="amber b6 t13">{t[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
