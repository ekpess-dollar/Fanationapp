import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/lib/core'

const LINKS = [
  { href: '#features',  label: 'Features' },
  { href: '#creators',  label: 'For creators' },
  { href: '#earn',      label: 'Earn' },
  { href: '#faq',       label: 'FAQ' },
]

/* 16px, stroked in `currentColor` so `.nav-toggle` owns the colour and these
   follow it through the floating → solid change without a rule of their own. */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.2v2.1M12 19.7v2.1M4.1 12H2M22 12h-2.1M6.34 6.34 4.86 4.86M19.14 19.14l-1.48-1.48M17.66 6.34l1.48-1.48M4.86 19.14l1.48-1.48" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 13.4A8.4 8.4 0 0 1 10.6 3.5a8.4 8.4 0 1 0 9.9 9.9z" />
    </svg>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: '#0C1121' }}>
        <svg viewBox="80 40 240 245" xmlns="http://www.w3.org/2000/svg" className="w-[34px] h-[34px]">
          <g fill="#2599F6">
            <path d="M 279.3 68.36 L 275.0 64.06 L 268.75 60.16 L 261.33 57.81 L 255.47 57.42 L 150.78 57.81 L 139.84 60.94 L 128.52 67.97 L 124.61 71.88 L 119.14 79.69 L 115.62 87.89 L 114.06 94.92 L 114.06 205.47 L 121.09 195.31 L 128.52 186.72 L 128.12 100.39 L 128.52 96.09 L 130.86 88.67 L 133.59 83.98 L 137.89 79.3 L 144.92 74.61 L 153.12 72.27 L 258.98 72.27 L 265.23 75.0 L 268.75 78.52 L 270.7 82.42 L 271.09 90.62 L 269.53 94.53 L 264.84 99.61 L 258.2 102.34 L 175.39 102.34 L 166.41 106.25 L 160.16 113.67 L 158.2 120.31 L 158.2 160.55 L 172.27 151.17 L 172.66 121.48 L 173.83 119.14 L 176.56 117.19 L 260.55 116.8 L 268.36 114.45 L 275.39 110.16 L 281.64 102.73 L 285.55 92.58 L 285.94 85.94 L 284.77 78.52 Z"/>
            <path d="M 245.31 147.66 L 237.5 141.02 L 229.3 137.5 L 225.78 136.72 L 212.89 137.5 L 202.73 141.41 L 182.81 152.34 L 165.23 164.06 L 153.12 173.44 L 138.28 186.72 L 129.3 196.09 L 122.66 204.69 L 116.41 216.41 L 114.06 225.0 L 114.06 235.16 L 115.62 240.62 L 121.09 249.61 L 126.56 254.3 L 132.42 257.42 L 141.02 259.38 L 148.83 258.98 L 155.86 256.64 L 165.23 249.61 L 170.7 240.62 L 172.66 231.64 L 171.88 185.94 L 158.2 197.27 L 158.2 231.25 L 156.64 236.72 L 151.95 242.19 L 146.88 244.53 L 141.8 244.92 L 137.5 243.75 L 133.59 241.41 L 130.08 237.11 L 128.52 233.59 L 128.12 228.52 L 130.08 221.09 L 139.06 207.03 L 160.16 186.33 L 183.2 169.14 L 209.38 154.3 L 217.58 151.17 L 224.61 151.17 L 230.08 153.52 L 234.38 157.42 L 237.11 162.11 L 238.28 169.14 L 236.72 175.0 L 230.86 182.03 L 222.66 185.16 L 215.62 184.38 L 205.08 179.69 L 191.8 171.88 L 178.91 180.86 L 199.22 192.97 L 213.67 198.83 L 218.36 199.61 L 228.12 198.83 L 236.33 195.7 L 241.8 191.8 L 246.88 186.33 L 249.61 181.64 L 251.95 175.0 L 252.73 168.75 L 251.95 161.33 L 250.39 156.25 Z"/>
          </g>
        </svg>
      </div>
      <span className="font-black text-[19px] nav-word" style={{ letterSpacing: '-0.01em' }}>Fanation</span>
    </div>
  )
}

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])


  /* The overlay is `md:hidden`, so widening past the breakpoint hides it while
     `open` stays true — and `open` is half of `data-solid`, which would leave a
     desktop header stuck in its scrolled skin at the top of the page. */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const fn = () => { if (mq.matches) setOpen(false) }
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  return (
    /* Fragment, not a wrapper — the overlay has to be a sibling of the header
       rather than a child of it. `.fanav[data-solid="1"]` carries a
       `backdrop-filter`, and a filtered element becomes the containing block
       for every `position:fixed` descendant under it. Opening the menu sets
       `data-solid="1"`, so the menu was the thing that created the box that
       trapped it: `fixed inset-0` stopped meaning the viewport and started
       meaning the header's own 70px strip. The scrim painted into that strip,
       under the bar, where nothing could see it, and the five centred items
       overflowed a 70px box in both directions — Features and For creators
       ended up above the top of the screen with no way to reach them.

       As siblings the two are ordered by the root stacking context, which is
       what the z-indexes below were always assuming. */
    <>
      <header
        className="fanav fixed top-0 inset-x-0 z-50 transition-all duration-300"
        data-solid={scrolled || open ? '1' : '0'}>
        <div className="max-w-[1180px] mx-auto px-6 flex items-center justify-between" style={{ height: 70 }}>
          <Link to="/" aria-label="Fanation home"><Logo /></Link>

          <nav className="hidden md:flex items-center gap-7">
            {LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-medium transition-colors nav-link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Same title as the product's control, which is what
                `verify-theme.mjs` matches on across all three apps. */}
            <button
              type="button"
              className="nav-toggle"
              title="Toggle light / dark"
              aria-label="Toggle light / dark"
              onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark'
                setTheme(next)
              }}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <Link to="/login" className="hidden md:inline-flex text-sm font-medium transition-colors nav-link">
              Log in
            </Link>
            <Link to="/signup"
              className="hidden md:inline-flex text-[13px] font-bold px-5 py-2.5 rounded-full text-white whitespace-nowrap transition-all"
              style={{ background: 'var(--blue-solid)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--blue-solid-hover)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(37,153,246,0.35)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--blue-solid)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = ''
              }}>
              Start Creating
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              className="md:hidden flex flex-col gap-[5px] p-1 bg-transparent border-none cursor-pointer"
              aria-label="Menu"
              aria-expanded={open}>
              <span className="block w-6 h-0.5 nav-bar-ic rounded transition-all duration-300"
                style={open ? { transform: 'translateY(7px) rotate(45deg)' } : {}} />
              <span className="block w-6 h-0.5 nav-bar-ic rounded transition-all duration-300"
                style={open ? { opacity: 0 } : {}} />
              <span className="block w-6 h-0.5 nav-bar-ic rounded transition-all duration-300"
                style={open ? { transform: 'translateY(-7px) rotate(-45deg)' } : {}} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay. `z-40` sits it under the `z-50` header, which is what
          keeps the close button reachable — the three bars are already animated
          into an X on open, and the scrim used to cover them. Both numbers are
          resolved in the root stacking context now that the two are siblings,
          so the ordering is a rule rather than a hope.

          `inset-0` finally means the viewport. It is still `md:hidden`, and the
          media query listener above closes the menu on the way past 768px so
          `data-solid` cannot be left stuck on at the top of a desktop page. */}
      <div
        className="md:hidden fixed inset-0 flex flex-col items-center justify-center gap-9 z-40 transition-opacity duration-300"
        style={{ background: 'var(--scrim)', opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }}>
        {LINKS.map(l => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}
            className="text-[28px] font-black ink transition-colors"
            style={{ letterSpacing: '-0.02em' }}>
            {l.label}
          </a>
        ))}
        <Link to="/signup" onClick={() => setOpen(false)} className="mt-4 text-white text-lg font-bold px-10 py-4 rounded-full"
          style={{ background: 'var(--blue-solid)' }}>
          Start Creating →
        </Link>
      </div>
    </>
  )
}
