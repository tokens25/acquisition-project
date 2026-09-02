import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { FieldGroup } from './FieldGroup'
import type { CardSetStore } from '../editor/useCardSet'
import type { FlowContent } from '../rules/flow'
import { defaultFlow } from '../rules/flow'
import type { Step } from '../rules/journey'

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
export function FlowPanel({ store, step }: { store: CardSetStore; step: Step }) {
  const { set, updateSet } = store
  const flow = { ...defaultFlow, ...set.flow }

  /** Writes one field of one screen, leaving the other five alone. */
  const patch = <K extends keyof FlowContent>(screen: K, next: Partial<FlowContent[K]>) =>
    updateSet({ flow: { ...flow, [screen]: { ...flow[screen], ...next } } })

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
    )
  }

  if (step.renderer === 'cadence') {
    const c = flow.cadence
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
                <TextField
                  label="Saving"
                  value={option.saving ?? ''}
                  pipelineKey={`cadence.options[${i}].saving`}
                  onChange={(v) => write({ saving: v })}
                  helpText="Beside the price, in green. Empty draws nothing."
                />
              </div>
            )
          })}
          <SelectField
            label="Pre-selected"
            value={c.selected}
            options={c.options.map((o) => ({ value: o.id, label: o.title }))}
            onChange={(v) => patch('cadence', { selected: v })}
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
          <TextField
            label="Consent text"
            value={a.consentBody}
            pipelineKey={'account.consentBody'}
            onChange={(v) => patch('account', { consentBody: v })}
            rows={4}
          />
          <TextField
            label="Under the box"
            value={a.consentNote}
            pipelineKey={'account.consentNote'}
            onChange={(v) => patch('account', { consentNote: v })}
          />
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
          {c.lines.map((line, i) => {
            const write = (next: Partial<typeof line>) =>
              patch('checkout', {
                lines: c.lines.map((l, j) => (j === i ? { ...l, ...next } : l)),
              })
            return (
              <div className="demo__feature" key={i}>
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
              </div>
            )
          })}
          <TextField
            label="Renewal note"
            value={c.renewalNote}
            pipelineKey={'checkout.renewalNote'}
            onChange={(v) => patch('checkout', { renewalNote: v })}
            rows={3}
          />
        </FieldGroup>

        <FieldGroup title="How to pay">
          <TextField
            label="Cards option"
            value={c.cardsLabel}
            pipelineKey={'checkout.cardsLabel'}
            onChange={(v) => patch('checkout', { cardsLabel: v })}
          />
          <TextField
            label="Cards chip"
            value={c.cardsOverflow}
            pipelineKey={'checkout.cardsOverflow'}
            onChange={(v) => patch('checkout', { cardsOverflow: v })}
            helpText="The “+4” beside the card marks."
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
          <TextField
            label="Google Pay option"
            value={c.googlePayLabel}
            pipelineKey={'checkout.googlePayLabel'}
            onChange={(v) => patch('checkout', { googlePayLabel: v })}
          />
          <TextField
            label="PayPal option"
            value={c.paypalLabel}
            pipelineKey={'checkout.paypalLabel'}
            onChange={(v) => patch('checkout', { paypalLabel: v })}
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
