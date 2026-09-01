import '../App.css'
import './demo.css'
import './pipeline/pipeline.css'

import { useEffect, useMemo, useState } from 'react'
import aiSparkle from '../assets/icons/ai-sparkle.svg?raw'
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
import type { Mode, SectionStatus } from '../rules/pipeline'
import { planSection } from '../rules/pipeline'
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
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  /** The plan open in the edit panel — shared with the handoff chip beside it. */
  const [openTier, setOpenTier] = useState(store.set.tiers[0]?.id ?? '')

  /**
   * Approval is also the moment the content goes to the shared copy.
   *
   * Publishing used to be its own button. Removing it without moving the act
   * anywhere would have left the shared copy permanently behind, so it lands
   * here, at the point somebody says the content is right — with a fixed
   * message rather than the prompt the button used to raise.
   */
  const onApprove = async () => {
    store.updateSet({ review: 'approved' })
    const result = await store.publish('content: approved')
    setSaveNote(result.ok ? 'Approved and published to the shared copy.' : (result.error ?? 'Approved, but publishing failed.'))
  }

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

  const readyTiers = store.set.tiers.filter((t) => pipe.doc.ready[planSection(t.id)])
  /** Whether a step has anything Dev should see: its own section, or any plan's. */
  const stepReady = (id: string) =>
    id === 'plans' ? readyTiers.length > 0 : Boolean(pipe.doc.ready[id])
  /** The plans step carries one section per plan; its marker shows the one that needs attention. */
  const plansStatus = (): SectionStatus => {
    const all = store.set.tiers.map((t) => pipe.status(planSection(t.id)))
    if (all.includes('changed')) return 'changed'
    if (all.includes('ready')) return 'ready'
    if (all.includes('done')) return 'done'
    return 'draft'
  }
  const markerFor = (id: string) => (
    <SectionMarker status={id === 'plans' ? plansStatus() : pipe.status(id)} />
  )

  /* Dev sees only what Market has marked ready: the steps in the list, the
     plans in the set. Market sees everything. */
  const shown = dev ? planned.filter((p) => stepReady(p.step.id)) : planned
  const hiddenSteps = planned.length - shown.length
  const shownSet = dev ? { ...store.set, tiers: readyTiers } : store.set
  const readyCount = Object.keys(pipe.doc.ready).length

  const devTier = readyTiers.some((t) => t.id === openTier) ? openTier : (readyTiers[0]?.id ?? '')
  const sectionId = !step ? '' : step.renderer === 'plans' ? planSection(dev ? devTier : openTier) : step.id
  const section = pipe.section(sectionId)

  const switchMode = (mode: Mode) => {
    pipe.setMode(mode)
    // Whatever field had focus loses it: in Dev nothing is editable, and a
    // caret left blinking in a field that no longer exists is a lie.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    if (mode === 'dev' && editing && step && !stepReady(step.id)) setEditing(false)
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
   * Which set of actions the bar carries.
   *
   * Edit mode is a review flow: hand it over, then have it approved. Neither
   * can be asked for while the rules are failing, so both start switched off
   * and the gate beside them says what is missing. The one that is live is the
   * primary; the step behind it drops to third level rather than disappearing,
   * so the sequence stays readable from where you are in it.
   *
   * Leaving edit mode is the arrow at the top of the panel, which was always
   * the way back — the button here said it a second time.
   */
  const review = store.set.review ?? 'draft'
  const rulesMet = coverage.failing.length === 0

  /**
   * What the gate says, and the colour it says it in.
   *
   * Failing rules come first whatever the review state: content that has
   * stopped validating is the thing to know about, and the review is already
   * withdrawn by the edit that broke it.
   */
  const gate = !rulesMet
    ? {
        state: 'blocked' as const,
        text: `Not ready for review — ${coverage.failing.length} of ${coverage.total} contexts failing`,
      }
    : review === 'in-review'
      ? { state: 'waiting' as const, text: 'Waiting for product & UX approval' }
      : review === 'approved'
        ? { state: 'clear' as const, text: `Approved — ${coverage.total} contexts checked` }
        : { state: 'clear' as const, text: `Ready for review — ${coverage.total} contexts checked` }

  const actions = editing ? (
    <div className="demo__actions">
      <Button
        appearance={review === 'draft' ? 'primary' : 'tertiary'}
        size="md"
        iconBefore={<Icon svg={iconArtwork.checkmark} size={20} />}
        disabled={!rulesMet || review !== 'draft'}
        title={
          !rulesMet
            ? `${coverage.failing.length} of ${coverage.total} contexts still fail — fix those first`
            : review === 'draft'
              ? 'Hand this to product and UX'
              : 'Already with product and UX'
        }
        onClick={() => store.updateSet({ review: 'in-review' })}
      >
        Ready for review
      </Button>

      <Button
        appearance={review === 'in-review' ? 'primary' : 'tertiary'}
        size="md"
        iconBefore={<Icon svg={iconArtwork.check} size={20} />}
        disabled={review !== 'in-review' || store.publishing}
        title={
          review === 'in-review'
            ? 'Record the approval and publish to the shared copy'
            : 'Available once the content is with product and UX'
        }
        onClick={() => void onApprove()}
      >
        {store.publishing ? 'Publishing…' : 'Approved'}
      </Button>

      {/* Not wired to anything yet, and says so rather than answering a click
          with nothing. */}
      <Button
        appearance="tertiary"
        size="md"
        iconBefore={<Icon svg={aiSparkle} size={20} />}
        disabled
        title="Not connected yet"
      >
        Evaluate performance
      </Button>

      <ModeToggle mode={pipe.mode} onChange={switchMode} />
    </div>
  ) : (
    <div className="demo__actions">
      <Button
        appearance="secondary"
        size="md"
        iconBefore={<Icon svg={iconArtwork.preview} size={20} />}
        aria-pressed={previewOnly}
        title={previewOnly ? 'Show the panel again' : 'Hide the panel and fill the width'}
        onClick={() => setPreviewOnly((v) => !v)}
      >
        {previewOnly ? 'Show panel' : 'Preview'}
      </Button>

      <Button
        appearance="tertiary"
        size="md"
        iconBefore={<Icon svg={iconArtwork.download} size={20} />}
        title="Downloads the content as this app stores it — not yet the shape the rule engine reads."
        onClick={store.exportJson}
      >
        Export JSON
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

    <main
      className="page demo"
      data-preview-only={previewOnly || undefined}
      data-collapsed={collapsed || undefined}
    >
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
      {saveNote && <p className="demo__savenote">{saveNote}</p>}
      {dev && readyCount > 0 && (
        <p className="pl-devline">
          Dev mode · showing {readyCount} section{readyCount === 1 ? '' : 's'} marked ready for dev
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
                {step && step.renderer !== 'plans' && section && (
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
                  /* Dev reads: every string of the section, its key, and a
                     button to take it. Nothing here writes. */
                  section && step ? (
                    <>
                      {step.renderer === 'plans' && (
                        <section className="demo__group">
                          <h3 className="demo__group-title">Plans</h3>
                          <div className="ed-tabs">
                            {readyTiers.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                className="ed-tab"
                                data-on={devTier === t.id || undefined}
                                onClick={() => setOpenTier(t.id)}
                              >
                                {t.planName || t.id}
                                <SectionMarker status={pipe.status(planSection(t.id))} />
                              </button>
                            ))}
                          </div>
                          {store.set.tiers.length > readyTiers.length && (
                            <p className="pl-hidden-note">
                              {store.set.tiers.length - readyTiers.length} not ready yet · hidden in Dev
                            </p>
                          )}
                        </section>
                      )}
                      <section className="demo__group">
                        <div className="pl-head-row">
                          <h3 className="demo__group-title">Strings</h3>
                          {step.renderer === 'plans' && <StatusChip section={section} pipe={pipe} />}
                        </div>
                        <DevStrings section={section} />
                      </section>
                    </>
                  ) : (
                    <p className="pl-empty">
                      Nothing is marked ready for dev yet.
                      <small>Sections show up here once Market marks them ready.</small>
                    </p>
                  )
                ) : step && step.renderer !== 'plans' && step.renderer !== 'stub' ? (
                  <FlowPanel store={store} step={step} />
                ) : (
                  <EditPanel
                    store={store}
                    openTier={openTier}
                    onOpenTier={setOpenTier}
                    heading={section && <StatusChip section={section} pipe={pipe} />}
                    tabExtra={(id) => <SectionMarker status={pipe.status(planSection(id))} />}
                  />
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
                  <small>Sections show up here once Market marks them ready.</small>
                </p>
              ) : (
                <UserFlow
                  planned={shown}
                  selectedId={step?.id ?? ''}
                  onOpen={openStep}
                  marker={markerFor}
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
            <StepPreview journey={store.journey} set={shownSet} context={store.context} />
          ) : (
            <JourneyFrames
              planned={shown}
              selectedId={step?.id ?? ''}
              onOpen={openStep}
              set={shownSet}
              context={store.context}
              onReorder={(ids) => store.setStepOrder(store.journey.id, ids)}
              reordered={store.reordered}
              onResetOrder={() => store.setStepOrder(store.journey.id, [])}
            />
          )}
        </div>
      </div>
    </main>
  )
}
