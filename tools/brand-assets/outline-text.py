#!/usr/bin/env python3
"""
Convert a line of text into an SVG path, using Inter and the same shaper a browser uses.

Why this exists: the static brand assets (`assets/og-*.svg`, `assets/lockup.svg`) carry
their text as outlines, not as `<text>`. Outlines render identically in sharp/librsvg,
in a mail client's link preview, and in an OS thumbnailer — none of which can be relied
on to have Inter, or to honour @font-face. Live text there is a coin flip.

Run this when the copy on one of those assets changes, then paste the path back in.
Nothing in the app build depends on it.

    pip install fonttools uharfbuzz --break-system-packages
    curl -sL https://registry.npmjs.org/@fontsource/inter/-/inter-5.3.0.tgz | tar xz -C /tmp
    python3 outline-text.py "Turn Followers Into Fans." --weight 800 --size 68

Output space: font-size given by --size, pen origin (0, 0), baseline on y = 0, ink in
negative y. Place it with translate(x y) — no scale needed.

Options:
    --weight   400 | 500 | 700 | 800 | 900        (default 700)
    --size     emit scale, in px                  (default 100)
    --track    letter-spacing, in em              (default -0.01, matching the wordmark)
    --fonts    directory holding inter-latin-<w>-normal.woff
               (default /tmp/package/files)
"""
import argparse, io, re, sys

def outline(text, weight=700, size=100.0, track_em=-0.01, fonts="/tmp/package/files"):
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.misc.transform import Transform
    import uharfbuzz as hb

    tt = TTFont(f"{fonts}/inter-latin-{weight}-normal.woff")
    upem = tt["head"].unitsPerEm
    buf = io.BytesIO(); tt.flavor = None; tt.save(buf)

    face = hb.Face(buf.getvalue()); font = hb.Font(face); font.scale = (upem, upem)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(font, b, {"kern": True, "liga": True})

    order, gs = tt.getGlyphOrder(), tt.getGlyphSet()
    k, track, cursor, out = size / upem, track_em * upem, 0.0, []
    for inf, pos in zip(b.glyph_infos, b.glyph_positions):
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
        gs[order[inf.codepoint]].draw(TransformPen(pen, Transform(
            k, 0, 0, -k, (cursor + pos.x_offset) * k, -pos.y_offset * k)))
        d = pen.getCommands()
        if d:
            out.append(d)
        cursor += pos.x_advance + track
    advance = (cursor - track) * k if b.glyph_infos else 0.0

    xs = []
    toks = re.findall(r"[A-Za-z]|-?\d*\.?\d+", " ".join(out))
    n_args, cmd, i = {"M": 2, "L": 2, "Q": 4, "C": 6, "H": 1, "V": 1, "Z": 0}, None, 0
    while i < len(toks):
        if re.fullmatch(r"[A-Za-z]", toks[i]):
            cmd = toks[i].upper(); i += 1; continue
        n = n_args.get(cmd, 0)
        if not n:
            i += 1; continue
        if cmd in ("M", "L", "Q", "C"):
            xs += [float(v) for v in toks[i:i + n:2]]
        elif cmd == "H":
            xs.append(float(toks[i]))
        i += n

    return {
        "d": " ".join(out),
        "advance": round(advance, 2),
        "ink_x0": round(min(xs), 2) if xs else 0.0,
        "ink_x1": round(max(xs), 2) if xs else 0.0,
        "cap_height": round(tt["OS/2"].sCapHeight / upem * size, 2),
    }

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("text")
    p.add_argument("--weight", type=int, default=700)
    p.add_argument("--size", type=float, default=100.0)
    p.add_argument("--track", type=float, default=-0.01)
    p.add_argument("--fonts", default="/tmp/package/files")
    a = p.parse_args()
    r = outline(a.text, a.weight, a.size, a.track, a.fonts)
    print(f"<!-- advance {r['advance']}  ink {r['ink_x0']}..{r['ink_x1']}  cap {r['cap_height']} -->",
          file=sys.stderr)
    print(r["d"])
