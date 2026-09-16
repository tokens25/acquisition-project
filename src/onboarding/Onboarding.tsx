import './onboarding.css'

import { useMemo } from 'react'
import { SelectField } from '../components/SelectField'
import { channelById, marketById } from '../rules/catalogue'
import type {
  CardStructure,
  ConsentItem,
  FlowStructure,
} from '../rules/onboarding'
import { LAST_STEP, SETUP_STEPS, settle, settlePlans, structureSummary } from '../rules/onboarding'
import { ENTRY_POINTS, STATUS_LABELS, USER_STATUSES } from '../rules/entry'
import { stepsFor } from '../rules/generate'
import { SkeletonCard } from './SkeletonCard'

/** "Japan · NFL", or just the market for a general flow. */
export function whereLabel(marketId: string, channelId?: string): string {
  const market = marketById(marketId)?.label ?? marketId
  const channel = channelId ? (channelById(channelId)?.label ?? channelId) : null
  return channel ? `${market} · ${channel}` : market
}

/**
 * The invitation, shown where a flow would be if anyone had described one.
 *
 * Only for a situation somebody could actually reach: an unavailable channel
 * is not an empty flow waiting to be filled, it is a channel this market does
 * not sell, and offering to build one would be offering to build a screen
 * nobody can arrive at.
 */
export function OnboardingStart({
  marketId,
  channelId,
  draft,
  onStart,
}: {
  marketId: string
  channelId?: string
  draft?: FlowStructure
  onStart: () => void
}) {
  const resuming = draft?.state === 'in-progress'
  return (
    <div className="ob">
      <div className="ob-start">
        <h2 className="ob-start__title">Set up your acquisition flow</h2>
        <p className="ob-start__body">
          Eight questions: who it is for, how they arrive, and what the screens are made of.
          At the end the flow is built and ready for its words.
        </p>
        <p className="ob-start__where">{whereLabel(marketId, channelId)}</p>
        <div className="ob-start__actions">
          <button type="button" className="ob-primary" onClick={onStart}>
            {resuming ? `Resume setup · step ${draft?.step ?? 1}` : 'Start setup'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Onboarding({
  draft,
  onChange,
  onFinish,
  onClose,
  warning,
}: {
  draft: FlowStructure
  onChange: (next: FlowStructure) => void
  onFinish: () => void
  onClose: () => void
  /** Shown when the structure is being changed after content already exists. */
  warning?: string
}) {
  const step = Math.min(Math.max(draft.step, 1), LAST_STEP)
  const write = (next: Partial<FlowStructure>) => onChange({ ...draft, ...next })
  const writeCard = (next: Partial<CardStructure>) =>
    write({ card: settle({ ...draft.card, ...next }) })
  const go = (n: number) => write({ step: Math.min(Math.max(n, 1), LAST_STEP) })

  const plans = draft.plans
  const cards = useMemo(
    () => Array.from({ length: plans.count }, (_, i) => i),
    [plans.count],
  )

  return (
    <div className="ob">
      <div className="ob__head">
        <h2 className="ob__title">Set up your acquisition flow</h2>
        <p className="ob__where">{whereLabel(draft.marketId, draft.channelId)}</p>
      </div>

      {warning && (
        <p className="ob__warning" role="status">
          {warning}
        </p>
      )}

      <ul className="ob__steps">
        {SETUP_STEPS.map((s) => (
          <li key={s.n}>
            <button
              type="button"
              className="ob__step"
              aria-current={s.n === step ? 'step' : undefined}
              data-done={s.n < step || undefined}
              onClick={() => go(s.n)}
            >
              {s.n}. {s.title}
            </button>
          </li>
        ))}
      </ul>

      <div className="ob__body">
        <div className="ob__controls">
          <p className="ob__blurb">{SETUP_STEPS[step - 1].blurb}</p>

          {step === 1 && (
            <div className="ob-choices">
              {USER_STATUSES.map((id) => (
                <Choice
                  key={id}
                  name="ob-audience"
                  checked={draft.audience === id}
                  title={STATUS_LABELS[id] ?? id}
                  body={
                    id === 'logged-out-new'
                      ? 'Nobody we know yet. They will need an account before they can pay.'
                      : 'Has an account already. They log in rather than create one.'
                  }
                  onPick={() => write({ audience: id })}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="ob-choices">
              {ENTRY_POINTS.map((cta) => (
                <Choice
                  key={cta}
                  name="ob-entry"
                  checked={draft.entry === cta}
                  title={cta}
                  body={
                    cta === 'Landing page'
                      ? 'They pressed a button on a page selling this. Nothing is known yet.'
                      : cta === 'CRM'
                        ? 'They followed an email or a push. The campaign may already know the plan.'
                        : 'They came from inside the catalogue, looking at something they cannot watch.'
                  }
                  onPick={() => write({ entry: cta })}
                />
              ))}
            </div>
          )}

          {step === 3 && <CardControls card={draft.card} onChange={writeCard} />}

          {step === 4 && (
            <>
              <Count
                label="How many plans"
                value={plans.count}
                min={1}
                max={6}
                onChange={(v) => write({ plans: settlePlans({ ...plans, count: v }) })}
              />
              <SelectField
                label="Highlighted"
                helpText="The plan being recommended."
                value={plans.highlighted === null ? 'none' : String(plans.highlighted)}
                options={[
                  { value: 'none', label: 'None' },
                  ...cards.map((i) => ({ value: String(i), label: `Plan ${i + 1}` })),
                ]}
                onChange={(v) =>
                  write({
                    plans: settlePlans({
                      ...plans,
                      highlighted: v === 'none' ? null : Number(v),
                    }),
                  })
                }
              />
              <SelectField
                label="Selected by default"
                helpText="The plan the customer arrives on. Not the same question."
                value={plans.selected === null ? 'none' : String(plans.selected)}
                options={[
                  { value: 'none', label: 'None' },
                  ...cards.map((i) => ({ value: String(i), label: `Plan ${i + 1}` })),
                ]}
                onChange={(v) =>
                  write({
                    plans: settlePlans({ ...plans, selected: v === 'none' ? null : Number(v) }),
                  })
                }
              />
            </>
          )}

          {step === 5 && (
            <CadenceControls draft={draft} write={write} planCount={plans.count} />
          )}

          {step === 6 && (
            <>
              <Toggle
                label="Show an information banner on the login page"
                checked={draft.banner.enabled}
                onChange={(v) => write({ banner: { ...draft.banner, enabled: v } })}
              />
              {draft.banner.enabled && (
                <div className="ob-toggles">
                  {(['title', 'description', 'link'] as const).map((k) => (
                    <Toggle
                      key={k}
                      nested
                      label={k === 'link' ? 'Link or button' : k[0].toUpperCase() + k.slice(1)}
                      checked={draft.banner[k]}
                      onChange={(v) => write({ banner: { ...draft.banner, [k]: v } })}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {step === 7 && <ConsentControls items={draft.consents} onChange={(c) => write({ consents: c })} />}

          {step === LAST_STEP && (
            <>
            <p className="ob__blurb">
              “Continue to add content” builds this flow — its screens, and an empty plan
              card for each plan. Nothing is written for you.
            </p>
            <dl className="ob-review">
              {structureSummary(draft).map((row, i) => (
                <div className="ob-review__row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                  <button type="button" className="ob-review__edit" onClick={() => go(editStepFor(i))}>
                    Edit
                  </button>
                </div>
              ))}
            </dl>
            </>
          )}
        </div>

        <Preview draft={draft} step={step} />
      </div>

      <div className="ob__foot">
        {step > 1 && (
          <button type="button" className="ob-secondary" onClick={() => go(step - 1)}>
            Back
          </button>
        )}
        <span className="ob__spacer" />
        <button type="button" className="ob-secondary" onClick={onClose}>
          Save and close
        </button>
        {step < LAST_STEP ? (
          <button type="button" className="ob-primary" onClick={() => go(step + 1)}>
            Next
          </button>
        ) : (
          <button type="button" className="ob-primary" onClick={onFinish}>
            {warning ? 'Save structure' : 'Continue to add content'}
          </button>
        )}
      </div>
    </div>
  )
}

/** Which step a review row belongs to, so Edit lands where the answer is given. */
function editStepFor(rowIndex: number): number {
  // For · Arriving from · Card · Plans · Highlighted · Selected · Payment ·
  // Banner · Consents
  return [1, 2, 3, 4, 4, 4, 5, 6, 7][rowIndex] ?? 1
}

function CardControls({
  card,
  onChange,
}: {
  card: CardStructure
  onChange: (next: Partial<CardStructure>) => void
}) {
  return (
    <div className="ob-toggles">
      <Toggle label="Title" checked={card.title} onChange={(v) => onChange({ title: v })} />
      <Toggle label="Description" checked={card.description} onChange={(v) => onChange({ description: v })} />
      <Toggle label="Price" checked={card.price} onChange={(v) => onChange({ price: v })} />
      {card.price && (
        <Toggle nested label="“Starts at” above the price" checked={card.startsAt} onChange={(v) => onChange({ startsAt: v })} />
      )}
      <Toggle label="Legal text" checked={card.legal} onChange={(v) => onChange({ legal: v })} />
      <Toggle label="Button" checked={card.cta} onChange={(v) => onChange({ cta: v })} />
      {card.cta && (
        <Toggle nested label="Savings label above the button" checked={card.saving} onChange={(v) => onChange({ saving: v })} />
      )}
      <Toggle label="Logos" checked={card.logos} onChange={(v) => onChange({ logos: v })} />
      {card.logos && (
        <>
          <SelectField
            label="Logo rows"
            value={String(card.logoRows)}
            options={[
              { value: '1', label: 'One row' },
              { value: '2', label: 'Two rows' },
            ]}
            onChange={(v) => onChange({ logoRows: Number(v) as 1 | 2 })}
          />
          <SelectField
            label="Last position"
            value={card.logoOverflow}
            options={[
              { value: 'count', label: '“+N” — how many are not shown' },
              { value: 'logo', label: 'One more logo' },
            ]}
            onChange={(v) => onChange({ logoOverflow: v as 'count' | 'logo' })}
          />
        </>
      )}
      <Toggle label="Features" checked={card.features} onChange={(v) => onChange({ features: v })} />
      {card.features && (
        <Count label="How many features" value={card.featureCount} min={1} max={10} onChange={(v) => onChange({ featureCount: v })} />
      )}
      <Toggle
        label="“All features & content” at the foot"
        checked={card.details}
        onChange={(v) => onChange({ details: v })}
      />
    </div>
  )
}

function CadenceControls({
  draft,
  write,
  planCount,
}: {
  draft: FlowStructure
  write: (next: Partial<FlowStructure>) => void
  planCount: number
}) {
  const c = draft.cadence
  const set = (next: Partial<typeof c>) => write({ cadence: { ...c, ...next } })
  const options = Array.from({ length: c.optionCount }, (_, i) => i)
  const forPlan = (p: number) => c.optionsByPlan[p] ?? options

  return (
    <>
      <p className="ob__blurb">
        Billing choices — monthly, annual — not payment methods. The names and prices come with
        the content.
      </p>
      <Toggle
        label="Customers choose how to pay in a step of its own"
        checked={c.enabled}
        onChange={(v) => set({ enabled: v })}
      />
      {c.enabled && (
        <>
          <Count
            label="How many options"
            value={c.optionCount}
            min={1}
            max={6}
            onChange={(v) =>
              set({
                optionCount: v,
                defaultOption: c.defaultOption !== null && c.defaultOption < v ? c.defaultOption : null,
                optionsByPlan: Object.fromEntries(
                  Object.entries(c.optionsByPlan).map(([p, list]) => [p, list.filter((o) => o < v)]),
                ),
              })
            }
          />
          <SelectField
            label="Default option"
            value={c.defaultOption === null ? 'none' : String(c.defaultOption)}
            options={[
              { value: 'none', label: 'None — the customer picks' },
              ...options.map((i) => ({ value: String(i), label: `Option ${i + 1}` })),
            ]}
            onChange={(v) => set({ defaultOption: v === 'none' ? null : Number(v) })}
          />
          <div className="ob-matrix">
            <p className="ob__blurb">Which options each plan offers.</p>
            {Array.from({ length: planCount }, (_, p) => (
              <div className="ob-matrix__row" key={p}>
                <span className="ob-matrix__plan">Plan {p + 1}</span>
                {options.map((o) => (
                  <label className="ob-toggle" key={o}>
                    <input
                      type="checkbox"
                      checked={forPlan(p).includes(o)}
                      onChange={(e) => {
                        const now = new Set(forPlan(p))
                        if (e.target.checked) now.add(o)
                        else now.delete(o)
                        set({ optionsByPlan: { ...c.optionsByPlan, [p]: [...now].sort((a, b) => a - b) } })
                      }}
                    />
                    {o + 1}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function ConsentControls({
  items,
  onChange,
}: {
  items: ConsentItem[]
  onChange: (next: ConsentItem[]) => void
}) {
  return (
    <>
      <Count
        label="How many consent items"
        value={items.length}
        min={0}
        max={8}
        onChange={(v) => {
          const next = items.slice(0, v)
          while (next.length < v) next.push({ required: false, withLink: false })
          onChange(next)
        }}
      />
      {items.map((item, i) => (
        <div className="ob-matrix__row" key={i}>
          <span className="ob-matrix__plan">Item {i + 1}</span>
          <Toggle
            label="Required"
            checked={item.required}
            onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, required: v } : x)))}
          />
          <Toggle
            label="Has a link"
            checked={item.withLink}
            onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, withLink: v } : x)))}
          />
        </div>
      ))}
      {items.length === 0 && <p className="ob__blurb">No consent section is drawn.</p>}
    </>
  )
}

/** What the right-hand side shows, which is whatever the step is about. */
function Preview({ draft, step }: { draft: FlowStructure; step: number }) {
  const { card, plans } = draft
  const one = step === 3
  const count = one ? 1 : plans.count

  // The first two questions are about the journey rather than the card, so
  // what they change is the list of screens — show that instead.
  if (step <= 2 || step === LAST_STEP) return <FlowMapPreview draft={draft} />
  if (step === 6) return <BannerPreview draft={draft} />
  if (step === 7) return <ConsentPreview draft={draft} />
  if (step === 5 && draft.cadence.enabled) return <CadencePreview draft={draft} />

  return (
    <div className="ob__preview">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard
          key={i}
          card={card}
          label={one ? undefined : `Plan ${i + 1}`}
          highlighted={!one && plans.highlighted === i}
          selected={one || plans.selected === null ? undefined : plans.selected === i}
          // The row reserves what any card in it needs, exactly as the real one does.
          reserveSaving={card.saving}
          reserveLegal={card.legal}
        />
      ))}
    </div>
  )
}

/** The screens this flow will have, as it is currently described. */
function FlowMapPreview({ draft }: { draft: FlowStructure }) {
  const steps = stepsFor(draft)
  return (
    <div className="ob__preview ob__preview--stack">
      <ol className="ob-map">
        {steps.map((s, i) => (
          <li className="ob-map__row" key={s.id}>
            <span className="ob-map__n">{i + 1}</span>
            <span className="ob-map__name">{s.shortName ?? s.name}</span>
          </li>
        ))}
      </ol>
      <p className="ob-map__note">
        {steps.length} screens. Setup decides what is on them; the words come after.
      </p>
    </div>
  )
}

/** One of a short list of answers, with the reason it might be the right one. */
function Choice({
  name,
  checked,
  title,
  body,
  onPick,
}: {
  name: string
  checked: boolean
  title: string
  body: string
  onPick: () => void
}) {
  return (
    <label className="ob-choice" data-on={checked || undefined}>
      <input type="radio" name={name} checked={checked} onChange={onPick} />
      <span>
        <strong className="ob-choice__title">{title}</strong>
        <span className="ob-choice__body">{body}</span>
      </span>
    </label>
  )
}

function CadencePreview({ draft }: { draft: FlowStructure }) {
  const { optionCount, defaultOption } = draft.cadence
  return (
    <div className="ob__preview ob__preview--stack">
      <div className="ob-screen">
        <p className="ob-screen__title">Choose how to pay</p>
        {Array.from({ length: optionCount }, (_, i) => (
          <div className="ob-option" key={i} data-selected={defaultOption === i || undefined}>
            <span className="ob-option__dot" />
            <span className="ob-slot ob-slot--option">Option {i + 1}</span>
          </div>
        ))}
        <div className="ob-slot ob-slot--button">Button</div>
      </div>
    </div>
  )
}

function BannerPreview({ draft }: { draft: FlowStructure }) {
  const b = draft.banner
  return (
    <div className="ob__preview ob__preview--stack">
      <div className="ob-screen">
        <p className="ob-screen__title">Log in</p>
        {b.enabled && (
          <div className="ob-banner">
            {b.title && <div className="ob-slot ob-slot--caption">Banner title</div>}
            {b.description && <div className="ob-slot ob-slot--legal">Banner description</div>}
            {b.link && <div className="ob-slot ob-slot--caption">Link or button</div>}
          </div>
        )}
        <div className="ob-slot ob-slot--price">Email</div>
        <div className="ob-slot ob-slot--button">Button</div>
      </div>
    </div>
  )
}

function ConsentPreview({ draft }: { draft: FlowStructure }) {
  return (
    <div className="ob__preview ob__preview--stack">
      <div className="ob-screen">
        <p className="ob-screen__title">Create your account</p>
        <div className="ob-slot ob-slot--price">Email</div>
        <div className="ob-slot ob-slot--price">Password</div>
        {draft.consents.map((c, i) => (
          <label className="ob-consent" key={i}>
            {/* Unchecked, always: this is what the customer is shown, and a
                consent that arrives already given is not a consent. */}
            <input type="checkbox" checked={false} readOnly />
            <span className="ob-slot ob-slot--legal">
              Consent {i + 1}
              {c.required ? ' · required' : ' · optional'}
              {c.withLink ? ' · with link' : ''}
            </span>
          </label>
        ))}
        <div className="ob-slot ob-slot--button">Button</div>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  nested,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  nested?: boolean
}) {
  return (
    <label className="ob-toggle" data-nested={nested || undefined}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function Count({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="ob-count">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(Math.min(Math.max(Math.round(n), min), max))
        }}
      />
    </label>
  )
}
