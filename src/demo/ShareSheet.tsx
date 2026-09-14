import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import closeIcon from '../assets/icons/action-close-md.svg?raw'
import { ACCOUNT } from '../account/account'
import { useDialog } from '../account/useDialog'
import { clickedAway } from '../components/dismiss'
import { Icon } from '../components/Icon'
import { CheckIcon, ChevronIcon, CodeIcon, CopyIcon } from './pipeline/icons'
import './share-sheet.css'

/**
 * Handing the page to somebody else.
 *
 * The shape is the one every design tool has settled on, and the reason it has
 * is worth stating: sharing is two different questions that look like one.
 * Who may open it — a list, and a level against each name — and how you get it
 * to them, which is a link of one kind or another. The sheet answers them in
 * that order and keeps them apart.
 *
 * What is real here and what is not: every link this copies is a real link to
 * this page, and Export JSON downloads what the tool actually holds. Who has
 * access is drawn and not enforced — there is nothing behind this to enforce
 * it with, and a permission that is not checked is worse than one that is not
 * offered, so it is marked rather than pretended at.
 */
export function ShareSheet({
  open,
  what,
  onClose,
  onCopyLink,
  onCopyDevLink,
  onCopyPrototypeLink,
  onExport,
}: {
  open: boolean
  /** What is being shared, in the words the tool uses for it. */
  what: string
  onClose: () => void
  onCopyLink: () => void
  onCopyDevLink: () => void
  onCopyPrototypeLink: () => void
  onExport: () => void
}) {
  const ref = useDialog(open)
  const [invite, setInvite] = useState('')
  /* Entered and kept, against what is still being typed. */
  const [guests, setGuests] = useState<string[]>([])
  const [asked, setAsked] = useState<Level>('edit')
  const [people, setPeople] = useState<Person[]>(PEOPLE)
  const typing = useRef<HTMLInputElement>(null)

  /** What has been typed becomes one of them, if it is anything at all. */
  const keep = () => {
    const one = invite.trim().replace(/,$/, '')
    if (one === '') return
    setGuests((all) => (all.includes(one) ? all : [...all, one]))
    setInvite('')
  }
  const anyone = guests.length > 0 || invite.trim() !== ''
  const [copied, setCopied] = useState<string | null>(null)
  /* Which of the sheet's two views is showing. The second is a settings page
     rather than a second dialog: it is the same thing being looked at more
     closely, and stacking a modal on a modal to say so is a way of losing
     where you were. */
  const [view, setView] = useState<View>('main')
  const [scope, setScope] = useState<Scope>('org')
  const [access, setAccess] = useState<Access>('view')
  const [searchable, setSearchable] = useState(false)
  const [canTake, setCanTake] = useState(true)
  /* What they were on the way in, so Cancel means it. */
  const [was, setWas] = useState<Settings>({
    scope: 'org',
    access: 'view',
    searchable: false,
    canTake: true,
  })

  const enter = () => {
    setWas({ scope, access, searchable, canTake })
    setView('settings')
  }
  const cancel = () => {
    setScope(was.scope)
    setAccess(was.access)
    setSearchable(was.searchable)
    setCanTake(was.canTake)
    setView('main')
  }
  const changed =
    scope !== was.scope ||
    access !== was.access ||
    searchable !== was.searchable ||
    canTake !== was.canTake

  /** Says which one took, so the row reports rather than the whole sheet. */
  const did = (name: string, run: () => void) => () => {
    run()
    setCopied(name)
    window.setTimeout(() => setCopied((c) => (c === name ? null : c)), 1600)
  }

  return (
    <dialog
      ref={ref}
      className="shr"
      onClose={onClose}
      onClick={(e) => clickedAway(e) && onClose()}
      aria-labelledby="shr-title"
    >
      <div className="shr__sheet" data-view={view}>
        {view === 'people' ? (
          <div className="shr__card">
            <header className="shr__head">
              <button
                type="button"
                className="shr__back"
                aria-label="Back to sharing"
                title="Back"
                onClick={() => setView('main')}
              >
                <ChevronIcon size={14} direction="right" />
              </button>
              <h2 className="shr__title">Collaborators in this file</h2>
              <button
                type="button"
                className="shr__close"
                aria-label="Close"
                title="Close"
                onClick={onClose}
              >
                <Icon svg={closeIcon} size={24} />
              </button>
            </header>

            <ul className="shr__people">
              {people.map((one) => (
                <li className="shr__person" key={one.name}>
                  <span className="shr__face" style={{ background: one.tint }} aria-hidden="true">
                    {one.name.slice(0, 1)}
                  </span>
                  <span className="shr__name">
                    {one.name}
                    {one.you && <span className="shr__you"> (you)</span>}
                  </span>
                  {/* The owner's level is a fact rather than a choice: there is
                      one of them and it is not in anybody's gift here. */}
                  {one.level === 'owner' ? (
                    <span className="shr__level">owner</span>
                  ) : (
                    <LevelMenu
                      level={one.level}
                      onPick={(next) =>
                        setPeople((all) =>
                          all.map((x) => (x.name === one.name ? { ...x, level: next } : x)),
                        )
                      }
                      onRemove={() =>
                        setPeople((all) => all.filter((x) => x.name !== one.name))
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : view === 'settings' ? (
          <div className="shr__card">
            <header className="shr__head">
              <button
                type="button"
                className="shr__back"
                aria-label="Back to sharing"
                title="Back"
                onClick={cancel}
              >
                <ChevronIcon size={14} direction="right" />
              </button>
              <h2 className="shr__title">Share settings</h2>
              <button
                type="button"
                className="shr__close"
                aria-label="Close"
                title="Close"
                onClick={onClose}
              >
                <Icon svg={closeIcon} size={24} />
              </button>
            </header>

            <p className="shr__who">Who can access</p>
            <ScopePicker scope={scope} onPick={setScope} />
            <p className="shr__note">{SCOPES.find((o) => o.id === scope)?.note}</p>

            <p className="shr__who">What can they do</p>
            <div className="shr__choices" role="radiogroup" aria-label="What can they do">
              {(['view', 'edit'] as Access[]).map((one) => (
                <label className="shr__choice" key={one}>
                  <input
                    type="radio"
                    name="shr-access"
                    checked={access === one}
                    onChange={() => setAccess(one)}
                  />
                  <span>{one === 'view' ? 'View' : 'Edit'}</span>
                </label>
              ))}
            </div>
            <p className="shr__note">
              {access === 'view'
                ? 'Can view and comment on this file.'
                : 'Can change the page and everything on it.'}
            </p>

            <hr className="shr__rule" />

            <p className="shr__who">Advanced</p>
            <label className="shr__check">
              <input
                type="checkbox"
                checked={searchable}
                onChange={(e) => setSearchable(e.target.checked)}
              />
              <span>Discoverable via search</span>
            </label>
            <label className="shr__check">
              <input
                type="checkbox"
                checked={canTake}
                onChange={(e) => setCanTake(e.target.checked)}
              />
              <span>
                Viewers can copy, save, and export from this file
                <small>This setting applies to anyone in the file with can view access</small>
              </span>
            </label>

            <footer className="shr__foot">
              <button type="button" className="shr__cancel" onClick={cancel}>
                Cancel
              </button>
              <button
                type="button"
                className="shr__save"
                disabled={!changed}
                onClick={() => setView('main')}
              >
                Save
              </button>
            </footer>
          </div>
        ) : (
        <>
        <div className="shr__card">
          <header className="shr__head">
            <h2 id="shr-title" className="shr__title">
              Share “{what}”
            </h2>
            <button type="button" className="shr__link" onClick={did('link', onCopyLink)}>
              <CopyIcon size={14} />
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              className="shr__close"
              aria-label="Close"
              title="Close"
              onClick={onClose}
            >
              <Icon svg={closeIcon} size={24} />
            </button>
          </header>

          {/* Each address becomes a chip as it is entered, so the field holds
              a list rather than a sentence somebody has to punctuate. */}
          <div className="shr__invite">
            <div className="shr__field" onClick={() => typing.current?.focus()}>
              {guests.map((one) => (
                <span className="shr__chip" key={one}>
                  {one}
                  <button
                    type="button"
                    className="shr__chip-off"
                    aria-label={`Remove ${one}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setGuests((all) => all.filter((x) => x !== one))
                    }}
                  >
                    <CrossMark />
                  </button>
                </span>
              ))}
              <input
                ref={typing}
                className="shr__typing"
                value={invite}
                placeholder={guests.length === 0 ? 'Add emails, names, or user groups' : ''}
                aria-label="Add emails, names, or user groups"
                onChange={(e) => setInvite(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    keep()
                  }
                  // Backspace on an empty field takes the last one back.
                  if (e.key === 'Backspace' && invite === '') setGuests((all) => all.slice(0, -1))
                }}
                onBlur={keep}
              />
              {(guests.length > 0 || invite.trim() !== '') && (
                <LevelMenu level={asked} onPick={setAsked} />
              )}
            </div>
            <button
              type="button"
              className="shr__ask"
              disabled={!anyone}
              title={
                anyone
                  ? 'Add them to the file'
                  : 'Nobody to invite yet — type an address or a name'
              }
              onClick={() => {
                const all = invite.trim() === '' ? guests : [...guests, invite.trim()]
                setPeople((was) => [
                  ...was,
                  ...all
                    .filter((name) => !was.some((x) => x.name === name))
                    .map((name, i) => ({
                      name,
                      level: asked,
                      tint: TINTS[(was.length + i) % TINTS.length],
                    })),
                ])
                setGuests([])
                setInvite('')
              }}
            >
              Invite
            </button>
          </div>

          <p className="shr__who">Who has access</p>
          <ul className="shr__list">
            <li>
              <button type="button" className="shr__row" onClick={enter}>
                <span className="shr__mark" aria-hidden="true">
                  <DeviceMark />
                </span>
                <span className="shr__name">Anyone in DAZN</span>
                <span className="shr__level">
                  can {access}
                  <ChevronIcon size={12} direction="right" />
                </span>
              </button>
            </li>
            <li>
              <button type="button" className="shr__row" onClick={() => setView('people')}>
                <span className="shr__mark" data-you="" aria-hidden="true">
                  {ACCOUNT.name.slice(0, 1)}
                </span>
                <span className="shr__name">
                  {ACCOUNT.name}
                  {people.length > 1 && ` and ${people.length - 1} others`}
                </span>
                <span className="shr__level">
                  can access
                  <ChevronIcon size={12} direction="right" />
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* The ways to hand it over, under the question of who may have it. */}
        <div className="shr__card shr__card--acts">
          <button type="button" className="shr__act" onClick={did('dev', onCopyDevLink)}>
            <CodeIcon size={14} />
            {copied === 'dev' ? 'Copied' : 'Copy Dev Mode link'}
          </button>
          <button
            type="button"
            className="shr__act"
            onClick={did('proto', onCopyPrototypeLink)}
          >
            <PlayIcon />
            {copied === 'proto' ? 'Copied' : 'Copy prototype link'}
          </button>
          <button type="button" className="shr__act" onClick={onExport}>
            <BraceIcon />
            Export JSON
          </button>
        </div>
        </>
        )}
      </div>
    </dialog>
  )
}

type Access = 'view' | 'edit'
type Scope = 'invited' | 'org' | 'anyone'
type View = 'main' | 'settings' | 'people'
type Level = 'edit' | 'view' | 'owner'
interface Person {
  name: string
  level: Level
  tint: string
  you?: boolean
}

/**
 * Who is in the file.
 *
 * Made up, like the account this tool is used under: there is nothing behind
 * it holding a list of people, and a list drawn from nothing is the honest
 * version of one — it says what the sheet would show rather than inventing a
 * back end to show it from.
 */
const PEOPLE: Person[] = [
  { name: ACCOUNT.name, level: 'owner', tint: '#d12424', you: true },
  { name: 'Alona Goldberg', level: 'edit', tint: '#4a4ae0' },
  { name: 'Fillip', level: 'edit', tint: '#a78bfa' },
  { name: 'Luka', level: 'edit', tint: '#3d4549' },
  { name: 'Meenakshi Thaploo', level: 'edit', tint: '#f08a7a' },
]

/** Colours for anybody invited from here, in the order they arrive. */
const TINTS = ['#4a4ae0', '#a78bfa', '#3d4549', '#f08a7a', '#2a8f6b']

const LEVELS: { id: Level; label: string }[] = [
  { id: 'edit', label: 'can edit' },
  { id: 'view', label: 'can view' },
]

/** One person's level, the two it can be, and the way out of the file. */
function LevelMenu({
  level,
  onPick,
  onRemove,
}: {
  level: Level
  onPick: (next: Level) => void
  /** Absent where there is nobody to remove yet — the invite row. */
  onRemove?: () => void
}) {
  const [open, setOpen] = useState(false)
  /* Which way it opened. Decided when it opens rather than held: where the
     row is depends on how many people are above it. */
  const [up, setUp] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  return (
    <div className="shr__level-wrap" ref={box}>
      <button
        type="button"
        className="shr__level shr__level--pick"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          // Three items and their rule, near enough: enough to know whether
          // they will fit under the row that opened them.
          const room = window.innerHeight - e.currentTarget.getBoundingClientRect().bottom
          setUp(room < 150)
          setOpen((v) => !v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        {LEVELS.find((l) => l.id === level)?.label}
        <ChevronIcon size={12} />
      </button>
      {open && (
        <ul
          className="shr__menu shr__menu--level"
          data-up={up || undefined}
          role="listbox"
          aria-label="What they can do"
        >
          {LEVELS.map((one) => (
            <li key={one.id}>
              <button
                type="button"
                className="shr__option"
                role="option"
                aria-selected={one.id === level}
                onClick={() => {
                  onPick(one.id)
                  setOpen(false)
                }}
              >
                <span className="shr__option-tick" aria-hidden="true">
                  {one.id === level && <CheckIcon size={12} />}
                </span>
                {one.label}
              </button>
            </li>
          ))}
          {/* Under a rule, because it is not a third level: the two above
              change what somebody can do and this one ends their being here
              at all. */}
          {onRemove && (
            <>
              <li className="shr__menu-rule" role="presentation" />
              <li>
                <button
                  type="button"
                  className="shr__option"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onRemove()
                    setOpen(false)
                  }}
                >
                  <span className="shr__option-tick" aria-hidden="true" />
                  Remove
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  )
}
interface Settings {
  scope: Scope
  access: Access
  searchable: boolean
  canTake: boolean
}

/**
 * How wide the door is open.
 *
 * Three, narrowest first, which is the order they are drawn in and the order
 * that lets somebody read down the list and stop at the first one they are
 * willing to give. Only the middle one's line is the design's; the two either
 * side say the same kind of thing in the same voice.
 */
const SCOPES: { id: Scope; label: string; note: string; mark: () => ReactNode }[] = [
  {
    id: 'invited',
    label: 'People invited to file',
    note: 'Only the people named above can open it.',
    mark: () => <LockMark />,
  },
  {
    id: 'org',
    label: 'DAZN',
    note: 'Org members can access this file via link or through the file browser.',
    mark: () => <DeviceMark />,
  },
  {
    id: 'anyone',
    label: 'Anyone',
    note: 'Anyone with the link can open it, inside DAZN or outside.',
    mark: () => <GlobeMark />,
  },
]

/**
 * The scope, and the three it can be.
 *
 * Hand-built rather than a `select`, which this codebase otherwise prefers and
 * for good reasons — the browser's own list brings its keyboard and its mobile
 * behaviour for nothing. It cannot bring an icon per option or a tick against
 * the chosen one, and both are what this list is: three doors, told apart at a
 * glance. So the keyboard is written out here instead of borrowed.
 */
function ScopePicker({ scope, onPick }: { scope: Scope; onPick: (next: Scope) => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const chosen = SCOPES.find((o) => o.id === scope) ?? SCOPES[1]

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  const step = (by: number) => {
    const at = SCOPES.findIndex((o) => o.id === scope)
    onPick(SCOPES[Math.max(0, Math.min(SCOPES.length - 1, at + by))].id)
  }

  return (
    <div className="shr__scope-wrap" ref={box}>
      <button
        type="button"
        className="shr__scope"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (open) step(1)
            else setOpen(true)
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            step(-1)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        {chosen.mark()}
        <span className="shr__scope-value">{chosen.label}</span>
        <ChevronIcon size={12} />
      </button>
      {open && (
        <ul className="shr__menu" role="listbox" aria-label="Who can access">
          {SCOPES.map((one) => (
            <li key={one.id}>
              <button
                type="button"
                className="shr__option"
                role="option"
                aria-selected={one.id === scope}
                onClick={() => {
                  onPick(one.id)
                  setOpen(false)
                }}
              >
                <span className="shr__option-tick" aria-hidden="true">
                  {one.id === scope && <CheckIcon size={12} />}
                </span>
                {one.mark()}
                {one.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** The cross on a chip, at a chip's size — the DS icon starts at 16. */
function CrossMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

/** Only the invited: a padlock. */
function LockMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  )
}

/** Anyone at all: a globe. */
function GlobeMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11M8 2.5c1.6 1.6 2.4 3.5 2.4 5.5S9.6 12 8 13.5C6.4 12 5.6 10 5.6 8s.8-3.9 2.4-5.5Z" />
    </svg>
  )
}

/** The org, drawn as the two screens the design puts against it. */
function DeviceMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.5" y="3" width="8" height="7" rx="1.2" />
      <path d="M3.5 12.5h4" />
      <rect x="11" y="5.5" width="3.5" height="7" rx="1" />
    </svg>
  )
}

/** Walking the prototype: the same triangle the preview button's row uses. */
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3.5 12.5 8 5 12.5Z" />
    </svg>
  )
}

/** What the tool holds, as the tool holds it. */
function BraceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 2.5c-1.6 0-2 .9-2 2v1.6c0 1-.5 1.4-1.5 1.4 1 0 1.5.5 1.5 1.4v1.6c0 1.1.4 2 2 2" />
      <path d="M9.5 2.5c1.6 0 2 .9 2 2v1.6c0 1 .5 1.4 1.5 1.4-1 0-1.5.5-1.5 1.4v1.6c0 1.1-.4 2-2 2" />
    </svg>
  )
}
