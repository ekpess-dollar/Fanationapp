import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CREATORS, REPORT_REASONS, useAppStore } from "@/lib/core";
import type { Creator, PollOpt, Post } from "@/lib/core";
import { Avatar, Icon, Photo, SIZES, Verified, mediaFor, myMediaFor, poolFor } from "@/lib/ui";
import { LinkRow } from "@/components/settings-nav";

const MODAL_LABELS: Record<string, string> = {
  subscribe: "Subscribe",
  coins: "Buy coins",
  gift: "Send a gift",
  ppv: "Unlock content",
  tip: "Send a tip",
  report: "Report post",
  compose: "Create post",
  payout: "Withdraw earnings",
  paidmsg: "Unlock message",
  logout: "Log out",
  chatinfo: "Chat info",
  preferences: "Set your interests",
};

const PREF_CATS = [
  { id: "lifestyle",  label: "Lifestyle",    emoji: "🌿" },
  { id: "fitness",    label: "Fitness",      emoji: "💪" },
  { id: "travel",     label: "Travel",       emoji: "✈️" },
  { id: "beauty",     label: "Beauty",       emoji: "💄" },
  { id: "music",      label: "Music",        emoji: "🎵" },
  { id: "gaming",     label: "Gaming",       emoji: "🎮" },
  { id: "comedy",     label: "Comedy",       emoji: "😂" },
  { id: "art",        label: "Art",          emoji: "🎨" },
  { id: "tech",       label: "Tech",         emoji: "💻" },
  { id: "cooking",    label: "Cooking",      emoji: "🍳" },
  { id: "education",  label: "Education",    emoji: "📚" },
  { id: "dance",      label: "Dance",        emoji: "💃" },
  { id: "podcasts",   label: "Podcasts",     emoji: "🎙️" },
  { id: "live",       label: "Live Streams", emoji: "🔴" },
  { id: "fashion",    label: "Fashion",      emoji: "👗" },
  { id: "adult",      label: "Adult",        emoji: "🔞" },
];

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Global modal host — open from anywhere via store.openModal(type, data). */
export function ModalHost() {
  const modal = useAppStore((s) => s.modal);
  const close = useAppStore((s) => s.closeModal);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);
  /* Read through a ref so the listener is registered once and never churns. */
  const open = useRef(false);
  open.current = !!modal;

  /* Save the element that had focus before opening, then move focus into the
     dialog. Restore it when the modal closes so the user lands back where
     they were — the trigger button, for example. */
  useEffect(() => {
    if (modal) {
      prevFocus.current = document.activeElement;
      const raf = requestAnimationFrame(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      });
      return () => cancelAnimationFrame(raf);
    } else {
      if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus();
      prevFocus.current = null;
    }
  }, [modal]);

  useEffect(() => {
    /* Escape must not touch the store when no modal is open.
     *
     * This host mounts in the app layout, so its listener is on `window`
     * before any page's. `closeModal()` writes `{ modal: null }`, which is a
     * new state object even when nothing changed, so every component that
     * subscribes to the whole store re-renders. Escape is a discrete input
     * event, so React flushes that re-render *synchronously, inside the
     * dispatch* — and any listener a re-rendering component removes in its
     * effect cleanup is dropped from the live dispatch before it runs.
     *
     * That is exactly how the story viewer lost its own Escape: it registered
     * after this one, and this handler's pointless store write unmounted its
     * listener mid-flight. Guarding on `open` keeps the store untouched, so
     * every later Escape listener on the page still fires. */
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open.current) close(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close]);

  if (!modal) return null;
  const M: Record<string, React.ReactNode> = {
    subscribe: <SubscribeModal c={modal.d as Creator} />,
    coins: <CoinsModal />,
    gift: <GiftModal c={modal.d as Creator} />,
    ppv: <PpvModal p={modal.d as Post} />,
    tip: <TipModal c={modal.d as Creator} />,
    report: <ReportModal p={modal.d as Post} />,
    compose: <ComposeModal defaultVis={typeof modal.d === "string" ? modal.d : undefined} />,
    payout: <PayoutModal />,
    paidmsg: <PaidMsgModal threadKey={(modal.d as string) || "sofiaa"} />,
    logout: <LogoutModal />,
    chatinfo: <ChatInfoModal c={modal.d as Creator} />,
    preferences: <PreferencesModal />,
  };
  const body = M[modal.t];
  if (!body) return null;

  const WIDE_MODALS = new Set<string>(["preferences"]);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  };

  return (
    <div className="overlay" onClick={close}>
      <div
        ref={dialogRef}
        className={"modal" + (WIDE_MODALS.has(modal.t) ? " modal-wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={MODAL_LABELS[modal.t] ?? "Dialog"}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapFocus}
      >
        {body}
      </div>
    </div>
  );
}

function SubscribeModal({ c = CREATORS[0] }: { c?: Creator }) {
  const { subscribe, closeModal } = useAppStore();
  const [sel, setSel] = useState(0);
  const plans: Array<[string, string, string]> = [
    ["1 month", `$${c.price}/mo`, ""],
    ["3 months", `$${Math.round(c.price * 2.5)}`, "Save 17%"],
    ["12 months", `$${Math.round(c.price * 9.2)}`, "Save 24%"],
  ];
  return (
    <>
      <div className="row gap12" style={{ marginBottom: 16 }}>
        <Avatar name={c.name} size={48} />
        <div className="col">
          <div className="row gap6 b7 uname">{c.name} {c.v && <Verified s={14} />}</div>
          <div className="muted t13">@{c.handle}</div>
        </div>
      </div>
      <div className="b7 t18" style={{ marginBottom: 10 }}>Choose your plan</div>
      {plans.map((b, i) => (
        <label key={i} className="row between hair"
          style={{ padding: "13px 15px", borderRadius: 12, marginBottom: 9, cursor: "pointer", borderColor: sel === i ? "var(--blue-ink)" : "var(--line)", background: sel === i ? "rgba(37,153,246,.07)" : "" }}>
          <div className="row gap10">
            <input type="radio" name="subscribe-plan" id={`plan-${i}`} checked={sel === i} onChange={() => setSel(i)} />
            <span className="b6">{b[0]}</span>
          </div>
          <div className="row gap8"><span className="blue b7">{b[1]}</span>{b[2] && <span className="chip-mint">{b[2]}</span>}</div>
        </label>
      ))}
      <button className="btn btn-blue btn-block" style={{ marginTop: 6 }} onClick={() => { subscribe(c.handle); closeModal(); }}>
        Subscribe · {plans[sel][1]}
      </button>
      <div className="row center muted2 t12" style={{ marginTop: 10 }}>Cancel anytime · Secured by Paystack</div>
    </>
  );
}

const PACKS: Array<[number, string]> = [[500, "$5"], [1200, "$10"], [2600, "$20"], [7000, "$49"]];
// Coins per dollar — scales linearly for custom amounts
const COINS_PER_DOLLAR = 100;

function CoinsModal() {
  const { coins, buyCoins, closeModal } = useAppStore();
  const [sel, setSel] = useState<number | null>(2);
  const [customUsd, setCustomUsd] = useState("");

  const customVal = parseFloat(customUsd);
  const customValid = !isNaN(customVal) && customVal >= 1;
  const customCoins = customValid ? Math.floor(customVal * COINS_PER_DOLLAR) : 0;

  // Active purchase is either the selected pack or a valid custom amount
  const activePack = sel !== null ? PACKS[sel] : null;
  const displayUsd = activePack ? activePack[1].replace("$", "") : customValid ? customVal.toFixed(2) : null;
  const displayCoins = activePack ? activePack[0] : customCoins;
  const canBuy = activePack !== null || customValid;

  const handleCustomChange = (v: string) => {
    // Allow digits and one decimal point only
    const clean = v.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*$/, "$1");
    setCustomUsd(clean);
    setSel(null); // deselect preset when user types
  };

  const handlePackSelect = (i: number) => {
    setSel(i);
    setCustomUsd(""); // clear custom when preset chosen
  };

  const handleBuy = () => {
    if (!canBuy) return;
    if (activePack) {
      buyCoins(activePack[0], activePack[1]);
    } else {
      buyCoins(customCoins, `$${customVal.toFixed(2)}`);
    }
    closeModal();
  };

  return (
    <>
      <div className="b7 t20" style={{ marginBottom: 4 }}>Buy coins</div>
      <div className="muted t13" style={{ marginBottom: 8 }}>Coins power gifts, tips, and PPV unlocks.</div>
      <div className="row between muted t13" style={{ marginBottom: 14 }}>
        <span>Current balance</span><span className="amber b7">{coins.toLocaleString()} coins</span>
      </div>
      <div className="grid g2 gap10" style={{ marginBottom: 14 }}>
        {PACKS.map((p, i) => (
          <button key={i} onClick={() => handlePackSelect(i)} aria-pressed={sel === i} className="card col center gap4"
            style={{ padding: 16, borderColor: sel === i ? "var(--amber)" : "var(--line)", background: sel === i ? "rgba(252,164,75,.06)" : "" }}>
            <span className="chip-coin"><Icon n="coin" s={14} />{p[0].toLocaleString()}</span>
            <span className="b7 t18">{p[1]}</span>
          </button>
        ))}
      </div>

      {/* Custom amount row */}
      <div className="card" style={{ padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="muted t13" style={{ flex: "none" }}>Custom amount</span>
        <div className="row gap6 grow" style={{ position: "relative" }}>
          <span className="muted b6" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>$</span>
          <input
            className="input"
            style={{ paddingLeft: 22, flex: 1 }}
            placeholder="0.00"
            inputMode="decimal"
            aria-label="Custom dollar amount"
            value={customUsd}
            onChange={(e) => handleCustomChange(e.target.value)}
          />
        </div>
        {customValid && (
          <span className="chip-coin" style={{ flex: "none" }}>
            <Icon n="coin" s={13} />{customCoins.toLocaleString()}
          </span>
        )}
      </div>

      <button className="btn btn-coin btn-block" disabled={!canBuy} onClick={handleBuy}>
        {canBuy
          ? `Pay $${displayUsd} · get ${displayCoins.toLocaleString()} coins`
          : "Select an amount"}
      </button>
    </>
  );
}

const GIFTS: Array<[string, number]> = [["🌹", 50], ["🎁", 200], ["💎", 500], ["👑", 1000], ["🔥", 20], ["⭐", 100], ["🚀", 750], ["💰", 500]];

function GiftModal({ c = CREATORS[0] }: { c?: Creator }) {
  const { coins, spend, toast, closeModal, openModal } = useAppStore();
  const [sel, setSel] = useState(1);
  return (
    <>
      <div className="b7 t20" style={{ marginBottom: 4 }}>Send a gift</div>
      <div className="muted t13" style={{ marginBottom: 14 }}>to {c.name} — they receive 80% of coin value.</div>
      <div className="grid g4 gap10" style={{ marginBottom: 14 }}>
        {GIFTS.map((g, i) => (
          <button key={i} onClick={() => setSel(i)} aria-pressed={sel === i} className="card col center gap4"
            style={{ padding: "14px 4px", borderColor: sel === i ? "var(--amber)" : "var(--line)" }}>
            <span style={{ fontSize: 22 }} aria-hidden>{g[0]}</span>
            <span className="chip-coin" style={{ padding: "2px 7px" }}>{g[1]}</span>
          </button>
        ))}
      </div>
      <div className="row between muted t13" style={{ marginBottom: 12 }}>
        <span>Your balance</span><span className="amber b7">{coins.toLocaleString()} coins</span>
      </div>
      <button className="btn btn-grad btn-block" onClick={() => {
        const ok = spend(GIFTS[sel][1], `Gift ${GIFTS[sel][0]} to @${c.handle}`);
        closeModal();
        if (ok) toast(`Gift ${GIFTS[sel][0]} sent to @${c.handle}`, "ok");
        else openModal("coins");
      }}>
        Send gift · {GIFTS[sel][1]} coins
      </button>
    </>
  );
}

function PpvModal({ p }: { p: Post }) {
  const { coins, unlockPost, closeModal, openModal } = useAppStore();
  const price = p?.price ?? 150;
  const short = coins < price;
  return (
    <div className="col center" style={{ gap: 12, textAlign: "center" }}>
      <div className="feature-ic" style={{ background: "rgba(37,153,246,.16)" }}><Icon n="lock" c="var(--blueL-ink)" /></div>
      <div className="b7 t20">Unlock this content</div>
      <div className="muted t14">Pay {price} coins to permanently unlock this drop{p?.who ? ` from ${p.who}` : ""}.</div>
      <div className="row between hair wfull" style={{ padding: "12px 14px", borderRadius: 12 }}>
        <span className="muted t13">Your balance</span>
        <span className={"b7 " + (short ? "coral" : "amber")}>{coins.toLocaleString()} coins</span>
      </div>
      {short && <div className="t13 coral">You need {(price - coins).toLocaleString()} more coins.</div>}
      <button className="btn btn-blue btn-block" onClick={() => {
        if (short) { closeModal(); openModal("coins"); }
        else { unlockPost(p); closeModal(); }
      }}>
        {short ? "Top up & unlock" : `Unlock for ${price} coins`}
      </button>
    </div>
  );
}

function TipModal({ c = CREATORS[0] }: { c?: Creator }) {
  const { tipUsd, closeModal } = useAppStore();
  const [sel, setSel] = useState(1);
  const TIPS = [5, 10, 25, 50, 100, 200];
  return (
    <>
      <div className="b7 t20" style={{ marginBottom: 4 }}>Send a tip</div>
      <div className="muted t13" style={{ marginBottom: 14 }}>to {c.name} · billed to your card.</div>
      <div className="grid g3 gap10" style={{ marginBottom: 14 }}>
        {TIPS.map((v, i) => (
          <button key={i} onClick={() => setSel(i)} aria-pressed={sel === i} className="card row center"
            style={{ padding: "14px 4px", borderColor: sel === i ? "var(--mint)" : "var(--line)" }}>
            <span className="b7 t18 mint">${v}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-grad btn-block" onClick={() => { tipUsd(TIPS[sel], c.handle); closeModal(); }}>
        Send ${TIPS[sel]} tip
      </button>
    </>
  );
}

function ReportModal({ p }: { p: Post }) {
  const { report, closeModal } = useAppStore();
  const [sel, setSel] = useState<number | null>(null);
  return (
    <>
      <div className="row between" style={{ marginBottom: 6 }}>
        <div className="b7 t20">Report this post</div>
        <button className="muted" onClick={closeModal} aria-label="Close"><Icon n="x" s={18} /></button>
      </div>
      <div className="muted t13" style={{ marginBottom: 14 }}>Your report is anonymous. @{p?.h} won&apos;t know who reported.</div>
      <div className="col gap6" style={{ marginBottom: 12 }}>
        {REPORT_REASONS.map((r, i) => (
          <label key={i} className="row gap10 hair t13 b6" onClick={() => setSel(i)}
            style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", borderColor: sel === i ? "var(--coral)" : "var(--line)", background: sel === i ? "rgba(243,106,70,.06)" : "" }}>
            <input type="radio" checked={sel === i} onChange={() => setSel(i)} />{r}
          </label>
        ))}
      </div>
      <button className="btn btn-red btn-block" disabled={sel == null}
        onClick={() => { if (sel != null) { report(p.id, REPORT_REASONS[sel]); closeModal(); } }}>
        Submit report
      </button>
      <div className="row center muted2 t12" style={{ marginTop: 10 }}>False reports may limit your account</div>
    </>
  );
}

function ComposeModal({ defaultVis }: { defaultVis?: string }) {
  const { addPost, closeModal } = useAppStore();
  const [cap, setCap] = useState("");
  const [vis, setVis] = useState(defaultVis || "Everyone");
  const [media, setMedia] = useState(false);
  const [pollOn, setPollOn] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [when, setWhen] = useState<string | null>(null);
  const [price, setPrice] = useState("150");
  const can = cap.trim().length > 0 || media;
  const pollOk = !pollOn || (p1.trim() && p2.trim());
  const poll: PollOpt[] | undefined = pollOn && p1.trim() && p2.trim()
    ? [{ label: p1.trim(), pct: 50 }, { label: p2.trim(), pct: 50 }]
    : undefined;
  return (
    <>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="b7 t20">Create post</div>
        <button className="muted" onClick={closeModal} aria-label="Close"><Icon n="x" s={18} /></button>
      </div>
      <div className="row gap12" style={{ marginBottom: 12 }}>
        <Avatar name="You" size={40} />
        <div className="col"><div className="b6 t14 uname">You</div><div className="muted t12">Posting as @yourhandle</div></div>
      </div>
      <textarea className="input" rows={3} maxLength={500} placeholder="What's on your mind?" aria-label="Post caption" value={cap}
        onChange={(e) => setCap(e.target.value)} style={{ resize: "none", marginBottom: 4 }} />
      <div className="row between muted2 t12" style={{ marginBottom: 10 }}><span /><span>{cap.length}/500</span></div>
      <div onClick={() => setMedia(!media)}
        style={{ border: `1px dashed ${media ? "var(--mint-ink)" : "var(--line2)"}`, borderRadius: 14, marginBottom: 14, cursor: "pointer", overflow: "hidden", position: "relative", height: media ? 110 : undefined, padding: media ? 0 : 20 }}>
        {media ? (
          <>
            <Photo sizes={SIZES.modal} src={myMediaFor(1)} seed="composeMedia" />
            <span className="chip-mint onart" style={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}><Icon n="check" s={12} />Media attached — click to remove</span>
          </>
        ) : (
          <div className="row center gap8 muted"><Icon n="upload" s={18} />Add photos or video</div>
        )}
      </div>
      {pollOn && (
        <div className="col gap8" style={{ marginBottom: 12 }}>
          <input className="input" placeholder="Poll option 1" aria-label="Poll option 1" value={p1} onChange={(e) => setP1(e.target.value)} />
          <input className="input" placeholder="Poll option 2" aria-label="Poll option 2" value={p2} onChange={(e) => setP2(e.target.value)} />
        </div>
      )}
      <label className="label">Who can see this</label>
      <div className="row gap8 wrap" style={{ marginBottom: 12 }}>
        {["Everyone", "Subscribers", "Tier: VIP", "Pay-per-view"].map((v) => (
          <span key={v} className={"tag" + (vis === v ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => setVis(v)}>{v}</span>
        ))}
      </div>
      {vis === "Pay-per-view" && (
        <div className="row hair" style={{ padding: "0 14px", borderRadius: 14, marginBottom: 12, gap: 8 }}>
          <Icon n="coin" s={16} c="var(--amber-ink)" />
          <input className="input" aria-label="Price in coins" style={{ border: "none", background: "none" }} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} />
          <span className="muted t13">coins to unlock</span>
        </div>
      )}
      <div className="row between">
        <div className="row gap14">
          <button className={"row gap6 t13 " + (pollOn ? "blueL" : "muted")} onClick={() => setPollOn(!pollOn)}>
            <Icon n="chart" s={16} />Poll
          </button>
          <button className={"row gap6 t13 " + (when ? "amber" : "muted")} onClick={() => setWhen(when ? null : "Tomorrow · 9am")}>
            <Icon n="cal" s={15} />{when || "Schedule"}
          </button>
        </div>
        <button className="btn btn-blue" disabled={!can || !pollOk}
          onClick={() => { addPost({ text: cap.trim(), media, poll, vis, when, price: Number(price) || 150 }); closeModal(); }}>
          {when ? "Schedule" : "Post"}
        </button>
      </div>
      {!can && <div className="muted2 t12" style={{ marginTop: 8 }}>Write a caption or attach media to post.</div>}
    </>
  );
}

function PayoutModal() {
  const { payoutError, requestPayout, closeModal, toast } = useAppStore();
  const [amt, setAmt] = useState("4280");
  const n = parseInt(amt || "0", 10);
  const err = payoutError(n);
  return (
    <>
      <div className="b7 t20" style={{ marginBottom: 4 }}>Withdraw earnings</div>
      <div className="muted t13" style={{ marginBottom: 16 }}>Available: $4,280.00 · arrives in 1–3 business days.</div>
      <label className="label" htmlFor="payout-amount">Amount</label>
      <div className="row hair" style={{ padding: "0 14px", borderRadius: 14, marginBottom: 6, gap: 6, borderColor: err ? "rgba(243,106,70,.5)" : "var(--line)" }}>
        <span className="muted t18" aria-hidden="true">$</span>
        <input id="payout-amount" className="input" aria-label="Withdrawal amount in dollars" style={{ border: "none", background: "none" }} value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9]/g, ""))} />
      </div>
      {err && <div className="coral t12" style={{ marginBottom: 10 }}>{err}</div>}
      <div className="row between hair" style={{ padding: "12px 14px", borderRadius: 12, marginTop: 8 }}>
        <div className="row gap10"><Icon n="wallet" s={18} /><span className="t14 b6">GTBank ·· 4021</span></div>
        <span className="chip-mint">Default</span>
      </div>
      <button className="btn btn-ghost btn-block btn-sm" style={{ margin: "8px 0 16px" }}
        onClick={() => toast("Bank/card form opens here — details are tokenised, we never store them")}>
        <Icon n="plus" s={15} />Add withdrawal method
      </button>
      <button className="btn btn-grad btn-block" disabled={!!err} onClick={() => { requestPayout(n); closeModal(); }}>
        Withdraw ${n.toLocaleString()}.00
      </button>
      <div className="row center muted2 t12" style={{ marginTop: 10 }}>Payouts over $10,000 require an extra compliance review</div>
    </>
  );
}

function PaidMsgModal({ threadKey }: { threadKey: string }) {
  const { coins, unlockDm, closeModal, openModal } = useAppStore();
  const short = coins < 200;
  return (
    <div className="col center" style={{ gap: 12, textAlign: "center" }}>
      <div className="feature-ic" style={{ background: "rgba(252,164,75,.16)" }}><Icon n="lock" c="var(--amber-ink)" /></div>
      <div className="b7 t20">Unlock this message</div>
      <div className="muted t14">Pay 200 coins to view this locked message and its media.</div>
      <div className="row between hair wfull" style={{ padding: "12px 14px", borderRadius: 12 }}>
        <span className="muted t13">Your balance</span>
        <span className={"b7 " + (short ? "coral" : "amber")}>{coins.toLocaleString()} coins</span>
      </div>
      <button className="btn btn-grad btn-block" onClick={() => {
        if (short) { closeModal(); openModal("coins"); }
        else { unlockDm(threadKey); closeModal(); }
      }}>
        {short ? "Top up & unlock" : "Unlock · 200 coins"}
      </button>
    </div>
  );
}

function LogoutModal() {
  const navigate = useNavigate();
  const { setAuthed, closeModal } = useAppStore();
  return (
    <div className="col center" style={{ gap: 12, textAlign: "center" }}>
      <div className="feature-ic" style={{ background: "rgba(243,106,70,.14)" }}>
        <Icon n="logout" c="var(--coral-ink)" />
      </div>
      <div className="b7 t20">Log out?</div>
      <div className="muted t14">You&apos;ll need to sign back in to access your account.</div>
      <div className="row gap10 wfull">
        <button className="btn btn-ghost grow" onClick={closeModal}>Cancel</button>
        <button className="btn btn-red grow" onClick={() => { closeModal(); setAuthed(false); navigate("/login"); }}>
          Log out
        </button>
      </div>
    </div>
  );
}

/** The panel behind tapping a conversation's header — everything X's own chat-info
    screen shows (avatar, name, a row of quick actions) minus the two actions this
    app has no calling feature for. The live ring mirrors the one live creators
    already wear on their stage thumbnail (D-live-stream), so a subscriber can tell
    from the avatar alone whether this person is on air right now. */
function ChatInfoModal({ c = CREATORS[0] }: { c?: Creator }) {
  const navigate = useNavigate();
  const { closeModal, block, openModal, toast } = useAppStore();
  const goLive = () => { closeModal(); navigate(`/live/${c.handle}`); };
  return (
    <div className="col gap16">
      <div className="col center" style={{ gap: 4, textAlign: "center" }}>
        <Avatar name={c.name} size={88} ring={c.live ? "var(--coral)" : undefined} onClick={c.live ? goLive : undefined} />
        <div className="b7 t20 row gap6" style={{ marginTop: 10 }}>{c.name} <Verified s={15} /></div>
        <div className="muted t14">@{c.handle}{c.live && <span className="coral"> · Live now</span>}</div>
        <div className="row gap16" style={{ marginTop: 14 }}>
          <button className="col center gap6" onClick={() => { closeModal(); navigate(`/creator/${c.handle}`); }}>
            <span className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="user" s={18} solid /></span>
            <span className="t12 muted">Profile</span>
          </button>
          <button className="col center gap6" onClick={() => { closeModal(); openModal("tip", c); }}>
            <span className="feature-ic" style={{ background: "var(--fill)" }}><Icon n="dollar" s={18} solid /></span>
            <span className="t12 muted">Tip</span>
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <LinkRow label="Mute conversation" onClick={() => toast("Conversation muted")} />
        <hr className="divider" />
        <LinkRow label="Report conversation" danger onClick={() => toast("Report submitted — Trust & Safety will review", "ok")} />
        <hr className="divider" />
        <LinkRow label={`Block @${c.handle}`} danger onClick={() => { closeModal(); block(c.handle); }} />
      </div>
      <div>
        <div className="up muted" style={{ marginBottom: 10 }}>Shared media</div>
        <div className="row gap8">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 84, height: 84, borderRadius: 10, overflow: "hidden", position: "relative", flex: "none" }}>
              <Photo sizes="84px" src={mediaFor(poolFor(c.handle), i)} seed={`ci${c.id}${i}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreferencesModal() {
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const closeModal = useAppStore((s) => s.closeModal);
  const toast = useAppStore((s) => s.toast);
  const [selected, setSelected] = useState<string[]>(preferences);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const save = () => {
    setPreferences(selected);
    closeModal();
    if (selected.length > 0)
      toast("Preferences saved — your feed is being personalized 🎉", "ok");
  };

  const skip = () => {
    setPreferences([]);
    closeModal();
  };

  return (
    <div className="col gap20">
      <div className="col gap6">
        <span className="display t24">What are you into?</span>
        <span className="muted t14">
          Pick topics you enjoy and we'll use them to personalise your feed and recommend creators. You can update these anytime in Settings.
        </span>
      </div>

      <div className="grid gap10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
        {PREF_CATS.map((cat) => {
          const on = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              className="row gap8"
              style={{
                padding: "11px 14px",
                borderRadius: 12,
                justifyContent: "flex-start",
                background: on ? "var(--blue-a3)" : "var(--fill)",
                border: `1.5px solid ${on ? "var(--blue)" : "transparent"}`,
                fontWeight: on ? 600 : 400,
                transition: "background .12s, border-color .12s",
              }}
              aria-pressed={on}
              onClick={() => toggle(cat.id)}
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{cat.emoji}</span>
              <span className="t13">{cat.label}</span>
              {on && <span className="sr-only">(selected)</span>}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="t13 muted" aria-live="polite">
          {selected.length} interest{selected.length === 1 ? "" : "s"} selected
        </div>
      )}

      <div className="row gap10" style={{ justifyContent: "flex-end", flexWrap: "wrap", marginTop: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={skip}>Skip for now</button>
        <button className="btn btn-blue btn-sm" onClick={save}>
          {selected.length > 0
            ? `Save ${selected.length} interest${selected.length === 1 ? "" : "s"}`
            : "Continue"}
        </button>
      </div>
    </div>
  );
}

