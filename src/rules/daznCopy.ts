/**
 * The checkout's words as dazn.com chooses them, for the plan and way of
 * paying being bought.
 *
 * DAZN's web checkout draws two sentences from its strings service: the
 * terms under the payment method (`payment_termsWarning…`) and the
 * purchase-summary sentence (`signUp_cancelSentence_…`). Which key is used
 * is decided in the site's own code, by product, cadence, discount and
 * SKU, with a fallback when a market lacks the narrower key. This is that
 * decision, written down as a ladder: the narrowest key the market has
 * wins. The `%{placeholder}` figures are the offer's.
 *
 * Approximated from the bundle's behaviour rather than read from its
 * source, so a market may still show a broader sentence than the site
 * does. The panel says which key was used, so that is visible.
 */
import type { CadenceOffer, Context, MarketConfig, Tier } from './content'
import { formatMoney } from './money'

const PERIOD: Record<string, string[]> = {
  Weekly: ['week', 'weekly'],
  Monthly: ['monthly', 'month'],
  '5 Instalments': ['instalments', 'instalment'],
  'Yearly Instalments': ['instalments', 'instalment'],
  '2-Year Instalments': ['instalments24', 'instalments'],
  Yearly: ['annual', 'annually'],
  Seasonal: ['seasonal', 'annual'],
}

/** Product word DAZN's keys use for a league pass. */
const PRODUCT_WORD: Record<string, string[]> = {
  nfl: ['nfl'],
  nhl: ['nhl'],
  fiba: ['fiba'],
  'college-sports': ['collegesports'],
  rallytv: ['rallytv'],
  'national-league': ['nationalleaguetv', 'nltv'],
}

/** "tier_motor_es" → "motor"; "tier_gold_de_wc_2" → "gold" — the plan's own word. */
function tierWord(entSet: string, market: string): string | null {
  const m = entSet.replace(/^tier_/, '').replace(new RegExp(`_${market}(_.*)?$`), '').replace(/_yp$/, '')
  return m && m !== entSet ? m.split('_')[0] : null
}

export interface DaznCheckoutCopy {
  /** The terms under the payment method, as plain text, links kept as their words. */
  terms: string | null
  termsKey: string | null
  /** The purchase-summary sentence. */
  summary: string | null
  summaryKey: string | null
  /** The right-of-withdrawal waiver, where the market states one. */
  withdrawal: string | null
  links: Record<string, string>
}

const has = (strings: Record<string, string>, key: string) => Boolean(strings[key]?.trim())

/** The first key the market has, in the order given. */
function pick(strings: Record<string, string>, keys: string[]): string | null {
  return keys.find((k) => has(strings, k)) ?? null
}

/** The candidate keys for the purchase-summary sentence, narrowest first. */
export function summaryKeys(tier: Tier, offer: CadenceOffer, market: string): string[] {
  const entSet = tier.source?.entitlementSetId ?? tier.id
  const periods = PERIOD[offer.cadence] ?? [offer.cadence.toLowerCase()]
  const discount = offer.discount && offer.introPrice !== null
  const fullTerm = discount && offer.introMonths >= (offer.termMonths ?? 12)
  const out: string[] = []
  const channel = tier.subscriptions?.[0]
  const words = channel ? PRODUCT_WORD[channel] ?? [channel] : []
  const tw = tierWord(entSet, market)

  // A youth SKU has its own sentence, named for the SKU.
  if (/_yp$/.test(entSet)) for (const p of periods) out.push(`signup_cancelation_youthoffer_${entSet}_${p}`)
  // The SKU's own sentence, where a market wrote one (tier_gold_de_wc_2_instalments).
  for (const p of periods) out.push(`signUp_cancelSentence_${entSet}_${p}`)
  if (words.length) {
    for (const w of words) {
      for (const p of periods) {
        if (discount) out.push(`signUp_${w}_cancelSentence_discount_${p}`, `signUp_cancelSentence_discount_${w}_${p}`)
        out.push(`signUp_${w}_cancelSentence_${p}`, `signUp_cancelSentence_${w}_${p}`)
      }
    }
  } else {
    for (const p of periods) {
      if (discount) {
        if (fullTerm) out.push(`signUp_cancelSentence_discount_${p}_full_term${tw ? `_${tw}` : ''}`, `signUp_cancelSentence_discount_${p}_full_term`)
        if (tw) out.push(`signUp_cancelSentence_discount_${p}_${tw}`)
        out.push(`signUp_cancelSentence_discount_${p}`)
      }
      if (tw) out.push(`signUp_cancelSentence_${p}_${tw}`)
      out.push(`signUp_cancelSentence_${p}`)
    }
  }
  return out
}

/** The candidate keys for the terms line. Klarna and weekly have their own; the rest read the base. */
export function termsKeys(offer: CadenceOffer, method?: string): string[] {
  const out: string[] = []
  if (method && /klarnapayovertime/i.test(method)) out.push('payment_termsWarning_klarnaPayOverTime')
  if (/week/i.test(offer.cadence)) out.push('payment_termsWarning_weekly')
  out.push('payment_termsWarning')
  return out
}

const dateIn = (locale: string, months: number, days = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  d.setDate(d.getDate() + days)
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

/** The figures a template may ask for, from this offer. */
export function figuresFor(offer: CadenceOffer, market: MarketConfig, links: Record<string, string>): Record<string, string> {
  const money = (n: number) => formatMoney(n, market.locale, market.currency)
  const term = offer.termMonths ?? (/year|annual/i.test(offer.cadence) ? 12 : /instal/i.test(offer.cadence) ? 12 : 1)
  const intro = offer.discount && offer.introPrice !== null ? offer.introPrice : offer.standardPrice
  const introMonths = offer.discount ? offer.introMonths || 1 : 0
  const fullPriceMonths = Math.max(0, term - introMonths)
  const perMonth = /instal|month/i.test(offer.cadence)
  const total = perMonth ? intro * introMonths + offer.standardPrice * fullPriceMonths : offer.standardPrice
  const weekly = /week/i.test(offer.cadence)
  const renews = /instal|year|annual|season/i.test(offer.cadence) ? term : 1
  const renewal = weekly ? dateIn(market.locale, 0, 7) : dateIn(market.locale, renews)
  return {
    price: money(offer.standardPrice),
    billingRate: money(offer.standardPrice),
    monthlyRate: money(offer.standardPrice),
    renewalAmount: money(offer.standardPrice),
    OriginalPrice: money(offer.standardPrice),
    discountedRate: money(intro),
    DiscountedPrice: money(intro),
    discountedMonths: String(introMonths || term),
    termInMonths: String(introMonths || term),
    numberOfFullPriceMonths: String(fullPriceMonths),
    monthSuffix: introMonths === 1 ? 'month' : 'months',
    discountedTotalPrice: money(perMonth ? total : intro),
    totalPrice: money(perMonth ? offer.standardPrice * term : offer.standardPrice),
    renewalDate: renewal,
    lastCancelDate: renewal,
    billingDate: dateIn(market.locale, offer.freeTrialMonths || 0),
    discountedDays: String((offer.freeTrialMonths ?? 0) * 30),
    termsLink: links.Terms ?? links.terms ?? '',
    policyLink: links.Privacy ?? links.privacy ?? '',
    subscriptionTermsLink: links.SubscriptionTerms ?? links.Terms ?? '',
  }
}

/** Placeholders filled, markdown links reduced to their words, whitespace settled. */
export function renderTemplate(template: string, figures: Record<string, string>): string {
  return template
    .replace(/%\{(\w+)\}/g, (_, key: string) => figures[key] ?? '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\u200b/g, '')
    .replace(/\\n|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The checkout's DAZN words for this plan at this cadence, or nulls where
 * the market's strings have nothing to say.
 */
export function daznCheckoutCopy(
  context: Context,
  tier: Tier,
  offer: CadenceOffer,
  market: MarketConfig,
  method?: string,
): DaznCheckoutCopy {
  const copy = market.checkoutCopy
  if (!copy) return { terms: null, termsKey: null, summary: null, summaryKey: null, withdrawal: null, links: {} }
  const figures = figuresFor(offer, market, copy.links)
  const termsKey = pick(copy.strings, termsKeys(offer, method))
  const summaryKey = pick(copy.strings, summaryKeys(tier, offer, context.market))
  const withdrawalKey = pick(copy.strings, ['payment_ROWexclusion_subscription', 'payment_ROWexclusion'])
  return {
    terms: termsKey ? renderTemplate(copy.strings[termsKey], figures) : null,
    termsKey,
    summary: summaryKey ? renderTemplate(copy.strings[summaryKey], figures) : null,
    summaryKey,
    withdrawal: withdrawalKey ? renderTemplate(copy.strings[withdrawalKey], figures) : null,
    links: copy.links,
  }
}
