import './hero.css'
import './gallery.css'

import { useState } from 'react'
import heroArt from '../assets/landing/hero.jpg'
import { DEVICES, deviceOf, metricsOf, type DeviceId } from './devices'
import { FocalDrag } from '../demo/FocalDrag'
import {
  DeviceFrame,
  HeroBackground,
  HeroIndicators,
  HeroNavigation,
  HeroStatusBar,
  HeroWebHeader,
  SafeZoneOverlay,
} from './HeroPieces'

/**
 * The hero studio's pieces, at /hero, to be looked at before any of them is
 * taken up.
 *
 * Nothing else in the tool imports these: this page and the two files beside
 * it are the whole of it, so choosing none of them is deleting a directory.
 *
 * Each card says where the piece came from, what it does, and — where we
 * already have something doing that job — what it would be replacing. That
 * last line is the one worth reading: several of these overlap what the
 * landing page already draws, and the question is not whether they are good
 * but whether they are better than what is there.
 */

interface Piece {
  id: string
  name: string
  from: string
  lines: number
  what: string
  /** What this project already has doing that job, if anything. */
  instead?: string
  render: (device: DeviceId) => React.ReactNode
}

const PIECES: Piece[] = [
  {
    id: 'frame',
    name: 'Device frames',
    from: 'preview/DeviceFrame.tsx',
    lines: 123,
    what: 'A television, a laptop, a tablet and a phone, drawn in CSS rather than pictured — bezel, stand, hinge, notch and side keys, every proportion derived from the screen it is holding.',
    instead:
      'The tool draws one phone: 375 × 812 with a 20 radius and a 2px outline, in .proto__phone and .jf__tile. It has no other device.',
    render: (device) => {
      const d = deviceOf(device)
      const scale = Math.min(300 / d.width, 220 / d.height)
      return (
        <div className="hg-scale" style={{ blockSize: d.height * scale + 40 }}>
          <div className="hg-scale__inner" style={{ transform: `scale(${scale})` }}>
            <DeviceFrame kind={d.frame} width={d.width} height={d.height}>
              <img className="hg-shot" src={heroArt} alt="" />
            </DeviceFrame>
          </div>
        </div>
      )
    },
  },
  {
    id: 'safe',
    name: 'Safe area',
    from: 'preview/SafeZoneOverlay.tsx',
    lines: 74,
    what: 'The margin a banner’s words have to stay inside, per device, as fractions of the screen. A television is the strict one, because a real set takes the edges.',
    instead: 'Nothing. The tool has no notion of a safe area.',
    render: (device) => (
      <div className="hg-screen" data-device={device}>
        <HeroBackground src={heroArt} focalX={50} focalY={35} />
        <SafeZoneOverlay device={device} />
      </div>
    ),
  },
  {
    id: 'chrome',
    name: 'Status bar and web header',
    from: 'hero/HeroChrome.tsx',
    lines: 124,
    what: 'What sits over the top of a hero: the phone’s own status bar, or a web page’s header. Both are sized from the device’s top inset rather than fixed.',
    instead:
      'The tool draws a status bar in .jf__status — a time and three imported icons — and a browser bar under the screen. This one is drawn rather than imported, and comes in a web flavour too.',
    render: (device) => {
      const m = metricsOf(device)
      return (
        <div className="hg-screen" data-device={device}>
          <HeroBackground src={heroArt} focalY={40} />
          <HeroStatusBar metrics={m} />
          <div className="hg-screen__spacer" style={{ blockSize: m.topInset + 12 }} />
          <HeroWebHeader metrics={{ ...m, topInset: m.topInset }} />
        </div>
      )
    },
  },
  {
    id: 'nav',
    name: 'Bottom navigation',
    from: 'hero/HeroNavigation.tsx',
    lines: 43,
    what: 'What the app’s own navigation takes out of the bottom of a hero. A demonstration rather than a working nav: the point of it is the room it leaves above.',
    instead: 'Nothing. The landing page has no app chrome at the foot.',
    render: (device) => (
      <div className="hg-screen" data-device={device}>
        <HeroBackground src={heroArt} focalY={35} />
        <HeroNavigation metrics={metricsOf(device)} />
      </div>
    ),
  },
  {
    id: 'dots',
    name: 'Carousel indicators',
    from: 'hero/HeroIndicators.tsx',
    lines: 68,
    what: 'Dim circles for the slides you are not on, and a wider pill for the one you are: a bright leading knob and a dim track, drawn as one gradient. Sized in the hero’s own pixels, so it reads small on a phone and large on a television.',
    instead:
      'The landing hero had dots once and they were removed. If the hero becomes a carousel, this is the drawing to use.',
    render: (device) => (
      <div className="hg-screen" data-device={device}>
        <HeroBackground src={heroArt} focalY={35} />
        <div className="hg-dots-slot">
          <HeroIndicators count={4} activeIndex={1} dotSize={metricsOf(device).dotSize} />
        </div>
      </div>
    ),
  },
  {
    id: 'drag',
    name: 'Adjust the frame',
    from: 'preview/FocalDragLayer.tsx',
    lines: 55,
    what: 'Drag the picture to say what the crop hangs from. The pointer’s travel is read as a percentage of the frame rather than in pixels, so it works at whatever size the preview is drawn at, and dragging right reveals what is off to the left — the picture follows the hand.',
    instead:
      'Nothing. A picture uploaded to the hero, the image card or a feature row is cropped to the middle and stays there.',
    render: () => <FrameAdjuster />,
  },
  {
    id: 'bg',
    name: 'Picture with a focal point',
    from: 'hero/HeroBackground.tsx',
    lines: 160,
    what: 'The picture behind a banner, cropped around a point somebody chose rather than around its middle, with a scrim up from the bottom for the words to sit on.',
    instead:
      'The landing hero crops to the middle and lays a four-stop wash over it. A focal point is what stops a face leaving the frame when the crop changes.',
    render: (device) => (
      <div className="hg-focals">
        {[
          { x: 20, y: 30, label: 'left' },
          { x: 50, y: 35, label: 'centre' },
          { x: 80, y: 30, label: 'right' },
        ].map((f) => (
          <figure className="hg-focal" key={f.label}>
            <div className="hg-screen hg-screen--small" data-device={device}>
              <HeroBackground src={heroArt} focalX={f.x} focalY={f.y} />
            </div>
            <figcaption>
              {f.label} · {f.x}% {f.y}%
            </figcaption>
          </figure>
        ))}
      </div>
    ),
  },
  {
    id: 'sidebar',
    name: 'The studio’s left editor',
    from: 'studio/EditorSidebar.tsx + 6 control files',
    lines: 1029,
    what: 'Their editing rail: Creative, Logo, Content, Offer and Mobile CTA as collapsible sections, each with its own AI menu. Every one of them reads their store and their i18n, so this is the one thing on this page that cannot be lifted — it is an application, not a drawing.',
    instead:
      'The Hero banner tab, built from the same design: Picture, Copy, CTA, Price and Logo. What theirs has that ours does not is listed below.',
    render: () => (
      <div className="hg-sidebar">
        {[
          ['Creative controls', 120, 'The picture, its scene prompt and the AI that generates one.'],
          ['Logo controls', 50, 'Which logo, and how big. We have this.'],
          ['Content controls', 380, 'Label, heading, body, and the character budgets. We have this.'],
          ['Offer controls', 101, 'The offer the banner carries — price, intro, add-on.'],
          ['Mobile CTA controls', 149, 'What the button says on a phone, apart from the desktop one.'],
          ['Price controls', 126, 'The price block. We have this.'],
          ['Editor sidebar', 103, 'The rail that holds them, with a section per group.'],
        ].map(([name, lines, note]) => (
          <div className="hg-sidebar__row" key={name as string}>
            <span className="hg-sidebar__name">{name}</span>
            <span className="hg-sidebar__lines">{lines} lines</span>
            <span className="hg-sidebar__note">{note}</span>
          </div>
        ))}
      </div>
    ),
  },
]

/**
 * The drag, wired to somewhere to keep the two numbers.
 *
 * In the studio that is their store; here it is this component, which is the
 * point of the port — the piece does not care where the focal point lives.
 */
function FrameAdjuster() {
  const [focal, setFocal] = useState({ x: 50, y: 35 })
  return (
    <div className="hg-adjust">
      <div className="hg-screen hg-screen--small">
        <HeroBackground src={heroArt} focalX={focal.x} focalY={focal.y} scrim={false} />
        <FocalDrag focalX={focal.x} focalY={focal.y} onDrag={(x, y) => setFocal({ x, y })} />
      </div>
      <div className="hg-adjust__read">
        <p>
          <strong>{Math.round(focal.x)}%</strong> across, <strong>{Math.round(focal.y)}%</strong> down
        </p>
        <button type="button" className="hg-adjust__reset" onClick={() => setFocal({ x: 50, y: 35 })}>
          Back to the middle
        </button>
        <small>Drag the picture. The crop hangs from the point, so the same picture can be framed differently on each device.</small>
      </div>
    </div>
  )
}

export function HeroGallery() {
  const [device, setDevice] = useState<DeviceId>('mobile')
  const [taken, setTaken] = useState<string[]>([])

  const toggle = (id: string) =>
    setTaken((was) => (was.includes(id) ? was.filter((x) => x !== id) : [...was, id]))

  return (
    <main className="hg">
      <header className="hg__head">
        <div>
          <h1 className="hg__title">Pieces from the hero studio</h1>
          <p className="hg__lede">
            Six drawings ported out of <code>dazn-lab</code> — 15 files and 1,812 lines, none of
            which touches its store, its copy library or its AI. Styling is this project’s; the
            geometry is theirs. Nothing here is wired into the tool: tick what is worth keeping.
          </p>
        </div>
        <div className="hg__devices" role="radiogroup" aria-label="Device">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={device === d.id}
              className="hg__device"
              data-on={device === d.id || undefined}
              onClick={() => setDevice(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      <p className="hg__device-note">{deviceOf(device).note}</p>

      <div className="hg__list">
        {PIECES.map((piece) => (
          <section className="hg-card" key={piece.id} data-taken={taken.includes(piece.id) || undefined}>
            <header className="hg-card__head">
              <h2 className="hg-card__name">{piece.name}</h2>
              <label className="hg-card__take">
                <input type="checkbox" checked={taken.includes(piece.id)} onChange={() => toggle(piece.id)} />
                Keep this
              </label>
            </header>
            <p className="hg-card__what">{piece.what}</p>
            {piece.instead && (
              <p className="hg-card__instead">
                <strong>Already here:</strong> {piece.instead}
              </p>
            )}
            <div className="hg-card__stage">{piece.render(device)}</div>
            <p className="hg-card__from">
              <code>{piece.from}</code> · {piece.lines} lines
            </p>
          </section>
        ))}
      </div>

      <footer className="hg__foot">
        {taken.length === 0 ? (
          <p>Nothing ticked yet.</p>
        ) : (
          <p>
            <strong>{taken.length} ticked:</strong>{' '}
            {taken.map((id) => PIECES.find((p) => p.id === id)?.name).join(', ')}. Tell me these and
            I will wire them in; the rest of this directory can go.
          </p>
        )}
      </footer>
    </main>
  )
}
