import './journey.css'
import { statesOf, tabsOf } from '../rules/tabs'
import {
  LandingPageScreen,
  PhoneHat,
  SubscriptionFlowScreen,
  SubscriptionTabs,
} from '../components/flow/FlowScreens'
import { resolveFlow } from '../rules/layers'
import { HERO_ZOOM_MAX, HERO_ZOOM_MIN, heroOf } from '../rules/landing'
import heroArt from '../assets/landing/hero.jpg'
import { FocalDrag } from '../demo/FocalDrag'
import { useState } from 'react'

import { marketOf, type CardSet, type Context } from '../rules/content'
import type { Journey } from '../rules/journey'
import { knownAt, resolveJourney } from '../rules/journey'
import { resolveSet } from '../rules/resolve'
import { CardSetView } from './CardSetView'
import { FlowStep } from './FlowStep'

/**
 * Preview of the one step being edited, not the whole journey.
 *
 * Only the subscription step renders a real component. The rest show what is
 * known about them — their Figma frame, the values arriving from earlier steps,
 * their states and their runtime gates — so the journey stays legible before
 * those screens exist.
 */
export function StepPreview({
  journey,
  set,
  context,
  meta = true,
  onTab,
  onFocal,
  onZoom,
  onReset,
}: {
  journey: Journey
  set: CardSet
  context: Context
  /**
   * Whether to name the step and say where it sits in its journey.
   *
   * A product with one page has no journey to place it in: its name, "step 1
   * of 8" and the CTA it was entered from are all facts about a flow that is
   * not on screen, and the page is the only thing there is to look at. So the
   * whole line goes rather than being emptied out.
   */
  meta?: boolean
  /**
   * Told which tab is showing, because the panel beside this prices that tab.
   * The tab lives with the market and the cadence in the context rather than
   * in this component: it is another thing being looked at, and the editor has
   * to be looking at the same one.
   */
  onTab?: (tab: string) => void
  /**
   * Where the hero's picture is cropped from, when the preview is allowed to
   * move it. Absent and the handle is not offered at all — the walkthrough and
   * the tiles show the page, they do not edit it.
   */
  onFocal?: (x: number, y: number) => void
  /** How far into the picture the frame is, where that can be changed. */
  onZoom?: (zoom: number) => void
  /** Back to the middle and the whole picture, in one act. */
  onReset?: () => void
}) {
  /** Whether the picture is being moved right now, and which ways it can go. */
  const [framing, setFraming] = useState(false)
  const tabs = tabsOf(set)
  // A tab that has been renamed keeps its id, but one that has been removed has
  // not — so the chosen tab falls back to the first rather than to nothing.
  const tab = tabs.some((t) => t.id === context.tab) ? (context.tab as string) : (tabs[0]?.id ?? '')

  const steps = resolveJourney(journey, context)
  const step = steps.find((s) => s.id === set.stepId) ?? steps[0]
  if (!step) return <p className="jy__note">This journey has no steps in this market.</p>

  // The last state a step is drawn in — where the most has been filled in.
  const drawn = statesOf(step, set)
  const fullest = drawn[drawn.length - 1]

  const position = steps.indexOf(step) + 1
  // A partner storefront can carry a fourth card, and the row shows three.
  // Saying the number means a card scrolled out of view is still known about.
  const planCount = resolveSet(set, context).length
  const inbound = knownAt(journey, context, step.id)

  return (
    <div className="jy">
      {/* Lead with the step's own name. The entry CTA is quoted and labelled
          because a journey can enter from "Sign up" while a later step is also
          called Sign up — without that, the line reads as the wrong step.

          None of which a one-page product has anything to say about, so it
          draws no line at all rather than an empty one. */}
      {meta && (
        <p className="jy__entry">
          <strong className="jy__step-name">{step.shortName ?? step.name}</strong>
          <span className="jy__meta">
            step {position} of {steps.length} · entered from “{journey.entry.cta}”
          </span>
          {inbound.length > 0 && <span className="jy__seeds">inbound: {inbound.join(', ')}</span>}
          {step.renderer === 'plans' && (
            <span className="jy__meta">{planCount} plans in this set</span>
          )}
        </p>
      )}

      {/* Framing is done on the picture rather than in a field: you are
          choosing what stays in shot, and the shot is here. */}
      {step.renderer === 'landing' && onFocal && (
        <div className="jy__tools">
          <button
            type="button"
            className="jy__tool"
            data-on={framing || undefined}
            aria-pressed={framing}
            onClick={() => setFraming((v) => !v)}
          >
            <span className="jy__tool-mark" aria-hidden="true" />
            Adjust framing
          </button>
          {framing && onZoom && (
            <>
              <span className="jy__tools-split" aria-hidden="true" />
              <label className="jy__zoom">
                <span className="jy__zoom-name">Zoom</span>
                <input
                  type="range"
                  min={HERO_ZOOM_MIN}
                  max={HERO_ZOOM_MAX}
                  step={5}
                  value={heroOf(resolveFlow(set).landing).zoom}
                  onChange={(e) => onZoom(Number(e.target.value))}
                  aria-label="How far into the picture"
                />
                <span className="jy__zoom-read">{heroOf(resolveFlow(set).landing).zoom}%</span>
              </label>
            </>
          )}
          <span className="jy__tools-split" aria-hidden="true" />
          <button type="button" className="jy__tool" onClick={() => onReset?.()}>
            Reset
          </button>
        </div>
      )}
      {step.renderer === 'landing' ? (
        /* The whole page, which the edit view scrolls. The tiles and the
           walkthrough keep drawing the hero alone: that is the screen a phone
           opens on, and a tile of a 7412px page is a tile of nothing. */
        /* The lid, what stands under it, and the label under that — a
           laptop is three things and a phone is one, so the stage holds them
           and the shell is only ever the lid. */
        <div className="jy__stage" data-device={set.device}>
        <div className="jy__shell" data-device={set.device}>
          {/* The phone's, not the page's: held by the frame, so the page can
              scroll and bounce under it without taking it along. Only a phone
              has one — a desktop has a browser around it instead, and nothing
              here draws the browser. */}
          {set.device === 'mobile' && (
            <div className="jy__phone-hat">
              <PhoneHat />
            </div>
          )}
          <div className="jy__viewport" data-device={set.device} data-page="">
            <LandingPageScreen
              content={resolveFlow(set).landing}
              market={marketOf(set)}
              device={set.device}
              overArt={
                framing && onFocal ? (
                  <FocalDrag
                    focalX={heroOf(resolveFlow(set).landing).focalX}
                    focalY={heroOf(resolveFlow(set).landing).focalY}
                    onDrag={onFocal}
                    /* The picture as drawn — the uploaded one, or the shipped one
                       it stands in for. What can move depends on which. */
                    src={heroOf(resolveFlow(set).landing).image || heroArt}
                    zoom={heroOf(resolveFlow(set).landing).zoom}
                  />
                ) : undefined
              }
            >
              {/* The picker the page carries is the one the Subscription step
                  edits — its tabs and its cards, not a second drawing of them.
                  Rename a tab there and it reads the same here. */}
              <div className="fl-page__plans-tabs">
                <SubscriptionTabs tabs={tabs} tab={tab} onTab={(next) => onTab?.(next)} />
              </div>
              <CardSetView set={set} context={context} tab={tab} />
            </LandingPageScreen>
          </div>
        </div>
          {/* The hinge and the base, under the lid rather than inside it —
              which is where they are on a laptop, and the whole of what makes
              the shape read as one. Nothing on a phone. */}
          {set.device !== 'mobile' && (
            <>
              <span className="jy__hinge" aria-hidden="true" />
              <span className="jy__base" aria-hidden="true" />
            </>
          )}
        </div>
      ) : step.renderer === 'plans' ? (
        <div className="jy__viewport" data-device={set.device}>
          {/* The same screen the phone draws. The panel beside this edits its
              title and its tabs, and both have to show here or the editor is
              writing into the dark. */}
          <SubscriptionFlowScreen
            title={resolveFlow(set).plans.navTitle}
            tabs={tabs}
            tab={tab}
            onTab={(next) => onTab?.(next)}
          />
          {/* Beside the screen, not inside it. The row is wider than a phone
              here, and a screen that ends halfway along it draws its edge
              through whichever card that lands on. */}
          <div className="fl-sub__cards">
            <CardSetView set={set} context={context} tab={tab} />
          </div>
        </div>
      ) : step.renderer !== 'stub' ? (
        /* One screen, not every state side by side.
           A step's states are one screen at different points of being used —
           the same fields empty, then typed into, then confirmed — and the
           panel beside this edits the words on all of them at once. Three
           copies of one screen is three places to look for the line you are
           editing. The row is where the stages belong, and it still draws
           every one of them.

           The state drawn is the last, because it is the furthest the screen
           gets: everything that can be filled in is, so every line the panel
           can edit is on screen to be found. */
        <div className="jy__viewport" data-device={set.device}>
          <div className="jy__screens">
            <div className="jy__screen">
              <FlowStep step={step} state={fullest ?? 'default'} set={set} />
              <span className="jy__screen-name">{fullest}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="jy__placeholder jy__placeholder--solo">
          <p className="jy__frame">{step.figmaFrame}</p>
          {step.states && (
            <p className="jy__states">
              {step.states.length} states: {step.states.join(' → ')}
            </p>
          )}
          {step.requires && (
            <ul className="jy__requires">
              {step.requires.map((r) => (
                <li key={r}>
                  <code>{r}</code>
                </li>
              ))}
            </ul>
          )}
          {step.note && <p className="jy__note">{step.note}</p>}
          <p className="jy__todo">Placeholder — this screen isn’t built yet.</p>
        </div>
      )}
    </div>
  )
}
