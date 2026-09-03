import type { TranslationStore } from './useTranslations'
import './translation.css'

/**
 * The languages one market reads, and the way to add another.
 *
 * Scoped to the market on screen on purpose. A market owns its seven screens,
 * so a language given to Spain is a translation of Spain's words and means
 * nothing to Germany. Switching here changes which of this market's languages
 * is on screen, and nothing else.
 *
 * The official language is always the first, and never removable. Where a
 * market reads English and has been given nothing, there is one language and
 * nothing to switch between, so only the button shows.
 */
export function MarketLanguages({ tx, onAdd }: { tx: TranslationStore; onAdd: () => void }) {
  const working = tx.state === 'working'
  return (
    <div className="mlang" data-busy={working || undefined}>
      {tx.languages.length > 1 &&
        tx.languages.map((l) => (
          <button
            key={l.code}
            type="button"
            className="mlang__lang"
            data-on={l.code === tx.current.code || undefined}
            aria-pressed={l.code === tx.current.code}
            title={l.code === tx.official.code ? `${l.name}, what ${tx.market.label} reads officially` : `${l.name}, added for ${tx.market.label}`}
            onClick={() => tx.show(l.code)}
          >
            {l.name}
          </button>
        ))}
      <button type="button" className="mlang__add" onClick={onAdd} title={`Read ${tx.market.label} in another language`}>
        {working ? (
          <>
            <span className="mlang__spin" aria-hidden="true" />
            {tx.progress ? `Translating ${tx.progress.language}` : 'Translating'}
          </>
        ) : (
          <>Translate</>
        )}
      </button>
    </div>
  )
}
