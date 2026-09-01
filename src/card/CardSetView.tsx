import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PlanDetails, type PlanDetailsProps } from '../components/acquisition'
import type { CardSet, Context } from '../rules/content'
import { marketFor, resolveSet } from '../rules/resolve'
import { RuledCard } from './RuledCard'

/**
 * Renders a set for a context and resolves the two set-level layout rules.
 *
 * S-2 · one card wrapping to two lines pulls the whole set to two, capped there.
 * S-3 · every card renders at the tallest card's height.
 *
 * S-3 is CSS (stretch). S-2 is measured against the FULL text: each card
 * truncates to whatever budget it is given, so asking a rendered card whether
 * it wrapped only confirms the budget it was handed.
 */
export function CardSetView({
  set,
  context = set.context,
  interactive = true,
}: {
  set: CardSet
  context?: Context
  /**
   * Whether the cards respond to clicks. The journey thumbnails render the set
   * as a picture — opening a dialog inside a 280px tile that is itself a button
   * would be a surprise, not a feature.
   */
  interactive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLParagraphElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasMore, setHasMore] = useState(false)
  const [descriptionLines, setDescriptionLines] = useState<1 | 2>(1)
  /**
   * The open dialog's contents, or null.
   *
   * Held here rather than in the card, because the dialog covers the whole
   * preview and `.acq-card` clips its own overflow — a scrim rendered inside a
   * card would stop at the card's edge.
   */
  const [details, setDetails] = useState<Omit<PlanDetailsProps, 'onClose'> | null>(null)

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

      const anyWraps = cards.some(({ tier }) => {
        probe.textContent = tier.description
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

  // Whether anything is still to the right. Recomputed on scroll and on resize,
  // because either can end the overflow — and a fade left showing over the last
  // card would be a worse lie than no fade at all.
  const updateMore = useCallback(() => {
    const row = ref.current
    if (!row) return
    const remaining = row.scrollWidth - row.clientWidth - row.scrollLeft
    setHasMore(remaining > 4)
  }, [])

  useEffect(() => {
    const row = ref.current
    if (!row) return
    updateMore()
    // Listened for natively rather than through onScroll: scroll does not
    // bubble, and React's delegated handler misses a programmatic scrollLeft.
    row.addEventListener('scroll', updateMore, { passive: true })
    const observer = new ResizeObserver(updateMore)
    observer.observe(row)
    return () => {
      row.removeEventListener('scroll', updateMore)
      observer.disconnect()
    }
  }, [cards, updateMore])


  if (cards.length === 0) {
    return (
      <p className="acq-set__empty">
        Nothing is sold on {context.channel} at {context.cadence} in {context.market}.
      </p>
    )
  }

  return (
    <div className="acq-preview">
      <div className="acq-set-scroll" ref={scrollRef} data-more={hasMore || undefined}>
        <div
          className="acq-set"
          ref={ref}
          data-description-lines={descriptionLines}
        >
          {cards.map(({ tier, offer }) => (
            <RuledCard
              key={tier.id}
              set={set}
              tier={tier}
              offer={offer}
              market={market}
              context={context}
              device={set.device}
              descriptionLines={descriptionLines}
              onOpenDetails={interactive ? setDetails : undefined}
            />
          ))}
          <p className="acq-set__probe" ref={probeRef} aria-hidden="true" />
        </div>
      </div>
      {details && <PlanDetails {...details} onClose={() => setDetails(null)} />}
    </div>
  )
}
