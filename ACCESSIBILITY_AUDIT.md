# Accessibility Audit — Fanation Web App

**Standard:** WCAG 2.2 AA  
**Date:** 2026-10-06  
**Branch:** design  
**Phase:** 1 — Audit only (no code changes)

Severity scale used throughout:
- 🔴 **Critical** — blocks access for a whole class of users (screen reader, keyboard-only, etc.)
- 🟠 **Major** — significant barrier; workaround exists but is unreasonable
- 🟡 **Minor** — friction or partial failure; most users are unaffected

---

## 1. Color & Contrast

### 1.1 GiftLine text color fails in light mode
**Severity:** 🔴 Critical  
**File:** [`src/routes/studio/live.tsx`](src/routes/studio/live.tsx) — `GiftLine` component  
**WCAG:** 1.4.3 Contrast (Minimum) — requires 4.5:1 for normal text  

The gift username/message is rendered with `color: "#ffaa33"` (hardcoded inline). On the `--card2` surface in light mode (#ffffff or near-white) this yields approximately **1.79:1** — well below the 4.5:1 threshold for normal text and below even the 3:1 threshold for large text.

```tsx
// current — fails light mode
<span style={{ color: "#ffaa33", fontWeight: 700 }}>
```

### 1.2 Browse/Studio toggle: hardcoded `#04122a` text on blue active state
**Severity:** 🟠 Major  
**File:** [`src/routes/_shell.tsx:252-253`](src/routes/_shell.tsx)  
**WCAG:** 1.4.3 Contrast (Minimum)  

Active toggle button uses `color: "#04122a"` (dark navy) and `background: "var(--blue)"`. This is intentional and passes in dark mode. However, when `--blue` shifts for light mode, the contrast must be re-verified. More importantly, the values are hardcoded outside the token system so they never track theme changes automatically.

The _inactive_ state uses `color: "var(--muted)"` on `var(--fill)` background — `--muted` is confirmed 4.5:1+ in the token comments, but this particular combination on the pill background should be verified.

### 1.3 Chat bubble: hardcoded `color: "#04122a"` on blue background
**Severity:** 🟡 Minor  
**File:** [`src/components/chat-popups.tsx:82`](src/components/chat-popups.tsx)  
**WCAG:** 1.4.3  

Outgoing chat messages use `color: "#04122a"` on `background: "var(--blue)"`. Same as 1.2 — passes in the current dark theme but bypasses the token system.

### 1.4 No Windows High Contrast / forced-colors support
**Severity:** 🟡 Minor  
**File:** [`src/lib/brand/tokens.css`](src/lib/brand/tokens.css), [`src/lib/ui/styles.css`](src/lib/ui/styles.css)  
**WCAG:** 1.4.11 Non-text Contrast  

No `@media (forced-colors: active)` rules exist. Custom borders (`var(--line)`), button backgrounds, and icon fills will all be overridden by the browser but may not produce the intended control boundaries in Windows High Contrast mode.

---

## 2. Semantic HTML & Structure

### 2.1 No `<main>` landmark in the app shell
**Severity:** 🔴 Critical  
**File:** [`src/routes/_shell.tsx:205`](src/routes/_shell.tsx)  
**WCAG:** 1.3.6 Identify Purpose (AA), 2.4.1 Bypass Blocks  

The content area is `<div className="main">`. Screen reader users navigating by landmarks (NVDA's `D`, VoiceOver's rotor) cannot jump to the main content. There is no skip-to-content link either.

### 2.2 No skip-to-content link
**Severity:** 🔴 Critical  
**File:** [`index.html`](index.html), [`src/routes/_shell.tsx`](src/routes/_shell.tsx)  
**WCAG:** 2.4.1 Bypass Blocks  

Keyboard users must tab through the entire sidebar (6–8 nav links + account area) before reaching page content on every page load and route change. No skip link exists.

### 2.3 Sidebar nav links not wrapped in `<nav>`
**Severity:** 🟠 Major  
**File:** [`src/routes/_shell.tsx:195-199`](src/routes/_shell.tsx)  
**WCAG:** 1.3.6 Identify Purpose  

The desktop sidebar renders nav links inside `<div className="col gap4 grow">`. The mobile tab bar correctly uses `<nav className="tabbar">`, but the primary desktop navigation has no `<nav>` landmark, so assistive technology cannot identify it as site navigation.

### 2.4 ~20+ interactive `<div onClick>` elements that should be `<button>` or `<a>`
**Severity:** 🔴 Critical  
**WCAG:** 4.1.2 Name, Role, Value  

Keyboard-only users and screen reader users cannot activate these elements. Representative list:

| File | Element | Should be |
|------|---------|-----------|
| [`src/routes/feed.tsx`](src/routes/feed.tsx) | Story tray items (`<div onClick>`) | `<button>` |
| [`src/routes/feed.tsx`](src/routes/feed.tsx) | "Your story" (`<div onClick>`) | `<button>` |
| [`src/routes/feed.tsx`](src/routes/feed.tsx) | Compose bar (`<input readOnly onClick>`) | `<button>` |
| [`src/routes/feed.tsx`](src/routes/feed.tsx) | Compose icon actions (`<span onClick>`) | `<button>` |
| [`src/routes/feed.tsx`](src/routes/feed.tsx) | Suggested creator rows (`<div onClick>`) | `<button>` or `<Link>` |
| [`src/routes/feed.tsx`](src/routes/feed.tsx) | Live feed thumbnails (`<div onClick>`) | `<Link>` |
| [`src/routes/reels.tsx`](src/routes/reels.tsx) | Reel action buttons (`<div className="reelact" onClick>`) | `<button>` |
| [`src/components/post-card.tsx`](src/components/post-card.tsx) | Poll options (`<div onClick>`) | `<button>` |
| [`src/components/post-card.tsx`](src/components/post-card.tsx) | Video toggle (`<div onClick>`) | `<button>` |
| [`src/components/modals.tsx`](src/components/modals.tsx) | Subscribe plan rows (`<div onClick>`) | `<button>` |
| [`src/components/modals.tsx`](src/components/modals.tsx) | Coin/Gift/Tip selection items (`<div onClick>`) | `<button>` |
| [`src/components/modals.tsx`](src/components/modals.tsx) | Story prev/next zones (`<div onClick>`) | `<button>` |
| [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx) | `Menu` trigger (`<div onClick>`) | `<button>` |
| [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx) | `Menu` items (`<div onClick>`) | `<button role="menuitem">` |

### 2.5 Heading hierarchy uses `<div>` with `.display` class
**Severity:** 🟠 Major  
**WCAG:** 1.3.1 Info and Relationships  

Visual heading styles are applied via CSS class to `<div>` elements rather than semantic `<h1>`–`<h6>` tags. Screen readers using heading navigation (H key in NVDA/JAWS) cannot jump between sections.

### 2.6 "Don't have an account?" is a `<button>` that navigates
**Severity:** 🟡 Minor  
**File:** [`src/routes/login.tsx`](src/routes/login.tsx)  
**WCAG:** 4.1.2 Name, Role, Value  

A `<button type="button">` is used for navigation to the signup route. Buttons imply an action within the current context; navigation to another URL should use `<Link>` or `<a>`.

### 2.7 Single `<title>` for all SPA routes
**Severity:** 🟠 Major  
**File:** [`index.html`](index.html)  
**WCAG:** 2.4.2 Page Titled  

`<title>Fanation</title>` is static — it never changes as the user navigates between Feed, Reels, Messages, Studio, etc. Screen reader users who switch between browser tabs and AT users who rely on page titles cannot identify their current location.

---

## 3. Keyboard Access

### 3.1 `Menu` component has no keyboard interaction
**Severity:** 🔴 Critical  
**File:** [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx)  
**WCAG:** 2.1.1 Keyboard  

The `Menu` component trigger is a `<div>` (no `role="button"`, no `tabIndex`, not focusable). Even if the trigger were focusable, there is no Enter/Space to open, no Arrow key navigation between items, no Escape to close — none of the ARIA menu interaction patterns are implemented.

### 3.2 `.sw` toggle switch has no keyboard behavior
**Severity:** 🔴 Critical  
**File:** [`src/lib/ui/styles.css`](src/lib/ui/styles.css), usages throughout studio routes  
**WCAG:** 2.1.1 Keyboard  

The switch is a pure-CSS `<div>` + `<i>` pattern with no `role="switch"`, no `tabIndex`, and no keyboard handler. It cannot be toggled without a pointer.

### 3.3 No focus trap in modals or mobile drawer
**Severity:** 🔴 Critical  
**File:** [`src/components/modals.tsx`](src/components/modals.tsx), [`src/routes/_shell.tsx:307-324`](src/routes/_shell.tsx)  
**WCAG:** 2.1.2 No Keyboard Trap (inverse — focus _must_ stay inside a modal)  

When a modal opens, focus is not moved into it, and Tab will cycle through the entire underlying page behind the overlay. The mobile "More" drawer has the same issue.

### 3.4 Focus not managed on modal open/close
**Severity:** 🟠 Major  
**File:** [`src/components/modals.tsx`](src/components/modals.tsx)  
**WCAG:** 2.4.3 Focus Order  

`ModalHost` does not call `.focus()` on an element inside the modal when it opens, nor does it restore focus to the triggering element when the modal closes.

### 3.5 `.input:focus { outline: none }` without sufficient replacement
**Severity:** 🟠 Major  
**File:** [`src/lib/ui/styles.css`](src/lib/ui/styles.css)  
**WCAG:** 2.4.11 Focus Appearance (AA in WCAG 2.2)  

```css
.input:focus {
  outline: none;
  border-color: var(--blue-ink);
}
```

The native outline is suppressed and replaced only by a border-color change. At small border widths this may not meet the 2px minimum focus indicator requirement from WCAG 2.2 SC 2.4.11.

### 3.6 Story viewer prev/next tap zones are `<div>` elements
**Severity:** 🔴 Critical  
**File:** [`src/routes/feed.tsx`](src/routes/feed.tsx) — `StoryViewer`  
**WCAG:** 2.1.1 Keyboard  

The left/right navigation zones in the story viewer are `<div onClick>` — not buttons or links — making them unreachable by keyboard.

---

## 4. Screen Readers & ARIA

### 4.1 `Icon` SVGs have no `aria-hidden`
**Severity:** 🔴 Critical  
**File:** [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx) — `Icon` component  
**WCAG:** 4.1.2 Name, Role, Value  

```tsx
// current — SVG is announced to screen readers
<span dangerouslySetInnerHTML={{ __html: svg }} />
```

Every `<Icon>` renders a raw `<svg>` element. Without `aria-hidden="true"` on the `<svg>`, screen readers attempt to read the SVG path data or announce "image" with no useful name. Decorative icons (the vast majority) should be hidden; functional icons inside icon-only buttons should have an accessible name on the button instead.

### 4.2 Icon-only buttons missing `aria-label` in several locations
**Severity:** 🔴 Critical  
**WCAG:** 4.1.2 Name, Role, Value  

These buttons have no accessible name — their only content is an `<Icon>` with no text:

| File | Button |
|------|--------|
| [`src/components/modals.tsx`](src/components/modals.tsx) | Close button in `ReportModal` |
| [`src/components/modals.tsx`](src/components/modals.tsx) | Close button in `ComposeModal` |
| [`src/routes/studio/live.tsx`](src/routes/studio/live.tsx) | Story viewer More/Mute/Pause buttons |
| [`src/components/post-card.tsx`](src/components/post-card.tsx) | Like button (accessible name is just the count, e.g. "2,340") |
| [`src/components/post-card.tsx`](src/components/post-card.tsx) | Comment count button (same issue) |

### 4.3 `ToastStack` has no `aria-live` region
**Severity:** 🔴 Critical  
**File:** [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx) — `ToastStack`  
**WCAG:** 4.1.3 Status Messages  

Toasts are the app's primary feedback mechanism (subscribed, blocked, tip sent, etc.). Without `role="status"` / `aria-live="polite"` on the container, screen reader users receive no announcement when toasts appear. The toast auto-dismisses after 3.4s, leaving no persistent confirmation.

### 4.4 `ModalHost` overlay missing dialog role and labelling
**Severity:** 🔴 Critical  
**File:** [`src/components/modals.tsx`](src/components/modals.tsx)  
**WCAG:** 4.1.2 Name, Role, Value  

```tsx
// current
<div className="overlay">  {/* no role="dialog", no aria-modal, no aria-labelledby */}
```

Without `role="dialog"` and `aria-modal="true"`, screen readers do not know a dialog is open and will let users navigate the underlying page content. Without `aria-labelledby` pointing to the modal's heading, the dialog has no accessible name.

### 4.5 `Menu` component missing all ARIA menu attributes
**Severity:** 🔴 Critical  
**File:** [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx)  
**WCAG:** 4.1.2 Name, Role, Value  

The menu trigger has no `aria-haspopup="menu"` and no `aria-expanded`. Menu items have no `role="menuitem"`. The popup container has no `role="menu"`.

### 4.6 `.sw` toggle switch missing `role="switch"`
**Severity:** 🟠 Major  
**WCAG:** 4.1.2 Name, Role, Value  

Even if keyboard interaction is added (see 3.2), the element must also carry `role="switch"` and `aria-checked` so screen readers can announce its state.

### 4.7 `Avatar` inside a `<Link>` produces a nameless link
**Severity:** 🟠 Major  
**File:** [`src/routes/reels.tsx`](src/routes/reels.tsx), [`src/routes/feed.tsx`](src/routes/feed.tsx)  
**WCAG:** 2.4.6 Headings and Labels, 4.1.2 Name, Role, Value  

`Avatar` always renders `<img alt="">` (correct when standalone as a decorative avatar). When wrapped in a `<Link>` with no other visible text, the link has no accessible name — the image is explicitly empty and contributes nothing.

```tsx
// reels.tsx — link has no accessible name
<Link to={`/c/${c.handle}`}><Avatar name={c.name} size={34} /></Link>
```

### 4.8 No focus management or page title updates on SPA route changes
**Severity:** 🟠 Major  
**File:** [`src/router/app-routes.tsx`](src/router/app-routes.tsx), [`src/App.tsx`](src/App.tsx)  
**WCAG:** 2.4.2 Page Titled, 2.4.3 Focus Order  

When React Router navigates between routes there is no:
- `document.title` update (also noted under 2.7)
- `aria-live` announcement of the new page name
- Focus reset to the `<main>` or `<h1>` of the new page

Screen reader users navigating a SPA hear silence on route change and must explore the page to discover where they are.

### 4.9 `Loop` video has no `<track>` element
**Severity:** 🟡 Minor  
**File:** [`src/lib/ui/index.tsx`](src/lib/ui/index.tsx) — `Loop`  
**WCAG:** 1.2.2 Captions (Prerecorded)  

Background loop videos carry no `<track kind="captions">`. If loops contain speech or meaningful audio they would fail 1.2.2; decorative-only loops are exempt but should have `aria-hidden` and `muted`.

### 4.10 `nav` links use `title` attribute for tooltips instead of visible label
**Severity:** 🟡 Minor  
**File:** [`src/routes/_shell.tsx:79`](src/routes/_shell.tsx)  
**WCAG:** 2.4.6 Headings and Labels  

```tsx
<Link title={t(label)} ...>
```

The `title` attribute is not reliably surfaced by screen readers (depends on user settings) and is not accessible on touch devices. The label text is already rendered inside the link as `.navlabel` — `title` is redundant and should be removed.

---

## 5. Zoom / Reflow / Text Spacing

### 5.1 Font sizes defined in `px` throughout
**Severity:** 🟠 Major  
**File:** [`src/lib/ui/styles.css`](src/lib/ui/styles.css), component inline styles  
**WCAG:** 1.4.4 Resize Text  

Font sizes use `px` units (`t12`, `t13`, `t14`, `t16`…) rather than `rem` or `em`. When a user sets a larger browser default font size (e.g. 20px instead of 16px), the app text does not scale proportionally. WCAG 1.4.4 requires text to be resizable up to 200% without loss of content or functionality.

### 5.2 ChatPopup has a fixed pixel height
**Severity:** 🟠 Major  
**File:** [`src/components/chat-popups.tsx:42`](src/components/chat-popups.tsx)  
**WCAG:** 1.4.4 Resize Text, 1.4.10 Reflow  

```tsx
height: minimized ? "auto" : 380,
```

A fixed `380px` height means at 200% zoom (or with a large user font size) the popup content overflows or clips, and the message input may become inaccessible.

### 5.3 Live stream stage uses fixed pixel dimensions
**Severity:** 🟡 Minor  
**File:** [`src/routes/studio/live.tsx`](src/routes/studio/live.tsx)  
**WCAG:** 1.4.10 Reflow  

The broadcast stage area uses fixed-height layout. At 320px CSS viewport width (WCAG 1.4.10 reference width) content may not reflow to a single column.

---

## 6. Pointer & Touch Targets

### 6.1 ChatPopup action buttons below 24×24px minimum
**Severity:** 🟠 Major  
**File:** [`src/components/chat-popups.tsx:57-68`](src/components/chat-popups.tsx)  
**WCAG:** 2.5.8 Target Size (Minimum) — 24×24 CSS pixels  

```tsx
<button className="muted" style={{ padding: 4 }}>
  <Icon n="call" s={15} />
</button>
```

`padding: 4` on all sides + 15px icon = approximately **23×23px** total hit area. This falls below the WCAG 2.2 minimum of 24×24px.

### 6.2 Edit/remove bundle buttons use 14px icons
**Severity:** 🟡 Minor  
**File:** [`src/routes/studio/tiers.tsx:143-145`](src/routes/studio/tiers.tsx)  
**WCAG:** 2.5.8 Target Size (Minimum)  

```tsx
<button className="muted" onClick={() => openRowEdit(i)} aria-label="Edit bundle">
  <Icon n="edit" s={14} />
</button>
```

14px icon with no explicit padding — effective target is smaller than 24×24px.

### 6.3 Story viewer tap zones span large areas but are `<div>` elements
**Severity:** See 3.6 (keyboard access issue is the primary concern; touch targets are large)

---

## 7. Motion & Timing

### 7.1 Fire border animation uses inline styles — bypasses `prefers-reduced-motion`
**Severity:** 🔴 Critical  
**File:** [`src/routes/studio/live.tsx`](src/routes/studio/live.tsx) — `GiftLine`  
**WCAG:** 2.3.3 Animation from Interactions (AAA) / 2.3.1 (AA for flashing)  

```tsx
// inline style — not caught by the CSS prefers-reduced-motion block
style={{
  animation: "fire-scroll 1.8s ease infinite, fire-pulse 2s ease infinite"
}}
```

The global CSS reduced-motion rule in `styles.css` (line 2089) catches CSS-defined animations via the `animation-duration: 0.01ms` rule, but **inline `style` animations bypass it entirely**. Users who have set `prefers-reduced-motion: reduce` in their OS will still see the looping fire animation.

The `.giftfly` exemption in the CSS was added precisely to handle this scenario — the fire border animation needs the same treatment.

### 7.2 Story auto-advance ignores reduced motion preference
**Severity:** 🟠 Major  
**File:** [`src/routes/feed.tsx`](src/routes/feed.tsx) — `StoryViewer`  
**WCAG:** 2.2.2 Pause, Stop, Hide  

Stories auto-advance on a timer. There is no pause button and the auto-advance does not check `prefers-reduced-motion` or user preference. Vestibular disorder users and users with cognitive disabilities who need more time on each slide have no control.

### 7.3 No timeout warning for session or story auto-advance
**Severity:** 🟡 Minor  
**WCAG:** 2.2.1 Timing Adjustable  

The 3.4-second toast auto-dismiss and story auto-advance give no warning and no way to extend time. The 20-second interval between simulated fan chat messages also fires without user control.

---

## 8. Forms

### 8.1 Search input has no label
**Severity:** 🔴 Critical  
**File:** [`src/routes/_shell.tsx:220`](src/routes/_shell.tsx)  
**WCAG:** 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions  

```tsx
<input placeholder={t("search_placeholder")} />
```

No `<label>`, no `aria-label`, no `aria-labelledby`. A screen reader will announce only the placeholder text (unreliable and not a substitute for a label).

### 8.2 Comment input in `PostCard` has no label
**Severity:** 🟠 Major  
**File:** [`src/components/post-card.tsx`](src/components/post-card.tsx)  
**WCAG:** 1.3.1, 3.3.2  

The "Add a comment…" input uses only a placeholder. No `<label>` or `aria-label`.

### 8.3 Message input in `ChatPopup` has no label
**Severity:** 🟠 Major  
**File:** [`src/components/chat-popups.tsx:89`](src/components/chat-popups.tsx)  
**WCAG:** 1.3.1, 3.3.2  

```tsx
<input className="input" placeholder="Aa" value={msg} ... />
```

No label of any kind.

### 8.4 Stream title and category inputs in Studio Live have no `<label>`
**Severity:** 🟠 Major  
**File:** [`src/routes/studio/live.tsx`](src/routes/studio/live.tsx)  
**WCAG:** 1.3.1, 3.3.2  

The setup form uses `.label` class divs above inputs, but there are no `<label htmlFor>` associations — the visible text is not programmatically connected to its control.

### 8.5 Subscribe modal radio inputs are unlabeled
**Severity:** 🔴 Critical  
**File:** [`src/components/modals.tsx`](src/components/modals.tsx) — `SubscribeModal`  
**WCAG:** 1.3.1, 3.3.2  

Plan selection rows contain `<input type="radio">` with no `id`, no `name` attribute for grouping, and no `<label>` element. The visible tier name text is not associated with the radio.

### 8.6 Compose modal textarea has no label
**Severity:** 🟠 Major  
**File:** [`src/components/modals.tsx`](src/components/modals.tsx) — `ComposeModal`  
**WCAG:** 1.3.1, 3.3.2  

The post text area uses only a placeholder ("What's on your mind?"). No `aria-label` or `<label>`.

### 8.7 Payout amount input has no label
**Severity:** 🟠 Major  
**File:** [`src/routes/studio/payouts.tsx`](src/routes/studio/payouts.tsx)  
**WCAG:** 1.3.1, 3.3.2  

The amount field for requesting a payout has no programmatically associated label.

### 8.8 Story reply input has no label
**Severity:** 🟠 Major  
**File:** [`src/routes/feed.tsx`](src/routes/feed.tsx) — `StoryViewer`  
**WCAG:** 1.3.1, 3.3.2  

The "Reply to story…" input uses only a placeholder. No label association.

### 8.9 `autoComplete` missing on several form fields
**Severity:** 🟡 Minor  
**WCAG:** 1.3.5 Identify Input Purpose  

Login uses correct `autoComplete="email"` and `autoComplete="current-password"` via `CustomInput`. However, the signup flow, profile edit fields (name, handle, bio), and payout bank-detail fields do not carry appropriate `autoComplete` tokens, making autofill harder for users with motor disabilities.

---

## Summary Table

| # | Issue | Severity | WCAG SC |
|---|-------|----------|---------|
| 1.1 | GiftLine `#ffaa33` text fails contrast in light mode | 🔴 | 1.4.3 |
| 1.2 | Browse/Studio toggle hardcoded color outside token system | 🟠 | 1.4.3 |
| 2.1 | No `<main>` landmark | 🔴 | 2.4.1 |
| 2.2 | No skip-to-content link | 🔴 | 2.4.1 |
| 2.3 | Sidebar nav not wrapped in `<nav>` | 🟠 | 1.3.6 |
| 2.4 | ~20 `<div onClick>` elements not keyboard-accessible | 🔴 | 4.1.2 |
| 2.5 | Headings are `<div>` with class, not `<h*>` elements | 🟠 | 1.3.1 |
| 2.7 | Static `<title>` never updates on SPA route changes | 🟠 | 2.4.2 |
| 3.1 | `Menu` component has no keyboard interaction | 🔴 | 2.1.1 |
| 3.2 | `.sw` toggle not keyboard-accessible | 🔴 | 2.1.1 |
| 3.3 | No focus trap in modals or mobile drawer | 🔴 | 2.1.2 |
| 3.4 | Focus not managed on modal open/close | 🟠 | 2.4.3 |
| 3.5 | `outline: none` on inputs without adequate replacement | 🟠 | 2.4.11 |
| 3.6 | Story viewer prev/next zones are `<div>` elements | 🔴 | 2.1.1 |
| 4.1 | `Icon` SVGs missing `aria-hidden` | 🔴 | 4.1.2 |
| 4.2 | Icon-only buttons missing `aria-label` | 🔴 | 4.1.2 |
| 4.3 | `ToastStack` has no `aria-live` region | 🔴 | 4.1.3 |
| 4.4 | `ModalHost` missing `role="dialog"` + `aria-modal` | 🔴 | 4.1.2 |
| 4.5 | `Menu` missing all ARIA menu attributes | 🔴 | 4.1.2 |
| 4.6 | `.sw` missing `role="switch"` + `aria-checked` | 🟠 | 4.1.2 |
| 4.7 | `Avatar` inside `<Link>` produces nameless link | 🟠 | 4.1.2 |
| 4.8 | No focus management or title updates on route change | 🟠 | 2.4.2 |
| 5.1 | Font sizes in `px` instead of `rem` | 🟠 | 1.4.4 |
| 5.2 | ChatPopup fixed `380px` height | 🟠 | 1.4.4 |
| 6.1 | ChatPopup buttons ~23×23px (below 24px minimum) | 🟠 | 2.5.8 |
| 6.2 | Edit/remove bundle buttons use 14px icons | 🟡 | 2.5.8 |
| 7.1 | Fire animation inline style bypasses `prefers-reduced-motion` | 🔴 | 2.3.3 |
| 7.2 | Story auto-advance ignores reduced motion / has no pause | 🟠 | 2.2.2 |
| 8.1 | Search input has no label | 🔴 | 3.3.2 |
| 8.2 | Comment input has no label | 🟠 | 3.3.2 |
| 8.3 | Chat message input has no label | 🟠 | 3.3.2 |
| 8.4 | Stream setup inputs have no `<label>` | 🟠 | 3.3.2 |
| 8.5 | Subscribe modal radio inputs unlabeled | 🔴 | 3.3.2 |
| 8.6 | Compose textarea has no label | 🟠 | 3.3.2 |
| 8.7 | Payout amount input has no label | 🟠 | 3.3.2 |
| 8.8 | Story reply input has no label | 🟠 | 3.3.2 |

**Totals:** 13 Critical 🔴 · 19 Major 🟠 · 5 Minor 🟡

---

## What Is Already Done Well

- `CustomInput` component — proper `htmlFor`/`id`, `aria-invalid`, `aria-describedby`, `role="alert"` on error, password toggle with `aria-label` ([`src/components/custom-input.tsx`](src/components/custom-input.tsx))
- Login page — correct `autoComplete` tokens, `<label htmlFor>` associations ([`src/routes/login.tsx`](src/routes/login.tsx))
- `prefers-reduced-motion` — comprehensive CSS rule for all stylesheet-defined animations ([`src/lib/ui/styles.css:2089`](src/lib/ui/styles.css))
- Auth mosaic — correctly uses `aria-hidden` ([`src/components/auth.tsx:64`](src/components/auth.tsx))
- Reel navigation arrows — have `aria-label` ([`src/routes/reels.tsx:283-286`](src/routes/reels.tsx))
- Reel seek bar — correctly `aria-hidden` ([`src/routes/reels.tsx:192`](src/routes/reels.tsx))
- Space/arrow key reel navigation — keyboard shortcut implemented ([`src/routes/reels.tsx`](src/routes/reels.tsx))
- Live stream transport controls — all have `aria-label` ([`src/routes/live-stream.tsx`](src/routes/live-stream.tsx))
- `RouteFallback` — has `aria-busy` and `aria-live` ([`src/components/route-fallback.tsx`](src/components/route-fallback.tsx))
- `index.html` — has `lang="en"`, no `user-scalable=no`, viewport meta present
- Design token system — WCAG contrast ratios documented inline in token comments
- Google/Apple auth buttons — use `aria-busy` during loading ([`src/components/auth.tsx`](src/components/auth.tsx))
- Landing page nav — has `<header>`, `<nav>`, `aria-label` on toggle ([`src/features/landing/components/Nav.tsx`](src/features/landing/components/Nav.tsx))

---

*End of Phase 1 audit. Awaiting review before proceeding to Phase 2 (remediation).*
