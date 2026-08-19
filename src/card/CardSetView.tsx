import { useLayoutEffect, useRef, useState } from 'react'
import type { CardSet } from '../rules/content'
import { RuledCard } from './RuledCard'

/**
 * Renders a set and resolves the two set-level layout rules.
 *
 * S-2 · one card wrapping to two lines pulls the whole set to two, capped there.
 * S-3 · every card renders at the tallest card's height.
 *
 * S-3 is pure CSS (stretch). S-2 needs to know whether any description wraps,
 * so it is measured once after layout and shared down. A CSS subgrid row track
 * would remove the measurement, at the cost of restructuring the card's
 * internals — worth revisiting if the card ever becomes a grid throughout.
 */
export function CardSetView({ set, onMore }: { set: CardSet; onMore?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [descriptionLines, setDescriptionLines] = useState<1 | 2>(1)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const measure = () => {
      const texts = root.querySelectorAll<HTMLElement>('.acq-card-header__text')
      let anyWraps = false
      texts.forEach((el) => {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21
        if (el.scrollHeight > lineHeight * 1.5) anyWraps = true
      })
      setDescriptionLines(anyWraps ? 2 : 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [set])

  return (
    <div className="acq-set" ref={ref} data-description-lines={descriptionLines}>
      {set.cards.map((card) => (
        <RuledCard
          key={card.id}
          card={card}
          locale={set.locale}
          device={set.device}
          descriptionLines={descriptionLines}
          onMore={onMore}
        />
      ))}
    </div>
  )
}
