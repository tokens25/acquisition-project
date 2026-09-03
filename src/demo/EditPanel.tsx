import { useEffect, useState } from 'react'
import { resolveFlow, writeFlow } from '../rules/layers'
import {
  forgetTab,
  ownsTabs,
  shareTabs,
  styleOf,
  tabsOf,
  tierOnTab,
  withTabAdded,
  withTabRemoved,
  writeTabs,
} from '../rules/tabs'
import type { CadenceOffer, PlanTab, TierPatch } from '../rules/content'
import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import { iconArtwork } from '../card/assets'
import { Icon } from '../components/Icon'
import type { CardSetStore } from '../editor/useCardSet'
import { excludedTiers, resolveTier } from '../rules/resolve'
import { SHOW_ADDON, STATIC, ctaLabelFor, defaultExplainer, priceUnitFor } from '../rules/derive'
import { formatMoney } from '../rules/money'
import { logoArtwork } from '../card/assets'
import { BenefitIcon } from './BenefitIcon'
import { IconPicker } from './IconPicker'
import { SourceTabs } from './SourceTabs'
import { FieldGroup } from './FieldGroup'
import { MarkedField } from '../components/FieldMark'
import { cadenceKey, tierKey } from '../rules/pipeline'

/** Sentinel for "write a new line here" in the benefit picker. */
const CUSTOM_FEATURE = '__custom__'
const CUSTOM_PREFIX = 'feature-custom-'

/**
 * How many benefits a card carries.
 *
 * The card is a fixed height against the others in its set, and past five the
 * list is what gives — so the limit belongs where the lines are chosen rather
 * than as a surprise when the card is drawn.
 */
const MAX_BENEFITS = 5

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
 * typing it *for Monthly*, and putting that three screens away in the default
 * view made the number look absolute when it never is.
 */
export function EditPanel({ store }: { store: CardSetStore }) {
  const {
    set,
    context,
    setContext,
    updateTier: writeTier,
    addTier,
    removeTier,
    updateOffer: writeOffer,
    offerFor,
    updateSet,
  } = store
  /**
   * How narrowly the edits below are meant.
   *
   * A tab is always on screen, so this cannot be read off the context: doing
   * that would make every edit belong to whichever tab happened to be showing.
   * Empty is the plan however it is shown, which is what most edits are.
   */
  const planTabs = tabsOf(set)
  const marketName = set.markets.find((m) => m.code === context.market)?.label ?? context.market
  const tabScope = planTabs.some((t) => t.id === context.tab)
    ? (context.tab as string)
    : (planTabs[0]?.id ?? '')
  const scope = tabScope ? { tab: tabScope } : undefined
  const updateTier = (id: string, patch: TierPatch) => writeTier(id, patch, scope)
  const forget = (tabIds: string[]) => {
    const next = tabIds.reduce((tiers, id) => forgetTab(tiers, id), set.tiers)
    next.forEach((t, i) => {
      if (t !== set.tiers[i]) writeTier(t.id, { tabs: t.tabs })
    })
  }
  const updateOffer = (tierId: string, patch: Partial<CadenceOffer>) =>
    writeOffer(tierId, patch, scope)
  const [openTier, setOpenTier] = useState(set.tiers[0]?.id ?? '')

  /** The competition being dragged, and the row it is currently over. */
  const [dragComp, setDragComp] = useState<string | null>(null)
  const [overComp, setOverComp] = useState<{ id: string; after: boolean } | null>(null)

  /**
   * Why the assistant cannot write, when it cannot.
   *
   * Asked once, before any tier is chosen, so the hook order does not depend
   * on whether this set has plans. Null means it is available — the AI tab
   * then says who is writing rather than why nobody is.
   */
  const [assistant, setAssistant] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/assistant', { headers: { accept: 'application/json' } })
      .then((r) =>
        r.headers.get('content-type')?.includes('json')
          ? (r.json() as Promise<{ configured?: boolean; reason?: string }>)
          : Promise.reject(new Error('No assistant route on this deployment.')),
      )
      .then((b) => {
        if (!cancelled && !b.configured) {
          setAssistant(b.reason ?? 'The assistant is not set up on this deployment.')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setAssistant(e instanceof Error ? e.message : 'The assistant is unavailable here.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const absent = new Map(excludedTiers(set, context).map((e) => [e.tier.id, e.reason]))
  const tier = set.tiers.find((t) => t.id === openTier) ?? set.tiers[0]
  if (!tier) return <p className="ed-placeholder">This set has no plans.</p>

  const resolved = resolveTier(tier, context)
  const offer = offerFor(tier.id)
  const market = set.markets.find((m) => m.code === context.market)

  /**
   * What currently reads after the slash, written or not.
   *
   * The field shows the effective value rather than an empty box: the card is
   * already saying something, and a blank field beside it would read as
   * "nothing set" when something plainly is.
   */
  const unit = priceUnitFor(set, context.cadence, market?.locale ?? 'en')
  const money = (amount: number) =>
    market ? formatMoney(amount, market.locale, market.currency) : String(amount)
  /** "$" — the sign the card will draw, so the field reads like the card. */
  const currency = market
    ? new Intl.NumberFormat(market.locale, { style: 'currency', currency: market.currency })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value
    : undefined
  const currencyMark = currency ? <span className="ed-currency">{currency}</span> : undefined

  const patchTier = (p: Parameters<typeof updateTier>[1]) => updateTier(tier.id, p)

  // Absent means custom: copy written before this choice existed was written
  // by hand, and defaulting the other way would relabel it as generated.
  const source = resolved.descriptionSource ?? 'custom'
  // The other tabs this plan has been written differently for, so an edit here
  // says what it is not touching.
  const otherTabs = planTabs
    .filter(
      (t) =>
        t.id !== tabScope &&
        (tier.overrides.some((o) => o.when.tab === t.id) ||
          set.offers.some((o) => o.tierId === tier.id && o.tab === t.id)),
    )
    .map((t) => t.name)
  const explainerSource = offer?.explainerSource ?? 'custom'

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

  /**
   * The name and the line under it are catalogue values, not tier values.
   * Two plans carrying the same competition describe it the same way — writing
   * it per tier is how a set ends up saying two things about one competition.
   */
  const updateLogo = (id: string, p: { name?: string; blurb?: string }) =>
    updateSet({ logoCatalog: set.logoCatalog.map((l) => (l.id === id ? { ...l, ...p } : l)) })

  /** Drops `id` beside `target`. This order is the order on the card. */
  const moveLogo = (id: string, target: string, after: boolean) => {
    if (id === target) return
    const next = resolved.logoTiles.filter((l) => l !== id)
    const at = next.indexOf(target)
    if (at < 0) return
    next.splice(after ? at + 1 : at, 0, id)
    patchTier({ logoTiles: next })
  }

  /** One place up or down — the keyboard's version of the same gesture. */
  const nudgeLogo = (id: string, by: number) => {
    const from = resolved.logoTiles.indexOf(id)
    const to = from + by
    if (from < 0 || to < 0 || to >= resolved.logoTiles.length) return
    const next = [...resolved.logoTiles]
    next.splice(to, 0, ...next.splice(from, 1))
    patchTier({ logoTiles: next })
  }

  /** The first competition not already on this plan, or nothing left to add. */
  const unusedLogo = set.logoCatalog.find((l) => !resolved.logoTiles.includes(l.id))

  return (

    <>
      <FieldGroup title="Screen">
        {/* Written and layered like every other line in the flow, so the plan
            picker is not the one screen whose title lives in the markup. */}
        <TextField
          label="Screen title"
          value={resolveFlow(set).plans.navTitle}
          onChange={(v) =>
            updateSet(writeFlow(set, { market: context.market }, 'plans', { navTitle: v }))
          }
          helpText="The line in the bar under the status bar."
        />
      </FieldGroup>

      <FieldGroup title="Plans">
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
        <button
          type="button"
          className="ed-add"
          onClick={() => setOpenTier(addTier())}
        >
          Add a plan
        </button>
        {/* Beside the picker that chose it, because removing a plan is a thing
            you do to the one you are looking at — not something to find at the
            bottom of its fields. A set with no plans has nothing to sell, so
            the last one stays, and removing takes the plan's prices with it:
            an offer for a plan that is gone prices nothing. */}
        {set.tiers.length > 1 && (
          <button
            type="button"
            className="demo__feature-remove"
            onClick={() => {
              const next = set.tiers.find((t) => t.id !== tier.id)
              removeTier(tier.id)
              setOpenTier(next?.id ?? '')
            }}
          >
            Remove {resolved.planName || 'this plan'}
          </button>
        )}
        {absent.has(tier.id) && (
          <p className="ed-absent">
            <strong>{resolved.planName}</strong> is not in this set — {absent.get(tier.id)}. Edits
            still apply everywhere it is sold.
          </p>
        )}
      </FieldGroup>

      <FieldGroup title="Tabs">
        {tabsOf(set).map((one, i) => {
          const all = tabsOf(set)
          const write = (next: Partial<PlanTab>) =>
            updateSet(writeTabs(set, all.map((t, j) => (j === i ? { ...t, ...next } : t))))
          return (
            <div className="demo__feature" key={one.id}>
              <TextField
                label={`Tab ${i + 1}`}
                value={one.name}
                onChange={(v) => write({ name: v })}
              />
              <SelectField
                label="Style"
                value={styleOf(one)}
                options={[
                  { value: 'plain', label: 'Just the name' },
                  { value: 'celebratory', label: 'The name, a gold bolt and the sparkle' },
                ]}
                onChange={(v) => write({ style: v as PlanTab['style'] })}
              />
              {/* A pair goes together — one tab divides the plans into the
                  plans — so a pair has one control under both of them rather
                  than two buttons that would each do the same thing. */}
              {all.length > 2 && (
                <button
                  type="button"
                  className="demo__feature-remove"
                  onClick={() => {
                    updateSet(writeTabs(set, withTabRemoved(all, i)))
                    forget([one.id])
                  }}
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
          onClick={() => updateSet(writeTabs(set, withTabAdded(tabsOf(set))))}
        >
          {tabsOf(set).length ? 'Add a tab' : 'Add tabs'}
        </button>
        {tabsOf(set).length === 2 && (
          <button
            type="button"
            className="demo__feature-remove"
            onClick={() => {
              const gone = tabsOf(set).map((t) => t.id)
              updateSet(writeTabs(set, []))
              forget(gone)
            }}
          >
            Remove tabs
          </button>
        )}
        {/* The tabs on screen are this market's, not everybody's. Handing them
            back is the way out, the same as with the flow screens. */}
        {ownsTabs(set) && (
          <button
            type="button"
            className="demo__feature-remove"
            onClick={() => updateSet(shareTabs(set))}
          >
            Give {marketName} the shared tabs back
          </button>
        )}
      </FieldGroup>

      {tabsOf(set).length > 0 && (
        <FieldGroup title="Where this applies">
          <SelectField
            label="Editing"
            value={tabScope}
            options={tabsOf(set).map((t) => ({ value: t.id, label: t.name }))}
            onChange={(v) => setContext({ ...context, tab: v })}
            helpText="Prices and copy typed below are written for this tab."
          />
          {otherTabs.length > 0 && (
            <p className="ed-absent">
              {resolved.planName} reads differently on {otherTabs.join(', ')}.
            </p>
          )}
        </FieldGroup>
      )}

      <FieldGroup title="Tier">
        <TextField
          label="Badge"
          value={resolved.badge ?? ''}
          pipelineKey={tierKey(tier.id, 'badge')}
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
        {/* Which tabs the card appears under. Nothing ticked means every tab:
            a plan that is on no tab is sold nowhere, which is what removing it
            is for. */}
        {tabsOf(set).length > 1 &&
          tabsOf(set).map((one) => (
            <ToggleField
              key={one.id}
              label={`Shows on ${one.name}`}
              checked={tierOnTab(resolved, one.id)}
              onChange={(on: boolean) => {
                const showing = tabsOf(set)
                  .map((t) => t.id)
                  .filter((id) => (id === one.id ? on : tierOnTab(resolved, id)))
                // Written for the market and not for a tab: which tabs a
                // plan appears on is a fact about the plan across all of them,
                // and a tab-scoped answer to it would only apply on the tab it
                // was given from.
                writeTier(tier.id, {
                  // Every tab and no tab both mean the same drawing, so the
                  // simpler of the two is what gets written.
                  tabs: showing.length === tabsOf(set).length ? [] : showing,
                })
              }}
            />
          ))}
        <TextField
          label="Tier name"
          value={resolved.planName}
          pipelineKey={tierKey(tier.id, 'name')}
          onChange={(v) => updateTier(tier.id, { planName: v })}
        />
        {/* Who writes this copy. The tabs sit above the field and to the
            right, so the field keeps its own full width. */}
        <SourceTabs
          value={source}
          onChange={(v) => patchTier({ descriptionSource: v })}
          label="Description source"
        />
        <TextField
          label="Description"
          value={resolved.description}
          pipelineKey={tierKey(tier.id, 'description')}
          onChange={(v) => updateTier(tier.id, { description: v })}
          rows={4}
          readOnly={source === 'ai'}
          helpText={
            source === 'ai'
              ? (assistant ?? 'Written by the assistant. Switch to Custom to edit it here.')
              : undefined
          }
        />
      </FieldGroup>

      <FieldGroup title={market ? `Pricing — ${market.currency}` : 'Pricing'}>
        {offer ? (
          <>
            <TextField
              label="Full price"
              type="number"
              leading={currencyMark}
              step={0.01}
              min={0}
              value={String(offer.standardPrice ?? '')}
              pipelineKey={cadenceKey(tier.id, offer.cadence, 'full')}
              onChange={(v) => updateOffer(tier.id, { standardPrice: Number(v) })}
            />
            {/* Everything after the slash. It belongs to the cadence rather
                than to this plan, so writing it here writes it for every plan
                priced this way — which is the point: they cannot then disagree
                about what "monthly" is called. */}
            <TextField
              label="Price per"
              value={unit}
              pipelineKey={cadenceKey(tier.id, offer.cadence, 'per')}
              onChange={(v) =>
                updateSet({ priceUnits: { ...set.priceUnits, [context.cadence]: v } })
              }
              helpText={`Reads as ${money(offer.standardPrice)}/${unit || '…'} on the card.`}
            />
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
            {offer.discount && (
              <TextField
                label="Discount price"
                type="number"
                leading={currencyMark}
                step={0.01}
                min={0}
                max={offer.standardPrice}
                error={offer.introPrice != null && offer.introPrice >= offer.standardPrice}
                value={String(offer.introPrice ?? '')}
                pipelineKey={cadenceKey(tier.id, offer.cadence, 'discount')}
                onChange={(v) => updateOffer(tier.id, { introPrice: Number(v) })}
                helpText={`Must stay below ${offer.standardPrice}.`}
              />
            )}
            {/* The sentence under the price. Only where there is a discount to
                explain — an undiscounted price needs no footnote. */}
            {offer.discount && (
              <>
                <SourceTabs
                  value={explainerSource}
                  onChange={(v) => updateOffer(tier.id, { explainerSource: v })}
                  label="Explainer source"
                />
                <TextField
                  label="Price explainer"
                  value={offer.explainer ?? ''}
                  pipelineKey={cadenceKey(tier.id, offer.cadence, 'explainer')}
                  onChange={(v) => updateOffer(tier.id, { explainer: v })}
                  rows={2}
                  readOnly={explainerSource === 'ai'}
                  helpText={
                    explainerSource === 'ai'
                      ? (assistant ?? 'Written by the assistant. Switch to Custom to edit it here.')
                      : market
                        ? `Empty falls back to “${defaultExplainer(offer, market, context.cadence)}”.`
                        : undefined
                  }
                />
              </>
            )}
            {/* The button's words, written out. It is not part of the discount:
                every plan has a button, and only the wordings that mention a
                saving need one. */}
            <TextField
              label="Button"
              value={offer.ctaLabel ?? ''}
              pipelineKey={cadenceKey(tier.id, offer.cadence, 'cta')}
              onChange={(v) => updateOffer(tier.id, { ctaLabel: v })}
              helpText={
                market
                  ? `Empty falls back to “${ctaLabelFor(resolved.planName, { ...offer, ctaStyle: 'plain' }, market)}”.`
                  : undefined
              }
            />
            {/* With a discount there is a saving to name, so the wordings that
                name it are offered. Picking one writes it into the field above
                rather than setting a mode — the field stays the one place the
                button's words live, and they can be edited afterwards. */}
            {offer.discount && market && (
              <SelectField
                label="Add the saving"
                value={offer.ctaLabel ?? ''}
                options={[
                  ...(offer.ctaLabel &&
                  !(['plain', 'saving-amount', 'saving-percent'] as const).some(
                    (style) =>
                      ctaLabelFor(resolved.planName, { ...offer, ctaStyle: style }, market) ===
                      offer.ctaLabel,
                  )
                    ? [{ value: offer.ctaLabel, label: offer.ctaLabel }]
                    : []),
                  ...(['plain', 'saving-amount', 'saving-percent'] as const).map((style) => {
                    const label = ctaLabelFor(resolved.planName, { ...offer, ctaStyle: style }, market)
                    return { value: label, label }
                  }),
                ]}
                onChange={(v) => updateOffer(tier.id, { ctaLabel: v })}
              />
            )}
          </>
        ) : (
          <p className="ed-placeholder">
            Not sold at <strong>{context.cadence}</strong>. That is a fact about the plan, not a
            gap — the card does not render in this view.
          </p>
        )}
      </FieldGroup>

      {/* Add-on lives on the offer, like the prices — the same benefit can be
          sold at one cadence and bundled at another. Hidden for now behind the
          same switch the card reads, so the form cannot offer a field whose
          effect the card is not drawing. */}
      {SHOW_ADDON && (
      <FieldGroup title="Add-on">
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
      </FieldGroup>
      )}

      <FieldGroup title="Competitions">
        {/* One under the other, in the order they appear on the card. The old
            grid could say which competitions were on the plan but not what
            order they sat in, and the popup needs a name and a line for each
            anyway — neither of which a 40px square has room for. */}
        <ul className="ed-comps">
          {resolved.logoTiles.map((id, i) => {
            const entry = set.logoCatalog.find((l) => l.id === id)
            return (
              <li
                className="ed-comp"
                key={id}
                data-dragging={dragComp === id || undefined}
                data-drop={
                  overComp?.id === id ? (overComp.after ? 'after' : 'before') : undefined
                }
                onDragOver={(e) => {
                  if (!dragComp || dragComp === id) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  // Which half the pointer is over decides which side it lands
                  // on: above the middle inserts before, below it inserts after.
                  const box = e.currentTarget.getBoundingClientRect()
                  setOverComp({ id, after: e.clientY > box.top + box.height / 2 })
                }}
                onDragLeave={() => setOverComp((o) => (o?.id === id ? null : o))}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = e.dataTransfer.getData('text/plain') || dragComp
                  if (from) moveLogo(from, id, overComp?.after ?? false)
                  setDragComp(null)
                  setOverComp(null)
                }}
              >
                {/* Only the strip is the handle. Making the whole row draggable
                    would fight the text fields inside it for the same gesture. */}
                <div
                  className="ed-comp__head"
                  draggable
                  tabIndex={0}
                  role="button"
                  aria-label={`${entry?.name ?? id} — position ${i + 1} of ${resolved.logoTiles.length}. Alt with the arrow keys moves it.`}
                  onDragStart={(e) => {
                    setDragComp(id)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', id)
                  }}
                  onDragEnd={() => {
                    setDragComp(null)
                    setOverComp(null)
                  }}
                  onKeyDown={(e) => {
                    if (!e.altKey) return
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      nudgeLogo(id, -1)
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      nudgeLogo(id, 1)
                    }
                  }}
                >
                  <span className="ed-comp__pos">{i + 1}</span>
                  <img className="ed-comp__logo" src={logoArtwork[id]} alt="" />
                  <span className="ed-comp__name">{entry?.name || id}</span>
                  <button
                    type="button"
                    className="ed-comp__remove"
                    onClick={() =>
                      patchTier({ logoTiles: resolved.logoTiles.filter((l) => l !== id) })
                    }
                  >
                    Remove
                  </button>
                </div>
                {entry && (
                  <>
                    <TextField
                      label="Competition name"
                      value={entry.name}
                      pipelineKey={tierKey(tier.id, `competitions[${i}]`)}
                      onChange={(v) => updateLogo(entry.id, { name: v })}
                    />
                    <TextField
                      label="Description"
                      rows={2}
                      value={entry.blurb ?? ''}
                      onChange={(v) => updateLogo(entry.id, { blurb: v })}
                    />
                  </>
                )}
              </li>
            )
          })}
        </ul>
        {resolved.logoTiles.length === 0 && (
          <p className="ed-placeholder">No competitions on this plan yet.</p>
        )}
        <button
          type="button"
          className="ed-add"
          disabled={!unusedLogo}
          onClick={() =>
            unusedLogo && patchTier({ logoTiles: [...resolved.logoTiles, unusedLogo.id] })
          }
        >
          Add competition
        </button>
        <TextField
          label="Total number of competitions"
          type="number"
          min={0}
          value={String(resolved.logoTotal)}
          pipelineKey={tierKey(tier.id, 'competitions.total')}
          onChange={(v) => patchTier({ logoTotal: Number(v) })}
        />
      </FieldGroup>

      <FieldGroup title="Benefits">
        {resolved.features.map((id, i) => {
          const entry = set.featureCatalog.find((f) => f.id === id)
          const isCustom = Boolean(entry && entry.id.startsWith(CUSTOM_PREFIX))
          const setFeature = (v: string) =>
            patchTier({ features: resolved.features.map((f, j) => (j === i ? v : f)) })
          return (
            <div className="demo__feature" key={`${id}-${i}`}>
              {/* The icon is half of what tells two benefits apart, so the menu
                  shows it beside every line rather than the words alone. */}
              <MarkedField pipelineKey={tierKey(tier.id, `features[${i}]`)}>
              <IconPicker
                label={`Benefit ${i + 1}`}
                value={id}
                options={[
                  ...set.featureCatalog.map((f) => ({
                    value: f.id,
                    iconId: f.iconId,
                    label: f.status === 'deprecated' ? `${f.text} (retired)` : f.text || f.id,
                  })),
                  { value: CUSTOM_FEATURE, label: 'Write a custom benefit…' },
                ]}
                onChange={(v) =>
                  v === CUSTOM_FEATURE ? setFeature(addCustomFeature()) : setFeature(v)
                }
              />
              </MarkedField>
              {entry && isCustom && (
                <>
                  <TextField
                    label="Benefit"
                    value={entry.text}
                    onChange={(v) => updateFeature(entry.id, { text: v })}
                    helpText="Written here, stored in the library so it can be reused."
                  />
                  <BenefitIcon
                    entry={entry}
                    onPick={(iconId) => updateFeature(entry.id, { iconId })}
                  />
                </>
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
        {/* Five is the card's budget. The button says which it is rather than
            going quiet, so a full list does not read as a broken control. */}
        <button
          type="button"
          className="ed-add"
          disabled={resolved.features.length >= MAX_BENEFITS}
          onClick={() => patchTier({ features: [...resolved.features, set.featureCatalog[0].id] })}
        >
          {resolved.features.length >= MAX_BENEFITS
            ? `Add benefit — ${MAX_BENEFITS} is the most a card shows`
            : 'Add benefit'}
        </button>
      </FieldGroup>

    </>
  )
}
