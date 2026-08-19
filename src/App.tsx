import './App.css'
import { CardSetView } from './card/CardSetView'
import { SetEditor } from './editor/SetEditor'
import { useCardSet } from './editor/useCardSet'
import { contextLabel, summarise, validateAll } from './rules/validate'

/**
 * Acquisition — authoring surface plus preview.
 *
 * The preview renders through the same rules layer the product would, so what
 * is approved here is what would ship. Publishing is gated on every market
 * passing, not just the one on screen.
 */
export function App() {
  const store = useCardSet()
  const coverage = summarise(validateAll(store.set))
  const blocked = coverage.failing.length > 0

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
              Preview · {store.editingBase ? 'Base' : contextLabel(store.context)}
            </h2>
            <span className="page__gate" data-blocked={blocked || undefined}>
              {blocked ? `Blocked · ${coverage.failing.length}/${coverage.total}` : `Ready · ${coverage.total} checked`}
            </span>
          </div>
          <p className="page__section-note">
            The set as it would render. Card heights and description lines resolve across
            the set (S-2, S-3), not per card.
          </p>
          <CardSetView set={store.set} context={store.context} />
        </div>
      </div>
    </main>
  )
}
