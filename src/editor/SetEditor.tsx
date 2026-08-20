import './editor.css'

import { useState } from 'react'
import { logoCatalog } from '../card/assets'
import type { AddOnType, AuthoredCard, CardPatch } from '../rules/content'
import { marketFor, resolveCard } from '../rules/resolve'
import { summarise, validateAll, validateContext } from '../rules/validate'
import { CheckField, FieldGroup, NumberField, SelectField, TextArea, TextField } from './Field'
import { journeys } from '../rules/journeys'
import { BASE_MARKET, type CardSetStore } from './useCardSet'

const ADDON_TYPES: { value: AddOnType; label: string }[] = [
  { value: 'included', label: 'Included in plan' },
  { value: 'one-time-payment', label: 'One time payment' },
  { value: 'discount-code', label: 'Discount code' },
]

/**
 * The authoring surface.
 *
 * Only fields §7 marks as authored appear as inputs. Everything derived or
 * static is listed read-only underneath, so an editor can see what a switch
 * produced without being able to contradict it.
 *
 * Edits land wherever the context points: on the base card, or on that
 * market's difference from it.
 */
export function SetEditor({ store }: { store: CardSetStore }) {
  const { set, context, editingBase, setContext, updateSet } = store
  const [openCard, setOpenCard] = useState(set.cards[0]?.id ?? '')

  const results = validateAll(set)
  const coverage = summarise(results)
  const here = validateContext(set, context)
  const hereErrors = here.filter((v) => v.severity === 'error')

  return (
    <form className="ed" onSubmit={(e) => e.preventDefault()}>

      {/* Coverage — machines check every market, so a person only reviews changes. */}
      <div
        className="ed-gate"
        data-state={coverage.failing.length ? 'blocked' : coverage.warning.length ? 'warn' : 'clear'}
      >
        <p className="ed-gate__headline">
          {coverage.failing.length
            ? `Publish blocked — ${coverage.failing.length} of ${coverage.total} contexts failing`
            : `Publish ready — ${coverage.total} contexts checked`}
        </p>
        {coverage.failing.length > 0 && (
          <p className="ed-gate__contexts">Failing: {coverage.failingLabels.join(', ')}</p>
        )}
        {coverage.warning.length > 0 && (
          <p className="ed-gate__contexts">Warnings: {coverage.warningLabels.join(', ')}</p>
        )}
        {here.length > 0 && (
          <ul className="ed-gate__list">
            {here.map((v, i) => (
              <li key={i} data-severity={v.severity}>
                <code>{v.rule}</code> {v.message}
                {v.cardId && <span className="ed-gate__card"> · {v.cardId}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <FieldGroup title="Context">
        <SelectField
          label="Market"
          hint={editingBase ? 'Editing the base — changes reach every market.' : `Editing ${context.market}'s difference from the base.`}
          value={context.market}
          options={[
            { value: BASE_MARKET, label: 'Base — all markets' },
            ...set.markets.map((m) => ({ value: m.code, label: `${m.label} (${m.currency})` })),
          ]}
          onChange={(v) => setContext({ ...context, market: v })}
        />
        <SelectField
          label="Journey"
          value={set.journeyId}
          options={journeys.map((j) => ({ value: j.id, label: j.name }))}
          onChange={(v) => updateSet({ journeyId: v })}
        />
      </FieldGroup>

      <FieldGroup title="Tiers">
        <div className="ed-tabs">
        {set.cards.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ed-tab"
            data-on={openCard === c.id || undefined}
            data-invalid={hereErrors.some((e) => e.cardId === c.id) || undefined}
            onClick={() => setOpenCard(c.id)}
          >
            {resolveCard(c, context).planName || c.id}
          </button>
        ))}
        </div>
      </FieldGroup>

      {set.cards
        .filter((c) => c.id === openCard)
        .map((card) => (
          <CardFields key={card.id} card={card} store={store} />
        ))}
    </form>
  )
}

function CardFields({ card, store }: { card: AuthoredCard; store: CardSetStore }) {
  const { set, context, updateCard, overriddenKeys } = store
  const resolved = resolveCard(card, context)
  const market = marketFor(set, context.market)
  const overridden = overriddenKeys(card)

  const patch = (p: CardPatch) => updateCard(card.id, p)
  const mark = (key: keyof CardPatch) => (overridden.includes(key) ? ' ●' : '')

  const toggleLogo = (id: string) => {
    const has = resolved.logos.some((l) => l.id === id)
    patch({
      logos: has
        ? resolved.logos.filter((l) => l.id !== id)
        : [...resolved.logos, { id, alt: logoCatalog[id].alt }],
    })
  }

  return (
    <>
      <FieldGroup title="Content">
        <TextField label={`Plan Name${mark('planName')}`} hint="One value — header, CTA and add-on label." value={resolved.planName} onChange={(v) => patch({ planName: v })} />
        <TextArea label={`Description${mark('description')}`} hint="Full text. Never pre-truncate — the card measures and adds “… more”." value={resolved.description} onChange={(v) => patch({ description: v })} rows={4} />
      </FieldGroup>

      <FieldGroup title={`Pricing — ${market.currency}`}>
        <CheckField
          label={`Discount${mark('discount')}`}
          hint="Drives the caption, primary and struck price, the explainer and the CTA area."
          checked={resolved.discount}
          onChange={(v) => patch({ discount: v })}
        />
        <NumberField label={`Standard price${mark('standardPrice')}`} value={resolved.standardPrice} step={0.01} min={0} onChange={(v) => patch({ standardPrice: v })} />
        <NumberField label={`Intro price${mark('introPrice')}`} hint="Used as the primary price while Discount is on." value={resolved.introPrice} step={0.01} min={0} onChange={(v) => patch({ introPrice: v })} />
        <NumberField label={`Intro months${mark('introMonths')}`} value={resolved.introMonths} min={1} onChange={(v) => patch({ introMonths: v })} />
        <TextField label={`Billing period${mark('installment')}`} value={resolved.installment} onChange={(v) => patch({ installment: v })} />
      </FieldGroup>

      <FieldGroup title="Competitions">
        <div className="ed-logos">
          {Object.entries(logoCatalog).map(([id, logo]) => {
            const on = resolved.logos.some((l) => l.id === id)
            return (
              <button key={id} type="button" className="ed-logo" data-on={on || undefined} onClick={() => toggleLogo(id)} title={logo.alt} aria-pressed={on}>
                <img src={logo.src} alt={logo.alt} />
              </button>
            )
          })}
        </div>
        <NumberField label={`Total competitions${mark('logoTotal')}`} hint="Drives the derived “+N” tile." value={resolved.logoTotal} min={0} onChange={(v) => patch({ logoTotal: v })} />
      </FieldGroup>

      <FieldGroup title="Add-on">
        <CheckField label="Show add-on" checked={resolved.addOn.enabled} onChange={(v) => patch({ addOn: { enabled: v } })} />
        <SelectField label="Type" value={resolved.addOn.type} options={ADDON_TYPES} onChange={(v) => patch({ addOn: { type: v } })} />
        <TextField label="Title" value={resolved.addOn.title} onChange={(v) => patch({ addOn: { title: v } })} />
        <TextField label="Subtitle" value={resolved.addOn.subtitle} onChange={(v) => patch({ addOn: { subtitle: v } })} />
      </FieldGroup>

      <FieldGroup title="Features">
        {resolved.features.map((feature, i) => (
          <div className="ed-row" key={i}>
            <TextField
              label={`Feature ${i + 1}`}
              value={feature}
              onChange={(v) => {
                const features = [...resolved.features]
                features[i] = v
                patch({ features })
              }}
            />
            <button type="button" className="ed__btn ed__btn--quiet ed__btn--icon" onClick={() => patch({ features: resolved.features.filter((_, j) => j !== i) })} aria-label={`Remove feature ${i + 1}`}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="ed__btn" onClick={() => patch({ features: [...resolved.features, 'New feature'] })}>
          Add feature
        </button>
      </FieldGroup>

    </>
  )
}
