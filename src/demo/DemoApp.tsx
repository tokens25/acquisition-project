import '../App.css'
import './demo.css'
import './fields.css'
import './pipeline/pipeline.css'

import { useEffect, useMemo, useState } from 'react'
import daznLogo from '../assets/brand/logo-dazn.svg?raw'
import { StepPreview } from '../card/StepPreview'
import { Icon } from '../components/Icon'
import { useCardSet } from '../editor/useCardSet'
import { planJourney } from '../rules/journey'
import { summarise, validateAll } from '../rules/validate'
import { Button } from '../components/Button'
import { DefaultPanel } from './DefaultPanel'
import { EditPanel } from './EditPanel'
import { FlowPanel } from './FlowPanel'
import { UserFlow } from './UserFlow'
import { iconArtwork } from '../card/assets'
import { JourneyFrames } from './JourneyFrames'
import { Prototype } from './Prototype'
import type { Mode } from '../rules/pipeline'
import { changeMap } from '../rules/pipeline'
import { FieldMarks } from '../components/fieldMarks'
import { DevStrings } from './pipeline/DevStrings'
import { ModeToggle } from './pipeline/ModeToggle'
import { SectionMarker } from './pipeline/SectionMarker'
import { StatusChip } from './pipeline/StatusChip'
import { usePipeline } from './pipeline/usePipeline'

/**
 * The redesigned interface, at /demo.
 *
 * Two views rather than one long form. The default view asks which situation is
 * being authored for; the edit view edits one step of the journey that answers.
 * The old interface stays at / until this one earns the swap.
 */
export function DemoApp() {
  const store = useCardSet()
  const [editing, setEditing] = useState(false)
  const [prototype, setPrototype] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const planned = planJourney(store.journey, store.context)
  const steps = planned.filter((p) => !p.skipped).map((p) => p.step)
  const step = steps.find((s) => s.id === store.set.stepId) ?? steps[0]
  const coverage = summarise(validateAll(store.set))

  /* ── Market / Dev handoff ──
     Flow sections are named after their steps, as the journey names them. */
  const stepLabels = useMemo(
    () => Object.fromEntries(store.journey.steps.map((s) => [s.id, s.shortName ?? s.name])),
    [store.journey],
  )
  const pipe = usePipeline(store, stepLabels)
  const dev = pipe.mode === 'dev'

  /* Dev sees only the pages Market has marked ready. Market sees everything. */
  const shown = dev ? planned.filter((p) => pipe.doc.ready[p.step.id]) : planned
  const hiddenSteps = planned.length - shown.length
  const readyCount = Object.keys(pipe.doc.ready).length

  const section = step ? pipe.section(step.id) : undefined
  /** Each field's change since dev received it, for the field to show itself. */
  const marks = useMemo(
    () => (dev || !section ? new Map() : changeMap(pipe.doc, section)),
    [dev, section, pipe.doc],
  )
  const chipFor = (id: string) => {
    const s = pipe.section(id)
    return s ? <StatusChip section={s} pipe={pipe} compact /> : null
  }

  const switchMode = (mode: Mode) => {
    pipe.setMode(mode)
    // Whatever field had focus loses it: in Dev nothing is editable, and a
    // caret left blinking in a field that no longer exists is a lie.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    if (mode === 'dev' && editing && step && !pipe.doc.ready[step.id]) setEditing(false)
  }

  // Shift+D flips the mode, unless the keystroke is going into a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      switchMode(dev ? 'market' : 'dev')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const openStep = (id: string) => {
    store.updateSet({ stepId: id })
    setEditing(true)
  }

  /**
   * What the gate says, and the colour it says it in: whether every context
   * the set is sold in still passes the rules.
   */
  const gate =
    coverage.failing.length > 0
      ? {
          state: 'blocked' as const,
          text: `${coverage.failing.length} of ${coverage.total} contexts failing`,
        }
      : { state: 'clear' as const, text: `${coverage.total} contexts checked` }

  const actions = editing ? (
    <div className="demo__actions">
      <ModeToggle mode={pipe.mode} onChange={switchMode} />
    </div>
  ) : (
    <div className="demo__actions">
      {/* Icon only. The label is carried by the tooltip and the accessible
          name instead, so the toolbar reads as controls rather than as a
          sentence competing with the gate to its left. */}
      <Button
        appearance="tertiary"
        size="md"
        iconBefore={<Icon svg={iconArtwork.download} size={16} />}
        aria-label="Export JSON"
        title="Export JSON — downloads the content as this app stores it, not yet the shape the rule engine reads."
        onClick={store.exportJson}
      />

      <Button
        appearance="secondary"
        size="md"
        iconBefore={<Icon svg={iconArtwork.preview} size={16} />}
        title="Walk the journey at full size, one screen at a time"
        onClick={() => setPrototype(true)}
      >
        Preview
      </Button>

      <ModeToggle mode={pipe.mode} onChange={switchMode} />
    </div>
  )

  // The brand strip carries the collapse control, so it has to survive the

  // collapse — it moves into the top bar rather than disappearing with the
  // panel it closes.
  const brand = (
    <header className="demo__brand">
      <span className="demo__mark">
        <Icon svg={daznLogo} size={24} />
      </span>
      <h1 className="demo__title">Acquisition model</h1>
      <span className="demo__beta">BETA</span>
      <button
        type="button"
        className="demo__collapse"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Open the panel' : 'Close the panel'}
        title={collapsed ? 'Open the panel' : 'Close the panel'}
        onClick={() => setCollapsed((v) => !v)}
      >
        <Icon svg={iconArtwork['panel-collapse']} size={24} />
      </button>
    </header>
  )

  return (

    <main className="page demo" data-collapsed={collapsed || undefined}>
      {/* The bar spans the window and never moves. Collapsing the panel
          resizes the row beneath it, so the preview opens leftward without
          dragging the status of the whole set along with it. */}
      <div className="demo__top" data-mode={pipe.mode}>
        {brand}
        <div className="demo__statusbar">
          {/* The gate reports where the content stands, which in edit mode is
              a step in the review rather than a verdict on publishing. */}
          <span className="demo__gate" data-state={gate.state}>
            {gate.text}
          </span>
          {actions}
        </div>
      </div>
      {dev && readyCount > 0 && (
        <p className="pl-devline">
          Dev mode · showing {readyCount} page{readyCount === 1 ? '' : 's'} marked ready for dev
          · {pipe.sections.length - readyCount} hidden until Market marks them
        </p>
      )}

      <div className="demo__body">
        <div className="demo__rail">
        <div className="demo__panel">

          {editing ? (
            <>
              {/* The arrow is the way back, and only the arrow. The trail it
                  used to carry — journey name, then step name — said where you
                  were twice over, when the panel below already only makes sense
                  for one step. What is left is the step's own title, which is
                  a heading rather than a control. */}
              <div className="demo__head">
                <button
                  type="button"
                  className="demo__back"
                  onClick={() => setEditing(false)}
                  aria-label="Back to the journey"
                >
                  <Icon svg={iconArtwork['chevron-left']} size={20} />
                </button>
                <h2 className="demo__step-title">{step?.shortName ?? step?.name}</h2>
                {section && (
                  <span className="pl-head-chip">
                    <StatusChip section={section} pipe={pipe} />
                  </span>
                )}
              </div>
              {/* The panel follows the step. A flow screen is copy from
                  end to end, and the card set's groups would have nothing to
                  say about it. */}
              <div className="demo__fields">
                {dev ? (
                  /* Dev reads: every string of the page, its key, and a button
                     to take it. Nothing here writes. */
                  section ? (
                    <section className="demo__group">
                      <h3 className="demo__group-title">Strings</h3>
                      <DevStrings section={section} />
                    </section>
                  ) : (
                    <p className="pl-empty">
                      Nothing is marked ready for dev yet.
                      <small>Pages show up here once Market marks them ready.</small>
                    </p>
                  )
                ) : (
                  <FieldMarks.Provider value={marks}>
                    {step && step.renderer !== 'plans' && step.renderer !== 'stub' ? (
                      <FlowPanel store={store} step={step} />
                    ) : (
                      <EditPanel store={store} />
                    )}
                  </FieldMarks.Provider>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="demo__fields">
                <DefaultPanel store={store} />
              </div>

              {dev && readyCount === 0 ? (
                <p className="pl-empty">
                  Nothing is marked ready for dev yet.
                  <small>Pages show up here once Market marks them ready.</small>
                </p>
              ) : (
                <UserFlow
                  planned={shown}
                  selectedId={step?.id ?? ''}
                  onOpen={openStep}
                  trailing={chipFor}
                  footnote={dev && hiddenSteps > 0 ? `${hiddenSteps} not ready yet · hidden in Dev` : undefined}
                />
              )}

              <button type="button" className="demo__reset" onClick={store.reset}>
                Reset progress
              </button>
            </>
          )}
        </div>
        </div>

        <div className="demo__preview">

          {editing && step ? (
            <StepPreview journey={store.journey} set={store.set} context={store.context} />
          ) : (
            <JourneyFrames
              planned={shown}
              selectedId={step?.id ?? ''}
              onOpen={openStep}
              set={store.set}
              marker={(id) => <SectionMarker status={pipe.status(id)} />}
              context={store.context}
              onReorder={(ids) => store.setStepOrder(store.journey.id, ids)}
              reordered={store.reordered}
              onResetOrder={() => store.setStepOrder(store.journey.id, [])}
            />
          )}
        </div>
      </div>

      {/* The whole journey, not the part Dev mode is showing: the prototype is
          the flow a person walks, and what Market has marked ready is a fact
          about the handoff rather than about the journey. */}
      {prototype && (
        <Prototype
          planned={planned}
          set={store.set}
          context={store.context}
          onClose={() => setPrototype(false)}
        />
      )}
    </main>
  )
}
