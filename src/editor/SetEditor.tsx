import './editor.css'

import { useState } from 'react'
import { iconArtwork, logoArtwork } from '../card/assets'
import type { AddOnPurchaseType, CardSet, Tier, TierPatch } from '../rules/content'
import { DIRECT } from '../rules/content'
import { journeysFor, resolveJourney } from '../rules/journey'
import { journeys } from '../rules/journeys'
import { excludedTiers, marketFor, resolveTier } from '../rules/resolve'
import { summarise, validateAll, validateContext } from '../rules/validate'
import { Icon } from '../components/Icon'
import { CheckField, FieldGroup, NumberField, SelectField, TextArea, TextField } from './Field'
import { StepPicker } from './StepPicker'
import { BASE_MARKET, type CardSetStore } from './useCardSet'

/** Sentinel for "write a new line here" in the feature picker. */
const CUSTOM_FEATURE = '__custom__'

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

          <OrphanFeatures store={store} />
        </>
      )}
    </form>
  )
}

function TierFields({ tier, store }: { tier: Tier; store: CardSetStore }) {
  const { set, context, updateTier, updateOffer, offerFor, updateSet } = store
  const resolved = resolveTier(tier, context)
  const market = marketFor(set, context.market)
  const offer = offerFor(tier.id)

  const patch = (p: TierPatch) => updateTier(tier.id, p)

  // Two availability controls are consulted only on one side of the direct /
  // partner line (see filterAcquirableTiers). Naming which side keeps a control
  // that cannot move the preview from reading as one that is broken.
  const onDirect = context.channel === DIRECT
  const tierChannel = resolved.channel || DIRECT
  const statusInert = onDirect
    ? undefined
    : `No effect on ${context.channel} — status closes a tier on the direct storefront only. Partners carry it either way.`
  const partnersInert =
    tierChannel !== DIRECT
      ? `No effect — this tier is exclusive to ${tierChannel}, so there is no direct version for a partner to carry.`
      : onDirect
        ? 'No effect on direct — this decides whether partner storefronts may carry the tier.'
        : undefined


  /** How many tiers reference a catalogue line, in this context. */
  const usedBy = (featureId: string) =>
    set.tiers.filter((t) => resolveTier(t, context).features.includes(featureId)).length

  const updateFeature = (
    id: string,
    p: { text?: string; iconId?: string; status?: 'active' | 'deprecated' },
  ) =>
    updateSet({
      featureCatalog: set.featureCatalog.map((f) => (f.id === id ? { ...f, ...p } : f)),
    })

  /**
   * Adds a blank line to the catalogue and returns its id.
   *
   * A custom line is still a catalogue entry — the engine schema gives a tier a
   * list of ids and nothing else, so an inline one could not survive an export.
   * Writing it here and storing it there keeps the authoring where it is wanted
   * without inventing a shape the renderer cannot read.
   */
  const addCustomFeature = () => {
    // Numbered from what exists rather than stamped with a clock: the same
    // edits produce the same ids, so an exported file diffs cleanly.
    const taken = new Set(set.featureCatalog.map((f) => f.id))
    let n = 1
    while (taken.has(`feature-custom-${n}`)) n += 1
    const id = `feature-custom-${n}`

    updateSet({
      featureCatalog: [
        ...set.featureCatalog,
        { id, iconId: 'check', text: '', status: 'active' as const },
      ],
    })
    return id
  }

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
          inert={statusInert}
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
          inert={partnersInert}
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
        {resolved.features.map((id, i) => {
          const entry = set.featureCatalog.find((f) => f.id === id)
          const setFeature = (v: string) =>
            patch({ features: resolved.features.map((f, j) => (j === i ? v : f)) })
          return (
            <div className="ed-feature-row" key={`${id}-${i}`}>
              <div className="ed-row">
                {/* A select cannot show artwork, and the icon is half of what a
                    feature is. Shown beside the line rather than chosen there —
                    the pairing belongs to the catalogue, not to this tier. */}
                <span className="ed-feature-icon" aria-hidden="true">
                  <Icon svg={iconArtwork[entry?.iconId ?? 'check'] ?? iconArtwork.check} size={16} />
                </span>
                <SelectField
                  label={`Feature ${i + 1}`}
                  value={id}
                  options={[
                    ...set.featureCatalog.map((f) => ({
                      value: f.id,
                      label: f.status === 'deprecated' ? `${f.text} (retired)` : f.text,
                    })),
                    { value: CUSTOM_FEATURE, label: 'Custom line…' },
                  ]}
                  onChange={(v) => (v === CUSTOM_FEATURE ? setFeature(addCustomFeature()) : setFeature(v))}
                />
                <button type="button" className="ed__btn ed__btn--quiet ed__btn--icon" onClick={() => patch({ features: resolved.features.filter((_, j) => j !== i) })} aria-label={`Remove feature ${i + 1}`}>
                  ✕
                </button>
              </div>
              {/* Every line is written here, shared or not. Sending the common
                  case to a second panel put most edits behind a detour; the
                  coupling is better named than avoided. */}
              {entry && (
                <div className="ed-feature-inline">
                  <TextField
                    label="Line"
                    hint={
                      usedBy(entry.id) > 1
                        ? `Shared with ${usedBy(entry.id)} tiers — this wording and icon change on all of them.`
                        : undefined
                    }
                    value={entry.text}
                    onChange={(v) => updateFeature(entry.id, { text: v })}
                  />
                  <div className="ed-icons" role="group" aria-label="Icon">
                    {Object.entries(iconArtwork).map(([iconId, svg]) => (
                      <button
                        key={iconId}
                        type="button"
                        className="ed-icon"
                        data-on={entry.iconId === iconId || undefined}
                        onClick={() => updateFeature(entry.id, { iconId })}
                        aria-pressed={entry.iconId === iconId}
                        aria-label={iconId}
                        title={iconId}
                      >
                        <Icon svg={svg} size={16} />
                      </button>
                    ))}
                  </div>
                  <CheckField
                    label="Retired"
                    hint="Keeps the line out of new picks. Tiers already using it keep rendering it."
                    checked={entry.status === 'deprecated'}
                    onChange={(v) => updateFeature(entry.id, { status: v ? 'deprecated' : 'active' })}
                  />
                </div>
              )}
            </div>
          )
        })}
        <button type="button" className="ed__btn" onClick={() => patch({ features: [...resolved.features, set.featureCatalog[0].id] })}>
          Add feature
        </button>
      </FieldGroup>
    </>
  )
}

/**
 * Feature lines nothing points at any more.
 *
 * Every line is written on the tier that uses it, so there is no standing
 * catalogue panel — it put the common case behind a detour. What a tier cannot
 * reach is a line dropped from the last tier that had it: still in the
 * catalogue, still offered in every picker, authored by nobody. This appears
 * only when that has happened, and disappears again once it is dealt with.
 */
function OrphanFeatures({ store }: { store: CardSetStore }) {
  const { set, updateSet } = store

  const orphans = set.featureCatalog.filter(
    (f) =>
      !set.tiers.some(
        (t) => t.features.includes(f.id) || t.overrides.some((o) => o.patch.features?.includes(f.id)),
      ),
  )
  if (orphans.length === 0) return null

  return (
    <FieldGroup title="Unused feature lines">
      <p className="ed-field__hint">
        Still offered in the picker, used by no tier. Nothing references them, so removing one
        cannot leave a tier pointing at a line that is gone.
      </p>
      {orphans.map((feature) => (
        <div className="ed-row" key={feature.id}>
          <span className="ed-feature-icon" aria-hidden="true">
            <Icon svg={iconArtwork[feature.iconId] ?? iconArtwork.check} size={16} />
          </span>
          <span className="ed-orphan__text">{feature.text || feature.id}</span>
          <button
            type="button"
            className="ed__btn ed__btn--quiet"
            onClick={() =>
              updateSet({ featureCatalog: set.featureCatalog.filter((f) => f.id !== feature.id) })
            }
          >
            Remove
          </button>
        </div>
      ))}
    </FieldGroup>
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
