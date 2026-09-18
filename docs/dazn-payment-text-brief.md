# Brief: finding DAZN checkout legal / pricing text (all markets)

Give this whole file to Claude as context. Everything below was verified on 2026-09-18 from an
anonymous (not logged in) browser session on www.dazn.com, from a GB IP address.

## Goal

For every market, every offer and every payment method, get the text shown on the web checkout:

1. **T&C text under the payment method**, e.g. "By signing up you agree that your subscription
   starts immediately ... Your subscription auto-renews unless you cancel ..."
2. **Purchase summary sentence**, e.g. "In 8 days, you'll be charged £25.99/month. Cancel anytime
   before the end of the trial."

## Key finding

This text is NOT hard-coded in the page and does NOT need HTML scraping. It comes from public,
unauthenticated JSON APIs (CORS-open, plain GET, no token). The page combines three things:

| Piece | Source |
|---|---|
| The text templates (localised) | Resource Strings API |
| The offers, prices, trial lengths, payment methods | Offers API |
| Which template key is used for which offer/payment method | Logic in the front-end JS bundle (not an API) |

## 1. Resource Strings API (the text)

```
GET https://resource-strings.acc.indazn.com/v1/eu/live?region={cc}&LanguageCode={lang}&Platform=web
```

- `{cc}` = lowercase ISO country (gb, de, jp, us, it, es, ...). `{lang}` = language (en, de, ja, it, es, fr, ...).
- The `eu` in the path is the hosting region, not the market. `region=jp` and `region=us` both
  work on the `/eu/` path. Verified: gb/en, de/de, jp/ja, us/en all return 200 with 17k-20k strings.
- Response: `{ Strings: {key: text}, Links: {...}, Metadata: {...} }`.
- `Metadata.LabelsLastUpdated` and `Metadata.Version` can be used for change detection.
- Text is a template with `%{placeholder}` variables and markdown links, e.g.
  - `payment_termsWarning` = "By signing up you agree ... our [Terms of Use](%{termsLink}), [Privacy Policy and Cookie Notice](%{policyLink}). Your subscription auto-renews unless you cancel before the end of the minimum term by selecting 'Cancel Subscription' in MyAccount."
  - `auth_payment_cancelSentence_base_ent_set_month_ft` = "In %{discountedDays} days, you'll be charged %{price}/month. Cancel anytime before the end of the trial."
- `termsLink` / `policyLink` are filled from `Links.Terms` / `Links.Privacy` in the same response.
  `price`, `discountedDays`, `billingDate` etc. are filled from the offer (section 2).
- The same key can hold different text per market (e.g. `payment_termsWarning` is a different
  legal text in DE and JP), so always fetch per market + language. Never reuse GB text elsewhere.

Relevant key families (search keys with these regexes):

- `/termsWarning/i` (about 44 keys in GB), including per-payment-method variants:
  `payment_termsWarning`, `_extended`, `_weekly`, `_onetime`, `_upgrade`, `_il`, `_hbomax_it`,
  `_telstra_pay`, `_klarnaPayOverTime`,
  `payment_termsWarning_ppv_{apple|creditCard|dcb|default|direcDebitCard|googlePay|ideal|klarna|klarnaPaynow|paypal}`,
  `payment_termsWarning_superbowl_{...same list...}`, plus `*_myaccount` variants.
- `/payment_terms_acceptance/` : `payment_terms_acceptance_mixed_basket`, `payment_terms_acceptance_subscription_only`
- `/cancelSentence/i` (about 145 keys): `auth_payment_cancelSentence_*`, `signUp_cancelSentence_*`,
  `signUp_{nfl|nhl|fiba|elf|nltv|collegesports|...}_cancelSentence_*`
- Other related: `payment_ROWexclusion`, `paymentGoogle_terms`, `paymentAmazon_terms`,
  `payment_termsTv`, `apple_*_ca`, `auth_ppv_timeline_*`, `auth_plan_description_*`,
  `signup_cancelation_youthoffer_*`, `signup_rsncancel_sentence_*`

## 2. Offers API (offers, prices, payment methods)

```
GET https://tiered-pricing-offer-service.ar.indazn.com/v1/offers/{CC}?Platform=web&Brand=DAZN&Manufacturer=&ProductGroup=all&IsTiering=true&IncludeBundleOffers=true&BillingRouting=billing2
```

- `{CC}` = UPPERCASE country. Verified anonymously: GB = 40 offers, DE = 43, JP = 33, US = 26.
- Response top-level: `Offers[]`, `Addons[]`, `PaymentMethods[]`, `Entitlements[]`,
  `FreeTrialIneligibilityReason`, `DiscountIneligibilityReason`, `GiftCode`.
- Per offer: `Id`, `RatePlanId`, `EntitlementSetId`, `ProductGroup`, `BillingPeriod`
  (Month/Annual/Instalments/Week...), `BillingType`, `ChargeTiers[{Currency, Price, Discount}]`,
  `FreeTrialMonths`, `TotalFreeMonths`, `NextPaymentAmount`, `RenewalAmount`, `BillingDate`,
  `NextBillingDate`, `PaymentMethodIds[]`, `Promotions[]`, `Purchasable`.
- Payment methods differ per market. Verified:
  - GB: ApplePay, GooglePay, CreditCard, PayPal
  - DE: ApplePay, GooglePay, KlarnaPayNow, PayPal, CreditCard
  - JP: DCB, Merpay, ApplePay, GooglePay, CreditCard, PayPal
  - US: ApplePay, GooglePay, CreditCard, PayPal

## 3. Service discovery (do not hard-code the URLs above)

```
GET https://startup.core.indazn.com/v1/main/web?Platform=web&LandingPageKey=generic&Languages={lang-CC}&Brand=dazn
```

Returns `ServiceDictionary` with the current base URLs. Relevant entries: `ResourceStrings`,
`RatePlans` (= offers API), `RatePlansLite`, `MonetizationProductOffers`, `LpContentProxy`,
`PartnershipContent`. Also returns `Region` (geo-detected from caller IP), `SupportedLanguages`
(for the caller's market only) and `PaymentMethods`.

Note: startup geo-locates the caller, so it only describes the caller's own market. The strings
and offers APIs take the market as an explicit parameter, so they work for any market from any IP.

## 4. Campaign / PPV copy (Contentful)

```
GET https://dazn-content-proxy.sd.indazn.com/spaces/vhp9jnid12wf/environments/master/entries?content_type={type}&locale={lang-CC}&include=10&...
```

Content types seen: `EVOfferCampaignConfig` (filtered by `fields.tags[in]=` offer/campaign tags
such as `GB_DAZN_PPV_DF_REQ-2026-616_MT_MNA`), `CommonGroup` with `fields.tags[in]=offerStrings`
and `fields.env[in]=Live`, and `LPRootConfig`. This is where PPV event names and campaign-specific
offer copy live (e.g. the "BKFC: Till vs. Romero" line in the purchase summary).

## 5. Key-selection logic (which string is shown when)

This is the part with no API. It is in the minified bundles served from
`https://www.dazn.com/chapters/moon/auth/static/static/` (file names contain hashes that change
each release; get the current list from `https://www.dazn.com/chapters/moon/auth/index.html`).
Grep the bundles for `termsWarning` and `cancelSentence`.

**T&C text** (`webPayments-*.js`, and a `PaymentTerms` component in `app-*.js`). First match wins:

1. row-exclusion-v2 flag ON  -> PPV in basket ? `payment_terms_acceptance_mixed_basket` : `payment_terms_acceptance_subscription_only`
2. Klarna pay-over-time      -> `payment_termsWarning_klarnaPayOverTime`
3. instalments + extended T&C flag (`f_show_extended_paymentTerms` / myaccount extended-TnC feature) -> `payment_termsWarning_extended`
4. a `source` is passed      -> `payment_termsWarning_` + source   (this is how `ppv_paypal`, `ppv_googlePay`, `superbowl_creditCard` etc. are selected)
5. weekly offer              -> `payment_termsWarning_weekly`
6. otherwise                 -> `payment_termsWarning`

An extra checkbox label `payment_ROWexclusion` (right-of-withdrawal waiver) is added in markets
where the row-exclusion flag is on.

**Purchase summary sentence** (`signUpUnifiedJourney-*.js`, also `selectOffer-*.js`):

- Free trial: `auth_payment_cancelSentence_{entitlementSetId without "_{cc}" suffix}_{billingPeriod lowercased}_ft`
  (e.g. `base_ent_set` + `month` -> `auth_payment_cancelSentence_base_ent_set_month_ft`)
- Otherwise: result of `getOfferCancelStringId(offer)` (read this function in the bundle; it builds
  `signUp_cancelSentence_...` keys from product type, discount, billing period)
- Overrides: Klarna pay-over-time -> `signUp_cancelSentence_{productType}_klarnaPayOverTime`;
  discounted DAZN offer -> `signUp_cancelSentence_discount_{billingPeriod}`;
  NFL gift code -> `signUp_nfl_cancelSentence_{period}_nfl_giftCode`;
  youth/KYC offers -> `signup_cancelation_youthoffer_{entitlementSetId}_{period}`;
  RSN migrated users -> `signup_rsncancel_sentence_{period}..._migrated`;
  non-DAZN brand with free trial -> append `_ftd`; some paths append `_{countryCode}`.
- The component checks `checkIfStringExists(key)` and falls back when a key is missing in that
  market, so always resolve keys against that market's own strings response.

**Feature flags** that drive the branches above:
`https://features.fe.indazn.com/production/datafile-tag-web.json` (Optimizely-style datafile,
flags can be targeted per country).

## 6. Doing it for all markets

1. Build the market list (country + languages). Sources: the language/country switcher on
   dazn.com, the URL locales (`/en-GB/`, `/de-DE/`, `/ja-JP/`, ...), and `includedCountries`
   fields in the Contentful `LPRootConfig` entries. Multi-language markets (CH, BE, CA, ...) need
   one strings fetch per language.
2. For each market: fetch offers (section 2) and strings for each language (section 1).
3. For each offer x each of its `PaymentMethodIds`: compute the T&C key and summary key
   (section 5), look them up in that market's strings, fill placeholders from the offer + `Links`.
4. Store raw responses with `Metadata.Version` / `LabelsLastUpdated` and the bundle hash, and
   re-run on change.
5. Validate a sample per market in a real browser (Playwright) against the rendered checkout.
   Treat this as a test of the mapping, not as the data source.

## 7. Known gaps / caveats

- **Offers are user-state dependent.** The anonymous response showed
  `FreeTrialIneligibilityReason: "ForcedHardOffer"` and
  `DiscountIneligibilityReason: "AccountStatusPreventsDiscount"`, while a logged-in user saw an
  8-day free trial with a PPV bundle (URL had `contextualPpvId=ppv_e_till_romero`). Logged-in
  calls send the user's bearer token and possibly extra params. This was NOT captured. To capture
  it: a human signs in on dazn.com, opens DevTools > Network, filters for `offers` and
  `product-offers`, and records the request URL, query params and headers on the payment page.
  Different account states (new, lapsed, active, partner) can return different offers.
- Other surfaces have their own strings (`apple_*`, `paymentGoogle_terms`, `paymentAmazon_terms`,
  `payment_termsTv`) - `Platform=web` still returns them, but the selection logic for TV/mobile
  lives in those apps, not the web bundle.
- The selection logic is minified and can change on any release without notice.
- These are undocumented internal endpoints. If this is a DAZN-internal tool, the owning teams of
  resource-strings, tiered-pricing-offer-service and the `auth` chapter (web signup/payments) can
  provide the un-minified source of the key logic, which is more reliable than reverse-engineering.

## Companion files

- `dazn-fetch-payment-text.mjs` - tested Node 18+ script (no dependencies, no login). Run
  `node dazn-fetch-payment-text.mjs gb:en de:de jp:ja` (market:language pairs). Writes one JSON per
  market (relevant strings, links, offers, payment methods) plus `summary.csv` to `./dazn-output`.
  Tested 2026-09-18 on gb, de, it, es, jp, us, ca, fr - all returned data. It fetches the raw
  templates and offers only; it does NOT yet implement the key-selection logic from section 5.
- `dazn-summary-sample.csv` - sample output of that run (market, language, key, text).

## Quick check commands

```bash
curl -s "https://resource-strings.acc.indazn.com/v1/eu/live?region=gb&LanguageCode=en&Platform=web" | jq '.Strings | with_entries(select(.key|test("termsWarning|cancelSentence|terms_acceptance";"i")))'
```

```bash
curl -s "https://tiered-pricing-offer-service.ar.indazn.com/v1/offers/DE?Platform=web&Brand=DAZN&Manufacturer=&ProductGroup=all&IsTiering=true&IncludeBundleOffers=true&BillingRouting=billing2" | jq '{offers: [.Offers[] | {Id, EntitlementSetId, BillingPeriod, PaymentMethodIds}], pm: [.PaymentMethods[].Id]}'
```
