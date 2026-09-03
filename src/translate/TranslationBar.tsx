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
 * What language this market is being read in.
 *
 * Nothing to say for an English market, so it draws nothing rather than a row
 * saying no. Nothing to say about a translation that worked either: the
 * language is the fact, and the fields below carry their own marks. What is
 * left is the two things a person can act on, a line the Coach held back and a
 * translation that could not be fetched at all.
 */
export function TranslationBar({ tx, market }: { tx: TranslationStore; market: string }) {
  if (tx.state === 'off') return null
  const { held } = tx.counts

  return (
    <section className="tr-bar" data-state={tx.state} aria-label="Translation">
      <p className="tr-bar__head">
        <span className="tr-bar__lang">{tx.current.name}</span>
        <span className="tr-bar__market">
          {market}
          {tx.current.code === tx.official.code ? ', official' : ', added'}
        </span>
        {tx.state === 'working' && (
          <span className="tr-bar__working">
            Translating into {tx.progress?.language ?? tx.current.name}
            {tx.progress && tx.progress.left > 0 ? `, ${tx.progress.left} more to go` : ''}
          </span>
        )}
      </p>

      {/* An exception is worth a line. A count of what went right is not. */}
      {tx.state === 'ready' && held > 0 && (
        <p className="tr-bar__warn">
          {held} {held === 1 ? 'line' : 'lines'} kept the English, held back by the Coach.
        </p>
      )}

      {(tx.state === 'unavailable' || tx.state === 'failed') && (
        <>
          <p className="tr-bar__warn">{plainReason(tx.note).says}</p>
          <p className="tr-bar__note">{plainReason(tx.note).act}</p>
          {tx.note && <p className="tr-bar__raw">{tx.note}</p>}
          <button type="button" className="tr-bar__again" onClick={tx.retranslate}>
            Try again
          </button>
        </>
      )}
    </section>
  )
}
