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

/**
 * Throwing a thing away. Used wherever a row offers to be rid of itself — the
 * word said it before, and a column of the same word down the side of a panel
 * is a column of noise rather than a set of controls.
 */
export const TrashIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5" />
    <path d="M4 4.5 4.6 13a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4.5" />
    <path d="M6.6 7v4M9.4 7v4" />
  </svg>
)

export const UndoIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="M6 4 3 7l3 3" />
    <path d="M3 7h6.5a3.5 3.5 0 0 1 0 7H8" />
  </svg>
)

/**
 * Keeping a file. A floppy disk, which nothing has used in twenty years and
 * everyone still reads instantly — the one place where the old object beats
 * any drawing of what saving now actually is.
 */
export const SaveIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="M3.9 2.5h6.6l3 3v6.6a1.4 1.4 0 0 1-1.4 1.4H3.9a1.4 1.4 0 0 1-1.4-1.4V3.9a1.4 1.4 0 0 1 1.4-1.4Z" />
    <path d="M5.4 2.5v3.1h4.3V2.5" />
    <path d="M5.4 13.5v-3.2h5.2v3.2" />
  </svg>
)

/** Changing what a thing is called. */
export const PencilIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="m10.6 2.9 2.5 2.5" />
    <path d="M3 13.3 3.6 10l6.6-6.6 2.4 2.4L6 12.4l-3 .9Z" />
  </svg>
)

/** Running through something rather than reading it — the walkthrough. */
export const PlayIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="M5.3 3.3 12 8l-6.7 4.7V3.3Z" />
  </svg>
)

/** Off this machine and onto yours. */
export const DownloadIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" {...base} strokeWidth={1.6}>
    <path d="M8 2.4v7.4" />
    <path d="M4.9 6.9 8 10l3.1-3.1" />
    <path d="M2.8 13.2h10.4" />
  </svg>
)
