import './hero.css'

import type { ReactNode } from 'react'
import { safeZoneOf, type DeviceId, type FrameKind, type HeroMetrics } from './devices'

/**
 * The pieces of the hero studio, brought over to be looked at.
 *
 * Each one is a port of a file in `dazn-lab` — the file it came from is named
 * above it — with two things changed and nothing else:
 *
 *   the styling   Tailwind classes against that project's theme become this
 *                 project's CSS and tokens, in `hero.css`
 *   the seams     anything that reached into its store, its copy library or
 *                 its i18n was cut; these draw what they are handed
 *
 * The geometry is theirs: the proportions, the clamps, the way a phone's
 * radius is a twelfth of its width. That is the part worth having.
 */

/* ── DeviceFrame.tsx — the shells, drawn rather than pictured ───────────── */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export function DeviceFrame({
  kind,
  width,
  height,
  children,
}: {
  kind: FrameKind
  width: number
  height: number
  children: ReactNode
}) {
  if (kind === 'tv') {
    const pad = clamp(width * 0.012, 6, 14)
    return (
      <div className="hp-frame hp-frame--tv">
        <div className="hp-frame__bezel" style={{ padding: pad, paddingBottom: pad * 1.4, borderRadius: pad + 8 }}>
          <Screen width={width} height={height} radius={6}>
            {children}
          </Screen>
        </div>
        <div className="hp-frame__neck" style={{ inlineSize: width * 0.06, blockSize: clamp(height * 0.05, 10, 40) }} />
        <div className="hp-frame__foot" style={{ inlineSize: width * 0.26, blockSize: clamp(width * 0.012, 6, 12) }} />
      </div>
    )
  }

  if (kind === 'laptop') {
    const pad = clamp(width * 0.018, 8, 18)
    const baseH = clamp(width * 0.02, 10, 20)
    return (
      <div className="hp-frame hp-frame--laptop">
        <div className="hp-frame__bezel" style={{ padding: pad, paddingBottom: pad * 1.6, borderRadius: 14 }}>
          <Screen width={width} height={height} radius={6}>
            {children}
          </Screen>
        </div>
        <div className="hp-frame__deck" style={{ inlineSize: width * 1.12, blockSize: baseH }}>
          <span className="hp-frame__hinge" style={{ inlineSize: width * 0.16, blockSize: baseH * 0.42 }} />
        </div>
      </div>
    )
  }

  if (kind === 'tablet') {
    const pad = clamp(width * 0.045, 12, 26)
    const radius = clamp(width * 0.06, 22, 42)
    return (
      <div className="hp-frame hp-frame--tablet hp-frame__bezel" style={{ padding: pad, borderRadius: radius }}>
        <span
          className="hp-frame__lens"
          style={{ insetBlockStart: pad * 0.35, inlineSize: clamp(width * 0.012, 5, 9), blockSize: clamp(width * 0.012, 5, 9) }}
        />
        <Screen width={width} height={height} radius={radius - pad * 0.6}>
          {children}
        </Screen>
      </div>
    )
  }

  const pad = clamp(width * 0.05, 9, 16)
  const radius = clamp(width * 0.12, 30, 56)
  const notchH = clamp(width * 0.05, 14, 26)
  return (
    <div className="hp-frame hp-frame--phone hp-frame__bezel" style={{ padding: pad, borderRadius: radius }}>
      {/* The buttons down the sides: two on the left, one on the right. */}
      <span className="hp-frame__key" data-side="left" style={{ insetBlockStart: height * 0.18, blockSize: height * 0.06 }} />
      <span className="hp-frame__key" data-side="left" style={{ insetBlockStart: height * 0.27, blockSize: height * 0.1 }} />
      <span className="hp-frame__key" data-side="right" style={{ insetBlockStart: height * 0.22, blockSize: height * 0.13 }} />
      <div className="hp-frame__screen-wrap">
        <Screen width={width} height={height} radius={radius - pad * 0.7}>
          {children}
        </Screen>
        <span
          className="hp-frame__notch"
          style={{ inlineSize: width * 0.42, blockSize: notchH, borderEndStartRadius: notchH, borderEndEndRadius: notchH }}
        />
      </div>
    </div>
  )
}

function Screen({ width, height, radius, children }: { width: number; height: number; radius: number; children: ReactNode }) {
  return (
    <div className="hp-frame__screen" style={{ inlineSize: width, blockSize: height, borderRadius: radius }}>
      {children}
    </div>
  )
}

/* ── HeroIndicators.tsx — the carousel dots ─────────────────────────────── */

/**
 * Small dim circles, and a wider pill for the one you are on: a bright leading
 * knob and a dimmer track, drawn as one gradient rather than two elements.
 * Sized in the hero's own pixels, so it reads small on a phone and large on a
 * television without being told which it is on.
 */
export function HeroIndicators({
  count,
  activeIndex,
  dotSize = 6,
}: {
  count: number
  activeIndex: number
  dotSize?: number
}) {
  if (count < 1) return null
  const unit = dotSize
  const activeW = Math.round(unit * 4)
  const knob = (unit / activeW) * 100

  return (
    <div className="hp-dots" style={{ gap: Math.round(unit * 1.1) }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIndex
        return (
          <span
            key={i}
            className="hp-dot"
            data-on={active || undefined}
            style={{
              inlineSize: active ? activeW : unit,
              blockSize: unit,
              background: active
                ? `linear-gradient(90deg, #f4f5f6 0, #f4f5f6 ${knob}%, rgb(255 255 255 / 34%) ${knob}%, rgb(255 255 255 / 34%) 100%)`
                : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

/* ── HeroNavigation.tsx — the bar along the bottom ──────────────────────── */

const NAV_ITEMS = ['Home', 'Schedule', 'For You', 'Sports', 'Rentals']

/**
 * What the app's own navigation takes out of the bottom of the hero. It is a
 * demonstration rather than a working nav: what it is for is showing how much
 * room is left above it.
 */
export function HeroNavigation({ metrics }: { metrics: HeroMetrics }) {
  const fontSize = Math.max(11, metrics.navHeight * 0.26)
  const items = metrics.navHeight < 56 ? NAV_ITEMS.slice(0, 4) : NAV_ITEMS
  return (
    <nav className="hp-nav" style={{ blockSize: metrics.navHeight }} aria-label="Secondary navigation (demonstration)">
      {items.map((item, i) => (
        <span key={item} className="hp-nav__item" data-on={i === 0 || undefined} style={{ fontSize }}>
          {item}
        </span>
      ))}
    </nav>
  )
}

/* ── HeroChrome.tsx — what sits over the top of it ──────────────────────── */

/** The phone's own status bar: the time, and the three little indicators. */
export function HeroStatusBar({ metrics, transparent }: { metrics: HeroMetrics; transparent?: boolean }) {
  const fs = Math.max(13, metrics.topInset * 0.3)
  return (
    <div
      className="hp-status"
      data-clear={transparent || undefined}
      style={{ blockSize: metrics.topInset, fontSize: fs }}
      aria-hidden="true"
    >
      <span>9:41</span>
      <span className="hp-status__right">
        <span className="hp-status__bars">
          {[4, 6, 8, 10].map((h) => (
            <i key={h} style={{ blockSize: h }} />
          ))}
        </span>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M1 4c4-4 10-4 14 0M4 7c2.4-2.2 5.6-2.2 8 0M7 10c.7-.6 1.3-.6 2 0" />
        </svg>
        <span className="hp-status__battery">
          <i />
        </span>
      </span>
    </div>
  )
}

/** The web page's own header, for the views that have one. */
export function HeroWebHeader({ metrics }: { metrics: HeroMetrics }) {
  const fs = Math.max(11, metrics.topInset * 0.3)
  return (
    <div className="hp-web" style={{ blockSize: metrics.topInset }} aria-hidden="true">
      <span className="hp-web__menu">
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ inlineSize: fs * 1.3 }} />
        ))}
      </span>
      <span className="hp-web__mark" style={{ fontSize: fs }}>
        DAZN
      </span>
      <span className="hp-web__avatar" style={{ inlineSize: fs * 1.5, blockSize: fs * 1.5 }} />
    </div>
  )
}

/* ── SafeZoneOverlay.tsx — where the words must stay ────────────────────── */

/**
 * The margin a banner's words have to stay inside. Drawn as a dashed box over
 * the hero, with the device's own figures: a television is the strict one,
 * because a real set takes the edges.
 */
export function SafeZoneOverlay({ device }: { device: DeviceId }) {
  const zone = safeZoneOf(device)
  return (
    <div
      className="hp-safe"
      aria-hidden="true"
      style={{
        insetBlockStart: `${zone.top * 100}%`,
        insetBlockEnd: `${zone.bottom * 100}%`,
        insetInlineStart: `${zone.left * 100}%`,
        insetInlineEnd: `${zone.right * 100}%`,
      }}
    >
      <span className="hp-safe__label">safe area</span>
    </div>
  )
}

/* ── HeroBackground.tsx — the picture, and where it is looking ──────────── */

/**
 * The picture behind a banner, held at a focal point rather than centred.
 *
 * Their version reads a table of per-placement transforms — one entry per ad
 * placement they ship to — and this keeps the part that matters here: the
 * picture fills the frame, the crop hangs off a point somebody chose, and a
 * scrim runs up from the bottom so words can sit on it.
 */
export function HeroBackground({
  src,
  focalX = 50,
  focalY = 50,
  scrim = true,
}: {
  src: string
  /** Where the crop hangs from, as a percentage of the picture. */
  focalX?: number
  focalY?: number
  scrim?: boolean
}) {
  return (
    <div className="hp-bg" aria-hidden="true">
      <img src={src} alt="" style={{ objectPosition: `${focalX}% ${focalY}%` }} />
      {scrim && <span className="hp-bg__scrim" />}
    </div>
  )
}
