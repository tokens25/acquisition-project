import './App.css'
import { CardSetView } from './card/CardSetView'
import { SetEditor } from './editor/SetEditor'
import { useCardSet } from './editor/useCardSet'
import { validateSet, hasErrors } from './rules/validate'

/**
 * Acquisition — authoring surface plus preview.
 *
 * The preview renders through the same rules layer the product would, so what
 * is approved here is what would ship. Publish is gated on the rules passing.
 */
export function App() {
  const store = useCardSet()
  const violations = validateSet(store.set)
  const blocked = hasErrors(violations)

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Choose your plan</h1>
        <p className="page__subtitle">
          Rules and logic from the agreed card spec — switches in, everything else derived.
        </p>
      </header>

      <div className="page__split">
        <div className="page__pane">
          <SetEditor store={store} />
        </div>

        <div className="page__pane page__pane--preview">
          <div className="page__preview-head">
            <h2 className="page__section-title">Preview</h2>
            <span className="page__gate" data-blocked={blocked || undefined}>
              {blocked ? 'Publish blocked' : 'Publish ready'}
            </span>
          </div>
          <p className="page__section-note">
            The set as it would render. Card heights and description lines are resolved
            across the set (S-2, S-3), not per card.
          </p>
          <CardSetView set={store.set} />
        </div>
      </div>
    </main>
  )
}
