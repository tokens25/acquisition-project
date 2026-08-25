import '../App.css'
import './demo.css'

import { useState } from 'react'
import daznLogo from '../assets/brand/logo-dazn.svg?raw'
import { StepPreview } from '../card/StepPreview'
import { Icon } from '../components/Icon'
import { Assistant } from '../editor/Assistant'
import { useCardSet } from '../editor/useCardSet'
import { planJourney } from '../rules/journey'
import { summarise, validateAll } from '../rules/validate'
import { Button } from '../components/Button'
import { Stage1 } from './Stage1'
import { Stage2 } from './Stage2'
import { UserFlow } from './UserFlow'
import { iconArtwork } from '../card/assets'
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
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // "Save" here means publish. Edits reach localStorage the moment they are
  // typed, so a button that only closed the panel would be claiming to do
  // something that already happened.
  const onSave = async () => {
    const message = window.prompt('What changed?', 'content: update plan copy')
    if (message === null) return
    const result = await store.publish(message)
    setSaveNote(result.ok ? 'Saved to the shared copy.' : (result.error ?? 'Save failed.'))
  }

  const planned = planJourney(store.journey, store.context)
  const steps = planned.filter((p) => !p.skipped).map((p) => p.step)
  const step = steps.find((s) => s.id === store.set.stepId) ?? steps[0]
  const coverage = summarise(validateAll(store.set))

  const openStep = (id: string) => {
    store.updateSet({ stepId: id })
    setEditing(true)
  }

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
      <div className="page__split">
        <div className="demo__panel">
          {!collapsed && brand}

          {editing ? (
            <>
              <button type="button" className="demo__back" onClick={() => setEditing(false)}>
                <Icon svg={iconArtwork['chevron-left']} size={20} />
                {store.journey.name} — {step?.shortName ?? step?.name}
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
              {/* First action in the panel, because nothing below it means
                  anything until content is loaded. */}
              <label className="demo__upload">
                <Icon svg={iconArtwork.upload} size={24} />
                Upload Spreadsheet or JSON
                <input
                  type="file"
                  accept=".json,application/json,.xlsx"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void store.importJson(file)
                    e.target.value = ''
                  }}
                />
              </label>
              {store.importError && <p className="demo__error">{store.importError}</p>}

              <Assistant store={store} />

              <div className="demo__fields">
                <Stage1 store={store} />
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

        <div className="demo__preview">
          <div className="demo__statusbar">
            {collapsed && brand}
            <span className="demo__gate" data-state={coverage.failing.length ? 'blocked' : 'clear'}>
              {coverage.failing.length
                ? `Publish blocked — ${coverage.failing.length} of ${coverage.total} contexts failing`
                : `Publish ready — ${coverage.total} contexts checked`}
            </span>

            {!editing && (
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

                <Button
                  appearance="tertiary"
                  size="md"
                  iconBefore={<Icon svg={iconArtwork.settings} size={20} />}
                  disabled
                  title="No settings screen yet."
                >
                  Settings
                </Button>
              </div>
            )}

            {editing && (
              <div className="demo__actions">
                <Button
                  appearance="primary"
                  size="md"
                  iconBefore={<Icon svg={iconArtwork.checkmark} size={20} />}
                  disabled={!store.unpublished || store.publishing}
                  title={
                    store.unpublished
                      ? 'Publish these edits to the shared copy'
                      : 'Nothing to save — this matches what is published'
                  }
                  onClick={() => void onSave()}
                >
                  {store.publishing ? 'Saving…' : 'Save changes'}
                </Button>

                <Button
                  appearance="secondary"
                  size="md"
                  iconBefore={<Icon svg={iconArtwork.close} size={20} />}
                  onClick={() => setEditing(false)}
                >
                  Exit edit mode
                </Button>

                <Button
                  appearance="tertiary"
                  size="md"
                  iconBefore={<Icon svg={iconArtwork.settings} size={20} />}
                  disabled
                  title="No settings screen yet."
                >
                  Settings
                </Button>
              </div>
            )}
          </div>
          {saveNote && <p className="demo__savenote">{saveNote}</p>}

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
