import './acquisition.css'

export interface PlanLogo {
  src: string
  /** Team / competition name — used as the tile's accessible name. */
  alt: string
}

export interface LogoTilesProps {
  /** Logos to show, already scoped to the plan. */
  logos: PlanLogo[]
  /**
   * How many tiles fit before the "+N" overflow tile. The design lays out five
   * per row: `one` row shows 4 logos + overflow, `two` rows show 9 + overflow.
   */
  rows?: 'one' | 'two'
  /**
   * Total number of competitions in the plan. When it exceeds what fits, the
   * remainder is rendered as the trailing "+N" tile.
   */
  total?: number
}

const PER_ROW = 5

/**
 * LogoTiles — the grid of competition / team badges on an Acquisition card.
 * Figma: `Subscription Plan Logo Tile` (Rows = One | Two | Two +x).
 */
export function LogoTiles({ logos, rows = 'one', total }: LogoTilesProps) {
  const capacity = rows === 'two' ? PER_ROW * 2 : PER_ROW
  const overflow = Math.max(0, (total ?? logos.length) - (capacity - 1))
  const visible = overflow > 0 ? logos.slice(0, capacity - 1) : logos.slice(0, capacity)

  return (
    <ul className="acq-logo-tiles" data-rows={rows}>
      {visible.map((logo, i) => (
        <li className="acq-logo-tiles__tile" key={`${logo.alt}-${i}`}>
          <img src={logo.src} alt={logo.alt} />
        </li>
      ))}
      {overflow > 0 && (
        <li className="acq-logo-tiles__tile acq-logo-tiles__tile--overflow">
          <span>+{overflow}</span>
        </li>
      )}
    </ul>
  )
}
