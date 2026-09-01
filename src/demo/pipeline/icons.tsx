/**
 * The pipeline's own small icons, drawn inline so they take the current colour
 * and stay crisp at 10–14px. The DS icon set has no code glyph, and the text
 * `</>` rendered unevenly across fonts.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const CodeIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9.4 3 6.6 13" />
  </svg>
)

export const ChevronIcon = ({ size = 10, direction = 'down' }: { size?: number; direction?: 'down' | 'right' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    {...base}
    style={direction === 'right' ? { transform: 'rotate(-90deg)' } : undefined}
  >
    <path d="M3.5 6 8 10.5 12.5 6" />
  </svg>
)

export const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={2}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </svg>
)

export const CopyIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
    <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
  </svg>
)

export const UndoIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="M6 4 3 7l3 3" />
    <path d="M3 7h6.5a3.5 3.5 0 0 1 0 7H8" />
  </svg>
)
