import { useEffect, useRef, useState } from "react";
import { Pic, SIZES } from "../lib/images";
import { useInView, useReducedMotion } from "../lib/motion";
import { Link } from "react-router-dom";

// Carousel: platform-consistent photos that look dramatic blurred
// Uses creators-section photos (different from hero mosaic) + atmospheric new additions
const CAROUSEL_PHOTOS = [
  "creator-dembe.webp",
  "creator-nadia.webp",
  "creator-tobi.webp",
  "creator-sofia.webp",
];

const AVATARS = [
  { file: "creator-amara.webp", name: "Amara" },
  { file: "creator-marcus.webp", name: "James" },
  { file: "creator-aisha.webp", name: "Priscilia" },
  { file: "creator-tobi.webp", name: "David" },
  { file: "creator-nadia.webp", name: "Sofia" },
];

const GIFTS = [
  { icon: "🎁", text: "+500 coins", user: "@jay_88", delay: "0s" },
  { icon: "💎", text: "+$12.00", user: "@superfan", delay: "1.2s" },
  { icon: "⭐", text: "+$5.00", user: "@priscilia", delay: "2.4s" },
];

const COINS = ["🪙", "💎", "⭐", "🎁", "💰", "✨"];

export default function Hero() {
  const [slide, setSlide] = useState(0);
  const slideEls = useRef<(HTMLDivElement | null)[]>([]);
  const particlesRef = useRef<HTMLDivElement>(null);
  const calm = useReducedMotion();
  const [sectionRef, inView] = useInView<HTMLElement>();
  /* Every effect below is gated on this. The preference is the visitor's answer
     to whether the motion should exist at all; the observer is the answer to
     whether anyone can currently see it. Neither is worth spending a frame on
     alone. */
  const moving = !calm && inView;

  // Auto-advance carousel every 5s
  useEffect(() => {
    if (!moving) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % CAROUSEL_PHOTOS.length),
      5000,
    );
    return () => clearInterval(id);
  }, [moving]);

  // Parallax on scroll
  useEffect(() => {
    if (!moving) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          slideEls.current.forEach((s) => {
            if (s)
              s.style.transform = `translateY(${y * 0.35}px) translateZ(0)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [moving]);

  // Floating particles
  useEffect(() => {
    /* Not gated on `inView` — these are created once and then paused by CSS
       when the hero leaves. Tearing eighteen nodes down and rebuilding them on
       every crossing would cost more than leaving them parked. */
    if (calm) return;
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement("span");
      el.className = "particle";
      el.textContent = COINS[Math.floor(Math.random() * COINS.length)];
      el.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--dur:${8 + Math.random() * 12}s;--del:${Math.random() * 10}s;font-size:${10 + Math.random() * 10}px;`;
      container.appendChild(el);
    }
    return () => {
      if (container) container.innerHTML = "";
    };
  }, [calm]);

  return (
    <section
      ref={sectionRef}
      className={
        "hero-section relative min-h-screen flex items-center overflow-hidden" +
        (inView ? "" : " hero-still")
      }
    >
      {/* ── Blurred carousel background ── */}
      <div className="hero-carousel-bg">
        {CAROUSEL_PHOTOS.map((photo, i) => (
          <div
            key={photo}
            ref={(el) => {
              slideEls.current[i] = el;
            }}
            className={`hero-slide${i === slide ? " active" : ""}`}
            style={{
              backgroundImage: `url('/images/${photo}')`,
            }}
          />
        ))}
        <div className="hero-carousel-overlay" />
      </div>

      {/* ── Mesh gradient ──
          The four tints live in `globals.css` now. An inline background beats
          every selector, so while this sat here there was no way for the light
          palette to reach it. */}
      <div
        className="hero-mesh absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* ── Floating particles ── */}
      <div
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div
        className="max-w-[1180px] mx-auto px-6 relative w-full"
        style={{ zIndex: 2 }}
      >
        <div className="grid lg:grid-cols-2 items-center" style={{ gap: 60 }}>
          {/* ── Left copy ── */}
          <div>
            <div className="hero-eyebrow inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold mb-7">
              <span
                className="hero-eyebrow-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ animation: "landingBlink 2s ease-in-out infinite" }}
              />
              Turn followers into fans. Turn fans into income.
            </div>

            <h1
              className="font-black leading-[1.04] mb-6"
              style={{
                fontSize: "clamp(40px,5vw,72px)",
                letterSpacing: "-0.04em",
              }}
            >
              Turn Your Audience Into
              <br />
              {/* The same two stops as the closing CTA's gradient, and the same
                  reason for the pair: #F36A46 → #2599F6 in dark, and the light
                  values already solved against a pale ground. */}
              <em
                className="not-italic"
                style={{
                  background:
                    "linear-gradient(90deg, var(--cta-from) 0%, var(--cta-to) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                a Community
              </em>
              <br />
              That Pays You Back.
            </h1>

            {/* `--hero-muted`, not `--muted`: everything in this column sits on
                the carousel rather than on the page, and the two grounds are
                not the same colour. The earnings widget further down keeps
                `--muted` because it has a card of its own to sit on. */}
            <p
              className="leading-[1.78] mb-10 max-w-[440px]"
              style={{ fontSize: 17, color: "var(--hero-muted)" }}
            >
              Build a loyal fan community, earn recurring income, share
              exclusive content, host live experiences, and own your
              relationship with your audience — all from one platform.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                to="/signup"
                className="inline-flex items-center text-white font-bold"
                style={{
                  background: "var(--blue-solid-grad)",
                  fontSize: 16,
                  padding: "17px 34px",
                  borderRadius: "100px",
                  transition: "box-shadow .2s, transform .15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow =
                    "0 8px 32px rgba(37,153,246,0.45), 0 0 0 1px rgba(243,106,70,0.25)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "";
                  el.style.transform = "";
                }}
              >
                Start Creating Today →
              </Link>
              <a
                href="#features"
                className="hero-ghost inline-flex items-center font-semibold"
                style={{
                  fontSize: 16,
                  padding: "17px 34px",
                  borderRadius: "100px",
                }}
              >
                See How It Works
              </a>
            </div>

            {/* App store badges */}
            <div className="hidden sm:flex items-center gap-3 flex-wrap mb-10">
              <span
                className="text-xs mr-1"
                style={{ color: "var(--hero-muted)" }}
              >
                Available on
              </span>
              {/* Apple App Store */}
              <a
                href="#"
                className="hero-badge inline-flex items-center gap-3 hover:opacity-90 transition-opacity"
                style={{
                  background: "#000",
                  border: "1px solid rgba(255,255,255,0.18)",
                  padding: "9px 18px",
                  borderRadius: 14,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="white"
                  aria-hidden="true"
                >
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.459 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.925-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.391-2.376-2-.156-3.675 1.09-4.6 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                <span>
                  <p
                    className="leading-none mb-1"
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Download on the
                  </p>
                  <p
                    className="font-bold text-white leading-none"
                    style={{ fontSize: 14, letterSpacing: "-0.01em" }}
                  >
                    App Store
                  </p>
                </span>
              </a>
              {/* Google Play */}
              <a
                href="#"
                className="hero-badge inline-flex items-center gap-3 hover:opacity-90 transition-opacity"
                style={{
                  background: "#000",
                  border: "1px solid rgba(255,255,255,0.18)",
                  padding: "9px 18px",
                  borderRadius: 14,
                }}
              >
                <svg
                  width="20"
                  height="22"
                  viewBox="0 0 24 27"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1.5 0.8L14.5 13.5L1.5 26.2C0.9 25.9 0.5 25.3 0.5 24.5V2.5C0.5 1.7 0.9 1.1 1.5 0.8Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M19.5 9L14.5 13.5L19.5 18L22.8 16.2C23.7 15.7 23.7 14.8 23.7 13.5C23.7 12.2 23.7 11.3 22.8 10.8L19.5 9Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M1.5 0.8L14.5 13.5L19.5 9L4.2 0.1C3.1 -0.5 2 0 1.5 0.8Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M1.5 26.2L14.5 13.5L19.5 18L4.2 26.9C3.1 27.5 2 27 1.5 26.2Z"
                    fill="#34A853"
                  />
                </svg>
                <span>
                  <p
                    className="leading-none mb-1"
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Get it on
                  </p>
                  <p
                    className="font-bold text-white leading-none"
                    style={{ fontSize: 14, letterSpacing: "-0.01em" }}
                  >
                    Google Play
                  </p>
                </span>
              </a>
            </div>

            {/* Social proof */}
            <div
              className="flex items-center gap-4 pt-8"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <div className="flex">
                {AVATARS.map((a, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                    style={{
                      border: "2px solid var(--hero-ring)",
                      marginLeft: i === 0 ? 0 : -9,
                    }}
                  >
                    <Pic
                      src={`/images/${a.file}`}
                      sizes={SIZES.heroFace}
                      alt={a.name}
                      loading="lazy"
                      decoding="async"
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
              <div>
                <p
                  className="text-sm font-bold leading-tight"
                  style={{ color: "var(--heading)" }}
                >
                  12,000+ creators
                </p>
                <p className="text-xs" style={{ color: "var(--hero-muted)" }}>
                  creators, influencers, educators, coaches &amp; entertainers
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: creator mosaic grid ──
              Layout matches HTML exactly:
                Col 1 (LEFT): Sofia — tall, spans both rows
                Col 2 (RIGHT): Elena (top) + Marcus (bottom)
          ── */}
          <div
            className="relative hidden lg:block"
            style={{ paddingBottom: 72 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {/* Card A: Sofia — col1, rows 1-2 (LEFT TALL) */}
              <div
                className="relative rounded-[18px] overflow-hidden"
                style={{ gridRow: "1/span 2", gridColumn: 1 }}
              >
                <Pic
                  src="/images/creator-amara.webp"
                  sizes={SIZES.heroCard}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(7,9,26,0) 40%,rgba(7,9,26,0.92) 100%)",
                  }}
                />
                <div
                  className="hero-artchip absolute top-3 left-3 font-bold rounded-full px-2.5 py-1"
                  style={{
                    fontSize: 11,
                    border: "1px solid rgba(37,153,246,0.45)",
                    color: "#60B8FA",
                  }}
                >
                  8,400 subscribers
                </div>
                {/* Gift stream */}
                <div
                  className="absolute flex flex-col gap-2 items-end z-10"
                  style={{ right: 10, bottom: 56 }}
                >
                  {GIFTS.map((g, i) => (
                    <div
                      key={i}
                      className="hero-artchip giftpop flex items-center gap-1.5 text-white font-bold whitespace-nowrap rounded-full px-2.5 py-1.5"
                      style={{
                        fontSize: 11,
                        border: "1px solid rgba(243,106,70,0.5)",
                        animation: `giftPop 3.6s ease-in-out ${g.delay} infinite`,
                      }}
                    >
                      {g.icon} {g.text} from{" "}
                      <span style={{ color: "#F36A46" }}>{g.user}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <p className="font-bold text-white" style={{ fontSize: 13 }}>
                    Sofia
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    Lifestyle · Creator
                  </p>
                </div>
              </div>

              {/* Card B: Elena LIVE — col2, row 1 (RIGHT TOP) */}
              <div
                className="relative rounded-[18px] overflow-hidden"
                style={{ gridRow: 1, gridColumn: 2, height: 250 }}
              >
                <Pic
                  src="/images/creator-elena.webp"
                  sizes={SIZES.heroCard}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(7,9,26,0) 30%,rgba(7,9,26,0.9) 100%)",
                  }}
                />
                <div
                  className="absolute top-3 left-3 flex items-center gap-1 text-white font-black rounded-full px-2.5 py-1"
                  style={{ fontSize: 11, background: "var(--red-solid)" }}
                >
                  <span style={{ fontSize: 8 }}>●</span>LIVE
                </div>
                <div
                  className="hero-artchip absolute top-3 right-3 font-bold rounded-full px-2.5 py-1"
                  style={{
                    fontSize: 11,
                    border: "1px solid rgba(93,221,144,0.45)",
                    color: "#5DDD90",
                  }}
                >
                  +$340 today
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <p className="font-bold text-white" style={{ fontSize: 13 }}>
                    Elena
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    Streamer · 4.2K watching
                  </p>
                </div>
              </div>

              {/* Card C: Marcus — col2, row 2 (RIGHT BOTTOM) */}
              <div
                className="relative rounded-[18px] overflow-hidden"
                style={{ gridRow: 2, gridColumn: 2, height: 200 }}
              >
                <Pic
                  src="/images/creator-marcus.webp"
                  sizes={SIZES.heroCard}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(7,9,26,0) 30%,rgba(7,9,26,0.9) 100%)",
                  }}
                />
                <div
                  className="hero-artchip absolute top-3 left-3 font-bold rounded-full px-2.5 py-1"
                  style={{
                    fontSize: 11,
                    border: "1px solid rgba(252,164,75,0.45)",
                    color: "#FCA44B",
                  }}
                >
                  🪙 12,400 coins earned
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <p className="font-bold text-white" style={{ fontSize: 13 }}>
                    Marcus
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    Podcaster · Pay-per-view drops
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings widget — bottom left, overlaps Sofia card */}
            <div
              className="hero-earnings absolute flex items-center gap-3"
              style={{
                bottom: 8,
                left: 0,
                zIndex: 10,
                borderRadius: 14,
                padding: "14px 18px",
                minWidth: 200,
              }}
            >
              <span className="text-2xl leading-none">💰</span>
              <div>
                <p
                  className="mb-0.5"
                  style={{ fontSize: 11, color: "var(--muted)" }}
                >
                  This month&apos;s earnings
                </p>
                <p
                  className="font-black leading-none"
                  style={{
                    fontSize: 22,
                    color: "var(--mint-ink)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  $4,280.00
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
