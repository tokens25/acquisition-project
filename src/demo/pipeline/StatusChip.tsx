import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Section } from '../../rules/pipeline'
import {
  STATUS_LABEL,
  byLine,
  changedKeys,
  formatWhen,
  fullLabel,
  missingRequired,
  statusOf,
} from '../../rules/pipeline'
import { ChevronIcon, CodeIcon } from './icons'
import type { Pipeline } from './usePipeline'

const Glyph = () => (
  <span className="pl-glyph" aria-hidden="true">
    <CodeIcon size={10} />
  </span>
)

/**
 * A page's place in the handoff, as one chip in its header.
 *
 * Before Market marks it, the header carries the button that does. After,
 * the chip: green while Dev has exactly what Market wrote, orange the moment
 * a string differs, neutral once Dev has implemented it. Everything else —
 * what changed, the activity, the actions — is in the dropdown under it.
 *
 * `compact` is the same chip at list size, for the user-flow rows.
 */
export function StatusChip({
  section,
  pipe,
  compact,
}: {
  section: Section
  pipe: Pipeline
  compact?: boolean
}) {
  const status = statusOf(pipe.doc, section)
  const anchor = useRef<HTMLButtonElement>(null)

  if (status === 'draft') {
    if (pipe.mode !== 'market') return null
    const missing = missingRequired(section).length
    const hint = missing > 0 ? `Fill ${missing} required field${missing === 1 ? '' : 's'} first` : undefined
    return (
      <span className="pl-ready" data-compact={compact || undefined}>
        {!compact && hint && <span className="pl-ready__hint">{hint}</span>}
        <button
          type="button"
          className="pl-ready__btn"
          disabled={missing > 0}
          title={hint ?? 'Snapshot every string on this page and hand it to dev'}
          onClick={() => pipe.markReady(section.id)}
        >
          <CodeIcon size={12} />
          {compact ? 'Mark ready' : 'Mark ready for dev'}
        </button>
      </span>
    )
  }

  const open = pipe.pop === section.id
  return (
    <>
      <button
        key={status}
        ref={anchor}
        type="button"
        className="pl-chip"
        data-status={status}
        data-compact={compact || undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={status === 'changed' ? 'See what changed' : 'Status'}
        onClick={() => pipe.setPop(open ? null : section.id)}
      >
        <Glyph />
        <span className="pl-chip__label">{STATUS_LABEL[status]}</span>
        <span className="pl-chip__chevron" data-open={open || undefined}>
          <ChevronIcon size={10} />
        </span>
      </button>
      {open && <Dropdown section={section} pipe={pipe} anchor={anchor} onClose={() => pipe.setPop(null)} />}
    </>
  )
}

const WIDTH = 360

/**
 * Anchored under the chip and right-aligned to it.
 *
 * Positioned against the viewport rather than the chip's parent: the panel it
 * sits in scrolls and clips, and a 360px surface inside a 360px column would
 * lose its right edge. Measured on open and again whenever anything scrolls.
 */
function Dropdown({
  section,
  pipe,
  anchor,
  onClose,
}: {
  section: Section
  pipe: Pipeline
  anchor: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [logOpen, setLogOpen] = useState(false)

  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (!r) return
      const left = Math.max(8, Math.min(r.right - WIDTH, window.innerWidth - WIDTH - 8))
      setPos({ top: r.bottom + 6, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (box.current?.contains(t) || anchor.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor, onClose])

  const { doc, mode } = pipe
  const status = statusOf(doc, section)
  const changes = changedKeys(doc, section)
  const done = Boolean(doc.done[section.id])
  const log = doc.log[section.id] ?? []
  const latest = changes
    .map((c) => c.at)
    .filter((t): t is string => Boolean(t))
    .sort()
    .pop()

  const title =
    status === 'changed'
      ? `${changes.length} change${changes.length === 1 ? '' : 's'} since ${done ? 'completed' : 'marked ready'}`
      : status === 'done'
        ? 'Completed'
        : 'Ready for dev'
  const meta =
    status === 'changed'
      ? latest
        ? `Last edit ${byLine(latest)}`
        : ''
      : status === 'done'
        ? byLine(doc.doneBy[section.id] ?? '')
        : 'No changes since marked ready'

  return (
    <div
      ref={box}
      className="pl-pop"
      role="dialog"
      aria-label={`${section.label} — ${STATUS_LABEL[status]}`}
      style={pos ? { top: pos.top, left: pos.left, width: WIDTH } : { visibility: 'hidden' }}
    >
      <div className="pl-pop__title" data-status={status}>
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
      </div>

      {changes.length > 0 ? (
        <ul className="pl-changes">
          {changes.map((c) => (
            <li className="pl-change" key={c.key}>
              <div className="pl-change__head">
                <span className="pl-change__label">{fullLabel(c)}</span>
                {c.at && <span className="pl-change__when">{byLine(c.at)}</span>}
              </div>
              <s className="pl-change__old">{c.before === '' ? 'nothing' : c.before}</s>
              <span className="pl-change__new">{c.after === '' ? 'nothing' : c.after}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pl-pop__same">
          {done ? 'Dev implemented every string as written.' : 'Every string is exactly as dev received it.'}
        </p>
      )}

      <button
        type="button"
        className="pl-log__toggle"
        aria-expanded={logOpen}
        onClick={() => setLogOpen((v) => !v)}
      >
        <span className="pl-log__chevron" data-open={logOpen || undefined}>
          <ChevronIcon size={10} direction="right" />
        </span>
        Activity
        <span className="pl-log__count">
          {log.length} event{log.length === 1 ? '' : 's'}
        </span>
      </button>
      {logOpen && (
        <ol className="pl-log">
          {log.map((e, i) => (
            <li className="pl-log__event" key={`${e.at}-${i}`} data-tone={e.tone}>
              <span className="pl-log__dot" aria-hidden="true" />
              <span className="pl-log__text">{e.text}</span>
              <time className="pl-log__when" dateTime={e.at}>
                {formatWhen(e.at)}
              </time>
            </li>
          ))}
        </ol>
      )}

      <div className="pl-pop__actions">
        {mode === 'market' ? (
          <button type="button" className="pl-textbtn pl-textbtn--danger" onClick={() => pipe.removeReady(section.id)}>
            Remove ready status
          </button>
        ) : status === 'done' ? (
          <button type="button" className="pl-textbtn" onClick={() => pipe.reopen(section.id)}>
            Reopen
          </button>
        ) : (
          <button type="button" className="pl-primary" onClick={() => pipe.markCompleted(section.id)}>
            {done ? 'Mark completed again' : 'Mark completed'}
          </button>
        )}
      </div>
    </div>
  )
}
