import '../App.css'
import './demo.css'

import { useState } from 'react'
import { StepPreview } from '../card/StepPreview'
import { Assistant } from '../editor/Assistant'
import { useCardSet } from '../editor/useCardSet'
import { planJourney } from '../rules/journey'
import { summarise, validateAll } from '../rules/validate'
import { Stage1 } from './Stage1'
import { Stage2 } from './Stage2'
import { JourneyFrames } from './JourneyFrames'

/**
 * The redesigned interface, at /demo.
 *
 * Two stages rather than one long form. Stage one asks which situation is
 * being authored for; stage two edits one step of the journey that answers.
 * The old interface stays at / until this one earns the swap.
 */
export function DemoApp() {
  const store = useCardSet()
  const [editing, setEditing] = useState(false)

  const planned = planJourney(store.journey, store.context)
  const steps = planned.filter((p) => !p.skipped).map((p) => p.step)
  const step = steps.find((s) => s.id === store.set.stepId) ?? steps[0]
  const coverage = summarise(validateAll(store.set))

  const openStep = (id: string) => {
    store.updateSet({ stepId: id })
    setEditing(true)
  }

  return (
    <main className="page demo">
      <div className="page__split">
        <div className="demo__panel">
          <header className="demo__brand">
            <span className="demo__title">Acquisition model</span>
            <span className="demo__beta">BETA</span>
          </header>

          {editing ? (
            <>
              <button type="button" className="demo__back" onClick={() => setEditing(false)}>
                ‹ {store.journey.name} — {step?.shortName ?? step?.name}
              </button>
              <p className="demo__scope">
                {store.context.market === '*' ? 'Base — all markets' : store.context.market} ·{' '}
                {store.context.channel} · {store.context.cadence}
              </p>
              <div className="demo__fields">
                <Stage2 store={store} />
              </div>
            </>
          ) : (
            <>
              <Assistant store={store} />
              <div className="demo__fields">
                <Stage1 store={store} />
              </div>
            </>
          )}
        </div>

        <div className="demo__preview">
          <div className="demo__statusbar">
            <span className="demo__gate" data-state={coverage.failing.length ? 'blocked' : 'clear'}>
              {coverage.failing.length
                ? `Publish blocked — ${coverage.failing.length} of ${coverage.total} contexts failing`
                : `Publish ready — ${coverage.total} contexts checked`}
            </span>
          </div>

          {editing && step ? (
            <StepPreview journey={store.journey} set={store.set} context={store.context} />
          ) : (
            <JourneyFrames
              planned={planned}
              selectedId={step?.id ?? ''}
              onOpen={openStep}
            />
          )}
        </div>
      </div>
    </main>
  )
}
