# The live landing page's API

What `www.dazn.com` actually calls to draw a landing page, read off the running
site on 2026-09-18 from `en-CA` (`/en-CA/welcome`), anonymous, web.

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

### LPRootConfig

```
brand · displayName · isDevModeEnabled · prductGroup · environment
pages · includedCountries · components
```

`components` is an ordered list of links. That ordering is the page — the same
job our `sections` array does. (`prductGroup` is misspelled in the model itself,
not here.)

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
GET https://tiered-pricing-offer-service.ar.indazn.com/v1/offers/CA
      ?Platform=web&Brand=DAZN&Manufacturer=&ProductGroup=all
      &IsTiering=true&IncludeBundleOffers=true&BillingRouting=billing2
```

Country in the path, and the flags say this service answers for both tiering and
bundles. The CMS holds a `price` field on each tier as well, so one of the two
is a fallback — which wins is not established here.

## 4. The bootstrap

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
own origin to read their shapes. No authentication, no writes, and no cookie
consent was accepted. Field *names* and structure are recorded here; the copy
and artwork in the responses are not.

Re-run it against another market by changing the country in the path and the
`locale` / `fields.*Countries` filters — the ids and the rail UUIDs are
per-market.
