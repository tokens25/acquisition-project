import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
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
      onChange={(v) => patch(screen, { navTitle: v } as never)}
      helpText="The line in the bar under the status bar."
    />
  )

  if (step.renderer === 'cadence') {
    const c = flow.cadence
    return (
      <>
        <section className="demo__group">
          <h3 className="demo__group-title">Screen</h3>
          {navTitle('cadence', c.navTitle)}
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Ways to pay</h3>
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
                  onChange={(v) => write({ title: v })}
                />
                <TextField
                  label="Under the name"
                  value={option.note}
                  onChange={(v) => write({ note: v })}
                />
                <TextField
                  label="Price"
                  value={option.price}
                  onChange={(v) => write({ price: v })}
                />
                <TextField
                  label="How to pay"
                  value={option.unit}
                  onChange={(v) => write({ unit: v })}
                  helpText={`Reads as ${option.price}/${option.unit || '…'}.`}
                />
                <TextField
                  label="Ribbon"
                  value={option.badge}
                  onChange={(v) => write({ badge: v })}
                  helpText="Empty draws no ribbon."
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
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Bottom of the screen</h3>
          <TextField
            label="Button"
            value={c.cta}
            onChange={(v) => patch('cadence', { cta: v })}
          />
          <TextField
            label="Footnote"
            value={c.footnote}
            onChange={(v) => patch('cadence', { footnote: v })}
            rows={2}
          />
        </section>
      </>
    )
  }

  if (step.renderer === 'auth') {
    const a = flow.auth
    return (
      <>
        <section className="demo__group">
          <h3 className="demo__group-title">Screen</h3>
          {navTitle('auth', a.navTitle)}
          <TextField label="Heading" value={a.title} onChange={(v) => patch('auth', { title: v })} />
          <TextField
            label="Under the heading"
            value={a.subtitle}
            onChange={(v) => patch('auth', { subtitle: v })}
            rows={2}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Notice</h3>
          <TextField
            label="Notice heading"
            value={a.noticeTitle}
            onChange={(v) => patch('auth', { noticeTitle: v })}
          />
          <TextField
            label="Notice body"
            value={a.noticeBody}
            onChange={(v) => patch('auth', { noticeBody: v })}
            rows={2}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Sign in</h3>
          <TextField
            label="Email field"
            value={a.emailLabel}
            onChange={(v) => patch('auth', { emailLabel: v })}
          />
          <TextField
            label="Typed email"
            value={a.emailValue}
            onChange={(v) => patch('auth', { emailValue: v })}
            helpText="Empty draws the field as nobody has typed in it yet."
          />
          <TextField label="Button" value={a.cta} onChange={(v) => patch('auth', { cta: v })} />
          <TextField
            label="Divider"
            value={a.dividerLabel}
            onChange={(v) => patch('auth', { dividerLabel: v })}
          />
          {a.providers.map((p, i) => (
            <TextField
              key={p.id}
              label={`${p.id[0].toUpperCase()}${p.id.slice(1)} button`}
              value={p.label}
              onChange={(v) =>
                patch('auth', {
                  providers: a.providers.map((q, j) => (j === i ? { ...q, label: v } : q)),
                })
              }
            />
          ))}
        </section>
      </>
    )
  }

  if (step.renderer === 'account') {
    const a = flow.account
    return (
      <>
        <section className="demo__group">
          <h3 className="demo__group-title">Screen</h3>
          {navTitle('account', a.navTitle)}
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Name</h3>
          <TextField
            label="Section heading"
            value={a.nameHeading}
            onChange={(v) => patch('account', { nameHeading: v })}
          />
          <TextField
            label="First name field"
            value={a.firstNameLabel}
            onChange={(v) => patch('account', { firstNameLabel: v })}
          />
          <TextField
            label="First name shown"
            value={a.firstNameValue}
            onChange={(v) => patch('account', { firstNameValue: v })}
          />
          <TextField
            label="Last name field"
            value={a.lastNameLabel}
            onChange={(v) => patch('account', { lastNameLabel: v })}
          />
          <TextField
            label="Last name shown"
            value={a.lastNameValue}
            onChange={(v) => patch('account', { lastNameValue: v })}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Email</h3>
          <TextField
            label="Section heading"
            value={a.emailHeading}
            onChange={(v) => patch('account', { emailHeading: v })}
          />
          <TextField
            label="Email field"
            value={a.emailLabel}
            onChange={(v) => patch('account', { emailLabel: v })}
          />
          <TextField
            label="Email shown"
            value={a.emailValue}
            onChange={(v) => patch('account', { emailValue: v })}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Password</h3>
          <TextField
            label="Section heading"
            value={a.passwordHeading}
            onChange={(v) => patch('account', { passwordHeading: v })}
          />
          <TextField
            label="Password field"
            value={a.passwordLabel}
            onChange={(v) => patch('account', { passwordLabel: v })}
          />
          <TextField
            label="Password shown"
            value={a.passwordValue}
            onChange={(v) => patch('account', { passwordValue: v })}
            helpText="Drawn as dots. Only its length shows."
          />
          <TextField
            label="Checklist heading"
            value={a.rulesTitle}
            onChange={(v) => patch('account', { rulesTitle: v })}
          />
          {a.rules.map((rule, i) => (
            <TextField
              key={i}
              label={`Rule ${i + 1}`}
              value={rule}
              onChange={(v) =>
                patch('account', { rules: a.rules.map((r, j) => (j === i ? v : r)) })
              }
            />
          ))}
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Marketing consent</h3>
          <TextField
            label="Section heading"
            value={a.notifyHeading}
            onChange={(v) => patch('account', { notifyHeading: v })}
          />
          <TextField
            label="Consent text"
            value={a.consentBody}
            onChange={(v) => patch('account', { consentBody: v })}
            rows={4}
          />
          <TextField
            label="Under the box"
            value={a.consentNote}
            onChange={(v) => patch('account', { consentNote: v })}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Buttons</h3>
          <TextField label="Button" value={a.cta} onChange={(v) => patch('account', { cta: v })} />
          <TextField
            label="Button while working"
            value={a.workingCta}
            onChange={(v) => patch('account', { workingCta: v })}
            helpText="What it says on the confirmed screen, while the account is being made."
          />
        </section>
      </>
    )
  }

  if (step.renderer === 'zip') {
    const z = flow.zip
    return (
      <>
        <section className="demo__group">
          <h3 className="demo__group-title">Screen</h3>
          {navTitle('zip', z.navTitle)}
          <TextField
            label="Heading"
            value={z.heading}
            onChange={(v) => patch('zip', { heading: v })}
          />
          <TextField
            label="Under the heading"
            value={z.body}
            onChange={(v) => patch('zip', { body: v })}
            rows={4}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">ZIP code</h3>
          <TextField
            label="Field"
            value={z.fieldLabel}
            onChange={(v) => patch('zip', { fieldLabel: v })}
          />
          <TextField
            label="Code shown"
            value={z.fieldValue}
            onChange={(v) => patch('zip', { fieldValue: v })}
          />
          <TextField
            label="Heading over the teams"
            value={z.resultsLabel}
            onChange={(v) => patch('zip', { resultsLabel: v })}
            helpText="Only on the results screen. Figma still carries a placeholder here."
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Buttons</h3>
          <TextField label="Button" value={z.cta} onChange={(v) => patch('zip', { cta: v })} />
          <TextField
            label="Divider"
            value={z.dividerLabel}
            onChange={(v) => patch('zip', { dividerLabel: v })}
          />
          <TextField
            label="Second button"
            value={z.altCta}
            onChange={(v) => patch('zip', { altCta: v })}
          />
        </section>
      </>
    )
  }

  if (step.renderer === 'checkout') {
    const c = flow.checkout
    return (
      <>
        <section className="demo__group">
          <h3 className="demo__group-title">Screen</h3>
          {navTitle('checkout', c.navTitle)}
          <TextField
            label="Note at the top"
            value={c.note}
            onChange={(v) => patch('checkout', { note: v })}
            rows={2}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">What you are buying</h3>
          <TextField
            label="Summary title"
            value={c.summaryTitle}
            onChange={(v) => patch('checkout', { summaryTitle: v })}
          />
          <TextField
            label="Change button"
            value={c.changeCta}
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
                  onChange={(v) => write({ label: v })}
                />
                <TextField
                  label="Amount"
                  value={line.value}
                  onChange={(v) => write({ value: v })}
                />
                <TextField
                  label="How to pay"
                  value={line.unit ?? ''}
                  onChange={(v) => write({ unit: v })}
                  helpText="Empty shows the amount on its own."
                />
              </div>
            )
          })}
          <TextField
            label="Renewal note"
            value={c.renewalNote}
            onChange={(v) => patch('checkout', { renewalNote: v })}
            rows={3}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">How to pay</h3>
          <TextField
            label="Cards option"
            value={c.cardsLabel}
            onChange={(v) => patch('checkout', { cardsLabel: v })}
          />
          <TextField
            label="Cards chip"
            value={c.cardsOverflow}
            onChange={(v) => patch('checkout', { cardsOverflow: v })}
            helpText="The “+4” beside the card marks."
          />
          <TextField
            label="Card number field"
            value={c.cardNumberLabel}
            onChange={(v) => patch('checkout', { cardNumberLabel: v })}
          />
          <TextField
            label="Expiry field"
            value={c.expiryLabel}
            onChange={(v) => patch('checkout', { expiryLabel: v })}
          />
          <TextField
            label="CVC field"
            value={c.cvcLabel}
            onChange={(v) => patch('checkout', { cvcLabel: v })}
          />
          <TextField
            label="Name on card field"
            value={c.nameOnCardLabel}
            onChange={(v) => patch('checkout', { nameOnCardLabel: v })}
          />
          <TextField
            label="Google Pay option"
            value={c.googlePayLabel}
            onChange={(v) => patch('checkout', { googlePayLabel: v })}
          />
          <TextField
            label="PayPal option"
            value={c.paypalLabel}
            onChange={(v) => patch('checkout', { paypalLabel: v })}
          />
        </section>

        <section className="demo__group">
          <h3 className="demo__group-title">Small print and buttons</h3>
          <TextField
            label="Legal text"
            value={c.legal}
            onChange={(v) => patch('checkout', { legal: v })}
            rows={6}
          />
          <TextField
            label="Pay button"
            value={c.payCta}
            onChange={(v) => patch('checkout', { payCta: v })}
          />
          <TextField
            label="Under the pay button"
            value={c.secureCta}
            onChange={(v) => patch('checkout', { secureCta: v })}
          />
          <TextField
            label="Promo row"
            value={c.promoLabel}
            onChange={(v) => patch('checkout', { promoLabel: v })}
          />
        </section>
      </>
    )
  }

  const r = flow.ready
  return (
    <>
      <section className="demo__group">
        <h3 className="demo__group-title">Screen</h3>
        {navTitle('ready', r.navTitle)}
        <TextField label="Heading" value={r.title} onChange={(v) => patch('ready', { title: v })} rows={2} />
        <TextField
          label="Under the heading"
          value={r.body}
          onChange={(v) => patch('ready', { body: v })}
          rows={3}
        />
      </section>

      <section className="demo__group">
        <h3 className="demo__group-title">Buttons</h3>
        <TextField label="Button" value={r.cta} onChange={(v) => patch('ready', { cta: v })} />
        <TextField
          label="Second button"
          value={r.altCta}
          onChange={(v) => patch('ready', { altCta: v })}
        />
      </section>
    </>
  )
}
