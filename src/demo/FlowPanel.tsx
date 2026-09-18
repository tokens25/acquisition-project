import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import { blankCadenceOption, cadenceSavings } from '../rules/cadence'
import { authSource, checkoutSources, chosenTier, liveAuthScreen, liveCadenceScreen, liveCheckoutScreen } from '../rules/liveFlow'

/** What the checkout's authored lines may stand in for. */
const TOKENS_HELP = 'Tokens fill in from the plan and payment option being bought: {plan} {cadence} {price} {unit} {today} {next} {renewal} {term} {market}.'
import type { CadenceOption } from '../rules/flow'
import { blankConsent, consentsOf } from '../rules/consents'
import { blankLine, blankMethod, chosenMethod, linesOf, methodsOf } from '../rules/checkout'
import { FieldGroup } from './FieldGroup'
import { LandingSections } from './LandingSections'
import type { CardSetStore } from '../editor/useCardSet'
import type { FlowContent } from '../rules/flow'
import { defaultFlow } from '../rules/flow'
import type { Step } from '../rules/journey'
import type { Selector } from '../rules/layers'
import {
  SHARED,
  clearFlow,
  clearLayer,
  isMarketCopy,
  layersFor,
  resolveFlow,
  sameSelector,
  scopeLadder,
  selectorLabel,
  situationOf,
  specificity,
  writeFlow,
} from '../rules/layers'
import { flowFieldLabel } from '../rules/pipeline'
import { marketFor, resolveOffer, resolveSet } from '../rules/resolve'
import { HeroBannerFields } from './HeroBannerFields'
import { useState } from 'react'

/**
 * The edit view's form for the screens after the plan picker.
 *
 * Every string a screen shows has a field here — including the ones drawn as
 * placeholder values, because a preview of a filled form has to show something
 * and what it shows is a decision somebody makes.
 *
 * Grouped the way the screen reads top to bottom rather than by kind, so the
 * panel and the preview beside it can be followed together.
 */
/**
 * Which situations the edits below are for.
 *
 * Held here and not in the content: it is a fact about who is typing, not
 * about what the screens say. It opens on this market, because markets are
 * separate and the market you are looking at is the one you meant — the shared
 * copy is a deliberate step out, not somewhere to land by default.
 */
/**
 * The two halves of the landing page, as tabs.
 *
 * Market edits through them and Dev reads through them, so they are one
 * component: two tab strips that could drift apart would be two answers to
 * "which half is this string on".
 */
export function FlowTabs({
  value,
  onChange,
}: {
  value: 'page' | 'hero'
  onChange: (next: 'page' | 'hero') => void
}) {
  return (
    <div className="fp-tabs" role="tablist" aria-label="What to edit">
      {(['page', 'hero'] as const).map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          className="fp-tab"
          aria-selected={value === k}
          data-on={value === k || undefined}
          onClick={() => onChange(k)}
        >
          {k === 'page' ? 'Landing page' : 'Hero banner'}
        </button>
      ))}
    </div>
  )
}

export function FlowPanel({ store, step }: { store: CardSetStore; step: Step }) {
  const { set, updateSet } = store
  const at = situationOf(set)
  /* The checkout page is about one plan paid for one way, so it gets the two
     narrower rungs. Every other screen would only be offered a layer nobody
     could ever see. */
  const aboutOnePlan = step.renderer === 'checkout'
  const ladder = scopeLadder(at, { plan: aboutOnePlan })
  const home = ladder.find((r) => isMarketCopy(r.when)) ?? ladder[0]
  const [chosen, setChosen] = useState(home?.label ?? SHARED)
  // Which half of the landing page is being edited. The page, not the banner,
  // because that is what every other screen's panel opens on.
  const [tab, setTab] = useState<'page' | 'hero'>('page')
  const scope = ladder.find((r) => r.label === chosen)?.when ?? {}
  const screen = step.renderer as keyof FlowContent
  if (!(screen in defaultFlow)) return <FlowFields store={store} step={step} scope={scope} />

  const all = set.flowLayers ?? []
  const applying = layersFor(set, at)
  const mine = applying.find((l) => sameSelector(l.when, scope))
  const owned = Object.keys(mine?.patch[screen] ?? {})
  // Markets that have taken their own copy. An edit to the shared copy reaches
  // none of them, which is the deal markets being separate makes.
  const copies = all.filter((l) => isMarketCopy(l.when)).map((l) => selectorLabel(l.when))
  // Fields a narrower layer has already answered for. Typing into one of these
  // at this scope changes something real, but nothing visible from here — which
  // is worth saying out loud rather than leaving as a silent no-op.
  const shadowed = applying
    .filter((l) => specificity(l.when) > specificity(scope))
    .flatMap((l) =>
      Object.keys(l.patch[screen] ?? {}).map(
        (field) => `${flowFieldLabel(field)} (${selectorLabel(l.when)})`,
      ),
    )

  const help = isMarketCopy(scope)
    ? mine
      ? `${chosen} has its own copy of all seven screens. Nothing written elsewhere reaches it.`
      : `${chosen} shares the copy below. The first edit here gives it its own copy of all seven screens, starting from what it shows now.`
    : scope.market
      ? `Written for ${chosen} only, over ${selectorLabel({ market: scope.market })}’s own copy.`
      : 'The copy a market reads until it has one of its own.'

  /* The landing page is two things being authored at once: the banner at the
     top, which is a hero and has a hero's controls, and the eight sections
     under it. One list of fourteen groups made you scroll past the whole page
     to reach the picture, so they are two tabs. Only this screen has them,
     because only this screen has a hero. */
  const hasHero = screen === 'landing'

  return (
    <>
      {hasHero && <FlowTabs value={tab} onChange={setTab} />}
      {/* Neither half of the landing page asks where the copy applies. It is
          written for the market the fields above name, which is where an edit
          made while looking at that market was always going to go — the ladder
          out to the shared copy is a step this page does not offer. */}
      {!hasHero && (
      <FieldGroup title="Where this applies">
        <SelectField
          label="Editing"
          value={chosen}
          options={ladder.map((r) => ({ value: r.label, label: r.label }))}
          onChange={setChosen}
          helpText={help}
        />
        {!scope.market && copies.length > 0 && (
          <p className="ed-absent">
            {copies.join(', ')} {copies.length === 1 ? 'has its' : 'have their'} own copy, so this
            edit will not reach {copies.length === 1 ? 'it' : 'them'}.
          </p>
        )}
        {shadowed.length > 0 && (
          <p className="ed-absent">
            Answered more narrowly elsewhere, so edits here will not show in this
            situation: {shadowed.join(', ')}.
          </p>
        )}
        {owned.length > 0 && !isMarketCopy(scope) && (
          <button
            type="button"
            className="demo__feature-remove"
            onClick={() => updateSet(clearFlow(set, scope, screen))}
          >
            Reset this screen to inherited
          </button>
        )}
        {mine && isMarketCopy(scope) && (
          <button
            type="button"
            className="demo__feature-remove"
            onClick={() => updateSet(clearLayer(set, scope))}
          >
            Give {chosen} the shared copy back
          </button>
        )}
      </FieldGroup>
      )}
      {hasHero && tab === 'hero' ? (
        <HeroBannerFields store={store} scope={scope} />
      ) : (
        <FlowFields store={store} step={step} scope={scope} hero={!hasHero} />
      )}
    </>
  )
}

function FlowFields({
  store,
  step,
  scope,
  /**
   * Whether this list owns the hero's own fields.
   *
   * False on the landing page, where the hero has a tab of its own and these
   * groups would be the same fields twice; true everywhere else, since no
   * other screen splits itself in two.
   */
  hero = true,
}: {
  store: CardSetStore
  step: Step
  scope: Selector
  hero?: boolean
}) {
  const { set, updateSet, context, setContext } = store
  const flow = resolveFlow(set)

  /* The plans on sale in this situation, which is what a checkout page can be
     checking out. Named by their resolved name, so the menu reads the way the
     card does. */
  const plansHere = resolveSet(set, context).map((c) => c.tier)

  /** Writes one field of one screen to the chosen scope, and nothing else. */
  const patch = <K extends keyof FlowContent>(screen: K, next: Partial<FlowContent[K]>) =>
    updateSet(writeFlow(set, scope, screen, next))

  const navTitle = (screen: keyof FlowContent, value: string) => (
    <TextField
      label="Screen title"
      value={value}
      pipelineKey={`${screen}.navTitle`}
      onChange={(v) => patch(screen, { navTitle: v } as never)}
      helpText="The line in the bar under the status bar."
    />
  )

  if (step.renderer === 'landing') {
    const l = flow.landing
    return (
      <>
        {hero && (
          <>
          <FieldGroup title="Top bar">
            <TextField
              label="First button"
              value={l.navExplore}
              pipelineKey={'landing.navExplore'}
              onChange={(v) => patch('landing', { navExplore: v })}
            />
            <TextField
              label="Second button"
              value={l.navSignUp}
              pipelineKey={'landing.navSignUp'}
              onChange={(v) => patch('landing', { navSignUp: v })}
            />
          </FieldGroup>
  
          <FieldGroup title="Over the picture">
            <TextField
              label="Heading"
              value={l.title}
              pipelineKey={'landing.title'}
              onChange={(v) => patch('landing', { title: v })}
            />
            <TextField
              label="Under the heading"
              value={l.body}
              pipelineKey={'landing.body'}
              onChange={(v) => patch('landing', { body: v })}
              rows={4}
            />
          </FieldGroup>
  
          <FieldGroup title="Buttons">
            <TextField label="Button" value={l.cta} pipelineKey={'landing.cta'} onChange={(v) => patch('landing', { cta: v })} />
            <TextField
              label="Second button"
              value={l.altCta}
              pipelineKey={'landing.altCta'}
              onChange={(v) => patch('landing', { altCta: v })}
            />
          </FieldGroup>
          </>
        )}

        {/* Everything below the hero, as the list of components it is: each
            one can move, be switched off, or be copied. */}
        <LandingSections store={store} scope={scope} />
      </>
    )
  }

  if (step.renderer === 'cadence') {
    const c = flow.cadence
    /*
     * Priced from the plan being bought, when it has prices here.
     *
     * The options are then one per cadence the plan is sold at, and the
     * numbers on them are the offers' — so the panel edits the words and
     * shows the price, rather than offering a field for a figure the card
     * would disagree with. Written words are kept per cadence, so a title
     * typed for "Yearly" reads on every plan's yearly option.
     */
    const live = liveCadenceScreen(set, context, c)
    const isLive = live !== c
    const options = live.options
    const savingById = cadenceSavings(live)
    const savings = Object.values(savingById)[0] ?? ''
    const writeOption = (option: CadenceOption, next: Partial<CadenceOption>) => {
      const has = c.options.some((o) => o.id === option.id)
      patch('cadence', {
        options: has
          ? c.options.map((o) => (o.id === option.id ? { ...o, ...next } : o))
          : [...c.options, { id: option.id, title: '', note: '', price: '', unit: '', badge: '', saving: '', ...next }],
      })
    }
    return (
      <>
        <FieldGroup title="Screen">
          {navTitle('cadence', c.navTitle)}
        </FieldGroup>

        <FieldGroup title="Ways to pay">
          {isLive && (
            <>
              {/* Which plan's ways to pay are on screen. The step prices one
                  plan — the one picked on the cards — and nothing picked
                  reads as the highlighted plan, so this says which and lets
                  it be changed. */}
              <SelectField
                label="Plan"
                helpText="The plan whose ways to pay are shown. The words are yours; the prices are DAZN's."
                value={chosenTier(set, context)?.id ?? ''}
                options={plansHere.map((t) => {
                  const ways = set.cadences.filter((cadence) => resolveOffer(set, t.id, { ...context, cadence })).length
                  return { value: t.id, label: `${t.planName || t.id} · ${ways} way${ways === 1 ? '' : 's'} to pay` }
                })}
                onChange={(v) => setContext({ ...context, tier: v || undefined })}
              />
            </>
          )}
          {options.map((option, i) => {
            const authored = c.options.find((o) => o.id === option.id)
            const write = (next: Partial<CadenceOption>) =>
              isLive
                ? writeOption(option, next)
                : patch('cadence', {
                    options: c.options.map((o, j) => (j === i ? { ...o, ...next } : o)),
                  })
            return (
              <div className="demo__feature" key={option.id}>
                <TextField
                  label={isLive ? option.id : `Option ${i + 1}`}
                  value={isLive ? (authored?.title ?? '') : option.title}
                  pipelineKey={`cadence.options[${i}].title`}
                  onChange={(v) => write({ title: v })}
                  helpText={isLive && !authored?.title?.trim() ? `Empty reads "${option.title}".` : undefined}
                />
                <TextField
                  label="Under the name"
                  value={isLive ? (authored?.note ?? '') : option.note}
                  pipelineKey={`cadence.options[${i}].note`}
                  onChange={(v) => write({ note: v })}
                  helpText={isLive && !authored?.note?.trim() ? `Empty reads "${option.note}".` : undefined}
                />
                {isLive ? (
                  <p className="ed-absent">
                    Price from the offer: <strong>{option.price}/{option.unit}</strong>
                    {savingById[option.id] ? ` · ${savingById[option.id]}` : ''}
                  </p>
                ) : (
                  <>
                    <TextField
                      label="Price"
                      value={option.price}
                      pipelineKey={`cadence.options[${i}].price`}
                      onChange={(v) => write({ price: v })}
                    />
                    <TextField
                      label="How to pay"
                      value={option.unit}
                      pipelineKey={`cadence.options[${i}].unit`}
                      onChange={(v) => write({ unit: v })}
                      helpText={`Reads as ${option.price}/${option.unit || '…'}.`}
                    />
                  </>
                )}
                <TextField
                  label="Ribbon"
                  value={isLive ? (authored?.badge ?? option.badge) : option.badge}
                  pipelineKey={`cadence.options[${i}].badge`}
                  onChange={(v) => write({ badge: v })}
                  helpText="Empty draws no ribbon."
                />
                <TextField
                  label="Saving line"
                  value={authored?.saving ?? (isLive ? '' : option.saving ?? '')}
                  pipelineKey={`cadence.options[${i}].saving`}
                  onChange={(v) => write({ saving: v })}
                  helpText={
                    (isLive ? authored?.saving : option.saving)?.trim()
                      ? 'Written, so this is what is drawn.'
                      : savingById[option.id]
                        ? `Empty, so the prices answer it: "${savingById[option.id]}".`
                        : 'Empty. Nothing is drawn until this is written, or a yearly and a monthly price are both set.'
                  }
                />
                {/* A card can go, as long as one is left to choose. */}
                {!isLive && c.options.length > 1 && (
                  <button
                    type="button"
                    className="demo__feature-remove"
                    onClick={() =>
                      patch('cadence', {
                        options: c.options.filter((_, j) => j !== i),
                        selected:
                          c.selected === option.id
                            ? (c.options.find((_, j) => j !== i)?.id ?? '')
                            : c.selected,
                      })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
          {!isLive && (
            <button
              type="button"
              className="ed-add"
              onClick={() =>
                patch('cadence', { options: [...c.options, blankCadenceOption(c.options)] })
              }
            >
              Add a way to pay
            </button>
          )}

          {!isLive && (
            <SelectField
              label="Pre-selected"
              value={c.selected}
              options={c.options.map((o) => ({ value: o.id, label: o.title }))}
              onChange={(v) => patch('cadence', { selected: v })}
            />
          )}

          {/* How the computed saving is worded. A saving typed into a card
              above wins over both, because a person who typed it meant it. */}
          <SelectField
            label="Saving shown as"
            value={c.savingAs ?? 'amount'}
            options={[
              { value: 'amount', label: 'Money — Save $108 /year' },
              { value: 'percent', label: 'Percent — Save 30% /year' },
            ]}
            onChange={(v) => patch('cadence', { savingAs: v as 'amount' | 'percent' })}
            helpText={
              savings
                ? `Drawn on the yearly card: "${savings}".`
                : 'Drawn once a yearly card and a monthly card are both priced.'
            }
          />
        </FieldGroup>

        <FieldGroup title="Bottom of the screen">
          <TextField
            label="Button"
            value={c.cta}
            pipelineKey={'cadence.cta'}
            onChange={(v) => patch('cadence', { cta: v })}
          />
          <TextField
            label="Footnote"
            value={c.footnote}
            pipelineKey={'cadence.footnote'}
            onChange={(v) => patch('cadence', { footnote: v })}
            rows={2}
          />
        </FieldGroup>
      </>
    )
  }

  if (step.renderer === 'auth') {
    const a = flow.auth
    const authKey = authSource(set, context)
    const liveAuth = liveAuthScreen(set, context, a)
    return (
      <>
        <FieldGroup title="Screen">
          {navTitle('auth', a.navTitle)}
          <TextField label="Heading" value={a.title} pipelineKey={'auth.title'} onChange={(v) => patch('auth', { title: v })} />
          <TextField
            label="Under the heading"
            value={a.subtitle}
            pipelineKey={'auth.subtitle'}
            onChange={(v) => patch('auth', { subtitle: v })}
            rows={2}
          />
        </FieldGroup>

        <FieldGroup title="Notice">
          {authKey ? (
            <p className="ed-absent ed-live">
              For people who had this product before it came to DAZN. The line on screen is dazn.com's own for
              this channel (<code>{authKey}</code>): “{liveAuth.noticeTitle}
              {liveAuth.noticeBody ? ` ${liveAuth.noticeBody}` : ''}”. The words below are what shows where DAZN has
              none.
            </p>
          ) : (
            <p className="ed-absent">
              DAZN has no sign-in notice for this channel — it is for people who had the product before it came
              to DAZN (MSG+ and YES, Courtside 1891, NHL.TV). Leave both lines empty and no box is drawn.
            </p>
          )}
          <TextField
            label="Notice heading"
            value={a.noticeTitle}
            pipelineKey={'auth.noticeTitle'}
            onChange={(v) => patch('auth', { noticeTitle: v })}
          />
          <TextField
            label="Notice body"
            value={a.noticeBody}
            pipelineKey={'auth.noticeBody'}
            onChange={(v) => patch('auth', { noticeBody: v })}
            rows={2}
          />
        </FieldGroup>

        <FieldGroup title="Sign in">
          <TextField
            label="Email field"
            value={a.emailLabel}
            pipelineKey={'auth.emailLabel'}
            onChange={(v) => patch('auth', { emailLabel: v })}
          />
          <TextField
            label="Typed email"
            value={a.emailValue}
            pipelineKey={'auth.emailValue'}
            onChange={(v) => patch('auth', { emailValue: v })}
            helpText="Empty draws the field as nobody has typed in it yet."
          />
          <TextField label="Button" value={a.cta} pipelineKey={'auth.cta'} onChange={(v) => patch('auth', { cta: v })} />
          <TextField
            label="Divider"
            value={a.dividerLabel}
            pipelineKey={'auth.dividerLabel'}
            onChange={(v) => patch('auth', { dividerLabel: v })}
          />
          {a.providers.map((p, i) => (
            <TextField
              key={p.id}
              label={`${p.id[0].toUpperCase()}${p.id.slice(1)} button`}
              value={p.label}
              pipelineKey={`auth.providers[${i}].label`}
              onChange={(v) =>
                patch('auth', {
                  providers: a.providers.map((q, j) => (j === i ? { ...q, label: v } : q)),
                })
              }
            />
          ))}
        </FieldGroup>
      </>
    )
  }

  if (step.renderer === 'account') {
    const a = flow.account
    return (
      <>
        <FieldGroup title="Screen">
          {navTitle('account', a.navTitle)}
        </FieldGroup>

        <FieldGroup title="Name">
          <TextField
            label="Section heading"
            value={a.nameHeading}
            pipelineKey={'account.nameHeading'}
            onChange={(v) => patch('account', { nameHeading: v })}
          />
          <TextField
            label="First name field"
            value={a.firstNameLabel}
            pipelineKey={'account.firstNameLabel'}
            onChange={(v) => patch('account', { firstNameLabel: v })}
          />
          <TextField
            label="First name shown"
            value={a.firstNameValue}
            pipelineKey={'account.firstNameValue'}
            onChange={(v) => patch('account', { firstNameValue: v })}
          />
          <TextField
            label="Last name field"
            value={a.lastNameLabel}
            pipelineKey={'account.lastNameLabel'}
            onChange={(v) => patch('account', { lastNameLabel: v })}
          />
          <TextField
            label="Last name shown"
            value={a.lastNameValue}
            pipelineKey={'account.lastNameValue'}
            onChange={(v) => patch('account', { lastNameValue: v })}
          />
        </FieldGroup>

        <FieldGroup title="Email">
          <TextField
            label="Section heading"
            value={a.emailHeading}
            pipelineKey={'account.emailHeading'}
            onChange={(v) => patch('account', { emailHeading: v })}
          />
          <TextField
            label="Email field"
            value={a.emailLabel}
            pipelineKey={'account.emailLabel'}
            onChange={(v) => patch('account', { emailLabel: v })}
          />
          <TextField
            label="Email shown"
            value={a.emailValue}
            pipelineKey={'account.emailValue'}
            onChange={(v) => patch('account', { emailValue: v })}
          />
        </FieldGroup>

        <FieldGroup title="Password">
          <TextField
            label="Section heading"
            value={a.passwordHeading}
            pipelineKey={'account.passwordHeading'}
            onChange={(v) => patch('account', { passwordHeading: v })}
          />
          <TextField
            label="Password field"
            value={a.passwordLabel}
            pipelineKey={'account.passwordLabel'}
            onChange={(v) => patch('account', { passwordLabel: v })}
          />
          <TextField
            label="Password shown"
            value={a.passwordValue}
            pipelineKey={'account.passwordValue'}
            onChange={(v) => patch('account', { passwordValue: v })}
            helpText="Drawn as dots. Only its length shows."
          />
          <TextField
            label="Checklist heading"
            value={a.rulesTitle}
            pipelineKey={'account.rulesTitle'}
            onChange={(v) => patch('account', { rulesTitle: v })}
          />
          {a.rules.map((rule, i) => (
            <TextField
              key={i}
              label={`Rule ${i + 1}`}
              value={rule}
              pipelineKey={`account.rules[${i}]`}
              onChange={(v) =>
                patch('account', { rules: a.rules.map((r, j) => (j === i ? v : r)) })
              }
            />
          ))}
        </FieldGroup>

        <FieldGroup title="Marketing consent">
          <TextField
            label="Section heading"
            value={a.notifyHeading}
            pipelineKey={'account.notifyHeading'}
            onChange={(v) => patch('account', { notifyHeading: v })}
          />
          {consentsOf(a).map((consent, i) => {
            const all = consentsOf(a)
            const write = (next: Partial<typeof consent>) =>
              patch('account', {
                consents: all.map((c, j) => (j === i ? { ...c, ...next } : c)),
              })
            return (
              <div className="demo__feature" key={consent.id}>
                <TextField
                  label={`Consent ${i + 1}`}
                  value={consent.body}
                  pipelineKey={`account.consents[${i}].body`}
                  onChange={(v) => write({ body: v })}
                  rows={3}
                />
                <TextField
                  label="Under the box"
                  value={consent.note}
                  pipelineKey={`account.consents[${i}].note`}
                  onChange={(v) => write({ note: v })}
                  helpText="Empty draws nothing."
                />
                <ToggleField
                  label="On by default"
                  checked={consent.on}
                  onChange={(next: boolean) => write({ on: next })}
                  hint={
                    consent.on
                      ? 'Someone has to turn it off to decline.'
                      : 'Someone has to turn it on to agree.'
                  }
                />
                <button
                  type="button"
                  className="demo__feature-remove"
                  onClick={() =>
                    patch('account', { consents: all.filter((_, j) => j !== i) })
                  }
                >
                  Remove
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() =>
              patch('account', {
                consents: [...consentsOf(a), blankConsent(consentsOf(a))],
              })
            }
          >
            Add a consent
          </button>
        </FieldGroup>

        <FieldGroup title="Buttons">
          <TextField label="Button" value={a.cta} pipelineKey={'account.cta'} onChange={(v) => patch('account', { cta: v })} />
          <TextField
            label="Button while working"
            value={a.workingCta}
            pipelineKey={'account.workingCta'}
            onChange={(v) => patch('account', { workingCta: v })}
            helpText="What it says on the confirmed screen, while the account is being made."
          />
        </FieldGroup>
      </>
    )
  }

  if (step.renderer === 'zip') {
    const z = flow.zip
    return (
      <>
        <FieldGroup title="Screen">
          {navTitle('zip', z.navTitle)}
          <TextField
            label="Heading"
            value={z.heading}
            pipelineKey={'zip.heading'}
            onChange={(v) => patch('zip', { heading: v })}
          />
          <TextField
            label="Under the heading"
            value={z.body}
            pipelineKey={'zip.body'}
            onChange={(v) => patch('zip', { body: v })}
            rows={4}
          />
        </FieldGroup>

        <FieldGroup title="ZIP code">
          <TextField
            label="Field"
            value={z.fieldLabel}
            pipelineKey={'zip.fieldLabel'}
            onChange={(v) => patch('zip', { fieldLabel: v })}
          />
          <TextField
            label="Code shown"
            value={z.fieldValue}
            pipelineKey={'zip.fieldValue'}
            onChange={(v) => patch('zip', { fieldValue: v })}
          />
          <TextField
            label="Heading over the teams"
            value={z.resultsLabel}
            pipelineKey={'zip.resultsLabel'}
            onChange={(v) => patch('zip', { resultsLabel: v })}
            helpText="Only on the results screen. Figma still carries a placeholder here."
          />
        </FieldGroup>

        <FieldGroup title="Buttons">
          <TextField label="Button" value={z.cta} pipelineKey={'zip.cta'} onChange={(v) => patch('zip', { cta: v })} />
          <TextField
            label="Divider"
            value={z.dividerLabel}
            pipelineKey={'zip.dividerLabel'}
            onChange={(v) => patch('zip', { dividerLabel: v })}
          />
          <TextField
            label="Second button"
            value={z.altCta}
            pipelineKey={'zip.altCta'}
            onChange={(v) => patch('zip', { altCta: v })}
          />
        </FieldGroup>
      </>
    )
  }

  if (step.renderer === 'checkout') {
    const c = flow.checkout
    const liveCheckout = liveCheckoutScreen(set, context, c)
    return (
      <>
        {/* What is being bought, on the page that buys it.
            The page's summary, its dates and its legal line are all about one
            plan on one billing cycle, so which one is a question the panel has
            to ask before any of its fields mean anything. Answering it moves
            the preview as well: you edit what you are looking at. */}
        <FieldGroup title="What is being bought">
          <SelectField
            label="Plan"
            helpText="The plan this page is checking out."
            value={context.tier ?? ''}
            options={[
              { value: '', label: 'No plan in particular' },
              ...plansHere.map((t) => ({ value: t.id, label: t.planName || t.id })),
            ]}
            onChange={(v) => setContext({ ...context, tier: v || undefined })}
          />
          <SelectField
            label="Payment option"
            helpText="Its terms and its renewal date follow from this."
            value={context.cadence}
            options={set.cadences.map((v) => ({ value: v, label: v }))}
            onChange={(v) => setContext({ ...context, cadence: v })}
          />
        </FieldGroup>

        <FieldGroup title="Screen">
          {navTitle('checkout', c.navTitle)}
          <TextField
            label="Note at the top"
            value={c.note}
            pipelineKey={'checkout.note'}
            onChange={(v) => patch('checkout', { note: v })}
            rows={2}
          />
        </FieldGroup>

        <FieldGroup title="What you are buying">
          <TextField
            label="Summary title"
            value={c.summaryTitle}
            pipelineKey={'checkout.summaryTitle'}
            onChange={(v) => patch('checkout', { summaryTitle: v })}
          />
          <TextField
            label="Change button"
            value={c.changeCta}
            pipelineKey={'checkout.changeCta'}
            onChange={(v) => patch('checkout', { changeCta: v })}
          />
          {liveCheckout !== c && (
            <p className="ed-absent ed-live">
              The summary lines are worked out from{' '}
              <strong>{chosenTier(set, context)?.planName}</strong> at <strong>{context.cadence}</strong>:
              {liveCheckout.lines.map((l) => ` ${l.label} ${l.value}${l.unit ? `/${l.unit}` : ''}`).join(' ·')}.
              The ways to pay are {marketFor(set, context.market).label}'s, from DAZN.
              {(() => {
                const src = checkoutSources(set, context)
                return src?.summaryKey || src?.termsKey ? (
                  <>
                    {' '}The summary sentence and the terms are dazn.com's own for this market
                    {src.summaryKey ? <> (<code>{src.summaryKey}</code></> : ''}
                    {src.termsKey ? <>{src.summaryKey ? ', ' : ' ('}<code>{src.termsKey}</code>)</> : src.summaryKey ? ')' : ''}.
                  </>
                ) : (
                  <> DAZN has no checkout words for this market; the lines below are read.</>
                )
              })()}{' '}
              Change the plan or payment option under "What is being bought" to see another's.
            </p>
          )}
          {linesOf(c).map((line, i) => {
            const all = linesOf(c)
            const write = (next: Partial<typeof line>) =>
              patch('checkout', {
                lines: all.map((l, j) => (j === i ? { ...l, ...next } : l)),
              })
            return (
              <div className="demo__feature" key={line.id}>
                <TextField
                  label={`Line ${i + 1}`}
                  value={line.label}
                  pipelineKey={`checkout.lines[${i}].label`}
                  onChange={(v) => write({ label: v })}
                />
                <TextField
                  label="Amount"
                  value={line.value}
                  pipelineKey={`checkout.lines[${i}].value`}
                  onChange={(v) => write({ value: v })}
                />
                <TextField
                  label="How to pay"
                  value={line.unit ?? ''}
                  pipelineKey={`checkout.lines[${i}].unit`}
                  onChange={(v) => write({ unit: v })}
                  helpText="Empty shows the amount on its own."
                />
                {/* Three ways a line can read, named by what each one draws
                    rather than by the flag it sets. */}
                <SelectField
                  label="Reads as"
                  value={line.offer ? 'offer' : line.schedule ? 'schedule' : 'plain'}
                  options={[
                    { value: 'plain', label: 'A plain amount' },
                    { value: 'offer', label: 'An offer, in gold' },
                    { value: 'schedule', label: 'What happens next, with a date mark' },
                  ]}
                  onChange={(v) =>
                    write({ offer: v === 'offer', schedule: v === 'schedule' })
                  }
                />
                {/* A summary with nothing in it is not a summary. */}
                {all.length > 1 && (
                  <button
                    type="button"
                    className="demo__feature-remove"
                    onClick={() =>
                      patch('checkout', { lines: all.filter((_, j) => j !== i) })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => patch('checkout', { lines: [...linesOf(c), blankLine(linesOf(c))] })}
          >
            Add a line
          </button>
          <TextField
            label="Renewal note"
            value={c.renewalNote}
            pipelineKey={'checkout.renewalNote'}
            onChange={(v) => patch('checkout', { renewalNote: v })}
            rows={3}
            helpText={liveCheckout !== c ? `Reads: “${liveCheckout.renewalNote}”. ${TOKENS_HELP}` : TOKENS_HELP}
          />
        </FieldGroup>

        <FieldGroup title="How to pay">
          {methodsOf(c).map((method, i) => {
            const all = methodsOf(c)
            const write = (next: Partial<typeof method>) =>
              patch('checkout', {
                methods: all.map((m, j) => (j === i ? { ...m, ...next } : m)),
              })
            return (
              <div className="demo__feature" key={method.id}>
                <TextField
                  label={`Option ${i + 1}`}
                  value={method.label}
                  pipelineKey={`checkout.methods[${i}].label`}
                  onChange={(v) => write({ label: v })}
                />
                {/* The artwork ships with the tool, so this picks between the
                    sets there are rather than asking for a file. */}
                <SelectField
                  label="Marks"
                  value={method.marks}
                  options={[
                    { value: 'cards', label: 'Visa and Mastercard' },
                    { value: 'gpay', label: 'The Google Pay mark' },
                    { value: 'paypal', label: 'The PayPal mark' },
                    { value: 'none', label: 'No marks' },
                  ]}
                  onChange={(v) => write({ marks: v as typeof method.marks })}
                />
                <TextField
                  label="Chip after the marks"
                  value={method.overflow ?? ''}
                  pipelineKey={`checkout.methods[${i}].overflow`}
                  onChange={(v) => write({ overflow: v })}
                  helpText="The “+4” beside the card marks. Empty draws none."
                />
                <ToggleField
                  label="Asks for a card"
                  checked={method.card ?? false}
                  onChange={(next: boolean) => write({ card: next })}
                  hint={
                    method.card
                      ? 'The card fields open under it when it is chosen.'
                      : 'Choosing it opens nothing here.'
                  }
                />
                {all.length > 1 && (
                  <button
                    type="button"
                    className="demo__feature-remove"
                    onClick={() =>
                      patch('checkout', {
                        methods: all.filter((_, j) => j !== i),
                        chosen:
                          chosenMethod(c) === method.id
                            ? (all.find((_, j) => j !== i)?.id ?? '')
                            : chosenMethod(c),
                      })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() =>
              patch('checkout', { methods: [...methodsOf(c), blankMethod(methodsOf(c))] })
            }
          >
            Add a way to pay
          </button>

          <SelectField
            label="Chosen on arrival"
            value={chosenMethod(c)}
            options={methodsOf(c).map((m) => ({ value: m.id, label: m.label || 'Untitled' }))}
            onChange={(v) => patch('checkout', { chosen: v })}
          />

          <TextField
            label="Card number field"
            value={c.cardNumberLabel}
            pipelineKey={'checkout.cardNumberLabel'}
            onChange={(v) => patch('checkout', { cardNumberLabel: v })}
          />
          <TextField
            label="Expiry field"
            value={c.expiryLabel}
            pipelineKey={'checkout.expiryLabel'}
            onChange={(v) => patch('checkout', { expiryLabel: v })}
          />
          <TextField
            label="CVC field"
            value={c.cvcLabel}
            pipelineKey={'checkout.cvcLabel'}
            onChange={(v) => patch('checkout', { cvcLabel: v })}
          />
          <TextField
            label="Name on card field"
            value={c.nameOnCardLabel}
            pipelineKey={'checkout.nameOnCardLabel'}
            onChange={(v) => patch('checkout', { nameOnCardLabel: v })}
          />
        </FieldGroup>

        <FieldGroup title="Small print and buttons">
          <TextField
            label="Legal text"
            value={c.legal}
            pipelineKey={'checkout.legal'}
            onChange={(v) => patch('checkout', { legal: v })}
            rows={6}
            helpText={liveCheckout !== c ? `Reads: “${liveCheckout.legal}”. ${TOKENS_HELP}` : TOKENS_HELP}
          />
          <TextField
            label="Pay button"
            value={c.payCta}
            pipelineKey={'checkout.payCta'}
            onChange={(v) => patch('checkout', { payCta: v })}
            helpText={liveCheckout !== c ? `Reads “${liveCheckout.payCta}”. ${TOKENS_HELP}` : TOKENS_HELP}
          />
          <TextField
            label="Under the pay button"
            value={c.secureCta}
            pipelineKey={'checkout.secureCta'}
            onChange={(v) => patch('checkout', { secureCta: v })}
          />
          <TextField
            label="Promo row"
            value={c.promoLabel}
            pipelineKey={'checkout.promoLabel'}
            onChange={(v) => patch('checkout', { promoLabel: v })}
          />
        </FieldGroup>
      </>
    )
  }

  const r = flow.ready
  return (
    <>
      <FieldGroup title="Screen">
        {navTitle('ready', r.navTitle)}
        <TextField label="Heading" value={r.title} pipelineKey={'ready.title'} onChange={(v) => patch('ready', { title: v })} rows={2} />
        <TextField
          label="Under the heading"
          value={r.body}
          pipelineKey={'ready.body'}
          onChange={(v) => patch('ready', { body: v })}
          rows={3}
        />
      </FieldGroup>

      <FieldGroup title="Buttons">
        <TextField label="Button" value={r.cta} pipelineKey={'ready.cta'} onChange={(v) => patch('ready', { cta: v })} />
        <TextField
          label="Second button"
          value={r.altCta}
          pipelineKey={'ready.altCta'}
          onChange={(v) => patch('ready', { altCta: v })}
        />
      </FieldGroup>
    </>
  )
}
