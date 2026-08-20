import { useState } from 'react'
import './App.css'
import { JourneyView } from './card/JourneyView'
import { journeys } from './rules/journeys'
import { SetEditor } from './editor/SetEditor'
import { useCardSet } from './editor/useCardSet'
import { summarise, validateAll } from './rules/validate'

/**
 * Acquisition — authoring surface plus preview.
 *
 * The preview renders through the same rules layer the product would, so what
 * is approved here is what would ship. Publishing is gated on every market
 * passing, not just the one on screen.
 */
export function App() {
  const store = useCardSet()
  const [journeyId, setJourneyId] = useState(journeys[0].id)
  const journey = journeys.find((j) => j.id === journeyId) ?? journeys[0]
  const coverage = summarise(validateAll(store.set))
  const blocked = coverage.failing.length > 0

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
        <h1 className="page__title">Choose your plan</h1>
        <p className="page__subtitle">
          One card, authored once. Markets and campaigns carry only their differences.
        </p>
      </header>

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
            </div>
            <label className="page__control">
              Journey
              <select value={journeyId} onChange={(e) => setJourneyId(e.target.value)}>
                {journeys.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="page__gate" data-blocked={blocked || undefined}>
              {blocked ? `Blocked · ${coverage.failing.length}/${coverage.total}` : `Ready · ${coverage.total} checked`}
            </span>
          </div>
          <p className="page__section-note">
            The journey as it resolves for this context — which steps appear, in order.
            Only the plans step renders a real component; the rest carry their Figma frame,
            their states and the runtime conditions they depend on.
          </p>
          <JourneyView journey={journey} set={store.set} context={store.context} />
        </div>
      </div>
    </main>
  )
}
