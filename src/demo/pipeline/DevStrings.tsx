import { useEffect, useRef, useState } from 'react'
import type { Section, StringDef } from '../../rules/pipeline'
import { CheckIcon, CopyIcon } from './icons'

/**
 * Puts text on the clipboard, in the environments that allow it.
 *
 * The async API needs a secure context and permission; the old selection
 * route works in the rest, including a preview embedded in another page.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    document.body.removeChild(area)
    return ok
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])
  return (
    <button
      type="button"
      className="pl-copy"
      data-copied={copied || undefined}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={async () => {
        if (!(await copyText(value))) return
        setCopied(true)
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 1200)
      }}
    >
      {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

/**
 * A page as Dev sees it: every string, read-only, with the key to implement
 * it under and a button to take the value. On the subscription page the
 * strings sit under their plan.
 */
export function DevStrings({ section }: { section: Section }) {
  const groups: { name?: string; strings: StringDef[] }[] = []
  for (const s of section.strings) {
    const last = groups[groups.length - 1]
    if (last && last.name === s.group) last.strings.push(s)
    else groups.push({ name: s.group, strings: [s] })
  }

  return (
    <div className="pl-strings">
      {groups.map((g, gi) => (
        <section className="pl-strings__group" key={g.name ?? gi}>
          {g.name && <h4 className="pl-strings__name">{g.name}</h4>}
          <ul className="pl-strings__list">
            {g.strings.map((s) => (
              <li className="pl-string" key={s.key}>
                <div className="pl-string__head">
                  <span className="pl-string__label">{s.label}</span>
                  <code className="pl-string__key" title={s.key}>
                    {s.key}
                  </code>
                </div>
                <div className="pl-string__row">
                  {s.value.trim() === '' ? (
                    <em className="pl-string__empty" data-required={s.required || undefined}>
                      {s.required ? 'Required · not written yet' : 'Empty'}
                    </em>
                  ) : (
                    <span className="pl-string__value">{s.value}</span>
                  )}
                  <CopyButton value={s.value} label={s.label} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
