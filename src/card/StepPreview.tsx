import './journey.css'
import { useState } from 'react'
import { statesOf, tabsOf } from '../rules/tabs'
import { SubscriptionTabs } from '../components/flow/FlowScreens'

import type { CardSet, Context } from '../rules/content'
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
}: {
  journey: Journey
  set: CardSet
  context: Context
}) {
  const tabs = tabsOf(set)
  const [openTab, setOpenTab] = useState('')
  // A tab that has been renamed keeps its id, but one that has been removed has
  // not — so the chosen tab falls back to the first rather than to nothing.
  const tab = tabs.some((t) => t.id === openTab) ? openTab : (tabs[0]?.id ?? '')

  const steps = resolveJourney(journey, context)
  const step = steps.find((s) => s.id === set.stepId) ?? steps[0]
  if (!step) return <p className="jy__note">This journey has no steps in this market.</p>

  const position = steps.indexOf(step) + 1
  // A partner storefront can carry a fourth card, and the row shows three.
  // Saying the number means a card scrolled out of view is still known about.
  const planCount = resolveSet(set, context).length
  const inbound = knownAt(journey, context, step.id)

  return (
    <div className="jy">
      {/* Lead with the step's own name. The entry CTA is quoted and labelled
          because a journey can enter from "Sign up" while a later step is also
          called Sign up — without that, the line reads as the wrong step. */}
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

      {step.renderer === 'plans' ? (
        <div className="jy__viewport" data-device={set.device}>
          {/* The same control the phone draws. The tabs editor sits in the
              panel beside this, and a tab added or renamed there has to show
              here or the editor is writing into the dark. */}
          <SubscriptionTabs tabs={tabs} tab={tab} onTab={setOpenTab} />
          <CardSetView set={set} context={context} tab={tab} />
        </div>
      ) : step.renderer !== 'stub' ? (
        /* Every state the step is drawn in, side by side — the same shape the
           plans step takes, and the same shape the Figma section lays out. */
        <div className="jy__viewport" data-device={set.device}>
          <div className="jy__screens">
            {statesOf(step, set).map((state) => (
              <div className="jy__screen" key={state}>
                <FlowStep step={step} state={state ?? 'default'} set={set} />
                <span className="jy__screen-name">{state}</span>
              </div>
            ))}
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
