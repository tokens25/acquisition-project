/**
 * The payment and checkout screens, priced from the plan being bought.
 *
 * The screens' words are content — written once, layered by market — but
 * the numbers on them are the offer's: what the chosen plan costs at each
 * cadence here, what is paid today, when the next payment falls. Those come
 * from the same offers the cards read, so the way to pay a person picks is
 * the way to pay the card quoted, and the checkout totals what they picked.
 *
 * Authored words still win where they are written: an option's title, note
 * or badge typed in the panel for a cadence replaces the standing one, and a
 * screen whose plan has no offers here is drawn exactly as authored.
 */
import type { CadenceOffer, CardSet, Context, MarketConfig, Tier } from './content'
import type { CadenceOption, CadenceScreen, CheckoutLine, CheckoutScreen } from './flow'
import { formatMoney, formatMoneyWhole } from './money'
import { billingLabel } from './derive'
import { marketFor, resolveOffer, resolveSet } from './resolve'

/**
 * The plan the context says is being bought.
 *
 * Nothing named means the plan DAZN is pointing at — the highlighted one —
 * because that is the card a person is most likely to have pressed, and
 * because it is usually the one sold every way: a screen drawn for a
 * monthly-only entry plan would show one option and look broken. Failing a
 * highlighted plan, the one sold the most ways; failing that, the first.
 */
export function chosenTier(set: CardSet, context: Context): Tier | null {
  const cards = resolveSet(set, context)
  if (cards.length === 0) return null
  if (context.tier) {
    const named = cards.find((c) => c.tier.id === context.tier)
    if (named) return named.tier
  }
  const lit = cards.find((c) => c.tier.highlighted)
  if (lit) return lit.tier
  const ways = (id: string) => set.cadences.filter((cadence) => resolveOffer(set, id, { ...context, cadence })).length
  return cards.slice().sort((a, b) => ways(b.tier.id) - ways(a.tier.id))[0].tier
}

type Kind = 'monthly' | 'instalments' | 'yearly' | 'other'
const kindOf = (cadence: string): Kind => {
  const c = cadence.toLowerCase()
  if (/instal/.test(c)) return 'instalments'
  if (/year|annual/.test(c)) return 'yearly'
  if (/month/.test(c)) return 'monthly'
  return 'other'
}

/** The standing words for a way to pay, before anyone writes better ones. */
function standing(cadence: string, offer: CadenceOffer): Pick<CadenceOption, 'title' | 'note' | 'unit'> {
  switch (kindOf(cadence)) {
    case 'monthly':
      return { title: 'Pay monthly', note: 'Renews every month. Cancel any time.', unit: 'month' }
    case 'yearly':
      return { title: 'Pay for the year', note: 'One payment now. Renews yearly.', unit: 'year' }
    case 'instalments': {
      const n = offer.termMonths ?? 12
      return { title: `Pay yearly in ${n} instalments`, note: `${n} monthly payments. ${n}-month contract.`, unit: 'month' }
    }
    default:
      return { title: `Pay ${cadence.toLowerCase()}`, note: '', unit: cadence.toLowerCase() }
  }
}

const paid = (o: CadenceOffer) => (o.discount && o.introPrice !== null ? o.introPrice : o.standardPrice)

/** What a way to pay costs over a year, for the saving beside it. */
function overAYear(cadence: string, o: CadenceOffer): number {
  switch (kindOf(cadence)) {
    case 'monthly':
      return paid(o) * 12
    case 'instalments':
      return paid(o) * (o.termMonths ?? 12)
    case 'yearly':
      return paid(o)
    default:
      return paid(o)
  }
}

/**
 * The payment screen for the plan being bought here.
 *
 * One option per cadence the plan is priced at in this market, in the set's
 * cadence order. Written options with the same id (the cadence) lend their
 * words; the prices are the offers'. The saving on the non-monthly options
 * is worked out against paying by the month, and stated only when it is one.
 */
export function liveCadenceScreen(set: CardSet, context: Context, authored: CadenceScreen): CadenceScreen {
  const tier = chosenTier(set, context)
  if (!tier) return authored
  const market = marketFor(set, context.market)
  const priced = set.cadences
    .map((cadence) => ({ cadence, offer: resolveOffer(set, tier.id, { ...context, cadence }) }))
    .filter((x): x is { cadence: string; offer: CadenceOffer } => x.offer !== null)
  if (priced.length === 0) return authored

  const monthly = priced.find((p) => kindOf(p.cadence) === 'monthly')
  const yearOnMonthly = monthly ? overAYear(monthly.cadence, monthly.offer) : null
  const options: CadenceOption[] = priced.map(({ cadence, offer }) => {
    const written = authored.options.find((o) => o.id === cadence)
    const words = standing(cadence, offer)
    let saving = written?.saving?.trim() ?? ''
    if (!saving && yearOnMonthly !== null && kindOf(cadence) !== 'monthly') {
      const saved = yearOnMonthly - overAYear(cadence, offer)
      if (saved > 0) {
        saving =
          authored.savingAs === 'percent'
            ? `Save ${Math.round((saved / yearOnMonthly) * 100)}% /year`
            : `Save ${formatMoneyWhole(saved, market.locale, market.currency)} /year`
      }
    }
    // The under-25 rate for this way to pay, where DAZN sells one: the same
    // plan's youth SKU, priced here at this cadence.
    const youth = set.tiers.find((t) => t.id === `${tier.id}-yp`)
    const youthOffer = youth ? resolveOffer(set, youth.id, { ...context, cadence }) : null
    const youthNote = youthOffer
      ? ` Under-25: ${formatMoney(paid(youthOffer), market.locale, market.currency)}/${billingLabel(cadence, youthOffer.termMonths).unit}.`
      : ''
    return {
      id: cadence,
      title: written?.title?.trim() || words.title,
      note: (written?.note?.trim() || words.note) + youthNote,
      price: formatMoney(paid(offer), market.locale, market.currency),
      unit: words.unit,
      badge: written?.badge ?? (kindOf(cadence) === 'yearly' && saving ? 'BEST VALUE' : ''),
      saving,
    }
  })
  const selected = options.some((o) => o.id === context.cadence) ? context.cadence : options[0].id
  return { ...authored, options, selected }
}

const dateIn = (locale: string, months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

/**
 * The checkout summary for the plan at the cadence being bought.
 *
 * Three lines the summary always has — what the plan costs and how often,
 * what is paid today, when the next payment falls — from the offer, with an
 * offer line ahead of them when a discount is running. The renewal note
 * names the contract where there is one. Everything else on the screen —
 * the legal, the methods, the labels — is the authored copy for this
 * situation, which the layers already pick per plan and cadence.
 */
export function liveCheckoutScreen(set: CardSet, context: Context, authored: CheckoutScreen): CheckoutScreen {
  const tier = chosenTier(set, context)
  if (!tier) return authored
  const offer = resolveOffer(set, tier.id, context)
  if (!offer) return authored
  const market: MarketConfig = marketFor(set, context.market)
  const money = (n: number) => formatMoney(n, market.locale, market.currency)
  const kind = kindOf(context.cadence)
  const words = standing(context.cadence, offer)
  const every = kind === 'yearly' ? 12 : 1

  const lines: CheckoutLine[] = []
  if (offer.discount && offer.introPrice !== null) {
    const months = offer.introMonths || 1
    lines.push({
      id: 'live-offer',
      label: `${money(offer.introPrice)} for ${months === 1 ? 'the first month' : `${months} months`}, then ${money(offer.standardPrice)}`,
      value: `−${money(offer.standardPrice - offer.introPrice)}`,
      offer: true,
    })
  }
  lines.push(
    { id: 'live-plan', label: words.title, value: money(offer.standardPrice), unit: words.unit },
    { id: 'live-today', label: 'Today you pay', value: money(paid(offer)) },
    {
      id: 'live-next',
      label: `Next payment on ${dateIn(market.locale, every)}`,
      value: money(offer.introMonths > 1 && offer.introPrice !== null ? offer.introPrice : offer.standardPrice),
      schedule: true,
    },
  )
  const renewalNote =
    kind === 'instalments'
      ? `This is a ${offer.termMonths ?? 12}-month plan paid monthly. It renews on ${dateIn(market.locale, offer.termMonths ?? 12)} unless you turn off auto-renew in My Account.`
      : kind === 'yearly'
        ? `Your plan renews on ${dateIn(market.locale, 12)} unless you turn off auto-renew in My Account.`
        : authored.renewalNote

  return {
    ...authored,
    summaryTitle: authored.summaryTitle.trim() || tier.planName,
    lines,
    renewalNote,
  }
}
