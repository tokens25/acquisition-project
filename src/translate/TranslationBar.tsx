import './translation.css'
import type { TranslationStore } from './useTranslations'

/**
 * The reason, turned into something a market user can act on.
 *
 * The exact string is never thrown away: it stays on screen underneath, small,
 * for whoever needs it. What changes is the sentence that answers "so what do
 * I do now".
 */
function plainReason(note: string | null): { says: string; act: string } {
  const raw = note ?? ''
  if (/API key is invalid|invalid.*api key/i.test(raw)) {
    return {
      says: 'The Anthropic key in this project is not a valid one.',
      act: 'Replace ANTHROPIC_API_KEY in the .env file at the project root with a real key from console.anthropic.com, then restart the dev server.',
    }
  }
  if (/ANTHROPIC_API_KEY|not set|not configured/i.test(raw)) {
    return {
      says: 'Translation needs Anthropic, and this project has no key.',
      act: 'Either add ANTHROPIC_API_KEY to a .env file at the project root and restart the dev server, or sign the claude command in on this machine.',
    }
  }
  if (/401|oauth|expired|authenticate|not logged in/i.test(raw)) {
    return {
      says: 'The claude command on this machine is signed out, and there is no Anthropic key to use instead.',
      act: 'Run claude login in a terminal, then press Try again. A key in .env would also do it, and takes priority.',
    }
  }
  if (/too long|timeout|timed out/i.test(raw)) {
    return { says: 'The translation took too long to come back.', act: 'Press Try again. A whole journey is a lot of words at once.' }
  }
  if (/network|fetch|ECONN|502|503|504/i.test(raw)) {
    return { says: 'Anthropic could not be reached.', act: 'Check the connection, then press Try again.' }
  }
  if (/PATH|ENOENT/i.test(raw)) {
    return { says: 'The claude command is not on the dev server’s PATH.', act: 'Restart the dev server from a shell where claude runs.' }
  }
  return { says: 'The translation did not come back.', act: 'Press Try again.' }
}

/**
 * What language this market reads, and how far its words have got.
 *
 * Nothing to say for an English market, so it draws nothing rather than a row
 * saying no. Machine translation is never silent about being machine
 * translation: the count is on screen until a person has read the strings.
 */
export function TranslationBar({ tx, market }: { tx: TranslationStore; market: string }) {
  if (tx.state === 'off') return null
  const { machine, reviewed, stale } = tx.counts

  return (
    <section className="tr-bar" data-state={tx.state} aria-label="Translation">
      <p className="tr-bar__head">
        <span className="tr-bar__lang">{tx.language.name}</span>
        <span className="tr-bar__market">{tx.matchesMarket ? market : `${market} reads ${tx.marketLanguage.name}`}</span>
        {tx.state === 'working' && <span className="tr-bar__working">Translating the whole flow…</span>}
      </p>

      {tx.state === 'ready' && (
        <p className="tr-bar__note">
          {machine > 0 && (
            <>
              <strong>{machine}</strong> machine translated
            </>
          )}
          {machine > 0 && reviewed > 0 && ' · '}
          {reviewed > 0 && (
            <>
              <strong>{reviewed}</strong> kept by a person
            </>
          )}
          {machine + reviewed === 0 && 'Nothing translated yet.'}
          {stale > 0 && ` · ${stale} out of date since the English changed`}
        </p>
      )}
      {tx.state === 'ready' && machine > 0 && tx.matchesMarket && (
        <p className="tr-bar__warn">Machine translation. Read a field and keep it before this market is published.</p>
      )}
      {tx.state === 'ready' && !tx.matchesMarket && (
        <p className="tr-bar__note">Reading only. {market} reads {tx.marketLanguage.name}, so nothing here can be kept for it.</p>
      )}
      {(tx.state === 'unavailable' || tx.state === 'failed') && (
        <>
          <p className="tr-bar__warn">{plainReason(tx.note).says}</p>
          <p className="tr-bar__note">{plainReason(tx.note).act}</p>
          {tx.note && <p className="tr-bar__raw">{tx.note}</p>}
        </>
      )}

      {tx.state !== 'working' && (
        <button type="button" className="tr-bar__again" onClick={tx.retranslate}>
          {tx.state === 'ready' ? 'Translate again' : 'Try again'}
        </button>
      )}
    </section>
  )
}
