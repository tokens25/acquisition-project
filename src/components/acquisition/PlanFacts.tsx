import './acquisition.css'

import type { Device } from './types'

export interface BillingOption {
  label: string
  price: string
  unit: string
  current?: boolean
  term?: string | null
}

export interface PlanFactsProps {
  /** Every way the plan is priced here; the one on screen is marked. */
  billing?: BillingOption[]
  /** "Under-25: €5.59/mo · 12 mo" */
  youth?: string
  /** Streams 2 · IP 1 · Video HD */
  limits?: { label: string; value: string }[]
  /** "Can add: Baloncesto €9.99/mo" */
  canAdd?: string[]
  highlighted?: boolean
  device?: Device
}

/**
 * The facts DAZN's catalogue states about a plan, under the price.
 *
 * Two rows that read like price tags rather than prose: how else the plan
 * can be paid for, and what it is sold with. Each row appears only when
 * there is something to say — a plan written by hand shows none of this.
 */
export function PlanFacts({ billing, youth, limits, canAdd, highlighted = false, device = 'desktop' }: PlanFactsProps) {
  const hasBilling = (billing?.length ?? 0) > 1 || youth
  const hasLimits = (limits?.length ?? 0) > 0 || (canAdd?.length ?? 0) > 0
  if (!hasBilling && !hasLimits) return null
  return (
    <div className="acq-facts" data-device={device} data-highlighted={highlighted || undefined}>
      {hasBilling && (
        <div className="acq-facts__row" data-field="billing">
          {(billing?.length ?? 0) > 1 &&
            billing!.map((b) => (
              <span key={b.label} className="acq-facts__tag" data-current={b.current || undefined} title={b.term ?? undefined}>
                <span className="acq-facts__k">{b.label}</span>
                <span className="acq-facts__v">
                  {b.price}
                  <small>/{b.unit}</small>
                </span>
              </span>
            ))}
          {youth && (
            <span className="acq-facts__tag acq-facts__tag--youth" data-field="youth">
              {youth}
            </span>
          )}
        </div>
      )}
      {hasLimits && (
        <div className="acq-facts__row" data-field="limits">
          {limits?.map((l) => (
            <span key={l.label} className="acq-facts__tag acq-facts__tag--limit">
              <span className="acq-facts__k">{l.label}</span>
              <span className="acq-facts__v">{l.value}</span>
            </span>
          ))}
          {canAdd && canAdd.length > 0 && (
            <span className="acq-facts__tag acq-facts__tag--add" data-field="canAdd" title={canAdd.join('\n')}>
              + {canAdd.join(' · ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
