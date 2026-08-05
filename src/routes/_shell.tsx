import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/core";
import { Avatar, FanationMark, Icon, Logo } from "@/lib/ui";
import { FAN_NAV, FAN_TABS, STUDIO_NAV, STUDIO_TABS } from "@/components/nav";
import { ThemeToggle } from "@/components/theme";
import { ModalHost } from "@/components/modals";
import RouteFallback from "@/components/route-fallback";

/**
 * One account, two modes: Browse (fan) ⇄ Studio (creator). Route prefix decides
 * the surface. This is the router's layout route — every authenticated page
 * renders through the `<Outlet />` below.
 *
 * Navigation exists twice on purpose. Above 900px it is the sidebar. Below it the
 * sidebar is display:none and the bottom tab bar plus the More drawer take over —
 * the same four-plus-More shape every social app uses on a phone, because the top
 * of a tall screen is not where a thumb lives.
 */
export default function AppLayout() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const authed = useAppStore((s) => s.authed);
  const coins = useAppStore((s) => s.coins);
  const openModal = useAppStore((s) => s.openModal);
  const setAuthed = useAppStore((s) => s.setAuthed);
  const [menu, setMenu] = useState(false);

  const studio = pathname.startsWith("/studio");
  /* Reels is the one route that wants the whole window. The sidebar stays — every
     destination is still one click away — but it drops to an icon rail, which is
     172px of width handed to a 9:16 video that is sized off exactly that number
     (`--side-w`, in styles.css). Instagram collapses its own nav here for the
     same reason. Nothing else in the shell changes. */
  const immersive = pathname === "/reels";
  const nav = studio ? STUDIO_NAV : FAN_NAV;
  const tabs = studio ? STUDIO_TABS : FAN_TABS;

  // Mock auth guard — replace with middleware + session at integration.
  useEffect(() => {
    if (!authed) navigate("/login", { replace: true });
  }, [authed, navigate]);

  // Any navigation closes the drawer, including a tap on a link inside it.
  useEffect(() => setMenu(false), [pathname]);

  // The drawer is fixed and scrolls its own content; the page behind it must not.
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu]);

  if (!authed) return null;

  const navLinks = nav.map(([href, label, icon]) => (
    <Link key={href} to={href} title={label} className={"navi" + (pathname === href ? " on" : "")}>
      <Icon n={icon} s={19} /><span className="navlabel">{label}</span>
    </Link>
  ));

  const account = (
    <div className="col gap8" style={{ marginTop: 12 }}>
      <button className="btn btn-ghost btn-sm btn-block" onClick={() => navigate(studio ? "/feed" : "/studio")}>
        <Icon n={studio ? "home" : "star"} s={15} />
        {studio ? "Switch to Browsing" : "Switch to Creator Studio"}
      </button>
      <div className="card row gap10" style={{ padding: 12 }}>
        <Avatar name="You" size={38} />
        <div className="col grow"><span className="b6 t14">You</span><span className="muted t12">@yourhandle</span></div>
        <button onClick={() => { setAuthed(false); navigate("/login"); }} title="Sign out">
          <Icon n="logout" s={17} c="var(--muted)" />
        </button>
      </div>
    </div>
  );

  /* The same two actions the account card carries, in a shape that collapses.
     A 76px rail cannot hold a card with a handle in it, and an icon rail you
     cannot sign out of is worse than a wide one. */
  const accountRail = (
    <div className="col gap4" style={{ marginTop: 12 }}>
      <button className="navi" title={studio ? "Switch to Browsing" : "Switch to Creator Studio"}
        onClick={() => navigate(studio ? "/feed" : "/studio")}>
        <Icon n={studio ? "home" : "star"} s={19} />
        <span className="navlabel">{studio ? "Switch to Browsing" : "Switch to Creator Studio"}</span>
      </button>
      <button className="navi" title="Sign out" onClick={() => { setAuthed(false); navigate("/login"); }}>
        <Icon n="logout" s={19} /><span className="navlabel">Sign out</span>
      </button>
    </div>
  );

  return (
    <div className={"app" + (immersive ? " immersive" : "")}>
      <div className="side">
        <div className="sidelogo">{immersive ? <FanationMark size={30} title="Fanation" /> : <Logo />}</div>
        <div className="col gap4 grow" style={{ overflowY: "auto" }}>
          <div className="up muted2 sidecap" style={{ padding: "6px 13px 8px" }}>{studio ? "Creator surface" : "Fan surface"}</div>
          {navLinks}
        </div>
        {immersive ? accountRail : account}
      </div>

      <div className="main">
        <div className="topbar">
          <div className="search"><Icon n="search" s={17} /><input placeholder="Search creators, posts, transactions…" /></div>
          <div className="grow" />
          {/* Browse ⇄ Studio. Hidden on a phone — the drawer carries the same switch,
              and five controls do not fit across 390px without shrinking the search
              field to nothing. */}
          <div className="row hide-sm" style={{ background: "var(--fill)", border: "1px solid var(--line)", borderRadius: 999, padding: 3 }}>
            {([["fan", "Browse", "/feed"], ["creator", "Studio", "/studio"]] as const).map(([k, label, href]) => (
              <button key={k} onClick={() => navigate(href)}
                style={{ padding: "6px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: (k === "creator") === studio ? "var(--blue)" : "transparent", color: (k === "creator") === studio ? "#04122a" : "var(--muted)" }}>
                {label}
              </button>
            ))}
          </div>
          <ThemeToggle />
          <button className="btn btn-ghost btn-sm" onClick={() => openModal("coins")}>
            <Icon n="coin" s={15} c="var(--amber-ink)" />{coins.toLocaleString()}
          </button>
          <button className="btn btn-blue btn-sm" onClick={() => openModal("compose")}>
            <Icon n="plus" s={15} /><span className="hide-sm">Create</span>
          </button>
        </div>
        {/* The boundary sits here rather than around <Routes>, so a split
            chunk arriving swaps only the content area — the sidebar, topbar
            and tab bar never unmount and never blink. */}
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>

      {/* Phone navigation. `.tabbar` is display:none above 900px, so nothing here
          renders on a desktop and the drawer below can never be opened there. */}
      <nav className="tabbar">
        {tabs.map(([href, label, icon]) => (
          <Link key={href} to={href} className={"tabi" + (pathname === href ? " on" : "")}>
            <Icon n={icon} s={20} />{label}
          </Link>
        ))}
        <button className={"tabi" + (menu ? " on" : "")} onClick={() => setMenu(true)} aria-label="More">
          <Icon n="menu" s={20} />More
        </button>
      </nav>

      {menu && (
        <>
          <div className="scrim" onClick={() => setMenu(false)} />
          <div className="navdrawer">
            <div className="row between" style={{ padding: "0 4px 18px" }}>
              <Logo />
              <button onClick={() => setMenu(false)} aria-label="Close menu"><Icon n="x" s={20} c="var(--muted)" /></button>
            </div>
            <div className="col gap4 grow">
              <div className="up muted2" style={{ padding: "0 13px 8px" }}>{studio ? "Creator surface" : "Fan surface"}</div>
              {navLinks}
            </div>
            {account}
          </div>
        </>
      )}

      <ModalHost />
    </div>
  );
}
