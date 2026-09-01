import { useState } from 'react'
import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import { iconArtwork } from '../card/assets'
import { Icon } from '../components/Icon'
import type { CardSetStore } from '../editor/useCardSet'
import { excludedTiers, resolveTier } from '../rules/resolve'
import { STATIC } from '../rules/derive'
import { logoArtwork } from '../card/assets'

/** Sentinel for "write a new line here" in the feature picker. */
const CUSTOM_FEATURE = '__custom__'
const CUSTOM_PREFIX = 'feature-custom-'

const PURCHASE_TYPES = [
  { value: 'one_time_payment' as const, label: 'One time payment' },
  { value: 'discount_code' as const, label: 'Discount code' },
]

/**
 * The edit view's form: one step of the journey, one plan at a time.
 *
 * Fields are the DS Form/TextField rather than the hand-rolled inputs the
 * first interface used — the design mocks it with real component instances, so
 * the code should use the real component.
 *
 * Cadence sits in the edit view, beside the prices it qualifies. Typing 34.99 is
 * typing it *for Monthly Flex*, and putting that three screens away in the default
 * view made the number look absolute when it never is.
 */
export function EditPanel({ store }: { store: CardSetStore }) {
  const { set, context, setContext, updateTier, updateOffer, offerFor, updateSet } = store
  const [openTier, setOpenTier] = useState(set.tiers[0]?.id ?? '')

  const absent = new Map(excludedTiers(set, context).map((e) => [e.tier.id, e.reason]))
  const tier = set.tiers.find((t) => t.id === openTier) ?? set.tiers[0]
  if (!tier) return <p className="ed-placeholder">This set has no plans.</p>

  const resolved = resolveTier(tier, context)
  const offer = offerFor(tier.id)
  const market = set.markets.find((m) => m.code === context.market)

  const patchTier = (p: Parameters<typeof updateTier>[1]) => updateTier(tier.id, p)

  const updateFeature = (id: string, p: { text?: string; iconId?: string }) =>
    updateSet({
      featureCatalog: set.featureCatalog.map((f) => (f.id === id ? { ...f, ...p } : f)),
    })

  /** Adds a blank catalogue line and returns its id — see the first interface. */
  const addCustomFeature = () => {
    const taken = new Set(set.featureCatalog.map((f) => f.id))
    let n = 1
    while (taken.has(`${CUSTOM_PREFIX}${n}`)) n += 1
    const id = `${CUSTOM_PREFIX}${n}`
    updateSet({
      featureCatalog: [
        ...set.featureCatalog,
        { id, iconId: 'check', text: '', status: 'active' as const },
      ],
    })
    return id
  }

  const toggleLogo = (id: string) =>
    patchTier({
      logoTiles: resolved.logoTiles.includes(id)
        ? resolved.logoTiles.filter((l) => l !== id)
        : [...resolved.logoTiles, id],
    })

  return (

    <>
      <section className="demo__group">
        <h3 className="demo__group-title">Plans</h3>
        <div className="ed-tabs">
          {set.tiers.map((t) => (
            <button
              key={t.id}
              type="button"
              className="ed-tab"
              data-on={openTier === t.id || undefined}
              data-absent={absent.has(t.id) || undefined}
              title={absent.get(t.id)}
              onClick={() => setOpenTier(t.id)}
            >
              {resolveTier(t, context).planName || t.id}
            </button>
          ))}
        </div>
        {absent.has(tier.id) && (
          <p className="ed-absent">
            <strong>{resolved.planName}</strong> is not in this set — {absent.get(tier.id)}. Edits
            still apply everywhere it is sold.
          </p>
        )}
      </section>

      <section className="demo__group">
        <h3 className="demo__group-title">Tier Name</h3>
        <TextField
          label="Badge"
          value={resolved.badge ?? ''}
          onChange={(v) => patchTier({ badge: v })}
          helpText={
            resolved.ultimate
              ? `Empty falls back to “${STATIC.badge}”.`
              : 'Only shows on the highlighted tier.'
          }
        />
        <ToggleField
          label="Highlighted Tier"
          tone="ultimate"
          checked={resolved.ultimate}
          onChange={(v) => updateTier(tier.id, { ultimate: v })}
        />
        <TextField
          label="Tier name"
          value={resolved.planName}
          onChange={(v) => updateTier(tier.id, { planName: v })}
          helpText="One value — header, CTA and add-on label."
        />
        <TextField
          label="Description"
          value={resolved.description}
          onChange={(v) => updateTier(tier.id, { description: v })}
          rows={4}
          helpText="Enter full text. Never pre-truncate — the card measures and adds “… more”."
        />
      </section>

      <section className="demo__group">
        <h3 className="demo__group-title">
          Pricing{market ? ` — ${market.currency}` : ''}
        </h3>
        <SelectField
          label="How to pay"
          value={context.cadence}
          options={set.cadences.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setContext({ ...context, cadence: v })}
          helpText="The prices below are this cadence only. A plan with no offer here is not sold this way."
        />

        {offer ? (
          <>
            <ToggleField
              label="Apply discount"
              tone="success"
              leading={<Icon svg={iconArtwork.discount} size={20} />}
              checked={offer.discount}
              onChange={(v) =>
                updateOffer(tier.id, {
                  discount: v,
                  introPrice: v
                    ? (offer.introPrice ?? Math.round(offer.standardPrice * 80) / 100)
                    : null,
                })
              }
            />
            <TextField
              label="Standard price"
              type="number"
              step={0.01}
              min={0}
              value={String(offer.standardPrice ?? '')}
              onChange={(v) => updateOffer(tier.id, { standardPrice: Number(v) })}
            />
            {offer.discount && (
              <TextField
                label="Discount price"
                type="number"
                step={0.01}
                min={0}
                max={offer.standardPrice}
                error={offer.introPrice != null && offer.introPrice >= offer.standardPrice}
                value={String(offer.introPrice ?? '')}
                onChange={(v) => updateOffer(tier.id, { introPrice: Number(v) })}
                helpText={`Must stay below ${offer.standardPrice}.`}
              />
            )}
          </>
        ) : (
          <p className="ed-placeholder">
            Not sold at <strong>{context.cadence}</strong>. That is a fact about the plan, not a
            gap — the card does not render in this view.
          </p>
        )}
      </section>

      {/* Add-on lives on the offer, like the prices — the same benefit can be
          sold at one cadence and bundled at another. */}
      <section className="demo__group">
        <h3 className="demo__group-title">Add-on</h3>
        {offer ? (
          <>
            <SelectField
              label="Add-on"
              helpText="Sold on this offer, or bundled into it — never both."
              value={offer.addOnId ?? (offer.includedAddOnIds[0] ? `included:${offer.includedAddOnIds[0]}` : '')}
              options={[
                { value: '', label: 'None' },
                ...set.addOnCatalog.flatMap((a) => [
                  { value: a.id, label: `${a.title} — sold` },
                  { value: `included:${a.id}`, label: `${a.title} — bundled` },
                ]),
              ]}
              onChange={(v) => {
                if (!v) {
                  updateOffer(tier.id, { addOnId: null, addOnPurchaseType: null, addOnDiscountPercent: null, includedAddOnIds: [] })
                  return
                }
                if (v.startsWith('included:')) {
                  updateOffer(tier.id, { addOnId: null, addOnPurchaseType: null, addOnDiscountPercent: null, includedAddOnIds: [v.slice(9)] })
                  return
                }
                updateOffer(tier.id, { addOnId: v, addOnPurchaseType: offer.addOnPurchaseType ?? 'one_time_payment', includedAddOnIds: [] })
              }}
            />
            {offer.addOnId && (
              <SelectField
                label="How it is paid for"
                value={offer.addOnPurchaseType ?? 'one_time_payment'}
                options={PURCHASE_TYPES}
                onChange={(v) =>
                  updateOffer(tier.id, {
                    addOnPurchaseType: v,
                    addOnDiscountPercent: v === 'discount_code' ? (offer.addOnDiscountPercent ?? 15) : null,
                  })
                }
              />
            )}
            {offer.addOnPurchaseType === 'discount_code' && (
              <TextField
                label="Discount percent"
                type="number"
                min={1}
                max={99}
                value={String(offer.addOnDiscountPercent ?? '')}
                onChange={(v) => updateOffer(tier.id, { addOnDiscountPercent: Number(v) })}
              />
            )}
          </>
        ) : (
          <p className="ed-placeholder">No offer at this cadence, so nothing to attach one to.</p>
        )}
      </section>

      <section className="demo__group">
        <h3 className="demo__group-title">Competitions</h3>
        <div className="ed-logos" role="group" aria-label="Competition logos">
          {set.logoCatalog.map((logo) => {
            const on = resolved.logoTiles.includes(logo.id)
            return (
              <button
                key={logo.id}
                type="button"
                className="ed-logo"
                data-on={on || undefined}
                aria-pressed={on}
                title={logo.name}
                onClick={() => toggleLogo(logo.id)}
              >
                <img src={logoArtwork[logo.id]} alt={logo.altText} />
              </button>
            )
          })}
        </div>
        <p className="tg__hint">Shown in the order picked.</p>
        <TextField
          label="Total number of competitions"
          type="number"
          min={0}
          value={String(resolved.logoTotal)}
          onChange={(v) => patchTier({ logoTotal: Number(v) })}
          helpText="Drives the derived “+N” tile."
        />
      </section>

      <section className="demo__group">
        <h3 className="demo__group-title">Features</h3>
        {resolved.features.map((id, i) => {
          const entry = set.featureCatalog.find((f) => f.id === id)
          const isCustom = Boolean(entry && entry.id.startsWith(CUSTOM_PREFIX))
          const setFeature = (v: string) =>
            patchTier({ features: resolved.features.map((f, j) => (j === i ? v : f)) })
          return (
            <div className="demo__feature" key={`${id}-${i}`}>
              <SelectField
                label={`Feature ${i + 1}`}
                value={id}
                options={[
                  ...set.featureCatalog.map((f) => ({
                    value: f.id,
                    label: f.status === 'deprecated' ? `${f.text} (retired)` : f.text || f.id,
                  })),
                  { value: CUSTOM_FEATURE, label: 'Custom line…' },
                ]}
                onChange={(v) => (v === CUSTOM_FEATURE ? setFeature(addCustomFeature()) : setFeature(v))}
              />
              {entry && isCustom && (
                <TextField
                  label="Line text"
                  value={entry.text}
                  onChange={(v) => updateFeature(entry.id, { text: v })}
                  helpText="Written here, stored in the catalogue so it can be reused."
                />
              )}
              <button
                type="button"
                className="demo__feature-remove"
                onClick={() => patchTier({ features: resolved.features.filter((_, j) => j !== i) })}
              >
                Remove
              </button>
            </div>
          )
        })}
        <button
          type="button"
          className="demo__reset"
          onClick={() => patchTier({ features: [...resolved.features, set.featureCatalog[0].id] })}
        >
          Add feature
        </button>
      </section>

    </>
  )
}
