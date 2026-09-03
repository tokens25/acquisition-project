import '../App.css'
import { resolveFlow } from '../rules/layers'
import './demo.css'
import './fields.css'
import './pipeline/pipeline.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import daznLogo from '../assets/brand/logo-dazn.svg?raw'
import { StepPreview } from '../card/StepPreview'
import { Icon } from '../components/Icon'
import { useCardSet } from '../editor/useCardSet'
import { planJourney } from '../rules/journey'
import { summarise, validateAll } from '../rules/validate'
import { Button } from '../components/Button'
import { DefaultPanel } from './DefaultPanel'
import { EditPanel } from './EditPanel'
import { FlowPanel } from './FlowPanel'
import { UserFlow } from './UserFlow'
import { iconArtwork } from '../card/assets'
import { JourneyFrames } from './JourneyFrames'
import { Prototype } from './Prototype'
import type { Mode } from '../rules/pipeline'
import { changeMap } from '../rules/pipeline'
import { FieldMarks } from '../components/fieldMarks'
import { TranslationBar } from '../translate/TranslationBar'
import { TranslationMarks, type TranslationMark } from '../translate/marks'
import { useTranslations } from '../translate/useTranslations'
import { LanguageSwitcher } from '../translate/LanguageSwitcher'
import { languagesIn } from '../translate/languages'
import { currentAt, viewSet } from '../translate/apply'
import { DevStrings } from './pipeline/DevStrings'
import { ModeToggle } from './pipeline/ModeToggle'
import { CodeIcon } from './pipeline/icons'
import { SectionMarker } from './pipeline/SectionMarker'
import { StatusChip } from './pipeline/StatusChip'
import { usePipeline } from './pipeline/usePipeline'
import { CoachPill } from './coach/CoachPill'
import { CoachGoalDialog } from './coach/CoachGoalDialog'
import type { CoachReviewContext } from './coach/brief'
import { CoachMark } from './coach/CoachMark'
import { CoachResults } from './coach/CoachResults'
import { askCoachAi, askCopySuggestions } from './coach/review/ai'
import type { CopySuggestion } from './coach/review/types'
import { runCoach } from './coach/review/coach'
import { patchesFor } from './coach/review/fix'
import { useCoachHighlight } from './coach/useCoachHighlight'
import type { Finding } from './coach/review/types'
import { buildSnapshot } from './coach/review/snapshot'
import type { Review } from './coach/review/types'

/**
 * The redesigned interface, at /demo.
 *
 * Two views rather than one long form. The default view asks which situation is
 * being authored for; the edit view edits one step of the journey that answers.
 * The old interface stays at / until this one earns the swap.
 */
export function DemoApp() {
  const store = useCardSet()
  const [editing, setEditing] = useState(false)
  const [prototype, setPrototype] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)

  const [review, setReview] = useState<Review | null>(null)
  const [coachView, setCoachView] = useState(false)
  const [selected, setSelected] = useState<Finding | null>(null)
  /** What the AI added last time, kept so a re-run after an edit keeps it. */
  const aiExtra = useRef<Finding[]>([])
  useCoachHighlight(selected?.highlight ?? null, [store.set, editing, selected?.id])
  /** Copy the Copy brain wrote and the Coach judged, by finding id. */
  const [suggestions, setSuggestions] = useState<Record<string, CopySuggestion>>({})
  /** Which finding is having its copy written right now, and how that went. */
  const [writing, setWriting] = useState<string | null>(null)
  const [copyNote, setCopyNote] = useState<{ id: string; note: string } | null>(null)

  /** Findings with the copy that has been written for them so far. */
  const withSuggestions = (r: Review): Review => ({
    ...r,
    findings: r.findings.map((f) => (f.suggestion || !suggestions[f.id] ? f : { ...f, suggestion: suggestions[f.id] })),
  })

  /** Go to the finding's screen and light up the strings it names. */
  const selectFinding = (f: Finding) => {
    setSelected(f)
    if (f.screen !== 'journey') openStep(f.screen)
  }

  /** Write the copy a finding asks for, then let the Coach judge it. */
  const writeCopy = async (f: Finding, instruction?: string, rewrite = false) => {
    if (!f.copyTarget || !review) return
    setWriting(f.id)
    setCopyNote(null)
    const snapshot = buildSnapshot(store.set, store.journey, store.context, planned)
    const res = await askCopySuggestions(snapshot, review.context, [f], instruction, rewrite)
    setWriting(null)
    if (res.status !== 'done') {
      setCopyNote({ id: f.id, note: res.note })
      return
    }
    const written = res.suggestions[f.id]
    if (!written) {
      setCopyNote({ id: f.id, note: 'The Copy AI did not answer for this one. Try again.' })
      return
    }
    setSuggestions((prev) => ({ ...prev, [f.id]: written }))
  }

  /**
   * Apply the fix through the same store methods the panel uses.
   *
   * Where the content proves the change, it happens at once. Where the change
   * is a piece of copy nobody has written yet, this asks the Copy AI for it
   * against the Coach's criteria; the Coach judges what comes back, and only
   * then is there something to apply. So the first press writes and the second
   * applies, and nothing lands that the Coach has not approved.
   */
  const applyFix = (f: Finding) => {
    const written = f.suggestion ?? suggestions[f.id]
    const fix =
      f.fix ??
      (f.copyTarget && written?.approved
        ? { label: 'Apply the suggested copy', replace: [{ from: f.copyTarget.path, to: written.after }] }
        : undefined)
    if (!fix) {
      if (f.copyTarget) void writeCopy(f)
      return
    }
    const patches = patchesFor(store.set, fix)
    if (patches.changed === 0) return
    const setPatch: Partial<typeof store.set> = {}
    if (patches.flow) Object.assign(setPatch, patches.flow)
    if (patches.featureCatalog) setPatch.featureCatalog = patches.featureCatalog
    if (Object.keys(setPatch).length) store.updateSet(setPatch)
    for (const t of patches.tiers) store.updateTier(t.id, t.patch)
    setSelected(null)
  }

  /**
   * The review follows the content: edit a string, fix a finding, and the
   * rules run again so what was fixed leaves the list.
   *
   * Guarded by what the review is actually made of rather than by the identity
   * of the objects carrying it. Running the rules sets state, so a dependency
   * that is a fresh object on every render would run the rules again, and again,
   * until React gave up and the screen stopped answering clicks. The guard
   * means the worst any such dependency can now cost is one wasted compare.
   */
  const lastReviewed = useRef('')
  useEffect(() => {
    if (!review) return
    const inputs = JSON.stringify([store.set, store.journey.steps.map((s) => s.id), store.context])
    if (inputs === lastReviewed.current) return
    lastReviewed.current = inputs
    const snapshot = buildSnapshot(store.set, store.journey, store.context, planJourney(store.journey, store.context))
    setReview((r) => (r ? { ...runCoach(snapshot, r.context, aiExtra.current), at: r.at, ai: r.ai, aiNote: r.aiNote, start: r.start } : r))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.set, store.journey, store.context, review])

  /**
   * The Coach's review of the whole flow.
   *
   * The rules run first and the result is on screen at once — every
   * contradiction the content proves, scored against the baseline and the
   * goal. The AI reading follows when a key is set, and is merged through the
   * same Coach so it meets the same evidence guard.
   */
  const reviewWithCoach = (context: CoachReviewContext) => {
    const snapshot = buildSnapshot(store.set, store.journey, store.context, planned)
    aiExtra.current = []
    setSelected(null)
    setSuggestions({})
    setCopyNote(null)
    const first = runCoach(snapshot, context)
    first.start = {
      health: first.health.overall,
      alignment: Object.fromEntries(first.alignment.map((a) => [a.goal, a.score])),
      byCriterion: Object.fromEntries(first.health.byCriterion.map((c) => [c.id, c.score])),
    }
    setReview(first)
    setCoachOpen(false)
    setEditing(false)
    // The results live in the left rail, so the rail has to be there: a
    // review started with the panel closed opens it again. It used to close
    // the preview-only view as well; Preview opens the prototype now, and
    // nothing is hiding the rail but the collapse.
    setCollapsed(false)
    setCoachView(true)
    void askCoachAi(snapshot, context, first.findings).then((ai) => {
      setReview((current) => {
        if (!current || current.at !== first.at) return current
        if (ai.status !== 'done') return { ...current, ai: ai.status, aiNote: ai.note }
        aiExtra.current = ai.findings
        const merged = runCoach(snapshot, context, ai.findings)
        return { ...merged, at: current.at, ai: 'done', aiNote: `${ai.findings.length} from the AI, via ${ai.model}.`, start: current.start }
      })
    })
  }

  const planned = planJourney(store.journey, store.context)
  const steps = planned.filter((p) => !p.skipped).map((p) => p.step)
  const step = steps.find((s) => s.id === store.set.stepId) ?? steps[0]
  const coverage = summarise(validateAll(store.set))

  /* ── Market / Dev handoff ──
     Flow sections are named after their steps, as the journey names them. */
  const stepLabels = useMemo(
    () => Object.fromEntries(store.journey.steps.map((s) => [s.id, s.shortName ?? s.name])),
    [store.journey],
  )
  const pipe = usePipeline(store, stepLabels)
  const dev = pipe.mode === 'dev'

  /* Dev sees only the pages Market has marked ready. Market sees everything. */
  const shown = dev ? planned.filter((p) => pipe.doc.ready[p.step.id]) : planned
  const hiddenSteps = planned.length - shown.length
  const readyCount = Object.keys(pipe.doc.ready).length

  const section = step ? pipe.section(step.id) : undefined
  /** Each field's change since dev received it, for the field to show itself. */
  const marks = useMemo(
    () => (dev || !section ? new Map() : changeMap(pipe.doc, section)),
    [dev, section, pipe.doc],
  )
  const chipFor = (id: string) => {
    const s = pipe.section(id)
    return s ? <StatusChip section={s} pipe={pipe} compact /> : null
  }

  const switchMode = (mode: Mode) => {
    pipe.setMode(mode)
    // Whatever field had focus loses it: in Dev nothing is editable, and a
    // caret left blinking in a field that no longer exists is a lie.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    if (mode === 'dev' && editing && step && !pipe.doc.ready[step.id]) setEditing(false)
  }

  // Shift+D flips the mode, unless the keystroke is going into a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      switchMode(dev ? 'market' : 'dev')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const openStep = (id: string) => {
    store.updateSet({ stepId: id })
    setEditing(true)
  }

  /**
   * What the gate says, and the colour it says it in: whether every context
   * the set is sold in still passes the rules.
   */
  /**
   * The words this market reads.
   *
   * Switching to a market whose locale is not English translates the whole
   * flow once and shows it. The panel still edits the English, which is the
   * source; the fields say what the market would read and offer to keep it.
   * Keeping writes it into that market's own copy, so no other market is
   * touched, and only kept words can be published.
   */
  /** The language on screen, when it is not the market's own. */
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const tx = useTranslations(store.set, store.context, language)
  const languages = useMemo(() => languagesIn(store.set), [store.set])
  const marketSet = useMemo(
    () => (tx.state === 'off' ? store.set : viewSet(store.set, store.context.market, tx.entries)),
    [store.set, store.context.market, tx.entries, tx.state],
  )

  const marketLabel = store.set.markets.find((m) => m.code === store.context.market)?.label ?? store.context.market

  const keepTranslation = (key: string, text: string) => {
    const market = store.context.market
    const forMarket = { ...(store.set.copyByMarket?.[market] ?? {}), [key]: text }
    store.updateSet({ copyByMarket: { ...(store.set.copyByMarket ?? {}), [market]: forMarket } })
    tx.accept(key)
  }

  const dropTranslation = (key: string) => {
    const market = store.context.market
    const forMarket = { ...(store.set.copyByMarket?.[market] ?? {}) }
    if (key in forMarket) {
      delete forMarket[key]
      store.updateSet({ copyByMarket: { ...(store.set.copyByMarket ?? {}), [market]: forMarket } })
    }
    tx.discard(key)
  }

  /** What each field says in this market, for the field to draw under itself. */
  const translationMarks = useMemo(() => {
    const map = new Map<string, TranslationMark>()
    if (tx.state === 'off') return map
    const kept = store.set.copyByMarket?.[store.context.market] ?? {}
    for (const [key, text] of Object.entries(kept)) {
      map.set(key, {
        text,
        state: 'reviewed',
        language: tx.language.name,
        canKeep: tx.matchesMarket,
        onKeep: () => keepTranslation(key, text),
        onDiscard: () => dropTranslation(key),
      })
    }
    for (const [key, t] of Object.entries(tx.entries)) {
      if (map.has(key)) continue
      // A translation of English that has since been edited is not this field's.
      if (currentAt(store.set, key) !== t.from) continue
      map.set(key, {
        text: t.text,
        state: t.state,
        language: tx.language.name,
        // Keeping publishes into the market's own copy, so it is only offered
        // when the language on screen is the one this market reads.
        canKeep: tx.matchesMarket,
        onKeep: () => keepTranslation(key, t.text),
        onDiscard: () => dropTranslation(key),
      })
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.entries, tx.state, tx.language.name, tx.matchesMarket, store.set, store.context.market])

  const gate =
    coverage.failing.length > 0
      ? {
          state: 'blocked' as const,
          text: `${coverage.failing.length} of ${coverage.total} contexts failing`,
        }
      : { state: 'clear' as const, text: `${coverage.total} contexts checked` }

  const actions = editing ? (
    <div className="demo__actions">
      <ModeToggle mode={pipe.mode} onChange={switchMode} />
    </div>
  ) : (
    <div className="demo__actions">
      {/* Icon only. The label is carried by the tooltip and the accessible
          name instead, so the toolbar reads as controls rather than as a
          sentence competing with the gate to its left. */}
      <Button
        appearance="tertiary"
        size="md"
        iconBefore={<Icon svg={iconArtwork.download} size={16} />}
        aria-label="Export JSON"
        title="Export JSON — downloads the content as this app stores it, not yet the shape the rule engine reads."
        onClick={store.exportJson}
      />

      <Button
        appearance="secondary"
        size="md"
        iconBefore={<Icon svg={iconArtwork.preview} size={16} />}
        title="Walk the journey at full size, one screen at a time"
        onClick={() => setPrototype(true)}
      >
        Preview
      </Button>

      <ModeToggle mode={pipe.mode} onChange={switchMode} />

      <CoachPill
        title={review && !coachView ? 'Show the last review' : 'Ask the Coach to review every screen of this journey'}
        onClick={() => (review && !coachView ? setCoachView(true) : setCoachOpen(true))}
      >
        Coach review
      </CoachPill>
    </div>
  )

  /**
   * Real answers for the goals that ask for one, read off this set: its
   * campaigns and add-ons, the landing page's own promise, the audience cues
   * the screens already carry. Better than an invented example, and it keeps
   * the Coach tracing words that exist.
   */
  const coachExamples = useMemo(() => {
    const flow = resolveFlow(store.set)
    const first = (text?: string) => (text ?? '').trim().split(/(?<=[.!?])\s/)[0]?.trim() ?? ''
    const campaigns = store.set.campaigns.map((c) => c.label)
    const addOns = store.set.addOnCatalog.map((a) => a.title)
    const discounted = store.set.offers
      .filter((o) => o.discount && o.introPrice !== null)
      .map((o) => `${o.introMonths} months at ${o.introPrice}`)
    return {
      'acquire-content': [...campaigns, ...addOns],
      'acquire-audience': [
        `Logged-out visitors in ${store.context.market}`,
        first(flow?.auth.noticeTitle).replace(/\?$/, ''),
        `People arriving from “${store.journey.entry.cta}”`,
      ].filter(Boolean),
      'drive-offer': [...addOns, ...discounted],
      'drive-benefit': [],
      'maintain-proposition': [flow?.landing.title ?? '', first(flow?.landing.body)].filter(Boolean),
    }
  }, [store.set, store.context.market, store.journey])

  const coachDialog = (
    <CoachGoalDialog
      open={coachOpen}
      tiers={[...store.set.tiers].sort((a, b) => a.displayOrder - b.displayOrder).map((t) => ({ id: t.id, name: t.planName }))}
      teams={store.set.logoCatalog.map((l) => l.name)}
      features={store.set.featureCatalog.map((f) => f.text)}
      examples={coachExamples}
      onClose={() => setCoachOpen(false)}
      onReview={reviewWithCoach}
    />
  )

  // The brand strip carries the collapse control, so it has to survive the

  // collapse — it moves into the top bar rather than disappearing with the
  // panel it closes.
  const brand = (
    <header className="demo__brand">
      <span className="demo__mark">
        <Icon svg={daznLogo} size={24} />
      </span>
      <h1 className="demo__title">Agentic acquisition</h1>
      <span className="demo__beta">BETA</span>
      <button
        type="button"
        className="demo__collapse"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Open the panel' : 'Close the panel'}
        title={collapsed ? 'Open the panel' : 'Close the panel'}
        onClick={() => setCollapsed((v) => !v)}
      >
        <Icon svg={iconArtwork['panel-collapse']} size={24} />
      </button>
    </header>
  )

  return (

    <TranslationMarks.Provider value={translationMarks}>
    <main className="page demo" data-collapsed={collapsed || undefined}>
      {/* The bar spans the window and never moves. Collapsing the panel
          resizes the row beneath it, so the preview opens leftward without
          dragging the status of the whole set along with it. */}
      <div className="demo__top" data-mode={pipe.mode}>
        {brand}
        <div className="demo__statusbar">
          <LanguageSwitcher
            languages={languages}
            value={tx.language.code}
            marketLanguage={tx.marketLanguage.code}
            busy={tx.state === 'working'}
            onChange={setLanguage}
          />
          {/* The gate reports where the content stands, which in edit mode is
              a step in the review rather than a verdict on publishing. */}
          <span className="demo__gate" data-state={gate.state}>
            {gate.text}
          </span>
          {actions}
        </div>
      </div>
      {coachDialog}
      {dev && readyCount > 0 && (
        <p className="pl-devline">
          <CodeIcon size={12} />
          <span>
            Dev mode · showing {readyCount} page{readyCount === 1 ? '' : 's'} marked ready for
            dev · {pipe.sections.length - readyCount} hidden until Market marks them
          </span>
        </p>
      )}

      <div className="demo__body">
        <div className="demo__rail">
        <div className="demo__panel">

          {editing ? (
            <>
              {/* The arrow is the way back, and only the arrow. The trail it
                  used to carry — journey name, then step name — said where you
                  were twice over, when the panel below already only makes sense
                  for one step. What is left is the step's own title, which is
                  a heading rather than a control. */}
              <div className="demo__head">
                <button
                  type="button"
                  className="demo__back"
                  onClick={() => setEditing(false)}
                  aria-label="Back to the journey"
                >
                  <Icon svg={iconArtwork['chevron-left']} size={20} />
                </button>
                <h2 className="demo__step-title">{step?.shortName ?? step?.name}</h2>
                {section && (
                  <span className="pl-head-chip">
                    <StatusChip section={section} pipe={pipe} />
                  </span>
                )}
              </div>
              {/* The panel follows the step. A flow screen is copy from
                  end to end, and the card set's groups would have nothing to
                  say about it. */}
              <div className="demo__fields">
                <TranslationBar tx={tx} market={marketLabel} />
                {dev ? (
                  /* Dev reads: every string of the page, its key, and a button
                     to take it. Nothing here writes. */
                  section ? (
                    <section className="demo__group">
                      <h3 className="demo__group-title">Strings</h3>
                      <DevStrings section={section} />
                    </section>
                  ) : (
                    <p className="pl-empty">
                      Nothing is marked ready for dev yet.
                      <small>Pages show up here once Market marks them ready.</small>
                    </p>
                  )
                ) : (
                  <FieldMarks.Provider value={marks}>
                    {step && step.renderer !== 'plans' && step.renderer !== 'stub' ? (
                      <FlowPanel store={store} step={step} />
                    ) : (
                      <EditPanel store={store} />
                    )}
                  </FieldMarks.Provider>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="demo__fields">
                <TranslationBar tx={tx} market={marketLabel} />
                <DefaultPanel store={store} />
              </div>

              {dev && readyCount === 0 ? (
                <p className="pl-empty">
                  Nothing is marked ready for dev yet.
                  <small>Pages show up here once Market marks them ready.</small>
                </p>
              ) : (
                <UserFlow
                  planned={shown}
                  selectedId={step?.id ?? ''}
                  onOpen={openStep}
                  trailing={(id) => (
                    <>
                      {review && <CoachMark review={review} screen={id} />}
                      {chipFor(id)}
                    </>
                  )}
                  footnote={dev && hiddenSteps > 0 ? `${hiddenSteps} not ready yet · hidden in Dev` : undefined}
                />
              )}

              <button type="button" className="demo__reset" onClick={store.reset}>
                Reset progress
              </button>
            </>
          )}
        </div>
        </div>

        <div className="demo__preview">

          {editing && step ? (
            <StepPreview
              journey={store.journey}
              // The market's own words, so the preview reads as that market
              // reads. The panel beside it still edits the English source.
              set={marketSet}
              context={store.context}
              onTab={(tab) => store.setContext({ ...store.context, tab })}
            />
          ) : (
            <JourneyFrames
              planned={shown}
              selectedId={step?.id ?? ''}
              onOpen={openStep}
              set={marketSet}
              // A translated market is not the market the frames were exported
              // from, so the row renders the screens instead of showing them.
              preferLive={tx.state !== 'off'}
              marker={(id) => (
                <>
                  <SectionMarker status={pipe.status(id)} />
                  {review && <CoachMark review={review} screen={id} />}
                </>
              )}
              context={store.context}
              onReorder={(ids) => store.setStepOrder(store.journey.id, ids)}
              reordered={store.reordered}
              onResetOrder={() => store.setStepOrder(store.journey.id, [])}
            />
          )}
        </div>

        {/* The Coach's findings, beside the screens they are about. A rail of
            its own on the right, so the panel on the left keeps doing its job
            and a finding and the screen it names can be seen together. */}
        {coachView && review && (
          <aside className="demo__coach" aria-label="Coach review">
            <CoachResults
              review={withSuggestions(review)}
              writingId={writing}
              copyNote={copyNote}
              onOpen={openStep}
              onSelect={selectFinding}
              onFix={applyFix}
              onFixWith={(f, instruction) => void writeCopy(f, instruction, true)}
              selectedId={selected?.id ?? null}
              onAgain={() => setCoachOpen(true)}
              onClose={() => setCoachView(false)}
            />
          </aside>
        )}
      </div>

      {/* The whole journey, not the part Dev mode is showing: the prototype is
          the flow a person walks, and what Market has marked ready is a fact
          about the handoff rather than about the journey. */}
      {prototype && (
        <Prototype
          planned={planned}
          set={marketSet}
          context={store.context}
          onClose={() => setPrototype(false)}
        />
      )}
    </main>
    </TranslationMarks.Provider>
  )
}
