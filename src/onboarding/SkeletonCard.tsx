import './onboarding.css'

import type { CardStructure } from '../rules/onboarding'

/**
 * A plan card with its parts named instead of filled.
 *
 * Deliberately not a loading shimmer. A shimmer says "this is coming"; this
 * says "this is what the card has", which is the question being answered — so
 * every block carries the name of the thing that will stand there, and a part
 * that is switched off is absent rather than blank. The layout closes up after
 * it, because a gap where a part used to be is a card describing a decision
 * nobody made.
 */
export function SkeletonCard({
  card,
  highlighted = false,
  selected,
  reserveSaving = false,
  reserveLegal = false,
  label,
  onSelect,
}: {
  card: CardStructure
  highlighted?: boolean
  /** Undefined means nothing in the row is chosen, so nothing is dimmed. */
  selected?: boolean
  /** A card beside this one has a savings plate, so this one keeps its room. */
  reserveSaving?: boolean
  reserveLegal?: boolean
  /** "Plan 1" — which card this is, in a row of them. */
  label?: string
  onSelect?: () => void
}) {
  const savingRoom = card.saving || reserveSaving
  const legalRoom = card.legal || reserveLegal

  return (
    <article
      className="ob-card"
      data-highlighted={highlighted || undefined}
      data-selected={selected || undefined}
      data-dimmed={selected === false || undefined}
      onClick={onSelect}
    >
      {label && <p className="ob-card__index">{label}</p>}
      {highlighted && <p className="ob-card__ribbon">Promoted</p>}

      {card.title && <div className="ob-slot ob-slot--title">Title</div>}
      {card.description && <div className="ob-slot ob-slot--description">Description</div>}

      {(card.title || card.description) && (card.price || card.cta) && (
        <hr className="ob-card__divider" />
      )}

      {card.startsAt && <div className="ob-slot ob-slot--caption">“Starts at”</div>}
      {card.price && <div className="ob-slot ob-slot--price">Price</div>}
      {legalRoom && (
        <div className="ob-slot ob-slot--legal" data-reserved={!card.legal || undefined}>
          Legal text
        </div>
      )}

      {card.cta && (
        <div className="ob-cta">
          {savingRoom && (
            <div className="ob-slot ob-slot--saving" data-reserved={!card.saving || undefined}>
              Savings label
            </div>
          )}
          <div className="ob-slot ob-slot--button">Button</div>
        </div>
      )}

      {card.logos && <LogoRows rows={card.logoRows} overflow={card.logoOverflow} />}

      {card.features && card.featureCount > 0 && (
        <ul className="ob-features">
          {Array.from({ length: card.featureCount }, (_, i) => (
            <li key={i} className="ob-slot ob-slot--feature">
              Feature {i + 1}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/** Five to a row, as the real tile is. The last one is a badge or a count. */
function LogoRows({ rows, overflow }: { rows: 1 | 2; overflow: 'count' | 'logo' }) {
  const perRow = 5
  return (
    <div className="ob-logos">
      {Array.from({ length: rows }, (_, r) => (
        <div className="ob-logos__row" key={r}>
          {Array.from({ length: perRow }, (_, i) => {
            const last = r === rows - 1 && i === perRow - 1
            return last && overflow === 'count' ? (
              <span key={i} className="ob-logo ob-logo--count">
                +N
              </span>
            ) : (
              <span key={i} className="ob-logo" />
            )
          })}
        </div>
      ))}
    </div>
  )
}
