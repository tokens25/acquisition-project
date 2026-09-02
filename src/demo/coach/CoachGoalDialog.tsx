import { useEffect, useRef, useState, type ReactNode } from 'react'
import closeIcon from '../../assets/icons/action-close-md.svg?raw'
import { Icon } from '../../components/Icon'
import { Toggle } from '../../components/Toggle'
import { CoachOrb } from './CoachOrb'
import { CoachPill } from './CoachPill'
import './coach.css'
import { BUSINESS_GOALS, type BusinessGoalId, type CoachReviewContext, type GoalPicks } from './brief'

export interface CoachGoalDialogProps {
  open: boolean
  /** The context already set in the panel, shown so the Coach's brief is in one place. */
  /** The plans in this set, in display order. */
  tiers: { id: string; name: string }[]
  /** Team and competition names the set knows. */
  teams: string[]
  /** The feature lines the cards can carry. */
  features: string[]
  /** Real answers from this set, per goal that asks for one. */
  examples: Partial<Record<BusinessGoalId, string[]>>
  onClose: () => void
  onReview: (context: CoachReviewContext) => void
}

const goalPicks = (g: BusinessGoalId): GoalPicks | undefined => {
  const goal = BUSINESS_GOALS.find((x) => x.id === g)
  return goal && 'picks' in goal ? goal.picks : undefined
}

function toggleIn<T extends string>(list: T[], id: T, on: boolean): T[] {
  return on ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id)
}

/**
 * A grouped inset list, the way iOS Settings lays one out: a small grey
 * heading above, a rounded card of hairline-separated rows, a footnote below.
 * The footnote carries the explanation so the rows stay to one word each.
 */
function Group({ heading, footer, children }: { heading: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="coach-goal__group">
      <h3 className="coach-goal__heading">{heading}</h3>
      <ul className="coach-goal__inset">{children}</ul>
      {footer && <p className="coach-goal__footer">{footer}</p>}
    </section>
  )
}

function SwitchRow({
  label,
  hint,
  on,
  onChange,
  ask,
  value,
  onValue,
  picks,
  picked,
  onPick,
  guide,
  examples,
}: {
  label: string
  hint?: string
  on: boolean
  onChange: (on: boolean) => void
  /** Free entry for a goal whose target is not in the set. Shown only while on. */
  ask?: string
  value?: string
  onValue?: (value: string) => void
  /** The set's own things to choose from, shown as chips while on. */
  picks?: string[]
  picked?: string | null
  onPick?: (value: string | null) => void
  /** One line saying what a good answer looks like. */
  guide?: string
  /** Real answers from this set, clickable to fill the field. */
  examples?: string[]
}) {
  const asking = on && (ask || (picks && picks.length > 0) || (examples && examples.length > 0))
  return (
    <li className="coach-goal__row" data-on={on || undefined} data-asking={asking || undefined} title={hint}>
      <span className="coach-goal__row-text">
        {label}
        {hint && <small className="coach-goal__row-hint">{hint}</small>}
        {on && picks && picks.length > 0 && (
          <span className="coach-goal__picks" role="group" aria-label={`Choose for ${label}`}>
            {picks.map((p) => (
              <button
                key={p}
                type="button"
                className="coach-goal__pick"
                aria-pressed={picked === p}
                onClick={() => onPick?.(picked === p ? null : p)}
              >
                {p}
              </button>
            ))}
          </span>
        )}
        {on && ask && (
          <>
            {guide && <small className="coach-goal__guide">{guide}</small>}
            {examples && examples.length > 0 && (
              <span className="coach-goal__picks" role="group" aria-label={`Suggestions for ${label}`}>
                {examples.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="coach-goal__pick"
                    aria-pressed={(value ?? '').trim() === e}
                    title={e}
                    onClick={() => onValue?.((value ?? '').trim() === e ? '' : e)}
                  >
                    {e.length > 44 ? `${e.slice(0, 44)}…` : e}
                  </button>
                ))}
              </span>
            )}
            <input
              type="text"
              className="coach-goal__row-input"
              placeholder={ask}
              value={value ?? ''}
              aria-label={ask}
              onChange={(e) => onValue?.(e.target.value)}
            />
            {examples && examples.length === 0 && <small className="coach-goal__guide">Nothing in this set to suggest. Type it as the campaign says it.</small>}
          </>
        )}
      </span>
      <Toggle label={label} active={on} onChange={onChange} />
    </li>
  )
}

/**
 * "Before the Coach reviews", what the Coach is told before it looks at a
 * single screen, in the brief's order: Business Goal → Package → Constraints →
 * Evidence. Market and journey are already chosen in the panel, so they are
 * shown at the top, not asked again.
 */
export function CoachGoalDialog({ open, tiers, teams, features, examples, onClose, onReview }: CoachGoalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [goals, setGoals] = useState<BusinessGoalId[]>([])
  const [targets, setTargets] = useState<Partial<Record<BusinessGoalId, string>>>({})
  const [picked, setPicked] = useState<Partial<Record<BusinessGoalId, string>>>({})

  // The native dialog owns focus, Escape and the backdrop; we only tell it when.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const ready = goals.length > 0

  return (
    <dialog ref={ref} className="coach-goal" onClose={onClose} aria-labelledby="coach-goal-title">
      <form
        method="dialog"
        className="coach-goal__sheet"
        onSubmit={(e) => {
          e.preventDefault()
          if (!ready) return
          // Constraints and evidence are not asked for now; the Coach treats
          // every reading as unproven until DAZN data says otherwise.
          // A picked plan is the tier to prioritise; a picked team or feature is
          // that goal's target unless something was typed instead.
          const prioritised = [...new Set(goals.flatMap((g) => (goalPicks(g) === 'plans' && picked[g] ? [tiers.find((t) => t.name === picked[g])?.id ?? ''] : [])).filter(Boolean))]
          const merged: Partial<Record<BusinessGoalId, string>> = { ...targets }
          for (const g of goals) if (picked[g] && !merged[g]?.trim()) merged[g] = picked[g]
          onReview({ businessGoals: goals, targets: merged, prioritisedTiers: prioritised, constraints: [], evidence: [] })
        }}
      >
        <header className="coach-goal__head">
          <h2 id="coach-goal-title" className="coach-goal__title">
            <CoachOrb size={16} /> Before the Coach reviews
          </h2>
          <button type="button" className="coach-goal__close" aria-label="Close" title="Close" onClick={onClose}>
            <Icon svg={closeIcon} size={16} />
          </button>
        </header>
        <p className="coach-goal__lede">What is this journey for? The Coach judges it against your goal, not a generic best practice.</p>

        <div className="coach-goal__body">
          <Group
            heading={
              <>
                Goal <span className="coach-goal__req">Required · what the Coach may optimise</span>
              </>
            }
            footer="The ten baseline questions run whatever you choose. A goal tells the Coach which levers it is allowed to judge, and what to trace through the journey."
          >
            {BUSINESS_GOALS.map((g) => {
              const kind = goalPicks(g.id)
              const options = kind === 'plans' ? tiers.map((t) => t.name) : kind === 'teams' ? teams : kind === 'features' ? features : undefined
              return (
                <SwitchRow
                  key={g.id}
                  label={g.label}
                  hint={g.hint}
                  on={goals.includes(g.id)}
                  onChange={(on) => setGoals((l) => toggleIn(l, g.id, on))}
                  ask={'asks' in g ? g.asks : undefined}
                  value={targets[g.id]}
                  onValue={(v) => setTargets((t) => ({ ...t, [g.id]: v }))}
                  picks={options}
                  picked={picked[g.id] ?? null}
                  onPick={(v) => setPicked((pk) => ({ ...pk, [g.id]: v ?? undefined }))}
                  guide={'guide' in g ? g.guide : undefined}
                  examples={'asks' in g ? examples[g.id] ?? [] : undefined}
                />
              )
            })}
          </Group>
        </div>

        <footer className="coach-goal__foot">
          <CoachPill
            size="lg"
            title={ready ? 'Review every screen of this journey' : 'Turn on at least one business goal first'}
            disabled={!ready}
            onClick={() => ref.current?.querySelector('form')?.requestSubmit()}
          >
            Review the journey
          </CoachPill>
        </footer>
      </form>
    </dialog>
  )
}
