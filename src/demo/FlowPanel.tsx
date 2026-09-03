import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import { blankCadenceOption, cadenceSavings } from '../rules/cadence'
import { blankConsent, consentsOf } from '../rules/consents'
import { blankProvider, blankQuestion, landingText, providersOf, questionsOf } from '../rules/landing'
import { blankLine, blankMethod, chosenMethod, linesOf, methodsOf } from '../rules/checkout'
import { FieldGroup } from './FieldGroup'
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
export function FlowPanel({ store, step }: { store: CardSetStore; step: Step }) {
  const { set, updateSet } = store
  const at = situationOf(set)
  const ladder = scopeLadder(at)
  const home = ladder.find((r) => isMarketCopy(r.when)) ?? ladder[0]
  const [chosen, setChosen] = useState(home?.label ?? SHARED)
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

  return (
    <>
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
      <FlowFields store={store} step={step} scope={scope} />
    </>
  )
}

function FlowFields({ store, step, scope }: { store: CardSetStore; step: Step; scope: Selector }) {
  const { set, updateSet } = store
  const flow = resolveFlow(set)

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
    // What the page says, the shipped wording standing in where a saved copy
    // predates the section.
    const t = landingText(l)
    return (
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

        {/* Everything below the hero. The page is long, so the groups are the
            sections you would name if you were pointing at it. */}
        <FieldGroup title="Postcode">
          <TextField label="Heading" value={t.zipHeading} pipelineKey={'landing.zipHeading'} onChange={(v) => patch('landing', { zipHeading: v })} />
          <TextField label="Field" value={t.zipLabel} pipelineKey={'landing.zipLabel'} onChange={(v) => patch('landing', { zipLabel: v })} />
          <TextField label="Code shown" value={t.zipValue} pipelineKey={'landing.zipValue'} onChange={(v) => patch('landing', { zipValue: v })} />
          <TextField label="Button" value={t.zipCta} pipelineKey={'landing.zipCta'} onChange={(v) => patch('landing', { zipCta: v })} />
        </FieldGroup>

        <FieldGroup title="Meet the teams">
          <TextField label="Over the heading" value={t.teamsEyebrow} pipelineKey={'landing.teamsEyebrow'} onChange={(v) => patch('landing', { teamsEyebrow: v })} />
          <TextField label="Heading" value={t.teamsTitle} pipelineKey={'landing.teamsTitle'} onChange={(v) => patch('landing', { teamsTitle: v })} />
          <TextField label="Under the heading" value={t.teamsBody} pipelineKey={'landing.teamsBody'} onChange={(v) => patch('landing', { teamsBody: v })} rows={2} />
          <TextField label="Under the tiles" value={t.teamsNote} pipelineKey={'landing.teamsNote'} onChange={(v) => patch('landing', { teamsNote: v })} rows={2} />
          <TextField label="Button" value={t.teamsCta} pipelineKey={'landing.teamsCta'} onChange={(v) => patch('landing', { teamsCta: v })} />
        </FieldGroup>

        <FieldGroup title="Multiview">
          <TextField label="Over the heading" value={t.multiviewEyebrow} pipelineKey={'landing.multiviewEyebrow'} onChange={(v) => patch('landing', { multiviewEyebrow: v })} />
          <TextField label="Pill" value={t.multiviewBadge} pipelineKey={'landing.multiviewBadge'} onChange={(v) => patch('landing', { multiviewBadge: v })} helpText="Empty draws none." />
          <TextField label="Heading" value={t.multiviewTitle} pipelineKey={'landing.multiviewTitle'} onChange={(v) => patch('landing', { multiviewTitle: v })} rows={2} />
          <TextField label="Under the heading" value={t.multiviewBody} pipelineKey={'landing.multiviewBody'} onChange={(v) => patch('landing', { multiviewBody: v })} rows={3} />
          <TextField label="Button" value={t.multiviewCta} pipelineKey={'landing.multiviewCta'} onChange={(v) => patch('landing', { multiviewCta: v })} />
        </FieldGroup>

        <FieldGroup title="TV providers">
          <TextField label="Heading" value={t.providersTitle} pipelineKey={'landing.providersTitle'} onChange={(v) => patch('landing', { providersTitle: v })} rows={2} />
          <TextField label="Under the heading" value={t.providersBody} pipelineKey={'landing.providersBody'} onChange={(v) => patch('landing', { providersBody: v })} rows={3} />
          <TextField label="The gold half" value={t.providersHighlight} pipelineKey={'landing.providersHighlight'} onChange={(v) => patch('landing', { providersHighlight: v })} helpText="Follows the sentence above, in gold." />
          {providersOf(l).map((provider, i) => {
            const all = providersOf(l)
            return (
              <div className="demo__feature" key={provider.id}>
                <TextField
                  label={`Provider ${i + 1}`}
                  value={provider.name}
                  pipelineKey={`landing.providers[${i}].name`}
                  onChange={(v) =>
                    patch('landing', {
                      providers: all.map((p, j) => (j === i ? { ...p, name: v } : p)),
                    })
                  }
                  helpText="The name picks the logo. One with no logo shows its name."
                />
                <button
                  type="button"
                  className="demo__feature-remove"
                  onClick={() => patch('landing', { providers: all.filter((_, j) => j !== i) })}
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
              patch('landing', { providers: [...providersOf(l), blankProvider(providersOf(l))] })
            }
          >
            Add a provider
          </button>
          <TextField label="Under the grid" value={t.providersNote} pipelineKey={'landing.providersNote'} onChange={(v) => patch('landing', { providersNote: v })} rows={2} />
          <TextField label="Button" value={t.providersCta} pipelineKey={'landing.providersCta'} onChange={(v) => patch('landing', { providersCta: v })} />
        </FieldGroup>

        <FieldGroup title="Devices">
          <TextField label="Heading" value={t.devicesTitle} pipelineKey={'landing.devicesTitle'} onChange={(v) => patch('landing', { devicesTitle: v })} />
          <TextField label="Second line" value={t.devicesTitleTwo} pipelineKey={'landing.devicesTitleTwo'} onChange={(v) => patch('landing', { devicesTitleTwo: v })} helpText="The design sets this on its own line." />
          <TextField label="Under the heading" value={t.devicesBody} pipelineKey={'landing.devicesBody'} onChange={(v) => patch('landing', { devicesBody: v })} rows={4} />
          <TextField label="Over the logos" value={t.devicesNote} pipelineKey={'landing.devicesNote'} onChange={(v) => patch('landing', { devicesNote: v })} />
        </FieldGroup>

        <FieldGroup title="Free games">
          <TextField label="Heading" value={t.freeTitle} pipelineKey={'landing.freeTitle'} onChange={(v) => patch('landing', { freeTitle: v })} rows={2} />
          <TextField label="Under the heading" value={t.freeBody} pipelineKey={'landing.freeBody'} onChange={(v) => patch('landing', { freeBody: v })} rows={3} />
          <TextField label="Button" value={t.freeCta} pipelineKey={'landing.freeCta'} onChange={(v) => patch('landing', { freeCta: v })} />
        </FieldGroup>

        <FieldGroup title="Questions">
          <TextField label="Heading" value={t.faqTitle} pipelineKey={'landing.faqTitle'} onChange={(v) => patch('landing', { faqTitle: v })} />
          {questionsOf(l).map((one, i) => {
            const all = questionsOf(l)
            return (
              <div className="demo__feature" key={one.id}>
                <TextField
                  label={`Question ${i + 1}`}
                  value={one.question}
                  pipelineKey={`landing.faqs[${i}].question`}
                  onChange={(v) =>
                    patch('landing', {
                      faqs: all.map((q, j) => (j === i ? { ...q, question: v } : q)),
                    })
                  }
                  rows={2}
                />
                <button
                  type="button"
                  className="demo__feature-remove"
                  onClick={() => patch('landing', { faqs: all.filter((_, j) => j !== i) })}
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
              patch('landing', { faqs: [...questionsOf(l), blankQuestion(questionsOf(l))] })
            }
          >
            Add a question
          </button>
        </FieldGroup>
      </>
    )
  }

  if (step.renderer === 'cadence') {
    const c = flow.cadence
    // What the yearly card will say, so the setting below can show it rather
    // than describe it.
    const savings = Object.values(cadenceSavings(c))[0] ?? ''
    return (
      <>
        <FieldGroup title="Screen">
          {navTitle('cadence', c.navTitle)}
        </FieldGroup>

        <FieldGroup title="Ways to pay">
          {c.options.map((option, i) => {
            const write = (next: Partial<typeof option>) =>
              patch('cadence', {
                options: c.options.map((o, j) => (j === i ? { ...o, ...next } : o)),
              })
            return (
              <div className="demo__feature" key={option.id}>
                <TextField
                  label={`Option ${i + 1}`}
                  value={option.title}
                  pipelineKey={`cadence.options[${i}].title`}
                  onChange={(v) => write({ title: v })}
                />
                <TextField
                  label="Under the name"
                  value={option.note}
                  pipelineKey={`cadence.options[${i}].note`}
                  onChange={(v) => write({ note: v })}
                />
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
                <TextField
                  label="Ribbon"
                  value={option.badge}
                  pipelineKey={`cadence.options[${i}].badge`}
                  onChange={(v) => write({ badge: v })}
                  helpText="Empty draws no ribbon."
                />
                {/* A card can go, as long as one is left to choose. */}
                {c.options.length > 1 && (
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
          <button
            type="button"
            className="ed-add"
            onClick={() =>
              patch('cadence', { options: [...c.options, blankCadenceOption(c.options)] })
            }
          >
            Add a way to pay
          </button>

          <SelectField
            label="Pre-selected"
            value={c.selected}
            options={c.options.map((o) => ({ value: o.id, label: o.title }))}
            onChange={(v) => patch('cadence', { selected: v })}
          />

          {/* The saving itself is not written anywhere — it is the difference
              between the yearly price and twelve monthly ones. This is only how
              that difference is said. */}
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
    return (
      <>
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
          />
          <TextField
            label="Pay button"
            value={c.payCta}
            pipelineKey={'checkout.payCta'}
            onChange={(v) => patch('checkout', { payCta: v })}
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
