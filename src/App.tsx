import './App.css'

import { useState } from 'react'
import { StepPreview } from './card/StepPreview'
import { Assistant } from './editor/Assistant'
import { SetEditor } from './editor/SetEditor'
import { useCardSet } from './editor/useCardSet'

/**
 * Acquisition — authoring surface plus preview.
 *
 * The preview renders through the same rules layer the product would, so what
 * is approved here is what would ship. Publishing is gated on every market
 * passing, not just the one on screen.
 */
export function App() {
  const store = useCardSet()
  const [publishNote, setPublishNote] = useState<string | null>(null)

  // What the header says about the copy on screen. The three cases are
  // genuinely different and a person needs to tell them apart: shared and
  // current, shared with unsaved work, or not shared at all.
  const remote = store.remote
  const shared = remote?.kind === 'published' || remote?.kind === 'unpublished'
  // The file is shared to read but not to write: there is no API to commit it.
  const fileOnly = remote?.kind === 'file'
  const sourceLabel = !remote
    ? 'Checking for shared content…'
    : remote.kind === 'published'
      ? store.unpublished
        ? 'Shared content, with unpublished edits'
        : 'Shared content, up to date'
      : remote.kind === 'unpublished'
        ? 'Nothing published yet — publishing will create it'
        : remote.kind === 'file'
          ? store.unpublished
            ? 'Shared file from the repo, with local edits — export and commit to share them'
            : 'Shared file from the repo'
          : 'This browser only — not shared'

  const onPublish = async () => {
    const message = window.prompt('What changed?', 'content: update plan copy')
    if (message === null) return
    const result = await store.publish(message)
    setPublishNote(result.ok ? 'Published.' : (result.error ?? 'Publish failed.'))
  }

  const { journey } = store

  // "IE" is a market code, not something to show a person. Resolve it to the
  // market's own label, and the campaign's, so the heading reads as a place.
  const marketName = store.editingBase
    ? 'Base'
    : (store.set.markets.find((m) => m.code === store.context.market)?.label ?? store.context.market)
  const campaignName = store.context.campaign
    ? (store.set.campaigns.find((c) => c.code === store.context.campaign)?.label ??
      store.context.campaign)
    : null
  const previewLabel = campaignName ? `${marketName} · ${campaignName}` : marketName


  return (
    <main className="page">
      <header className="page__header">
        <div className="page__titles">
        <h1 className="page__title">Choose your plan</h1>
        <p className="page__subtitle">
          One card, authored once. Markets and campaigns carry only their differences.
        </p>
        </div>
        <div className="page__actions">
          {shared && (
            <button
              type="button"
              className="page__btn page__btn--primary"
              onClick={() => void onPublish()}
              disabled={store.publishing || !store.unpublished}
              title={store.unpublished ? undefined : 'Nothing to publish — this matches what is published.'}
            >
              {store.publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
          <button type="button" className="page__btn" onClick={store.exportJson}>
            Export JSON
          </button>
          <label className="page__btn">
            Import spreadsheet or JSON
          <input
              type="file"
              accept=".xlsx,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void store.importJson(file)
                e.target.value = ''
              }}
            />
          </label>
          <button type="button" className="page__btn page__btn--quiet" onClick={store.reset}>
            Reset
          </button>
        </div>
        <p
          className="page__source"
          data-state={store.unpublished ? 'dirty' : shared || fileOnly ? 'shared' : 'local'}
        >
          {sourceLabel}
          {publishNote && <span className="page__source-note"> · {publishNote}</span>}
        </p>
      </header>
      {store.importError && (
        <p className="page__error">Import failed: {store.importError}</p>
      )}
      {store.importNotes.length > 0 && (
        <ul className="page__notes">
          {store.importNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <div className="page__split">
        <div className="page__pane">
          <Assistant store={store} />
          <SetEditor store={store} />
        </div>

        <div className="page__pane page__pane--preview">
          <div className="page__preview-head">
            <h2 className="page__section-title">
              Preview · {previewLabel}
            </h2>
            <div className="page__devices" role="group" aria-label="Preview device">
              <button
                type="button"
                className="page__device"
                data-on={store.set.device === 'mobile' || undefined}
                onClick={() => store.updateSet({ device: 'mobile' })}
              >
                Mobile
              </button>
              <button
                type="button"
                className="page__device"
                data-on={store.set.device !== 'mobile' || undefined}
                onClick={() => store.updateSet({ device: 'desktop' })}
              >
                Desktop
              </button>
            </div>          </div>
          <p className="page__section-note">
            The journey as it resolves for this context — which steps appear, in order.
            Only the plans step renders a real component; the rest carry their Figma frame,
            their states and the runtime conditions they depend on.
          </p>
          <StepPreview journey={journey} set={store.set} context={store.context} />
        </div>
      </div>
    </main>
  )
}
