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
import type { AccountScreen, AuthScreen, CadenceOption, CadenceScreen, CheckoutLine, CheckoutScreen, Consent, PaymentMethod, ReadyScreen } from './flow'
import { formatMoney, formatMoneyWhole } from './money'
import { billingLabel } from './derive'
import { daznCheckoutCopy } from './daznCopy'
import { marketFor, offerForCard, resolveOffer, resolveSet, resolveTier } from './resolve'
import { consentsOf } from './consents'

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

type Kind = 'weekly' | 'monthly' | 'instalments' | 'yearly' | 'seasonal' | 'other'
const kindOf = (cadence: string): Kind => {
  const c = cadence.toLowerCase()
  if (/instal/.test(c)) return 'instalments'
  if (/week/.test(c)) return 'weekly'
  if (/season/.test(c)) return 'seasonal'
  if (/year|annual/.test(c)) return 'yearly'
  if (/month/.test(c)) return 'monthly'
  return 'other'
}

/** The standing words for a way to pay, before anyone writes better ones. */
function standing(cadence: string, offer: CadenceOffer): Pick<CadenceOption, 'title' | 'note' | 'unit'> {
  switch (kindOf(cadence)) {
    case 'weekly':
      return offer.oneOff
        ? { title: 'Weekly pass', note: 'One payment for seven days. Does not renew.', unit: 'week' }
        : { title: 'Pay weekly', note: 'A week at a time. Renews every week until cancelled.', unit: 'week' }
    case 'monthly':
      return { title: 'Pay monthly', note: 'Renews every month. Cancel any time.', unit: 'month' }
    case 'yearly':
      return { title: 'Pay for the year', note: 'One payment now. Renews yearly.', unit: 'year' }
    case 'seasonal':
      return { title: 'Pay for the season', note: 'One payment for the whole season.', unit: 'season' }
    case 'instalments': {
      const n = offer.termMonths ?? 12
      const span = n === 12 ? 'yearly' : n === 24 ? 'for two years' : 'for the season'
      return { title: `Pay ${span} in ${n} instalments`, note: `${n} monthly payments. ${n}-month contract.`, unit: 'month' }
    }
    default:
      return { title: `Pay ${cadence.toLowerCase()}`, note: '', unit: cadence.toLowerCase() }
  }
}

const paid = (o: CadenceOffer) => (o.discount && o.introPrice !== null ? o.introPrice : o.standardPrice)

/** What a way to pay costs over a year, for the saving beside it. */
function overAYear(cadence: string, o: CadenceOffer): number {
  switch (kindOf(cadence)) {
    case 'weekly':
      return paid(o) * 52
    case 'monthly':
      return paid(o) * 12
    case 'instalments':
      // A two-year plan's yearly cost is half its total; a five-payment
      // season's is its total — either way, the year is what is compared.
      return (paid(o) * (o.termMonths ?? 12)) / Math.max(1, (o.termMonths ?? 12) / 12)
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
    // A youth SKU with no tab of its own is a rate on this plan, and is said
    // here. One with a tab is a card of its own on the picker, and says itself.
    const youth = set.tiers.find((t) => t.id === `${tier.id}-yp` && t.status === 'legacy')
    const youthOffer = youth ? resolveOffer(set, youth.id, { ...context, cadence }) : null
    const youthNote = youthOffer
      ? ` Youth rate: ${formatMoney(paid(youthOffer), market.locale, market.currency)}/${billingLabel(cadence, youthOffer.termMonths).unit}.`
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

/** A date `months` from today — or, for a weekly plan, seven days on. */
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

/**
 * How DAZN's payment method ids read on the screen, and which marks they draw.
 * Cards first, then the wallets, then the rest in the order the API gave.
 */
const METHOD_WORDS: Record<string, { label: string; marks: PaymentMethod['marks']; card?: boolean }> = {
  CreditCard: { label: 'Credit & Debit Cards', marks: 'cards', card: true },
  GooglePay: { label: 'Google Pay', marks: 'gpay' },
  PayPal: { label: 'PayPal', marks: 'paypal' },
  ApplePay: { label: 'Apple Pay', marks: 'none' },
  KlarnaPayOverTime: { label: 'Klarna', marks: 'none' },
  KlarnaPayOverTimeRecurring: { label: 'Klarna', marks: 'none' },
  KlarnaPayNow: { label: 'Klarna', marks: 'none' },
  DCB: { label: 'Carrier billing', marks: 'none' },
  Merpay: { label: 'Merpay', marks: 'none' },
  Bancontact: { label: 'Bancontact', marks: 'none' },
  TelstraPay: { label: 'Telstra', marks: 'none' },
}
const METHOD_ORDER = ['CreditCard', 'ApplePay', 'GooglePay', 'PayPal']

/** The ways to pay this market takes, drawn as the checkout lists them. */
export function liveMethods(market: MarketConfig): PaymentMethod[] | null {
  const ids = market.paymentMethods
  if (!ids?.length) return null
  const rank = (id: string) => {
    const i = METHOD_ORDER.indexOf(id)
    return i === -1 ? METHOD_ORDER.length : i
  }
  const seen = new Set<string>()
  return ids
    .slice()
    .sort((a, b) => rank(a) - rank(b))
    .flatMap((id) => {
      const words = METHOD_WORDS[id] ?? { label: id.replace(/([a-z])([A-Z])/g, '$1 $2'), marks: 'none' as const }
      // Klarna comes as three ids; one row says it.
      if (seen.has(words.label)) return []
      seen.add(words.label)
      return [{ id: `live-${id}`, label: words.label, marks: words.marks, ...(words.card ? { card: true, overflow: '+4' } : {}) }]
    })
}

/**
 * What the authored words may stand in for, and what stands in for them.
 *
 * A legal line has to name the price, the day it renews and what it renews
 * at, and those are the offer's. Written with these tokens the line is right
 * for every plan at every cadence; written with figures it is right for one.
 *
 *   {plan} {cadence} {price} {unit} {today} {next} {renewal} {term} {market}
 */
export function checkoutTokens(set: CardSet, context: Context): Record<string, string> | null {
  const tier = chosenTier(set, context)
  if (!tier) return null
  const offer = offerForCard(set, tier.id, context)
  if (!offer) return null
  const market = marketFor(set, context.market)
  const money = (n: number) => formatMoney(n, market.locale, market.currency)
  const kind = kindOf(offer.cadence)
  const words = standing(offer.cadence, offer)
  const every = kind === 'yearly' ? 12 : 1
  const term = kind === 'instalments' ? (offer.termMonths ?? 12) : kind === 'yearly' || kind === 'seasonal' ? 12 : 1
  return {
    plan: tier.planName,
    cadence: words.title.replace(/^Pay /, '').toLowerCase(),
    price: money(offer.standardPrice),
    unit: words.unit,
    today: money(paid(offer)),
    next: kind === 'weekly' ? dateIn(market.locale, 0, 7) : dateIn(market.locale, every),
    renewal: kind === 'weekly' ? dateIn(market.locale, 0, 7) : dateIn(market.locale, term),
    term: String(term),
    market: market.label,
  }
}

/** Every `{token}` in the text replaced; an unknown token is left as written. */
export const fillTokens = (text: string, tokens: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, key: string) => tokens[key] ?? m)

/**
 * The checkout for the plan at the cadence being bought.
 *
 * The summary lines come from the offer — what the plan costs and how often,
 * what is paid today, when the next payment falls, with an offer line ahead
 * of them when a discount is running and a trial line when one is on. The
 * ways to pay are the market's, from the offers service. Every authored
 * line on the screen has its tokens filled, so the legal names this price
 * and this renewal date. A plan with no price here is drawn as authored.
 */
/** Which of DAZN's strings the checkout on screen is reading, for the panel to say. */
export function checkoutSources(set: CardSet, context: Context): { summaryKey: string | null; termsKey: string | null } | null {
  const tier = chosenTier(set, context)
  if (!tier) return null
  const offer = offerForCard(set, tier.id, context)
  if (!offer) return null
  const c = daznCheckoutCopy(context, tier, offer, marketFor(set, context.market))
  return { summaryKey: c.summaryKey, termsKey: c.termsKey }
}

export function liveCheckoutScreen(set: CardSet, context: Context, authored: CheckoutScreen): CheckoutScreen {
  const tier = chosenTier(set, context)
  if (!tier) return authored
  // The offer at the cadence on screen, or the first way the plan is sold —
  // a checkout is always for a price that exists.
  const offer = offerForCard(set, tier.id, context)
  if (!offer) return authored
  const market: MarketConfig = marketFor(set, context.market)
  const money = (n: number) => formatMoney(n, market.locale, market.currency)
  const kind = kindOf(offer.cadence)
  const words = standing(offer.cadence, offer)
  const every = kind === 'yearly' ? 12 : 1
  const tokens = checkoutTokens(set, context) ?? {}
  const fill = (text: string) => fillTokens(text, tokens)

  const lines: CheckoutLine[] = []
  const discounted = offer.discount && offer.introPrice !== null
  const months = offer.introMonths || 1
  // The pay line is the offer, as the design draws it: the plan and how it is
  // paid, the full price struck through beside what is paid now, and a line
  // under the name saying how long the price holds.
  lines.push({
    id: 'live-plan',
    label: kind === 'instalments' ? `${words.title} · ${offer.termMonths ?? 12}-month contract` : words.title,
    value: money(discounted ? offer.introPrice! : offer.standardPrice),
    unit: words.unit,
    ...(discounted
      ? {
          offer: true,
          struck: money(offer.standardPrice),
          note:
            offer.introPrice === 0
              ? `first ${months === 1 ? 'month' : `${months} months`} free`
              : months >= (offer.termMonths ?? 12) && kind === 'instalments'
                ? `discounted for the whole ${months}-month contract`
                : `first ${months === 1 ? 'month' : `${months} months`} discounted`,
        }
      : {}),
    ...(offer.freeTrialMonths
      ? { offer: true, note: `${offer.freeTrialMonths} month${offer.freeTrialMonths === 1 ? '' : 's'} free, then ${money(offer.standardPrice)}/${words.unit}` }
      : {}),
  })
  // Anything bundled into the offer, marked as included rather than priced.
  // Three at most by name; a plan bundling a season of pay-per-views says so
  // in one line rather than a column of them.
  const included = offer.includedAddOnIds ?? []
  for (const id of included.slice(0, 3)) {
    const entry = set.addOnCatalog.find((a) => a.id === id)
    lines.push({ id: `live-included-${id}`, label: entry?.title ?? id, value: 'Included', included: true })
  }
  if (included.length > 3) {
    lines.push({ id: 'live-included-more', label: `${included.length - 3} more pay-per-view events`, value: 'Included', included: true })
  }
  lines.push({ id: 'live-today', label: 'Today you pay', value: money(offer.freeTrialMonths ? 0 : paid(offer)) })
  // A pass is paid once; there is no next payment to name.
  if (!offer.oneOff) {
    lines.push({
      id: 'live-next',
      label: `Next payment on ${kind === 'weekly' && !offer.freeTrialMonths ? dateIn(market.locale, 0, 7) : dateIn(market.locale, offer.freeTrialMonths || every)}`,
      value: money(offer.introMonths > 1 && offer.introPrice !== null ? offer.introPrice : offer.standardPrice),
      schedule: true,
    })
  }
  const methods = liveMethods(market)
  // What dazn.com's own checkout says here, for this plan and cadence, in
  // the market's language: the summary sentence under the totals and the
  // terms under the payment method. The authored lines are the fallback.
  // The monthly plan's price, for the line an annual plan's terms end on.
  const monthly = resolveOffer(set, tier.id, { ...context, cadence: 'Monthly' })
  const monthlyPrice = monthly && !monthly.oneOff ? monthly.standardPrice : undefined
  const dazn = daznCheckoutCopy(context, tier, offer, market, undefined, monthlyPrice)

  return {
    ...authored,
    note: fill(authored.note),
    summaryTitle: authored.summaryTitle.trim() ? fill(authored.summaryTitle) : tier.planName,
    lines,
    renewalNote: dazn.summary ?? fill(authored.renewalNote),
    // The CMS's terms for this way of paying where it has them; else the
    // market's own checkout terms; else the authored line with the figures.
    legal: offer.legal ?? dazn.terms ?? fill(authored.legal),
    payCta: fill(authored.payCta),
    ...(methods ? { methods, chosen: authored.chosen && methods.some((m) => m.id === authored.chosen) ? authored.chosen : methods[0].id } : {}),
  }
}

/* ── Sign-in ─────────────────────────────────────────────────────────── */

/**
 * The Resource Strings key for the sign-in notice of a channel: the line for
 * people who had the product before it moved to DAZN. Named per product in
 * DAZN's strings — `yesmsg` for the New York networks, `fiba`, `nhl` — so the
 * channel is mapped to that name, and a channel with no line has none.
 */
const SIGNIN_NOTICE_KEYS: Record<string, string[]> = {
  rsns: ['signin_yesmsg_migrated_user_header', 'signin_migrated_user_header_info'],
  fiba: ['signin_fiba_migrated_user_header'],
  nhl: ['signin_nhl_migrated_user_header'],
  nfl: ['signin_nfl_migrated_user_header'],
  'college-sports': ['signin_collegesports_migrated_user_header'],
  rallytv: ['signin_rallytv_migrated_user_header'],
  'national-league': ['signin_nationalleague_migrated_user_header'],
}

/** Which of DAZN's strings the sign-in notice reads, for the panel to say. Null when none. */
export function authSource(set: CardSet, context: Context): string | null {
  const strings = marketFor(set, context.market).checkoutCopy?.strings
  if (!strings) return null
  const keys = SIGNIN_NOTICE_KEYS[context.subscription ?? ''] ?? []
  return keys.find((k) => strings[k]?.trim()) ?? null
}

/**
 * The sign-in screen with DAZN's notice for this channel.
 *
 * DAZN writes it as one line — "Current or previous MSG+ subscriber? Use the
 * same email address to sign in." The design draws a heading and a body, so
 * the line is split where its question ends; a line with no question is the
 * heading alone. No line for this channel leaves the authored words, and
 * nothing authored leaves no notice at all.
 */
export function liveAuthScreen(set: CardSet, context: Context, authored: AuthScreen): AuthScreen {
  const key = authSource(set, context)
  if (!key) return authored
  const line = marketFor(set, context.market).checkoutCopy!.strings[key].trim()
  const q = line.indexOf('?')
  if (q > 0 && q < line.length - 1) {
    return { ...authored, noticeTitle: line.slice(0, q + 1).trim(), noticeBody: line.slice(q + 1).trim() }
  }
  return { ...authored, noticeTitle: line, noticeBody: '' }
}

/* ── Account: consents ───────────────────────────────────────────────── */

/**
 * The permission strings the account screen asks with, per channel.
 *
 * DAZN's own comes first and is worded per market — Spain's and Japan's are
 * not Germany's. A league sold through DAZN adds its partner's: the NFL's,
 * FIBA's, the NHL's (and its clubs'), the WRC promoter's, the NCAA's. The
 * New York networks and National League TV ask for nothing of their own.
 */
const DAZN_CONSENT_KEY = 'signup_allowMarketingEmails'
const PARTNER_CONSENT_KEYS: Record<string, string[]> = {
  nfl: ['signup_allowNFLMarketingEmails'],
  fiba: ['signup_allowFIBAMarketingEmails'],
  nhl: ['signup_allowNHLMarketingEmails', 'signup_allowNHLClubMarketingEmails'],
  rallytv: ['signup_allowRALLYMarketingEmails'],
  'college-sports': ['signup_allowCollegeSportsMarketingEmails'],
}

/** A Resource String as the screen reads it: no markdown, no zero-width marks, one line. */
const plainText = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/[\u200b\u00a0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Which of DAZN's strings the consents on screen read, in order. Empty when DAZN has none for this market. */
export function consentSources(set: CardSet, context: Context): string[] {
  const strings = marketFor(set, context.market).checkoutCopy?.strings
  if (!strings?.[DAZN_CONSENT_KEY]?.trim()) return []
  const partner = (PARTNER_CONSENT_KEYS[context.subscription ?? ''] ?? []).filter((k) => strings[k]?.trim())
  return [DAZN_CONSENT_KEY, ...partner]
}

/**
 * The account screen with DAZN's consents for this market and channel.
 *
 * The heading is DAZN's ("Get notified"), the first switch DAZN's own
 * permission in this market's wording, and one more for each partner the
 * channel brings. The note under the group is the authored one, kept: DAZN
 * has no string for it. Every switch starts off — the words say whether
 * turning it on agrees or declines, and the screen draws them as written.
 * A market DAZN has no consent string for reads the authored consents.
 */
export function liveAccountScreen(set: CardSet, context: Context, authored: AccountScreen): AccountScreen {
  const keys = consentSources(set, context)
  if (keys.length === 0) return authored
  const strings = marketFor(set, context.market).checkoutCopy!.strings
  const note = consentsOf(authored)[0]?.note ?? ''
  const consents: Consent[] = keys.map((key, i) => ({
    id: key,
    body: plainText(strings[key]),
    // The grey line closes the group, so it sits under the last switch.
    note: i === keys.length - 1 ? note : '',
    on: false,
  }))
  const heading = strings.auth_refined_consentOption_label?.trim()
  return { ...authored, ...(heading ? { notifyHeading: heading } : {}), consents }
}

/* ── Ready: the page after payment ───────────────────────────────────── */

/** Which of DAZN's strings the page after payment reads, for the panel to say. */
export function readySources(set: CardSet, context: Context): { titleKey: string | null; bodyKey: string | null } {
  const strings = marketFor(set, context.market).checkoutCopy?.strings ?? {}
  const has = (k: string) => Boolean(strings[k]?.trim())
  const bodyKeys = [
    ...(context.subscription === 'nfl' ? ['nfl_sac_pac_payment_confirmation_desc_1'] : []),
    'paymentcomplete_welcome_body',
  ]
  return {
    titleKey: has('paymentcomplete_welcome_header') ? 'paymentcomplete_welcome_header' : null,
    bodyKey: bodyKeys.find(has) ?? null,
  }
}

/**
 * The page after payment, for the plan bought in this market.
 *
 * The circles are the plan's own competitions — what was just paid for,
 * as the card showed them — rather than a fixed set of crests. The words
 * are DAZN's for the market where it has them (the NFL has a line of its
 * own), else the authored ones with their tokens filled. A plan with no
 * badges draws none: the New York crests belong to the RSN flow alone.
 */
export function liveReadyScreen(set: CardSet, context: Context, authored: ReadyScreen): ReadyScreen {
  const tier = chosenTier(set, context)
  const tokens = checkoutTokens(set, context) ?? {}
  const fill = (text: string) => fillTokens(text, tokens)
  const strings = marketFor(set, context.market).checkoutCopy?.strings ?? {}
  const { titleKey, bodyKey } = readySources(set, context)
  const known = new Set(set.logoCatalog.map((l) => l.id))
  const own = tier ? (resolveTier(tier, context).logoTiles ?? []).filter((id) => known.has(id)).slice(0, 5) : []
  const logos = own.length > 0 ? own : context.subscription === 'rsns' ? authored.logos : []
  return {
    ...authored,
    title: titleKey ? strings[titleKey].trim() : fill(authored.title),
    body: bodyKey ? strings[bodyKey].trim() : fill(authored.body),
    cta: fill(authored.cta),
    altCta: fill(authored.altCta),
    logos,
  }
}
