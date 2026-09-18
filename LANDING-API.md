# The live landing page's API

What `www.dazn.com` actually calls to draw a landing page, read off the running
site on 2026-09-18, anonymous, web. The call-by-call detail is `en-CA`
(`/en-CA/welcome`); the list of component types is read across eight markets.

Written down because this editor's content model was built from Figma, and the
two have to meet somewhere. Every component we ship has a counterpart here, and
the places where they disagree are listed at the end.

Everything below is a read. Nothing here was written to, and no account was
signed in — so anything that only a signed-in viewer sees is marked as unknown
rather than guessed at.

## The shape of it

A landing page is not one call. It is a page **config** from a CMS, and a
handful of **services** the config points at:

| Host | What it serves |
| --- | --- |
| `dazn-content-proxy.sd.indazn.com` | The page itself — a Contentful space, proxied |
| `contentful-asset-proxy.sd.indazn.com` | The pictures in it |
| `rail-router.discovery.indazn.com` | A rail's contents, by id |
| `tiered-pricing-offer-service.ar.indazn.com` | What the tiers cost, by country |
| `startup.core.indazn.com` | Which landing page key to ask for, and where the rest lives |
| `resource-strings.acc.indazn.com` | Strings the chapter itself owns |
| `themepark.fe.indazn.com` | The stylesheet, versioned |
| `features.fe.indazn.com` | Feature flags (Optimizely datafile) |

The page is a micro-frontend — a "chapter" — served from
`www.dazn.com/chapters/<country>/landingpage/`. The version we read was
`3.134.113.49100` inside shell `29.403.0`.

## 1. The page config

```
GET https://dazn-content-proxy.sd.indazn.com
      /spaces/vhp9jnid12wf/environments/master/entries
      ?content_type=LPRootConfig
      &locale=en-CA
      &include=10
      &fields.pages[in]=welcome
      &fields.includedCountries[in]=CA,ALL
      &fields.excludedCountries[nin]=CA
      &fields.environment[in]=Live
```

A stock Contentful Delivery API query, so the response is the stock envelope:
`items`, `includes.Entry`, `includes.Asset`, and `include=10` flattens the whole
tree into one call. The `en-CA` page came back as 1 item, 137 included entries
and 111 included assets.

Four things do the filtering, and they are worth noting because they are how
this system does what our `flowLayers` do:

| Field | Meaning |
| --- | --- |
| `fields.pages` | Which surface — `welcome` is the logged-out landing page |
| `fields.includedCountries` / `excludedCountries` | Market targeting, `ALL` for the shared copy |
| `fields.environment` | `Live` — so there is a non-live environment alongside it |
| `locale` | Language, separately from country |

### environment

Two unrelated things in that URL are called environment, and only one of them
is Contentful's.

`environments/master` in the **path** is Contentful's own — a branch of the
space carrying both the content model and the content. Everything read here
came from `master`; nothing suggests a second one is in use.

`fields.environment` is a field **DAZN added to the content type**, and it is a
list rather than a value. Across all 954 `LPRootConfig` entries it is an array
every time, drawn from three names:

| | configs carrying it |
| --- | --- |
| `Test` | 840 |
| `Live` | 685 |
| `Beta` | 114 |

They overlap, which is the point — 509 configs are `Live+Test`, 258 are `Test`
alone, 73 `Live` alone, 72 all three, 31 `Beta+Live`, 10 `Beta` alone. So it is
not a deployment tier a page moves through. It is **who is allowed to see this
page**, and a page can be visible to several audiences at once. The public site
asks for `Live`; a page still being worked on carries `Test` and simply is not
in the answer.

`fields.pages` works the same way — an array on 949 of the 954, so one config
can answer to several slugs (`msg`, `p/msg`, `welcome/msg`, `/msg` are one
entry). And `includedCountries` is a list too.

Which makes the whole filter a set intersection: give me the config whose
`pages` contains this slug, whose `includedCountries` contains this country or
`ALL`, and whose `environment` contains `Live`. Three lists on the entry, not
three layers over a base — see the disagreements at the end.

**The environment field is not one field.** `LPRootConfig` filters on
`fields.environment[in]=Live`. `CommonContentTierGroup` filters on
`fields.env[in]=production` — a different field name *and* a different
vocabulary, with no `Live` in it at all.
Asking a tier group for `Live` returns 0 items and a 200, which reads exactly
like an empty market. Checked both ways round: `env=production` gives 91 groups
and 202 tier items for `en-GB`, `env=Live` gives nothing.

### LPRootConfig

```
brand · displayName · isDevModeEnabled · prductGroup · environment
pages · includedCountries · components
```

`components` is an ordered list of links. That ordering is the page — the same
job our `sections` array does. (`prductGroup` is misspelled in the model itself,
not here.)

### Every component type in production

Read across eight markets' `welcome` pages (CA, US, GB, ES, IT, DE, JP, FR),
all eight answering. Seventeen names, and which markets were using each at the
time of reading:

| `componentType` | Markets | Ours |
| --- | --- | --- |
| `Banners` | US GB IT FR | Hero banner |
| `BoxedHeroBanners` | CA ES DE JP | Hero banner |
| `ContentTiers` | CA ES IT DE JP FR | Subscription plans |
| `SubscriptionsRail` | CA US GB DE JP FR | More subscriptions |
| `SpotlightRail` | CA US GB ES IT JP | Spotlight |
| `StandardRail` | JP | Rail |
| `StandardRailV2` | DE | Rail |
| `ComingUpRail` | DE | Games schedule |
| `CompetitionCarousel` | ES DE JP FR | Rail — Places |
| `SectionFeatures` | CA ES JP | Features list |
| `SupportedDevices` | CA US GB IT DE | Supported devices |
| `ZipCodeBreather` | US | Postcode |
| `IntroductionBanner` | IT DE JP FR | Text block (unconfirmed) |
| `FreemiumBanner` | CA US GB ES DE JP FR | — |
| `StickyPpvHeader` | ES | — |
| `FAQs` | all eight | FAQs |
| `Footer` | all eight | Footer |

Three things fall out of that table.

**`Banners` and `BoxedHeroBanners` are disjoint** — four markets each, none
with both. That is a hero rollout caught mid-flight, not two components.
`StandardRail` / `StandardRailV2` is the same story on a smaller scale.

**`FAQs` and `Footer` are the only two everywhere.** Everything else is a
market's own decision, which is the thing our per-market layering exists to
express.

**`ZipCodeBreather` is US-only**, which is our Postcode component and the RSN
journey it belongs to.

The mapping column is our reading, not theirs — `ComingUpRail`,
`CompetitionCarousel` and `IntroductionBanner` were named from their
component type and their place in the order, not from a rendered page.

### The components on the `en-CA` welcome page

Twelve, in order. Every one of them is an `LPContentGroup`; what it *is* comes
from the `componentType` field rather than from the entry's type.

| # | `componentType` | Children | Ours |
| --- | --- | --- | --- |
| 0 | `BoxedHeroBanners` | `LPBoxedHeroBanners` → 3 banner items | Hero banner |
| 1 | `SubscriptionsRail` | 9 × `LPContentItem` | More subscriptions |
| 2 | `ContentTiers` | `CommonContentTierGroup` | Subscription plans |
| 3 | `SectionFeatures` | `LPContentItem` + `LPButton` | Features list |
| 4 | `SubscriptionsRail` | 4 × `LPContentItem` | More subscriptions (a second one) |
| 5 | `SpotlightRail` | `AdaptiveImage` + **railId** | Spotlight |
| 6 | `SpotlightRail` | `AdaptiveImage` + `LPButton` + **railId** | Spotlight |
| 7 | `SpotlightRail` | `AdaptiveImage` + `LPButton` + **railId** | Spotlight |
| 8 | `FreemiumBanner` | `LPContentItem` | — |
| 9 | `SupportedDevices` | `LPContentItem` + `CommonKeyValue` | Supported devices |
| 10 | `FAQs` | 4 × `LPFaqArticle` | FAQs |
| 11 | `Footer` | none — `footerKeys` only | Footer |

Two things fall out of that list. A component type can appear more than once on
a page, which our duplication already allows. And `Footer` carries no entries at
all, only `footerKeys` — the footer is assembled from strings elsewhere.

### LPContentGroup

The union of every field seen across the twelve:

```
brand · displayName · componentType · version · title · description
entries · carouselInterval · backgroundColor · theme · videoAlignment
showGradient · showHighlightedBorder · railId · railParams · tags
targetComponentType · footerKeys
```

`version` (`v1`) appears only on `BoxedHeroBanners`, `ContentTiers`,
`SectionFeatures` and `FreemiumBanner` — the components that have been through a
redesign. It is a renderer switch, not content.

### The leaf types

| Type | Fields |
| --- | --- |
| `LPContentItem` | `title` `preTitle` `preTitleImage` `description` `backgroundImage` `logo` `video` `buttons` `showBadge` `badgeText` `showPrice` `showHighlightedBorder` `competitionId` |
| `LPBoxedHeroBannerItem` | `bannerType` `backgroundImage` `logos` `title` `titleSize` `description` `billingPeriod` `bannerActions` `helperText` `labelText` `horizontalContentAlignment` |
| `LPButton` | `buttonId` `buttonType` `label` `mobileButtonLabel` `freeTrialLabel` `type` `navigationType` `navigationChapterName` `navigationLink` `navigationInfo` `scrollAction` `startIcon` `endIcon` `entitlementSetId` `billingPeriod` `buttonTrackingId` |
| `AdaptiveImage` | `key` `default` `web` `mobile` `tablet` `livingRoom` |
| `CommonKeyValue` | `key` `value` |
| `LPFaqArticle` | `title` `url` `target` |
| `VideoAsset` | `displayName` `video` |
| `CatalogueFeaturesItem` | `logoImage` `tagLabel` `featuresText` |

**These lists are a floor, not the model.** Contentful omits a field that is
not set, so a type read from one market shows only what that market fills in.
`CommonContentTierItem` read off `en-CA` has 29 fields; read off `en-GB` it has
44 — `benefits`, `monthlyprice`, `weeklyprice`, `yearlyprice`,
`compareBillingPeriod`, `compareEntitlementSetId`, `bestValueBadgeText`,
`freeTrialText` and more. Read several markets before trusting a shape, or read
the content model itself.

`AdaptiveImage` is the one to copy. One picture per breakpoint plus a `default`,
keyed — our `ImagePicker` holds a single data URL and the page scales it.

### The tiers

`ContentTiers` → `CommonContentTierGroup`, which is where most of the
configuration on this page lives:

```
title · tiers · billingPlans · tierTypes · defaultTierType · defaultBillingPlan
preselectBillingPeriod · tiersLayout · tierVersion · tierClickAction
showSeeMore · showBenefits · showCommonFeatures · showBillingPeriodSwicther
showPlanUI · showTierTypeSwitcher · showDefaultOrderMobile
showWeeklyTierAside · showWeeklyTierTop · hidePlanSwitcherOnDesktop
tags · pageIds · env
```

Each tier is a `CommonContentTierItem`:

```
title · description · OfferMonthlyDescription · OfferAnnualDescription
price · showPrice · billingPeriod · entitlementSetId · moreDetails
buttons · modalEntry · interactionType · tags · eyebrowText · showEyebrow
isCardHighlighted · showBestValueBadge · showBadge · badgeColor
showImage · showLogos · showOverrideLogos · bigLogos · overrideLogos
showBenefits · showDivider · isMobileTier
```

`entitlementSetId` is the join to what a plan actually entitles you to. Nothing
about entitlements is in the CMS — the CMS only names the id.

(`showBillingPeriodSwicther` is misspelled in the model.)

## 2. The rails

```
GET https://rail-router.discovery.indazn.com/ca/v10/Rail
      ?id=<uuid>
      &platform=web
      &country=ca
      &brand=dazn
      &languageCode=en
      &params=PageType:Competition;ContentType:Competition;ContentId:<id>;OpenBrowse:True
```

**This is what our Rail ID fields point at.** The id is a UUID held on the
component in the CMS (`railId`), and `railParams.params` travels with it —
URL-encoded in the CMS, decoded onto the query string.

`params` is a semicolon-separated list of `Key:Value` pairs. Seen on this page:
`PageType`, `ContentType`, `ContentId`, `OpenBrowse`. `ContentId` is a
Contentful-style id for a competition or a sport.

The envelope:

```
Id · Title · Description · Params · Tiles · Type · Layout
StartPosition · Navigation · IsStacked · IsAutoPlay · ContinuousPlayEnabled
```

`Type` came back `Standard`. `Layout` was `null`, `IsStacked` and `IsAutoPlay`
`false`.

**Not established: the shape of a tile.** All three rails on the `en-CA` page
returned `Tiles: []` to an anonymous viewer, so there was nothing to read. That
is either genuinely empty scheduling for Canada at the time of reading, or a
rail that needs a signed-in viewer. Sign in, or read a market with live
fixtures, and `Tiles[0]` will answer it. Until then, treat our schedule and
spotlight placeholder tiles as unconfirmed against this service.

## 3. The prices

```
GET https://tiered-pricing-offer-service.ar.indazn.com/v1/offers/{COUNTRY}
      ?Platform=web&Brand=DAZN&ProductGroup=DAZN
      &IsTiering=true&IncludeBundleOffers=true&BillingRouting=billing2
```

Country in the path. No auth, no token, and **the country is in the request
rather than read off the caller's address** — so any market can be pulled from
anywhere, including from a script.

**But not from a browser that is not DAZN's.** This is the one service of the
four that checks the origin: a `fetch` from `http://localhost:5173` fails CORS,
where the content proxy and the rail router both answer it. Server-side `curl`
is fine. So anything in this tool that wants a price needs a proxy — a Vite dev
proxy, or something small and server-side — while everything else can be read
straight from the page.

```
Offers[] · Addons[] · Entitlements[] · PaymentMethods[]
FreeTrialIneligibilityReason · DiscountIneligibilityReason
GiftCode · NoOfferFreeTrialMonths
```

An offer:

```
Id · SkuId · RatePlanId · ProductGroup · ProductType · Brand
BillingPeriod · BillingType · BillingDate · NextBillingDate · RenewalDate
Duration · ChargeTiers[] · TierRank · EntitlementSetId
FreeTrialMonths · TotalFreeMonths · Instalment · AutoRenew
RenewalAmount · NextPaymentAmount · NextRenewalPlan
Purchasable · PurchaseDenyReasons · PaymentMethodIds
AllowsNoPaymentMethod · IsAccessCodeApplicable · Conditions
```

`ChargeTiers[]` is `Price` / `Currency` / `Discount`. `Addons[]` are the PPVs,
same shape plus `EventStartDate`, `DiscountPercentage` and `Promotions` — the
start date is how an upcoming event is told from a past one.

`Entitlements[]` is `setId` / `entitlementIds` / `features` / `content` /
`multiviewEnabledCountries`. The limits live in `features`:

| | |
| --- | --- |
| `CONCURRENCY.max_devices` | simultaneous streams |
| `CONCURRENCY.max_ips` | simultaneous networks |
| `DEVICE.max_registered_devices` | registered devices — 999 means unlimited |

and the policy is also spelled out in `entitlementIds`:
`disallow_watch_concurrency` (one stream),
`allow_watch_concurrency_with_single_location` (many streams, one network),
`allow_watch_concurrency` (many of both). Some products return `DEVICE` with no
`CONCURRENCY` block at all, and for those the stream count is only in the CMS
copy.

### ProductGroup

Case-sensitive, and it decides what is being sold:

| | |
| --- | --- |
| `DAZN` | the main tiered plans |
| `NFL` `NHL` `FIBA` | uppercase — FIBA is Courtside 1891 |
| `CollegeSports` `RallyTV` `NationalLeagueTV` | CamelCase |

A product's exact casing is in its signup URL:
`…/account/content/<ProductGroup>/signup`.

Two failure modes, and they do not look alike. **400** is no such group —
`MSG`, `MSGPlus` and `RSN` all answer 400, so our MSG+ product group has no
counterpart here under any obvious name. **200 with `Offers: []`** is a real
group that is not sold in that market: `NHL` is empty in CA and US and returns
four offers in DE.

## 4. The join

`EntitlementSetId` on an offer is `entitlementSetId` on a
`CommonContentTierItem`. That is the whole join between what a plan **costs**
and what a plan **says** — price and currency on one side, the title and the
benefit lines on the other. Neither service knows the other's half.

## 5. The bootstrap

```
GET https://startup.core.indazn.com/v1/main/web
      ?Platform=web&LandingPageKey=generic&Languages=en-US,en-CA,ru-CA&Brand=dazn
GET https://startup.core.indazn.com/v1/static/web?Brand=dazn
```

`LandingPageKey=generic` is the interesting one: the page to ask the CMS for is
itself a decision made upstream, so a market can be pointed at a different
landing page without touching the CMS query.

## Where we disagree with it

Worth reading before building an adapter.

**A component's type is a field, not a type.** Everything on the page is an
`LPContentGroup` discriminated by `componentType`. Our `SectionType` is a real
union with per-type fields. Mapping in is a switch on `componentType`; mapping
out means flattening back to one type with a lot of optional fields.

**Market targeting is per-entry, not layered.** `includedCountries` /
`excludedCountries` on each entry, against our `flowLayers` and the
base-plus-override ladder. Ours can express "Spain differs from the base in one
field"; theirs expresses "this entry is for these countries". Those do not
round-trip.

**Pictures are per-breakpoint.** `AdaptiveImage` carries `web` / `mobile` /
`tablet` / `livingRoom` / `default`. We carry one.

**Our Supported devices toggles have no counterpart.** Theirs is a list of
`LPContentItem` and `CommonKeyValue` entries — a device is on the wall by being
in the list. Our `supportedOff` list of names would map to adding and removing
entries, not to a flag.

**Buttons are richer than ours.** `navigationType` / `navigationChapterName` /
`navigationLink` / `scrollAction` / `entitlementSetId` / `buttonTrackingId`
against our single string of label text. Everywhere we hold a CTA as words, the
live page holds a destination and a tracking id too.

**Two components we do not have:** `FreemiumBanner`, and the second
`SubscriptionsRail` is used as a distinct band rather than a duplicate.

**One we have that this page does not use:** Meet the teams. It is fetched
separately — `content_type=CommonGroup&fields.tags[in]=rsn_lp_teams` — which is
an RSN concern, not on the generic welcome page.

## How this was read

Loaded `www.dazn.com` in a browser, let it redirect to `/en-CA/welcome`, read
the network log, then re-fetched the config and rail endpoints from the page's
own origin to read their shapes. The component-type table came from the same
query against eight markets.

Sections 3 and 4 started from a reference note of Alex's covering the offers and
tier-content services, and every claim in it was re-run here with plain `curl`
before being written down — which is how the `env` / `environment` split and
the 400-versus-empty distinction turned up. Both of those services answer an
unauthenticated server-side GET with no browser involved.

No authentication, no writes, and no cookie consent was accepted. Field *names*
and structure are recorded here; the copy and artwork in the responses are not.

Re-run it against another market by changing the country in the path and the
`locale` / `fields.*Countries` filters — the ids and the rail UUIDs are
per-market.
