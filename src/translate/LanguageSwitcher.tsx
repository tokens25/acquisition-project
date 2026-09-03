import './translation.css'
import type { Language } from './languages'

/**
 * Which language the journey is read in.
 *
 * Separate from the market on purpose. A market implies a language, and that
 * is the default, but someone writing for Germany may want to check the
 * English, and someone in the base may want to see how a screen reads in
 * Spanish before a market is chosen. This switches what is on screen and
 * changes nothing about the content.
 *
 * A dropdown rather than a row of codes: the list is as long as the markets
 * DAZN sells in, and a row of them would push the rest of the bar off the
 * edge as soon as a fourth country is added.
 */
export function LanguageSwitcher({
  languages,
  value,
  marketLanguage,
  busy,
  onChange,
}: {
  languages: Language[]
  /** The language on screen. */
  value: string
  /** The one this market reads, offered as its default. */
  marketLanguage: string
  /** A translation is being fetched, so the control says so. */
  busy?: boolean
  onChange: (code: string) => void
}) {
  if (languages.length < 2) return null
  const current = languages.find((l) => l.code === value)
  return (
    <div className="lang" data-busy={busy || undefined}>
      <select
        className="lang__select"
        aria-label="Language"
        value={value}
        title={
          value === marketLanguage
            ? `${current?.name ?? value}, what this market reads`
            : `Reading in ${current?.name ?? value}. This market reads ${languages.find((l) => l.code === marketLanguage)?.name ?? marketLanguage}.`
        }
        onChange={(e) => onChange(e.target.value)}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
            {l.code === marketLanguage ? ' · this market' : ''}
          </option>
        ))}
      </select>
      <svg className="lang__chev" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
