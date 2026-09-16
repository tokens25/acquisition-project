/**
 * The subscribe gold, as something an SVG can paint with.
 *
 * `--gradient-subscribe` is a CSS gradient, and CSS gradients are backgrounds:
 * the title wears it through `background-clip: text`, and the button wears it
 * as its own background. Neither trick reaches the inside of an icon. A glyph
 * takes a gradient only by referring to one defined in the document, so the
 * same two stops are declared here in the one form SVG understands.
 *
 * The id is fixed rather than generated. Two highlighted cards on one page
 * would declare it twice and the browser would use the first — which is the
 * same gradient, so the duplicate costs nothing and a generated id would cost
 * every icon a style rule of its own.
 *
 * Kept in sync by hand with the token, and deliberately: a build step that
 * parsed a CSS gradient into SVG stops would be a lot of machinery for two
 * colours that have not moved.
 */
export const GOLD_GRADIENT_ID = 'acq-gold'

export function GoldGradient() {
  return (
    <svg className="acq-gold-def" aria-hidden="true" focusable="false">
      <defs>
        {/* Left to right across each glyph, as the 90deg CSS gradient runs
            across the title. Bounding-box units are the default, so every
            icon gets the whole ramp rather than a slice of a shared one. */}
        <linearGradient id={GOLD_GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2af3d" />
          <stop offset="100%" stopColor="#fbed7d" />
        </linearGradient>
      </defs>
    </svg>
  )
}
