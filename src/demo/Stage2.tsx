import { useState } from 'react'
import { TextField } from '../components/TextField'
import type { CardSetStore } from '../editor/useCardSet'
import { excludedTiers, resolveTier } from '../rules/resolve'

/**
 * Stage two: one step of the journey, one plan at a time.
 *
 * Fields are the DS Form/TextField rather than the hand-rolled inputs the
 * first interface used — the design mocks it with real component instances, so
 * the code should use the real component.
 *
 * Cadence sits in this stage, beside the prices it qualifies. Typing 34.99 is
 * typing it *for Monthly Flex*, and putting that three screens away in stage
 * one made the number look absolute when it never is.
 */
export function Stage2({ store }: { store: CardSetStore }) {
  const { set, context, setContext, updateTier, updateOffer, offerFor } = store
  const [openTier, setOpenTier] = useState(set.tiers[0]?.id ?? '')

  const absent = new Map(excludedTiers(set, context).map((e) => [e.tier.id, e.reason]))
  const tier = set.tiers.find((t) => t.id === openTier) ?? set.tiers[0]
  if (!tier) return <p className="ed-placeholder">This set has no plans.</p>

  const resolved = resolveTier(tier, context)
  const offer = offerFor(tier.id)
  const market = set.markets.find((m) => m.code === context.market)

  return (
    <>
      <section className="demo__group">
        <h3 className="demo__group-title">Tiers</h3>
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
        <h3 className="demo__group-title">Header</h3>
        <TextField
          label="Badge"
          value={resolved.ultimate ? 'Best experience' : ''}
          readOnly
          helpText="Set by the Ultimate treatment below."
        />
        <label className="ed-field ed-field--check">
          <input
            className="ed-field__check"
            type="checkbox"
            checked={resolved.ultimate}
            onChange={(e) => updateTier(tier.id, { ultimate: e.target.checked })}
          />
          <span>
            <span className="ed-field__label">Ultimate treatment</span>
            <span className="ed-field__hint">Gold stroke, badge and CTA — max one per set.</span>
          </span>
        </label>
        <TextField
          label="Plan name"
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
        <label className="ed-field">
          <span className="ed-field__label">How to pay</span>
          <select
            className="ed-field__input"
            value={context.cadence}
            onChange={(e) => setContext({ ...context, cadence: e.target.value })}
          >
            {set.cadences.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="ed-field__hint">
            The prices below are this cadence only. A plan with no offer here is not sold this way.
          </span>
        </label>

        {offer ? (
          <>
            <label className="ed-field ed-field--check">
              <input
                className="ed-field__check"
                type="checkbox"
                checked={offer.discount}
                onChange={(e) =>
                  updateOffer(tier.id, {
                    discount: e.target.checked,
                    introPrice: e.target.checked
                      ? (offer.introPrice ?? Math.round(offer.standardPrice * 80) / 100)
                      : null,
                  })
                }
              />
              <span>
                <span className="ed-label-chip">Apply discount</span>
              </span>
            </label>
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
    </>
  )
}
