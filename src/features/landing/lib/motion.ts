/* Two questions about motion, answered once.
 *
 * `prefers-reduced-motion` is a stylesheet concern right up until the motion is
 * driven from JavaScript, and three of the hero's four moving things are: a 5s
 * interval that swaps the carousel, a scroll listener that writes a transform on
 * every slide, and a loop that injects eighteen floating spans into the DOM.
 * A media query in `globals.css` can freeze all of that at the paint layer, but
 * the interval still fires, the listener still runs on every scroll of every
 * page, and the eighteen spans are still created, laid out and composited before
 * being told to hold still. Honouring the preference properly means not starting
 * the work.
 *
 * `useInView` answers the second question — whether any of it is on screen. The
 * hero is one viewport tall at the top of a page that is roughly eight, so for
 * seven eighths of a scroll the carousel is repainting a full-viewport blurred
 * layer, eighteen particles are compositing, and a passive scroll handler is
 * writing transforms onto elements nobody can see. The observer costs one
 * callback per crossing and buys all of that back.
 *
 * Both hooks are safe before hydration and both track changes: a visitor who
 * turns the system setting on mid-session gets the quiet page without a reload.
 */

import { useEffect, useRef, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** True when the visitor has asked their system for less animation. */
export function useReducedMotion(): boolean {
  /* Read synchronously on first render rather than in an effect. Reading it a
     paint later means the particles are created and then removed, which is the
     flicker the preference exists to prevent. */
  const [calm, setCalm] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const on = () => setCalm(mq.matches)
    /* Safari only grew `addEventListener` on MediaQueryList in 14. The site
       still renders on older WebKit; it just stops tracking live changes. */
    if (mq.addEventListener) {
      mq.addEventListener('change', on)
      return () => mq.removeEventListener('change', on)
    }
    return
  }, [])

  return calm
}

/**
 * Whether the element is anywhere near the viewport. `margin` widens the box so
 * the hero starts moving again slightly before it is visible, rather than
 * snapping to life on the exact pixel it re-enters.
 */
export function useInView<T extends Element>(margin = '200px'): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  /* Starts true. The hero is the first thing on the page, and an observer does
     not report until after layout — starting false would blank the carousel for
     a frame on every cold load. */
  const [seen, setSeen] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => setSeen(e.isIntersecting),
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])

  return [ref, seen]
}
