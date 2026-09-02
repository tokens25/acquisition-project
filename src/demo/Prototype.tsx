import './prototype.css'

import type { MouseEvent as ReactMouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CardSetView } from '../card/CardSetView'
import { FlowStep } from '../card/FlowStep'
import { Icon } from '../components/Icon'
import { iconArtwork } from '../card/assets'
import reloadIcon from '../assets/browser/reload.svg'
import siteSettingsIcon from '../assets/browser/site-settings.svg'
import cellularIcon from '../assets/browser/status-cellular.svg'
import wifiIcon from '../assets/browser/status-wifi.svg'
import batteryIcon from '../assets/browser/status-battery.svg'
import type { CardSet, Context } from '../rules/content'
import type { ResolvedStep } from '../rules/journey'

/**
 * The journey, running, at the size the design file draws it.
 *
 * The frames row shows every screen at once, small, as a picture of the flow.
 * This shows one screen at a time, at full size, and lets you walk it — the
 * same journey, the same screens, the same content, told in the order a person
 * would meet it. It is the tool's own output played back rather than a second
 * rendering of it: what a screen draws here is what the panel wrote.
 *
 * Screens rather than steps, so a step drawn three ways is three taps. That is
 * what the row counts, what the Figma section reconciles against, and what a
 * person actually clicks through.
 */

/** The frame every screen in the section is drawn in. */
const PHONE = { width: 375, height: 812 }

/**
 * What advances the flow.
 *
 * The screens are Figma verbatim, so their CTAs are spans rather than buttons
 * and there is nothing to wire an onClick to. Rather than edit thirteen
 * screens to make them clickable — which would make them no longer verbatim —
 * the frame reads the click: land on something that looks like a control and
 * the flow moves on. Miss, and the controls say where they are instead of
 * nothing happening, which is what makes a prototype feel broken.
 */
const HOTSPOT = '.fl__cta, .dazn-btn, button, a, [role="button"]'

/** Room for the bar under the phone and a margin, before the phone must shrink. */
const FURNITURE = 132

export function Prototype({
  planned,
  set,
  context,
  onClose,
}: {
  /** The journey as planned — skipped steps included, and dropped here. */
  planned: ResolvedStep[]
  set: CardSet
  context: Context
  onClose: () => void
}) {
  // One entry per screen. A skipped step draws nothing, so it is not a screen
  // you can walk to — the row greys it, but a prototype cannot show it.
  const screens = useMemo(
    () =>
      planned
        .filter((p) => !p.skipped)
        .flatMap((p) => (p.step.states ?? [null]).map((state) => ({ step: p.step, state }))),
    [planned],
  )

  const [at, setAt] = useState(0)
  const [hint, setHint] = useState(false)
  const [scale, setScale] = useState(1)
  const page = useRef<HTMLDivElement>(null)

  const current = screens[Math.min(at, screens.length - 1)]
  const first = at === 0
  const last = at >= screens.length - 1

  const go = useCallback(
    (delta: number) => {
      setAt((n) => Math.min(Math.max(n + delta, 0), screens.length - 1))
    },
    [screens.length],
  )

  // A short display cannot hold 812 plus the bar under it. zoom rather than
  // transform, so the box shrinks with the picture and the bar stays put
  // instead of floating over a phone that still occupies its full height.
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(1, (window.innerHeight - FURNITURE) / PHONE.height))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Two of these screens are longer than a phone. Arriving part-way down one
  // because the last screen was scrolled would read as a broken screen.
  useEffect(() => {
    page.current?.scrollTo({ top: 0 })
  }, [at])

  useEffect(() => {
    if (!hint) return
    const t = setTimeout(() => setHint(false), 700)
    return () => clearTimeout(t)
  }, [hint])

  const tap = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest(HOTSPOT)) {
      e.preventDefault()
      if (!last) go(1)
    } else {
      setHint(true)
    }
  }

  // The set renders as a phone, the way it does in the frames row: this is a
  // 375-wide device, and a desktop row of three cards is not what it draws.
  const phoneSet = set.device === 'mobile' ? set : { ...set, device: 'mobile' as const }

  if (!current) return null

  const title = current.step.shortName ?? current.step.name

  return (
    <div
      className="proto"
      role="dialog"
      aria-modal="true"
      aria-label="Prototype"
      onClick={onClose}
    >
      <div className="proto__stage" onClick={(e) => e.stopPropagation()}>
        <div
          className="proto__phone"
          style={{ zoom: scale }}
          data-hint={hint || undefined}
        >
          {/* The device's own chrome, drawn at 1 rather than at a tile's
              scale — the same components the frames row puts around every
              screen, which is why they are the frames row's classes. */}
          <span className="jf__status" aria-hidden="true">
            <span className="jf__status-time">9:41</span>
            <span className="jf__status-island" />
            <span className="jf__status-levels">
              <img className="jf__status-cell" src={cellularIcon} alt="" />
              <img className="jf__status-wifi" src={wifiIcon} alt="" />
              <img className="jf__status-battery" src={batteryIcon} alt="" />
            </span>
          </span>

          <div className="proto__page" ref={page} onClick={tap}>
            {current.step.renderer === 'plans' ? (
              <CardSetView set={phoneSet} context={context} interactive={false} />
            ) : (
              <FlowStep step={current.step} state={current.state ?? 'default'} set={set} />
            )}
          </div>

          <span className="jf__chrome">
            <button
              type="button"
              className="jf__chrome-btn proto__back"
              disabled={first}
              aria-label="Back a screen"
              onClick={() => go(-1)}
            >
              <Icon svg={iconArtwork['chevron-left']} size={20} />
            </button>
            <span className="jf__url">
              <img className="jf__url-icon" src={siteSettingsIcon} alt="" />
              <span className="jf__url-text">dazn.com</span>
              <img className="jf__url-reload" src={reloadIcon} alt="" />
            </span>
            <span className="jf__chrome-btn jf__dots">•••</span>
          </span>
        </div>

        {/* Under the phone, not over it. The screen is the thing being shown;
            where you are in the flow is a caption on it. */}
        <div className="proto__bar">
          <button
            type="button"
            className="proto__step"
            disabled={first}
            aria-label="Back a screen"
            onClick={() => go(-1)}
          >
            <Icon svg={iconArtwork['chevron-left']} size={20} />
          </button>

          <span className="proto__where">
            <span className="proto__count">
              {at + 1} / {screens.length}
            </span>
            <span className="proto__name">
              {title}
              {current.state && <span className="proto__state"> · {current.state}</span>}
            </span>
          </span>

          {last ? (
            <button type="button" className="proto__restart" onClick={() => setAt(0)}>
              Start again
            </button>
          ) : (
            <button
              type="button"
              className="proto__step"
              aria-label="On a screen"
              onClick={() => go(1)}
            >
              <Icon svg={iconArtwork['chevron-right']} size={20} />
            </button>
          )}

          <button type="button" className="proto__close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
