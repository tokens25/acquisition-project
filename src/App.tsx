import './App.css'
import { StepPreview } from './card/StepPreview'
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
          <button type="button" className="page__btn" onClick={store.exportJson}>
            Export JSON
          </button>
          <label className="page__btn">
            Import JSON
            <input
              type="file"
              accept="application/json"
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
