import './editor.css'

import { useState } from 'react'
import { logoArtwork } from '../card/assets'
import type { AddOnPurchaseType, CardSet, Tier, TierPatch } from '../rules/content'
import { DIRECT } from '../rules/content'
import { journeysFor, resolveJourney } from '../rules/journey'
import { journeys } from '../rules/journeys'
import { excludedTiers, marketFor, resolveTier } from '../rules/resolve'
import { summarise, validateAll, validateContext } from '../rules/validate'
import { CheckField, FieldGroup, NumberField, SelectField, TextArea, TextField } from './Field'
import { StepPicker } from './StepPicker'
import { BASE_MARKET, type CardSetStore } from './useCardSet'

const PURCHASE_TYPES: { value: AddOnPurchaseType; label: string }[] = [
  { value: 'one_time_payment', label: 'One time payment' },
  { value: 'discount_code', label: 'Discount code' },
]

/**
 * The authoring surface.
 *
 * Only authored fields appear as inputs. Pricing edits land on the offer for
 * (tier, cadence, market) — the same plan sold two ways has two prices, and a
 * cadence it is not sold at has no row at all.
 */
export function SetEditor({ store }: { store: CardSetStore }) {
  const { set, context, editingBase, setContext, updateSet, journey, staleSeed, acceptSeed } = store
  const [openTier, setOpenTier] = useState(set.tiers[0]?.id ?? '')

  // A storefront belongs to its markets, and a journey to its storefront — so
  // both pickers narrow as the market changes, rather than offering a flow that
  // does not run here and quietly previewing content against it.
  const channelsHere = set.channels.filter(
    (c) => !c.markets || c.markets.includes(context.market),
  )
  const journeysHere = journeysFor(journeys, context)
  const hiddenJourneys = journeys.length - journeysHere.length

  const steps = resolveJourney(journey, context)
  const selectedStep = steps.find((s) => s.id === set.stepId) ?? steps[0]
  const editingPlans = selectedStep?.renderer === 'plans'

  // Tiers the current context does not render, and why. Kept selectable
  // rather than hidden: the publish gate checks every context, so a failure can
  // sit on a tier that this one happens not to show — and a tab you cannot see
  // is a fix you cannot reach.
  const absent = new Map(excludedTiers(set, context).map((e) => [e.tier.id, e.reason]))

  const coverage = summarise(validateAll(set))
  const here = validateContext(set, context)
  const hereErrors = here.filter((v) => v.severity === 'error')

  return (
    <form className="ed" onSubmit={(e) => e.preventDefault()}>
      {staleSeed && (
        <div className="ed-stale">
          <p className="ed-stale__text">
            This browser’s saved content is older than the content shipped in this build. Errors you
            see here may already be fixed in the repository.
          </p>
          <div className="ed-stale__actions">
            <button type="button" className="ed-stale__btn" onClick={store.reset}>
              Load shipped content
            </button>
            <button type="button" className="ed-stale__btn" onClick={acceptSeed}>
              Keep mine
            </button>
          </div>
        </div>
      )}
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
          <p className="ed-gate__contexts">Failing: {coverage.failingLabels.slice(0, 6).join(', ')}
            {coverage.failing.length > 6 && ` and ${coverage.failing.length - 6} more`}</p>
        )}
        {here.length > 0 && (
          <ul className="ed-gate__list">
            {here.slice(0, 8).map((v, i) => (
              <li key={i} data-severity={v.severity}>
                <code>{v.rule}</code> {v.message}
                {v.tierId && <span className="ed-gate__card"> · {v.tierId}</span>}
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
          label="Storefront"
          hint={context.channel === DIRECT ? 'Direct sells live tiers only.' : 'Partners also carry direct tiers flagged visible to them, legacy or not.'}
          value={context.channel}
          options={channelsHere.map((c) => ({ value: c.code, label: c.label }))}
          onChange={(v) => setContext({ ...context, channel: v })}
        />
        <SelectField
          label="How to pay"
          hint="A tier with no offer at this cadence is not sold this way, and does not render."
          value={context.cadence}
          options={set.cadences.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setContext({ ...context, cadence: v })}
        />
        <SelectField
          label="Journey"
          hint={hiddenJourneys > 0
            ? `${hiddenJourneys} ${hiddenJourneys === 1 ? 'journey does' : 'journeys do'} not run in this market or storefront.`
            : undefined}
          value={journey.id}
          options={journeysHere.map((j) => ({ value: j.id, label: j.name }))}
          onChange={(v) => updateSet({ journeyId: v })}
        />
      </FieldGroup>

      <FieldGroup title="Steps">
        <StepPicker
          journey={journey}
          context={context}
          selectedId={set.stepId}
          onSelect={(id) => updateSet({ stepId: id })}
        />
      </FieldGroup>

      {!editingPlans && (
        <p className="ed-placeholder">
          <strong>{selectedStep?.shortName ?? selectedStep?.name}</strong> has no editable fields
          yet. Only Subscription is wired up — the rest are placeholders for now.
        </p>
      )}

      {editingPlans && (
        <>
          <FieldGroup title="Tiers">
            <div className="ed-tabs">
              {set.tiers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="ed-tab"
                  data-on={openTier === t.id || undefined}
                  data-invalid={hereErrors.some((e) => e.tierId === t.id) || undefined}
                  data-absent={absent.has(t.id) || undefined}
                  title={absent.get(t.id)}
                  onClick={() => setOpenTier(t.id)}
                >
                  {resolveTier(t, context).planName || t.id}
                </button>
              ))}
            </div>
            {absent.has(openTier) && (
              <p className="ed-absent">
                <strong>{resolveTier(set.tiers.find((t) => t.id === openTier)!, context).planName}</strong>{' '}
                is not in this set — {absent.get(openTier)}. Edits still apply everywhere it is sold.
              </p>
            )}
          </FieldGroup>

          {set.tiers
            .filter((t) => t.id === openTier)
            .map((tier) => (
              <TierFields key={tier.id} tier={tier} store={store} />
            ))}
        </>
      )}
    </form>
  )
}

function TierFields({ tier, store }: { tier: Tier; store: CardSetStore }) {
  const { set, context, updateTier, updateOffer, offerFor } = store
  const resolved = resolveTier(tier, context)
  const market = marketFor(set, context.market)
  const offer = offerFor(tier.id)

  const patch = (p: TierPatch) => updateTier(tier.id, p)

  const toggleLogo = (id: string) => {
    const has = resolved.logoTiles.includes(id)
    patch({
      logoTiles: has ? resolved.logoTiles.filter((l) => l !== id) : [...resolved.logoTiles, id],
    })
  }

  return (
    <>
      <FieldGroup title="Content">
        <TextField label="Plan Name" hint="One value — header, CTA and add-on label." value={resolved.planName} onChange={(v) => patch({ planName: v })} />
        <TextArea label="Description" hint="Full text. Never pre-truncate — the card measures and adds “… more”." value={resolved.description} onChange={(v) => patch({ description: v })} rows={4} />
      </FieldGroup>

      <FieldGroup title="Availability">
        <SelectField
          label="Status"
          hint="Legacy closes a tier to new direct customers. Partners may still sell it."
          value={resolved.status}
          options={[
            { value: 'live', label: 'Live' },
            { value: 'legacy', label: 'Legacy' },
          ]}
          onChange={(v) => patch({ status: v as Tier['status'] })}
        />
        <CheckField
          label="Partners may carry this"
          hint="Only meaningful for direct tiers."
          checked={resolved.visibleToPartners}
          onChange={(v) => patch({ visibleToPartners: v })}
        />
        <CheckField
          label="Ultimate treatment"
          hint="Gold stroke, badge, gold plan name and gold CTA — max one per set (S-1)."
          checked={resolved.ultimate}
          onChange={(v) => patch({ ultimate: v })}
        />
      </FieldGroup>

      <OfferFields
        set={set}
        currency={market.currency}
        cadence={context.cadence}
        offer={offer}
        onChange={(p) => updateOffer(tier.id, p)}
      />

      <FieldGroup title="Competitions">
        <div className="ed-logos">
          {set.logoCatalog.map((logo) => {
            const on = resolved.logoTiles.includes(logo.id)
            return (
              <button key={logo.id} type="button" className="ed-logo" data-on={on || undefined} onClick={() => toggleLogo(logo.id)} title={logo.name} aria-pressed={on}>
                <img src={logoArtwork[logo.id]} alt={logo.altText} />
              </button>
            )
          })}
        </div>
        <NumberField label="Total competitions" hint="Drives the derived “+N” tile." value={resolved.logoTotal} min={0} onChange={(v) => patch({ logoTotal: v })} />
      </FieldGroup>

      <FieldGroup title="Features">
        {resolved.features.map((id, i) => (
          <div className="ed-row" key={`${id}-${i}`}>
            <SelectField
              label={`Feature ${i + 1}`}
              value={id}
              options={set.featureCatalog.map((f) => ({
                value: f.id,
                label: f.status === 'deprecated' ? `${f.text} (retired)` : f.text,
              }))}
              onChange={(v) => patch({ features: resolved.features.map((f, j) => (j === i ? v : f)) })}
            />
            <button type="button" className="ed__btn ed__btn--quiet ed__btn--icon" onClick={() => patch({ features: resolved.features.filter((_, j) => j !== i) })} aria-label={`Remove feature ${i + 1}`}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="ed__btn" onClick={() => patch({ features: [...resolved.features, set.featureCatalog[0].id] })}>
          Add feature
        </button>
      </FieldGroup>
    </>
  )
}

function OfferFields({
  set,
  currency,
  cadence,
  offer,
  onChange,
}: {
  set: CardSet
  currency: string
  cadence: string
  offer: ReturnType<CardSetStore['offerFor']>
  onChange: (patch: Parameters<CardSetStore['updateOffer']>[1]) => void
}) {
  if (!offer) {
    return (
      <FieldGroup title={`Pricing — ${cadence}`}>
        <p className="ed-placeholder">
          Not sold at <strong>{cadence}</strong>. That is a fact about the plan, not a gap — the
          card does not render in this view.
        </p>
      </FieldGroup>
    )
  }

  /**
   * A first discount price, for when the box is ticked and none is set yet.
   *
   * 20% below standard, which is both a plausible opening offer and — because
   * a price ending .99 stays .99 at four fifths — never lands on an odd
   * fraction. Guarded so it can never come back equal to standard, since the
   * whole point is that ticking a box cannot produce an invalid card.
   */
  const firstDiscountPrice = () => {
    const suggested = Math.round(offer.standardPrice * 80) / 100
    return suggested < offer.standardPrice ? suggested : 0
  }

  return (
    <FieldGroup title={`Pricing — ${cadence}, ${currency}`}>
      <CheckField
        label={<span className="ed-label-chip">Apply discount</span>}
        hint="Drives the caption, primary and struck price, the explainer and the CTA area."
        checked={offer.discount}
        onChange={(v) =>
          onChange({ discount: v, introPrice: v ? (offer.introPrice ?? firstDiscountPrice()) : null })
        }
      />
      <NumberField label="Standard price" value={offer.standardPrice} step={0.01} min={0} onChange={(v) => onChange({ standardPrice: v })} />
      {offer.discount && (
        <>
          <NumberField
            label="Discount price"
            hint={`Used as the primary price while Discount is on. Must stay below ${offer.standardPrice}.`}
            value={offer.introPrice ?? 0}
            step={0.01}
            min={0}
            max={offer.standardPrice}
            onChange={(v) => onChange({ introPrice: v })}
          />
          <NumberField label="Discount months" value={offer.introMonths} min={1} onChange={(v) => onChange({ introMonths: v })} />
        </>
      )}

      <SelectField
        label="Add-on"
        hint="Sold on this offer, or bundled into it — never both."
        value={offer.addOnId ?? (offer.includedAddOnIds[0] ? `included:${offer.includedAddOnIds[0]}` : '')}
        options={[
          { value: '', label: 'None' },
          ...set.addOnCatalog.flatMap((a) => [
            { value: a.id, label: `${a.title} — sold` },
            { value: `included:${a.id}`, label: `${a.title} — bundled` },
          ]),
        ]}
        onChange={(v) => {
          if (!v) return onChange({ addOnId: null, addOnPurchaseType: null, addOnDiscountPercent: null, includedAddOnIds: [] })
          if (v.startsWith('included:')) {
            return onChange({ addOnId: null, addOnPurchaseType: null, addOnDiscountPercent: null, includedAddOnIds: [v.slice(9)] })
          }
          return onChange({ addOnId: v, addOnPurchaseType: offer.addOnPurchaseType ?? 'one_time_payment', includedAddOnIds: [] })
        }}
      />
      {offer.addOnId && (
        <SelectField
          label="Purchase type"
          value={offer.addOnPurchaseType ?? 'one_time_payment'}
          options={PURCHASE_TYPES}
          onChange={(v) => onChange({ addOnPurchaseType: v, addOnDiscountPercent: v === 'discount_code' ? (offer.addOnDiscountPercent ?? 15) : null })}
        />
      )}
      {offer.addOnPurchaseType === 'discount_code' && (
        <NumberField label="Discount percent" value={offer.addOnDiscountPercent ?? 0} min={1} max={99} onChange={(v) => onChange({ addOnDiscountPercent: v })} />
      )}
    </FieldGroup>
  )
}
