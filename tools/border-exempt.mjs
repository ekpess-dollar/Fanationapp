/**
 * Boundaries that 1.4.11 does not reach, named one at a time.
 *
 * Read by `borderaudit.mjs`. Every entry is pulled out of the gated total and
 * printed in its own section with the reason attached, so the exemption is a
 * line in the report rather than a paragraph in somebody's head. An audit that
 * passes because a rule was quietly narrowed is worth less than one that fails
 * honestly; this is the middle path, and it only works if the list stays short
 * and every entry says why.
 *
 * The bar for being on this list is not "hard to fix". It is that the criterion
 * does not apply — the boundary is not identifying a component, because
 * something else already does. If the answer to "what happens if this edge
 * disappears" is "nothing, the thing is still identifiable", it belongs here.
 * If the answer is "you can no longer tell what it is", it does not, however
 * awkward the fix.
 *
 *   kind    which app the rule belongs to
 *   sel     matched as a prefix of the report's selector, which is the tag name
 *           plus the first 52 characters of the class attribute — so anchor it
 *           on a real class at the front of the list, never on a utility soup
 *           that reorders the moment someone edits the markup
 *   reason  why the criterion does not reach it, in full sentences
 */

export default [
  {
    kind: "landing",
    sel: "DIV.icontile",
    reason:
      "A tinted rounded square behind an icon, on the six feature cards and the " +
      "three how-it-works steps. Not operable, and not required to understand " +
      "anything: delete the tile and the icon still draws, the heading still " +
      "reads, the card still has its own boundary. 1.4.11 asks for the visual " +
      "information REQUIRED to identify a component and its boundaries, and " +
      "nothing here is required — the tile is a wash of hue behind a glyph.\n" +
      "       The arithmetic also has no answer. #5DDD90 has a relative " +
      "luminance of 0.58, so mint over #ffffff cannot exceed 1.67:1 at full " +
      "opacity, let alone at the alpha of an edge; amber and gold sit the same " +
      "way. Reaching 3:1 would mean replacing each hue with its -ink value and " +
      "putting six saturated dark outlines through a feature grid — a visible " +
      "design regression bought for a criterion that was never asking.\n" +
      "       What WAS a defect here is fixed rather than exempted: the fill " +
      "was solved per hue so light now matches dark's own contrast, tile by " +
      "tile. The tile is visible in both themes. Only its outline is exempt.",
  },
];
