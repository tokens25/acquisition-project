import '../App.css'
import './demo.css'

import { useState } from 'react'
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
import { UserFlow } from './UserFlow'
import { iconArtwork } from '../card/assets'
import { JourneyFrames } from './JourneyFrames'

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
      <div className="demo__top">
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
              </div>
              <div className="demo__fields">
                <EditPanel store={store} />
              </div>
            </>
          ) : (
            <>
              <div className="demo__fields">
                <DefaultPanel store={store} />
              </div>

              <UserFlow
                planned={planned}
                selectedId={step?.id ?? ''}
                onOpen={openStep}
              />

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
              planned={planned}
              selectedId={step?.id ?? ''}
              onOpen={openStep}
              set={store.set}
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
