import { useState } from "react";
import { useAppStore } from "@/lib/core";
import { Icon } from "@/lib/ui";

const ITEMS: Array<[string, string, string, number]> = [
  ["user", "Government-issued ID", "Passport, national ID, or driver's licence", 1],
  ["camera", "Facial verification", "A quick liveness check on camera", 2],
  ["shield", "2 private minutes", "Processed securely, never shared", 3],
];

export default function VerifyPage() {
  const S = useAppStore();
  const [step, setStep] = useState(0);
  const labels = ["Start verification", "Upload ID — continue", "Run liveness check"];
  const advance = () => {
    const msgs = ["Verification started — upload your ID", "ID received · quality check passed", "Liveness check passed — submitted for review"];
    S.toast(msgs[step], step === 0 ? "" : "ok");
    setStep((s) => s + 1);
  };
  return (
    <div className="content" style={{ maxWidth: 620 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div className="row gap12">
            <div className="feature-ic" style={{ background: "rgba(37,153,246,.16)" }}><Icon n="shield" c="var(--blueL-ink)" /></div>
            <div className="col">
              <div className="b7 t20">Identity verification</div>
              <div className="muted t13">Unlock payouts and creator features.</div>
            </div>
          </div>
          {step === 3 && <span className="chip-coin">Under review · ~24h</span>}
        </div>
        <hr className="divider" style={{ margin: "16px 0" }} />
        {step > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="row between t13 muted" style={{ marginBottom: 6 }}><span>Progress</span><span>{step}/3</span></div>
            <div className="progress"><i style={{ width: `${(step / 3) * 100}%` }} /></div>
          </div>
        )}
        <div className="up muted" style={{ marginBottom: 12 }}>What you'll need</div>
        {ITEMS.map((r) => (
          <div key={r[1]} className="row gap12" style={{ marginBottom: 12 }}>
            <div className="feature-ic" style={{ width: 38, height: 38, background: step >= r[3] ? "rgba(93,221,144,.14)" : "var(--fill)" }}>
              <Icon n={step >= r[3] ? "check" : r[0]} s={17} c={step >= r[3] ? "var(--mint-ink)" : "var(--muted)"} />
            </div>
            <div>
              <div className="b6 t14">{r[1]}</div>
              <div className="muted t12">{step >= r[3] ? "Done" : r[2]}</div>
            </div>
          </div>
        ))}
        {step < 3
          ? <button className="btn btn-blue btn-block" style={{ marginTop: 8 }} onClick={advance}>{labels[step]}</button>
          : <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }} onClick={() => { setStep(0); S.toast("Resubmission started — previous documents cleared"); }}>Resubmit documents</button>}
        <div className="row center muted2 t12" style={{ marginTop: 10 }}>Securely processed by Didit</div>
      </div>
    </div>
  );
}
