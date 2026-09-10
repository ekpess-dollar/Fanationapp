import * as React from "react";
import { BRAND, MARK_RADIUS_RATIO } from "./tokens";
import { MARK_PATHS, MARK_VIEWBOX } from "./mark";

/**
 * The Fanation logo, as two components.
 *
 * `FanationMark` is the tile — the square, the rounded corner, the glyph inside it.
 * `FanationLogo` is the horizontal lockup — mark, gap, wordmark.
 *
 * Every measurement scales off one number, `size`, using the ratios taken from the
 * live landing lockup (34 px tile · 9 px radius · 10 px gap · 19 px wordmark). Pass
 * `size={34}` and you get the landing header back exactly; pass anything else and
 * the proportions hold.
 *
 * The wordmark is set in whatever the surrounding `font-family` is, at weight 900.
 * That is deliberate: every project loads Inter as a bundled dependency, and the landing page
 * has always drawn the wordmark as live text rather than outlines. It is NOT the
 * rounded geometric face used in the 1024 px master export — see `../assets/README.md`
 * §5 for why, and for the outlined form the static assets use instead.
 */

type Div = React.HTMLAttributes<HTMLDivElement>;

export interface FanationMarkProps extends Omit<Div, "color"> {
  /** Edge length of the tile, in px. Everything else derives from this. */
  size?: number;
  /** Glyph colour. */
  color?: string;
  /** Tile colour. Pass `"transparent"` to drop the tile and place the glyph directly on the page. */
  tile?: string;
  /** Corner radius override, in px. Defaults to `size × 9/34`. */
  radius?: number;
  /** Accessible name. Omit when a visible wordmark sits beside the mark — then it is decorative. */
  title?: string;
}

export function FanationMark({
  size = 34,
  color = BRAND.blue,
  tile = BRAND.surface,
  radius,
  title,
  style,
  ...rest
}: FanationMarkProps) {
  const r = radius ?? size * MARK_RADIUS_RATIO;
  return (
    <div
      {...rest}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: tile,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flex: "none",
        ...style,
      }}
    >
      <svg
        viewBox={MARK_VIEWBOX}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        focusable="false"
        style={{ display: "block" }}
      >
        {title ? <title>{title}</title> : null}
        <g fill={color}>
          {MARK_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export interface FanationLogoProps extends Omit<Div, "color"> {
  /** Edge length of the tile, in px. Gap and wordmark scale from it. */
  size?: number;
  /**
   * Wordmark. A plain string in almost every case. A node is allowed for the one shape
   * the product actually needs — a qualifier set differently beside the name, as in
   * `<>Fanation <span className="muted">Admin</span></>` on the admin console. The
   * qualifier inherits weight 900 and the tracking; only what you override changes.
   * Set `""` to render the mark alone — the accessible name survives either way.
   */
  label?: React.ReactNode;
  /** Glyph colour. */
  color?: string;
  /** Tile colour. */
  tile?: string;
  /** Wordmark colour. Defaults to `currentColor`, so it follows the theme. */
  wordColor?: string;
  /** Render the tile as a plain square with no rounding — for full-bleed contexts such as an Apple touch icon. */
  square?: boolean;
}

export function FanationLogo({
  size = 34,
  label = "Fanation",
  color = BRAND.blue,
  tile = BRAND.surface,
  wordColor = "currentColor",
  square = false,
  style,
  ...rest
}: FanationLogoProps) {
  return (
    <div
      {...rest}
      style={{
        display: "flex",
        alignItems: "center",
        gap: (size * 10) / 34,
        ...style,
      }}
    >
      <FanationMark
        size={size}
        color={color}
        tile={tile}
        radius={square ? 0 : undefined}
        title={label ? undefined : "Fanation"}
      />
      {label ? (
        <span
          style={{
            fontFamily: "inherit",
            fontWeight: 900,
            fontSize: (size * 19) / 34,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            color: wordColor,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
