import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { tierOnTab } from '../rules/tabs'
import { PlanDetails, type PlanDetailsProps } from '../components/acquisition'
import { isWholeInView } from '../components/acquisition/viewport'
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
  detailsScope = 'card',
  tab,
}: {
  set: CardSet
  context?: Context
  /**
   * Which tab of the plan picker is showing. Absent draws every plan, which is
   * what the edit view and the card row want — there is no tab control there.
   */
  tab?: string | null
  /**
   * Whether the cards respond to clicks. The journey thumbnails render the set
   * as a picture — opening a dialog inside a 280px tile that is itself a button
   * would be a surprise, not a feature.
   */
  interactive?: boolean
  /**
   * Whether the details dialog belongs to the card it was opened from or to
   * the screen around it. The phone is the second case: there is no room
   * beside a card, so the popup takes the screen.
   */
  detailsScope?: 'card' | 'screen'
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
  const [details, setDetails] = useState<
    (Omit<PlanDetailsProps, 'onClose' | 'anchor'> & { cardIndex: number }) | null
  >(null)

  /**
   * The card the open dialog belongs to, so it can place itself over it.
   *
   * Looked up on demand by position in the row rather than held as a
   * reference: the row re-renders while the dialog is open — the panel beside
   * it is what people are editing — and a stored node would be the old one.
   */
  const anchor = useCallback(() => {
    if (!details) return null
    return ref.current?.querySelectorAll<HTMLElement>('.acq-card')[details.cardIndex] ?? null
  }, [details])

  /**
   * Which cards are on screen whole, by position in the row.
   *
   * The dialog opens over its card, so a card only half in view would put half
   * a dialog against the edge of the preview. Rather than place it somewhere it
   * does not belong, the control waits until the card it points at is all there.
   */
  const [whole, setWhole] = useState<boolean[]>([])
  // Read inside listeners, which outlive the render that registered them.
  const detailsRef = useRef(details)
  useEffect(() => {
    detailsRef.current = details
  }, [details])

  // The tab travels with the rest of what is on screen, so a price written for
  // one tab is found the same way a price written for one market is.
  const shown = useMemo(
    () => (tab === undefined ? context : { ...context, tab: tab ?? undefined }),
    [context, tab],
  )
  // A tab shows the plans that say they belong to it; the rest of the tool
  // shows every plan, because there is no tab control to be on.
  const cards = useMemo(
    () => resolveSet(set, shown).filter((c) => !shown.tab || tierOnTab(c.tier, shown.tab)),
    [set, shown],
  )
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

  /** Re-reads which cards are wholly on screen, and closes a dialog whose is not. */
  const measureWhole = useCallback(() => {
    const row = ref.current
    if (!interactive || !row) return
    const next = Array.from(row.querySelectorAll<HTMLElement>('.acq-card')).map(isWholeInView)
    setWhole((prev) =>
      prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
    )
    // A card scrolled out from under its own dialog leaves the dialog pointing
    // at nothing, so it closes with the card. In screen scope it points at the
    // screen, which does not scroll away.
    const open = detailsRef.current
    if (detailsScope === 'card' && open && next[open.cardIndex] === false) setDetails(null)
  }, [interactive, detailsScope])

  // Measured before paint, so a card that is already half out never offers the
  // control even for a frame. Scroll is captured on the document because it
  // does not bubble, and both the row and the pane around it move the cards.
  useLayoutEffect(() => {
    measureWhole()
    document.addEventListener('scroll', measureWhole, { capture: true, passive: true })
    window.addEventListener('resize', measureWhole)
    const row = ref.current
    const observer = new ResizeObserver(measureWhole)
    if (row) observer.observe(row)
    return () => {
      document.removeEventListener('scroll', measureWhole, { capture: true })
      window.removeEventListener('resize', measureWhole)
      observer.disconnect()
    }
  }, [cards, measureWhole])

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
          {cards.map(({ tier, offer }, cardIndex) => (
            <RuledCard
              key={tier.id}
              set={set}
              tier={tier}
              offer={offer}
              market={market}
              context={context}
              device={set.device}
              descriptionLines={descriptionLines}
              onOpenDetails={
                interactive ? (d) => setDetails({ ...d, cardIndex }) : undefined
              }
              // Only in card scope. The wait exists so a dialog cannot open
              // over a card that is half off screen; a dialog that belongs to
              // the screen has no such card to be half off it.
              detailsBlocked={
                interactive && detailsScope === 'card' && whole[cardIndex] !== true
              }
            />
          ))}
          <p className="acq-set__probe" ref={probeRef} aria-hidden="true" />
        </div>
      </div>
      {details && (
        <PlanDetails
          {...details}
          scope={detailsScope}
          // No anchor in screen scope: there is no card to place against, and
          // the dialog centres on the overlay when it is not given one.
          anchor={detailsScope === 'card' ? anchor : undefined}
          onClose={() => setDetails(null)}
        />
      )}
    </div>
  )
}
