import './acquisition.css'
import type { CSSProperties } from 'react'

export interface PlanLogo {
  src: string
  /** Team / competition name — used as the tile's accessible name. */
  alt: string
}

export interface LogoTilesProps {
  /** Logos to render, already trimmed to the visible count by the caller. */
  logos: PlanLogo[]
  /**
   * One row of five, or two. Rows is how many rows and nothing else — whether
   * the last slot is a badge or a count is the slot's own variant.
   */
  rows?: 1 | 2
  /** Hidden competitions; renders the trailing "+N" tile when above zero. */
  overflowCount?: number
}

/**
 * LogoTile — one slot in the row.
 * Figma: `.LogoTile` (Device × Type).
 *
 * Its own component because the design file has one: a slot holds a badge or
 * it holds the count of the badges that did not fit, and those are two
 * variants of one thing rather than two different things. The row below picks
 * which, and never draws a slot itself.
 */
export function LogoTile({ logo, count }: { logo?: PlanLogo; count?: number }) {
  if (logo) {
    return (
      <li className="acq-logo-tiles__tile">
        <img src={logo.src} alt={logo.alt} />
      </li>
    )
  }
  return (
    <li className="acq-logo-tiles__tile acq-logo-tiles__tile--overflow">
      <span>+{count}</span>
    </li>
  )
}

/**
 * LogoTiles — the row of competition badges on a plan card.
 * Figma: `.LogoTiles` (Rows × Device).
 *
 * Layout only. Row count and overflow are inputs, because §5 of the card rules
 * derives both from the add-on's presence and the competition total — and a
 * rule computed in two places is a rule that eventually disagrees with itself.
 */
export function LogoTiles({ logos, rows = 1, overflowCount = 0 }: LogoTilesProps) {
  return (
    <ul className="acq-logo-tiles" data-rows={rows} style={{ '--acq-logo-rows': rows } as CSSProperties}>
      {logos.map((logo, i) => (
        <LogoTile logo={logo} key={`${logo.alt}-${i}`} />
      ))}
      {overflowCount > 0 && <LogoTile count={overflowCount} />}
    </ul>
  )
}
