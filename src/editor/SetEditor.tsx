import './editor.css'

import { useRef, useState } from 'react'
import { logoCatalog } from '../card/assets'
import type { AddOnType, AuthoredCard, Device } from '../rules/content'
import { deriveCard } from '../rules/derive'
import { validateSet } from '../rules/validate'
import { CheckField, DerivedRow, FieldGroup, NumberField, SelectField, TextArea, TextField } from './Field'
import type { CardSetStore } from './useCardSet'

const DEVICES: { value: Device; label: string }[] = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'xl', label: 'Extra big' },
]

const ADDON_TYPES: { value: AddOnType; label: string }[] = [
  { value: 'included', label: 'Included in plan' },
  { value: 'one-time-payment', label: 'One time payment' },
  { value: 'discount-code', label: 'Discount code' },
]

const LOCALES = [
  { value: 'en-IE', label: 'English (EUR)' },
  { value: 'de-DE', label: 'Deutsch (EUR)' },
  { value: 'it-IT', label: 'Italiano (EUR)' },
  { value: 'en-GB', label: 'English (UK)' },
]

/**
 * The authoring surface.
 *
 * Only fields §7 marks as authored appear as inputs. Everything derived or
 * static is listed read-only underneath, so an editor can see what a switch
 * produced without being able to contradict it.
 */
export function SetEditor({ store }: { store: CardSetStore }) {
  const { set, updateSet, updateCard, reset, exportJson, importJson, importError } = store
  const [openCard, setOpenCard] = useState(set.cards[0]?.id ?? '')
  const fileInput = useRef<HTMLInputElement>(null)

  const violations = validateSet(set)
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  return (
    <form className="ed" onSubmit={(e) => e.preventDefault()}>
      <div className="ed__bar">
        <button type="button" className="ed__btn" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" className="ed__btn" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        <button type="button" className="ed__btn ed__btn--quiet" onClick={reset}>
          Reset
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importJson(file)
            e.target.value = ''
          }}
        />
      </div>
      {importError && <p className="ed__error">Import failed: {importError}</p>}

      <div
        className="ed-gate"
        data-state={errors.length ? 'blocked' : warnings.length ? 'warn' : 'clear'}
      >
        <p className="ed-gate__headline">
          {errors.length
            ? `Publish blocked — ${errors.length} rule ${errors.length === 1 ? 'violation' : 'violations'}`
            : warnings.length
              ? `Ready to publish — ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
              : 'Ready to publish — all rules pass'}
        </p>
        {violations.length > 0 && (
          <ul className="ed-gate__list">
            {violations.map((v, i) => (
              <li key={i} data-severity={v.severity}>
                <code>{v.rule}</code> {v.message}
                {v.cardId && <span className="ed-gate__card"> · {v.cardId}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <FieldGroup title="Set">
        <SelectField
          label="Market / locale"
          hint="Drives currency and number formatting."
          value={set.locale}
          options={LOCALES}
          onChange={(v) => updateSet({ locale: v })}
        />
        <SelectField
          label="Device"
          value={set.device}
          options={DEVICES}
          onChange={(v) => updateSet({ device: v })}
        />
      </FieldGroup>

      <div className="ed-tabs">
        {set.cards.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ed-tab"
            data-on={openCard === c.id || undefined}
            data-invalid={errors.some((e) => e.cardId === c.id) || undefined}
            onClick={() => setOpenCard(c.id)}
          >
            {c.planName || c.id}
          </button>
        ))}
      </div>

      {set.cards
        .filter((c) => c.id === openCard)
        .map((card) => (
          <CardFields key={card.id} card={card} locale={set.locale} onChange={updateCard} />
        ))}
    </form>
  )
}

function CardFields({
  card,
  locale,
  onChange,
}: {
  card: AuthoredCard
  locale: string
  onChange: (id: string, patch: Partial<AuthoredCard>) => void
}) {
  const d = deriveCard(card, locale)
  const patch = (p: Partial<AuthoredCard>) => onChange(card.id, p)

  const toggleLogo = (id: string) => {
    const has = card.logos.some((l) => l.id === id)
    patch({
      logos: has
        ? card.logos.filter((l) => l.id !== id)
        : [...card.logos, { id, alt: logoCatalog[id].alt }],
    })
  }

  return (
    <>
      <FieldGroup title="Switches">
        <CheckField
          label="Ultimate"
          hint="Drives stroke, badge, plan-name fill and CTA appearance together. Max one per set (S-1)."
          checked={card.ultimate}
          onChange={(v) => patch({ ultimate: v })}
        />
        <CheckField
          label="Discount"
          hint="Drives the caption, primary and struck price, the explainer and the CTA area."
          checked={card.discount}
          onChange={(v) => patch({ discount: v })}
        />
      </FieldGroup>

      <FieldGroup title="Content">
        <TextField label="Plan Name" hint="One value — header, CTA and add-on label." value={card.planName} onChange={(v) => patch({ planName: v })} />
        <TextArea label="Description" hint="Full text. Never pre-truncate — the card measures and adds “… more”." value={card.description} onChange={(v) => patch({ description: v })} rows={4} />
      </FieldGroup>

      <FieldGroup title="Pricing">
        <NumberField label="Standard price" value={card.standardPrice.amount} step={0.01} min={0} onChange={(v) => patch({ standardPrice: { ...card.standardPrice, amount: v } })} />
        <NumberField label="Intro price" hint="Used as the primary price while Discount is on." value={card.introPrice.amount} step={0.01} min={0} onChange={(v) => patch({ introPrice: { ...card.introPrice, amount: v } })} />
        <NumberField label="Intro months" value={card.introMonths} min={1} onChange={(v) => patch({ introMonths: v })} />
        <TextField label="Billing period" value={card.installment} onChange={(v) => patch({ installment: v })} />
      </FieldGroup>

      <FieldGroup title="Competitions">
        <div className="ed-logos">
          {Object.entries(logoCatalog).map(([id, logo]) => {
            const on = card.logos.some((l) => l.id === id)
            return (
              <button key={id} type="button" className="ed-logo" data-on={on || undefined} onClick={() => toggleLogo(id)} title={logo.alt} aria-pressed={on}>
                <img src={logo.src} alt={logo.alt} />
              </button>
            )
          })}
        </div>
        <NumberField label="Total competitions" hint="Drives the derived “+N” tile." value={card.logoTotal} min={0} onChange={(v) => patch({ logoTotal: v })} />
      </FieldGroup>

      <FieldGroup title="Add-on">
        <CheckField label="Show add-on" checked={card.addOn.enabled} onChange={(v) => patch({ addOn: { ...card.addOn, enabled: v } })} />
        <SelectField label="Type" value={card.addOn.type} options={ADDON_TYPES} onChange={(v) => patch({ addOn: { ...card.addOn, type: v } })} />
        <TextField label="Title" value={card.addOn.title} onChange={(v) => patch({ addOn: { ...card.addOn, title: v } })} />
        <TextField label="Subtitle" value={card.addOn.subtitle} onChange={(v) => patch({ addOn: { ...card.addOn, subtitle: v } })} />
      </FieldGroup>

      <FieldGroup title="Features">
        {card.features.map((feature, i) => (
          <div className="ed-row" key={i}>
            <TextField
              label={`Feature ${i + 1}`}
              value={feature}
              onChange={(v) => {
                const features = [...card.features]
                features[i] = v
                patch({ features })
              }}
            />
            <button type="button" className="ed__btn ed__btn--quiet ed__btn--icon" onClick={() => patch({ features: card.features.filter((_, j) => j !== i) })} aria-label={`Remove feature ${i + 1}`}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="ed__btn" onClick={() => patch({ features: [...card.features, 'New feature'] })}>
          Add feature
        </button>
      </FieldGroup>

      <FieldGroup title="Produced for you">
        <DerivedRow label="CTA label" value={d.ctaLabel} source="derived" note="Plan Name substitution" />
        <DerivedRow label="Included in…" value={d.addOnIncludedLabel} source="derived" note="Plan Name substitution" />
        <DerivedRow label="Primary price" value={d.primaryPrice} source="derived" note="Intro price while Discount is on" />
        <DerivedRow label="Struck price" value={d.struckPrice ?? ''} source="derived" note="standardPrice, only when Discount is on" />
        <DerivedRow label="Price explainer" value={d.explainer ?? ''} source="derived" note="Repeats standardPrice — one number, two positions" />
        <DerivedRow label="Savings amount" value={d.savingsLabel ?? ''} source="derived" note="Computed delta over 12 months" />
        <DerivedRow label="Logo rows" value={String(d.logoRows)} source="derived" note="1 if the add-on is present, else 2" />
        <DerivedRow label="Overflow tile" value={d.overflowLabel ?? ''} source="derived" note="Count of hidden tiles" />
        <DerivedRow label="Price caption" value={d.priceCaption ?? ''} source="static" note="Shown when Discount is on" />
        <DerivedRow label="Badge" value={d.badgeText ?? ''} source="static" note="Ultimate only" />
        <DerivedRow label="Footer" value={d.footerLabel} source="static" note="Always present" />
      </FieldGroup>
    </>
  )
}
