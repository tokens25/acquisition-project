import './acquisition.css'

export interface PlanLogo {
  src: string
  /** Team / competition name — used as the tile's accessible name. */
  alt: string
}

export interface LogoTilesProps {
  /** Logos to render, already trimmed to the visible count by the caller. */
  logos: PlanLogo[]
  /** One or two rows of five. Decided by the rules layer, not here. */
  rows?: 1 | 2
  /** Hidden competitions; renders the trailing "+N" tile when above zero. */
  overflowCount?: number
}

/**
 * LogoTiles — the grid of competition badges on an Acquisition card.
 * Figma: `Subscription Plan Logo Tile`.
 *
 * Layout only. Row count and overflow are inputs, because §5 of the card rules
 * derives both from the add-on's presence and the competition total — and a
 * rule computed in two places is a rule that eventually disagrees with itself.
 */
export function LogoTiles({ logos, rows = 1, overflowCount = 0 }: LogoTilesProps) {
  return (
    <ul className="acq-logo-tiles" data-rows={rows}>
      {logos.map((logo, i) => (
        <li className="acq-logo-tiles__tile" key={`${logo.alt}-${i}`}>
          <img src={logo.src} alt={logo.alt} />
        </li>
      ))}
      {overflowCount > 0 && (
        <li className="acq-logo-tiles__tile acq-logo-tiles__tile--overflow">
          <span>+{overflowCount}</span>
        </li>
      )}
    </ul>
  )
}
