import { useState } from 'react'
import closeIcon from '../../assets/icons/action-close-md.svg?raw'
import settingsIcon from '../../assets/icons/nav-settings.svg?raw'
import { Icon } from '../../components/Icon'
import { CoachOrb } from './CoachOrb'
import { CoachPill } from './CoachPill'
import { ALIGNMENT_LABEL, BAND_LABEL, gainIfResolved, reachIfResolved } from './review/score'
import { EVIDENCE_KIND_LABEL, type Finding, type Review, type Severity } from './review/types'
import { CRITERION_BY_ID, type CriterionId } from './review/doctrine'
import './coach.css'
import './results.css'

/**
 * What the Coach found, the score, the ten baseline questions, and every
 * finding laid out as the chain it was built from: what was seen, what backs
 * it, what it may mean, what to do (or why not yet), and how sure.
 */
export function CoachResults({
  review,
  onOpen,
  onSelect,
  onFix,
  onFixWith,
  selectedId,
  writingId = null,
  copyNote = null,
  onAgain,
  onClose,
}: {
  review: Review
  onOpen: (stepId: string) => void
  /** A finding was clicked: go to its screen and light up what it names. */
  onSelect: (finding: Finding) => void
  /** Apply the finding's own fix. */
  onFix: (finding: Finding) => void
  /** Write the copy again, with the person's own instruction where they gave one. */
  onFixWith: (finding: Finding, instruction?: string) => void
  selectedId?: string | null
  /** The finding whose copy is being written right now. */
  writingId?: string | null
  /** Why a write did not produce anything, for the card that asked. */
  copyNote?: { id: string; note: string } | null
  onAgain: () => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'issues' | 'score'>('issues')
  const [filter, setFilter] = useState<Severity | 'all'>('all')
  const [question, setQuestion] = useState<CriterionId | null>(null)
  const { health, alignment, byScreen, findings } = review
  const fixes = findings.filter((f) => f.severity === 'fix').length
  const tests = findings.filter((f) => f.severity === 'test').length
  const checks = findings.filter((f) => f.severity === 'check').length
  const notes = findings.filter((f) => f.severity === 'note').length
  const shown = findings.filter((f) => (filter === 'all' || f.severity === filter) && (!question || f.criterion === question))
  const startHealth = review.start?.health
  const delta = startHealth === undefined ? 0 : health.overall - startHealth

  // Grouped by screen, in the order the journey runs. The whole journey first.
  const groups = byScreen
    .map((sc) => ({ ...sc, items: shown.filter((f) => f.screen === sc.screen) }))
    .filter((g) => g.items.length > 0)

  /** From the score tab to the issues that explain one question. */
  const showIssuesFor = (id: CriterionId) => {
    setQuestion(id)
    setFilter('all')
    setTab('issues')
  }

  return (
    <section className="cr" aria-label="Coach review">
      <header className="cr__head">
        <h2 className="cr__title">
          <CoachOrb size={16} /> Coach review
        </h2>
        {/* Shown on hover only: changing the goal is the rare action here. */}
        <button type="button" className="cr__again" onClick={onAgain} aria-label="Change the goal and review again" title="Change the goal and review again">
          <Icon svg={settingsIcon} size={16} />
        </button>
        <button type="button" className="cr__close" onClick={onClose} aria-label="Close the Coach review" title="Close">
          <Icon svg={closeIcon} size={16} />
        </button>
      </header>

      {/* The verdict, in one glance. */}
      <div className="cr__score" data-band={health.band}>
        <div className="cr__number">
          <span className="cr__big">{health.overall}</span>
          <span className="cr__band">
            {BAND_LABEL[health.band]}
            {startHealth !== undefined && delta !== 0 && (
              <small className="cr__progress" data-up={delta > 0 || undefined}>
                {delta > 0 ? `+${delta}` : delta} since you started
              </small>
            )}
          </span>
        </div>
        <p className="cr__meaning">
          Journey health, out of 100: how well the journey answers the eight baseline questions. The same for this journey whichever goal you pick. Goal alignment is scored separately below.
        </p>
        {/* The counts are the filters: tap one to see only those. */}
        <div className="cr__counts" role="group" aria-label="Show">
          <button type="button" className="cr__count" data-severity="fix" data-on={filter === 'fix' || undefined} onClick={() => { setFilter((f) => (f === 'fix' ? 'all' : 'fix')); setTab('issues') }}>
            <strong>{fixes}</strong> to fix
          </button>
          <button type="button" className="cr__count" data-severity="test" data-on={filter === 'test' || undefined} onClick={() => { setFilter((f) => (f === 'test' ? 'all' : 'test')); setTab('issues') }}>
            <strong>{tests}</strong> to test
          </button>
          <button type="button" className="cr__count" data-severity="check" data-on={filter === 'check' || undefined} onClick={() => { setFilter((f) => (f === 'check' ? 'all' : 'check')); setTab('issues') }}>
            <strong>{checks}</strong> to check
          </button>
          <button type="button" className="cr__count" data-severity="note" data-on={filter === 'note' || undefined} onClick={() => { setFilter((f) => (f === 'note' ? 'all' : 'note')); setTab('issues') }}>
            <strong>{notes}</strong> notes
          </button>
        </div>
      </div>

      <div className="cr__tabs" role="tablist">
        <button type="button" role="tab" className="cr__tab" aria-selected={tab === 'issues'} onClick={() => setTab('issues')}>
          Issues
        </button>
        <button type="button" role="tab" className="cr__tab" aria-selected={tab === 'score'} onClick={() => setTab('score')}>
          How the score is made
        </button>
      </div>

      {tab === 'score' && (
        <>
          <section className="cr__block">
            <p className="cr__sub">The questions the Coach asks of every journey. Tap one to see what pulls it down. Goal alignment is the ninth and is scored on its own.</p>
            <ol className="cr__criteria">
              {health.byCriterion.filter((c) => c.id !== 'goal-alignment').map((c) => {
                const started = review.start?.byCriterion[c.id]
                const moved = started === undefined ? 0 : c.score - started
                const reach = reachIfResolved(findings, c.id)
                const open = question === c.id
                const band = c.score >= 85 ? 'strong' : c.score >= 70 ? 'sound' : c.score >= 50 ? 'needs-work' : 'at-risk'
                return (
                  <li key={c.id} className="cr__criterion" data-on={open || undefined} data-band={band}>
                    <button type="button" className="cr__c-row" aria-expanded={open} onClick={() => setQuestion((q) => (q === c.id ? null : c.id))}>
                      <span className="cr__c-n">{c.n}</span>
                      <span className="cr__c-label">
                        {c.label}
                          </span>
                      <span className="cr__c-bar" aria-hidden="true">
                        <span className="cr__c-fill" style={{ inlineSize: `${c.score}%` }} data-band={band} />
                      </span>
                      <span className="cr__c-score">
                        {c.score}
                        {moved !== 0 && <small className="cr__c-delta" data-up={moved > 0 || undefined}>{moved > 0 ? `+${moved}` : moved}</small>}
                      </span>
                    </button>
                    {open && (
                      <div className="cr__asked">
                        <p className="cr__asked-q">{c.question}</p>
                        <p className="cr__asked-why">
                          {c.fixes + c.checks === 0
                            ? 'Nothing pulls this down.'
                            : `${[c.fixes ? `${c.fixes} to fix` : '', c.tests ? `${c.tests} to test` : '', c.checks ? `${c.checks} to check` : ''].filter(Boolean).join(', ')} pull this down.${c.fixes ? ` Fix them and it reaches ${reach.fixesDone}.` : ''}${c.tests + c.checks > 0 && reach.allSettled > reach.fixesDone ? ` Settle the rest too and it reaches ${reach.allSettled}.` : ''}`}
                        </p>
                        {c.fixes + c.tests + c.checks > 0 && (
                          <button type="button" className="cr__go" onClick={() => showIssuesFor(c.id)}>
                            See them
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>

          {alignment.length > 0 && (
            <section className="cr__block">
              <h3 className="cr__h">Goal alignment</h3>
              <p className="cr__sub">How strongly this journey supports the direction you set. Kept apart from journey health on purpose: a healthy journey can still point the wrong way.</p>
              <ul className="cr__goals">
                {alignment.map((g) => (
                  <li key={g.goal} className="cr__goal" data-band={g.band}>
                    <span className="cr__goal-name">
                      {g.label}
                      <small>{ALIGNMENT_LABEL[g.band]}</small>
                    </span>
                    <span className="cr__goal-score">{g.score}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="cr__reliability">
            Scoring weights are product-defined, not calibrated against DAZN data.
            {review.reliability.guarded > 0 && ` The Coach held back ${review.reliability.guarded} of its own ${review.reliability.total} readings for want of evidence; that is a note on the Coach, and it does not affect the journey's score.`}
          </p>

          <p className="cr__ai" data-state={review.ai}>
            {review.ai === 'pending' && 'The AI is reading the copy too…'}
            {review.ai === 'done' && `Rules and AI reading, combined. ${review.aiNote ?? ''}`}
            {review.ai === 'unavailable' && 'Rules only. Add an AI key for the copy reading.'}
            {review.ai === 'failed' && 'Rules only. The AI reading did not come back.'}
          </p>
        </>
      )}

      {tab === 'issues' && (
        <>
          {question && (
            <div className="cr__asked cr__asked--filter">
              <p className="cr__asked-q">{CRITERION_BY_ID[question].label}: {CRITERION_BY_ID[question].question}</p>
              <button type="button" className="cr__go" onClick={() => setQuestion(null)}>
                Show all issues
              </button>
            </div>
          )}
          {groups.length === 0 && <p className="cr__empty">Nothing here.</p>}
          {groups.map((g) => (
            <section key={g.screen} className="cr__screen">
              <h3 className="cr__screen-name">
                {g.screen === 'journey' ? (
                  <span>{g.name}</span>
                ) : (
                  <button type="button" className="cr__screen-link" onClick={() => onOpen(g.screen)} title="Open this screen">
                    {g.name}
                  </button>
                )}
                <span className="cr__screen-meta">
                  {g.items.length} {g.items.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
              {g.items.map((f) => (
                <FindingCard
                  key={f.id}
                  f={f}
                  gain={gainIfResolved(findings, f)}
                  writing={writingId === f.id}
                  note={copyNote?.id === f.id ? copyNote.note : null}
                  selected={f.id === selectedId}
                  onSelect={() => onSelect(f)}
                  onFix={() => onFix(f)}
                  onFixWith={(instruction) => onFixWith(f, instruction)}
                />
              ))}
            </section>
          ))}
        </>
      )}
    </section>
  )
}

const CONFIDENCE_WORD: Record<Finding['confidence'], string> = { high: 'Certain', medium: 'Likely', low: 'Possible' }

/**
 * One finding as a card: what I see, why it matters, what to do. The Fix
 * pill and "Show on screen" sit under it; evidence and the sciences are
 * behind Details.
 */
function FindingCard({
  f,
  gain,
  writing,
  note,
  selected,
  onSelect,
  onFix,
  onFixWith,
}: {
  f: Finding
  gain: number
  /** The Copy AI is writing this one's copy right now. */
  writing: boolean
  /** Why the last write produced nothing, if it did not. */
  note: string | null
  selected: boolean
  onSelect: () => void
  onFix: () => void
  onFixWith: (instruction?: string) => void
}) {
  const canGo = f.screen !== 'journey'
  /**
   * One action opens the finding: it lights up the words on the screen and
   * shows the reasoning underneath. Two buttons for that read as two
   * different things when they are the same thing.
   */
  const [open, setOpen] = useState(false)
  const review = () => {
    const next = !open
    setOpen(next)
    if (next && canGo) onSelect()
  }

  /**
   * The Coach's brief is not always what you want said. Hovering the fix
   * button offers the Coach's own brief, or your instruction instead. Keyboard
   * reaches it the same way: focus lands on the pill, which opens the menu.
   */
  const [asking, setAsking] = useState(false)
  const [prompt, setPrompt] = useState('')
  /** The instruction the copy on screen was written to, where there was one. */
  const [askedFor, setAskedFor] = useState<string | null>(null)

  const approved = f.suggestion?.approved ? f.suggestion : null
  /** Ready to apply, or ready to be written. Both live on the same button. */
  const canApply = Boolean(f.fix || approved)
  const canWrite = Boolean(f.copyTarget) && !canApply
  /** Anything the Copy AI can write, you can also write to your own brief. */
  const canPrompt = Boolean(f.copyTarget)
  const fixLabel = writing
    ? 'Writing the copy…'
    : f.fix
      ? f.fix.label
      : approved
        ? 'Apply the suggested copy'
        : 'Write the fix with AI'

  /** What the suggested-copy block says, in every state it can be in. */
  const copyBlock = () => {
    if (f.fix && 'replace' in f.fix) {
      const r = f.fix.replace[0]
      const before = /^(path|tier|feature):/.test(r.from) ? (f.copyTarget?.current ?? f.highlight?.[0] ?? '') : r.from
      return (
        <div className="cr__copy" data-state="approved">
          <p className="cr__copy-line"><span className="cr__copy-k">Now</span> <s>{before}</s></p>
          <p className="cr__copy-line"><span className="cr__copy-k">Change to</span> <strong>{r.to}</strong></p>
          <p className="cr__copy-by">The content itself shows the right wording. Approved.</p>
        </div>
      )
    }
    if (f.fix && 'trim' in f.fix) return <p className="cr__copy-by">Removes stray spaces. Nothing is reworded.</p>
    if (!f.copyTarget) return <p className="cr__copy-by">This is not about one piece of copy, so there is nothing to rewrite. The recommendation above is the change.</p>
    if (approved) {
      return (
        <div className="cr__copy" data-state="approved">
          <p className="cr__copy-line"><span className="cr__copy-k">Now</span> <s>{f.copyTarget.current}</s></p>
          <p className="cr__copy-line"><span className="cr__copy-k">Change to</span> <strong>{approved.after}</strong></p>
          <p className="cr__copy-by">
            {approved.source === 'ai'
              ? askedFor
                ? `Written by the Copy AI to your instruction, “${askedFor}”. The Coach approved it.`
                : 'Written by the Copy AI to the Coach’s criteria. The Coach approved it.'
              : `Written from the content. Approved.${approved.why ? ` ${approved.why}` : ''}`}
          </p>
        </div>
      )
    }
    if (f.suggestion && !f.suggestion.approved) {
      return (
        <div className="cr__copy" data-state="rejected">
          <p className="cr__copy-line"><span className="cr__copy-k">Proposed</span> <s>{f.suggestion.after}</s></p>
          <p className="cr__copy-by">The Copy AI wrote this. The Coach did not approve it: {f.suggestion.reason} Press the button again to have another go.</p>
        </div>
      )
    }
    if (writing) return <p className="cr__copy-by" data-state="pending">The Copy AI is writing “{f.copyTarget.label}” to the Coach’s criteria…</p>
    if (note) return <p className="cr__copy-by" data-state="pending">{note}</p>
    return <p className="cr__copy-by">Press Fix and the Copy AI will write “{f.copyTarget.label}” to the Coach’s criteria. Nothing changes until the Coach approves it.</p>
  }

  return (
    <article className="cr__card" data-severity={f.severity} data-selected={selected || undefined}>
      <button type="button" className="cr__card-head" onClick={review} title={canGo ? 'Show it on the screen and read the reasoning' : 'Read the reasoning'}>
        <span className="cr__chip" data-severity={f.severity}>
          {f.severity === 'fix' ? 'Fix' : f.severity === 'test' ? 'Test' : f.severity === 'check' ? 'Check' : 'Note'}
        </span>
        <span className="cr__crit">{CRITERION_BY_ID[f.criterion].label}</span>
        {f.source === 'ai' && <span className="cr__tag">AI</span>}
        {gain > 0 && (
          <span className="cr__gain" title={`Worth ${gain} points on ${CRITERION_BY_ID[f.criterion].label}`}>
            +{gain}
          </span>
        )}
        <span className="cr__conf" data-level={f.confidence}>
          {CONFIDENCE_WORD[f.confidence]}
        </span>
      </button>

      <p className="cr__obs" onClick={review}>{f.observation}</p>
      <p className="cr__why">{f.interpretation}</p>
      {(f.recommendation || f.severity === 'check') && (
        <p className="cr__do">{f.recommendation ?? <em className="cr__none">Not enough evidence to change this yet.</em>}</p>
      )}
      {f.conflict && <p className="cr__conflict">{f.conflict}</p>}

      <div className="cr__actions">
        {canApply || canWrite ? (
          <span className="cr__fix">
            <CoachPill
              size="sm"
              title={canPrompt ? undefined : canWrite ? 'Ask the Copy AI to write this, judged by the Coach' : fixLabel}
              disabled={writing}
              onClick={() => {
                if (canWrite) setOpen(true)
                onFix()
              }}
            >
              {fixLabel}
            </CoachPill>
            {canPrompt && (
              <>
                <div className="cr__menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAsking(false)
                      setOpen(true)
                      setAskedFor(null)
                      if (canWrite) onFix()
                      else onFixWith()
                    }}
                  >
                    <strong>{canWrite ? 'Generate' : 'Generate again'}</strong>
                    <span>The Copy AI writes it to the Coach's brief</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(true)
                      setAsking(true)
                    }}
                  >
                    <strong>Custom prompt</strong>
                    <span>Say how you want it written</span>
                  </button>
                </div>
              </>
            )}
          </span>
        ) : (
          <span className="cr__go cr__go--off" title="Nothing to apply automatically">
            Fix
          </span>
        )}
        <button
          type="button"
          className="cr__go cr__go--details"
          aria-expanded={open}
          title={canGo ? 'Show it on the screen and read the reasoning' : 'Read the reasoning'}
          onClick={review}
        >
          {open ? 'Hide' : 'Review'}
        </button>
      </div>

      {open && asking && (
        <form
          className="cr__prompt"
          onSubmit={(e) => {
            e.preventDefault()
            const said = prompt.trim()
            if (!said || writing) return
            setAskedFor(said)
            onFixWith(said)
          }}
        >
          <label htmlFor={`prompt-${f.id}`}>How do you want this written?</label>
          <textarea
            id={`prompt-${f.id}`}
            rows={2}
            value={prompt}
            autoFocus
            placeholder="Shorter, and say what they get on the first day"
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <div className="cr__prompt-row">
            <p>The Coach still has to approve it. Prices, plan names and claims stay as they are.</p>
            <span>
              <button type="button" className="cr__go" onClick={() => setAsking(false)}>
                Cancel
              </button>
              <CoachPill size="sm" type="submit" disabled={writing || !prompt.trim()}>
                {writing ? 'Writing the copy…' : 'Write it'}
              </CoachPill>
            </span>
          </div>
        </form>
      )}

      {open && (
        <dl className="cr__chain">
          <dt>Suggested copy</dt>
          <dd>{copyBlock()}</dd>
          {f.alternatives && f.alternatives.length > 0 && (
            <>
              <dt>Options weighed</dt>
              <dd>
                <ul className="cr__options">
                  {f.alternatives.map((a) => (
                    <li key={a.option} data-chosen={a.chosen || undefined}>
                      <span className="cr__option-name">
                        {a.option}
                        {a.chosen && <span className="cr__option-pick">chosen</span>}
                      </span>
                      <span className="cr__option-for">For: {a.forIt}</span>
                      <span className="cr__option-against">Against: {a.against}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          <dt>Where I saw it</dt>
          <dd>
            <ul className="cr__evidence">
              {f.evidence.map((e, i) => (
                <li key={i}>
                  <span className="cr__level" data-level={e.kind}>
                    {EVIDENCE_KIND_LABEL[e.kind]}
                  </span>
                  {e.source}
                </li>
              ))}
            </ul>
          </dd>
          {f.nextStep && (
            <>
              <dt>How to be sure</dt>
              <dd>{f.nextStep}</dd>
            </>
          )}
          <dt>Business outcome</dt>
          <dd>{f.businessOutcome}</dd>
        </dl>
      )}
    </article>
  )
}
