import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CardSet, Context } from '../rules/content'
import { marketFor, resolveSet } from '../rules/resolve'
import { RuledCard } from './RuledCard'

/**
 * Renders a set for a context and resolves the two set-level layout rules.
 *
 * S-2 · one card wrapping to two lines pulls the whole set to two, capped there.
 * S-3 · every card renders at the tallest card's height.
 *
 * S-3 is pure CSS (stretch). S-2 has to be measured, and measured against the
 * FULL text: each card truncates itself to whatever budget it is given, so
 * asking a rendered card whether it wrapped would only ever confirm the budget
 * it was already handed. One offscreen probe at the real description width
 * answers the question the rule actually asks.
 */
export function CardSetView({
  set,
  context = set.context,
  onMore,
}: {
  set: CardSet
  context?: Context
  onMore?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLParagraphElement>(null)
  const [descriptionLines, setDescriptionLines] = useState<1 | 2>(1)

  const cards = useMemo(() => resolveSet(set, context), [set, context])
  const market = marketFor(set, context.market)

  useLayoutEffect(() => {
    const root = ref.current
    const probe = probeRef.current
    if (!root || !probe) return

    const measure = () => {
      const sample = root.querySelector<HTMLElement>('.acq-card-header__description')
      if (!sample) return
      const width = sample.clientWidth
      if (!width) return

      const style = getComputedStyle(sample)
      const lineHeight = parseFloat(style.lineHeight) || 21
      Object.assign(probe.style, {
        width: `${width}px`,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
      })

      const anyWraps = cards.some((card) => {
        probe.textContent = card.description
        return probe.scrollHeight > lineHeight * 1.4
      })
      setDescriptionLines((prev) => {
        const next = anyWraps ? 2 : 1
        return prev === next ? prev : next
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [cards])

  return (
    <div className="acq-set" ref={ref} data-description-lines={descriptionLines}>
      {cards.map((card) => (
        <RuledCard
          key={card.id}
          card={card}
          market={market}
          device={set.device}
          descriptionLines={descriptionLines}
          onMore={onMore}
        />
      ))}
      <p className="acq-set__probe" ref={probeRef} aria-hidden="true" />
    </div>
  )
}
