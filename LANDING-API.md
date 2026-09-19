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
| `ComingUpRail` | DE | `ComingUpRail` — ours takes the name |
| `CompetitionCarousel` | ES DE JP FR | `CompetitionCarousel` — ours takes the name |
| `SectionFeatures` | CA ES JP | Features list |
| `SupportedDevices` | CA US GB IT DE | Supported devices |
| `ZipCodeBreather` | US | — an announcement, not our input |
| `IntroductionBanner` | IT DE JP FR | `IntroductionBanner` — ours takes the name |
| `FreemiumBanner` | CA US GB ES DE JP FR | `FreemiumBanner` — ours takes the name |
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

**`ZipCodeBreather` is US-only**, and is not our postcode block. It is an
announcement with a picture inviting somebody to set their zone; ours is the
step that follows, which is `ZipCodeAutoFill`.

The mapping column is our reading, not theirs. Three of the rows were first
guessed from the type and its place in the order; all three have since been
settled by reading what they actually carry, and two of the guesses were wrong.

**`ComingUpRail` is our Games schedule**, which now carries that name. A
served rail — `railId`, `railParams`, a `title` and a `description`, and no
entries of its own. The same shape as ours: a heading, a line under it, and a
rail somebody else fills. Germany's reads "Alle Spiele. Alle Teams. Alles an
einem Ort."

**`CompetitionCarousel` is not our Places, and in the end it is not our teams
block either.** It held that name for a while, on the reading that the two do
the same job — until `TeamsRail` turned up on the RSN page matching the block
field for field, and took it. So this is a gap again: a row we do not draw. Its entries are `CommonSpoloCircularLogo` — `image`,
`description`, `isHighlighted` — and ES carries twelve, one per competition,
under a heading. A row of circular league badges.

Places is square photographs of stadiums with words laid over them: a different
component wearing a similar word. Meet the teams is the same idea — a row of
logo tiles saying how much you get — and the name is adopted on that reading.

A match at the block and not at the drawing, so the differences are worth
keeping written down. Ours burns a short label into the tile, a city over a
name, where this carries a sentence per badge with nowhere in our tile to put
it. Ours is a 150 rounded square with a gradient wash at its foot; this is a
circle. Ours colours each tile from what the name brings, where this has only
`isHighlighted`. And ours is keyed by team — the artwork is found by the name
written on the tile — where this is competitions.

Near enough to be the thing to stretch if somebody wants this row, and not near
enough that a page built from ours would look like it. Whether the description
is drawn under the badge, drawn as a tooltip, or not drawn at all is not
established: the component is in ES, DE, JP and FR only, and dazn.com serves by
detected country, so none of those pages could be seen rendered from here.

**`IntroductionBanner` is not our Text block. It is Article CTA**, which now
carries that name. A breather — the artwork is filed under that name
(`..._BUNDLE_BREATHER_DESKTOP_DACH.jpg`), which is the same word
`ZipCodeBreather` carries: a full-bleed band that breaks up the page.

Each card holds a `backgroundImage` — an `AdaptiveImage`, so desktop, tablet
and mobile are three separately cropped files, 2880 by 1200 at the top — with a
`title`, a `description`, one `primary` button, a `features` list, a
`disclaimer` and a badge. The group carries `carouselInterval: 5000` and
`showGradient`, so the band rotates.

And it quotes a live price. `showPrice`, a `billingPeriod` and an
`entitlementSetId` arrive as key-values, and one of Germany's two carries an
`offerLabel` written as markdown around a `{price}` placeholder — resolved
against the offers service through the join key above, rather than typed into
the CMS.

Text block is two headings and a body, which was never it. Article CTA is a
still, a line about it and a way in, which is the right family — and the name is
adopted on that reading.

A match at the block and short at the fields, so the three gaps are worth
keeping written down: ours is not full-bleed, it does not rotate, and nothing we
have binds a price to an entitlement and fills it in at render. That last one is
the only real work — the join it needs is the `entitlementSetId` above, which
`/api/dazn` already resolves for the plan cards.

**`FreemiumBanner` is our Image CTA**, which now carries that name. One
`LPContentItem` with a `backgroundImage`, a `title`, a `description` and
`buttons` — which is our picture, heading, line under it and button, field for
field. Ours was named for its form and theirs for its purpose, and the purpose
was already in ours: the copy it ships with is a free-to-watch pitch.

It carries three things ours cannot say — `showBadge` with its text, a
`features` list, and in Germany `showPrice` and `showHighlightedBorder`. A
match at the block, short at the fields.

So the palette is short of the welcome page by three: `CompetitionCarousel`,
the row of circular league badges; `ZipCodeBreather`, the US announcement that
invites somebody to set their zone; and `StickyPpvHeader`, which is Spain's
alone.
Everything else on GB, US, CA and IT has a block here — several of them short at
the fields, which is as much of the work as the missing blocks are.

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
| 8 | `FreemiumBanner` | `LPContentItem` | Image CTA, renamed to match |
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

### What the config selects on, and what it does not

The tool asks three questions at the front door. The config answers two of them.

**Market — yes.** `includedCountries` and `excludedCountries` on the entry,
with `locale` separately for the words.

**Product group — yes, and in its own vocabulary.** `prductGroup` on the root
config, misspelled in the model. Twenty-one values across the 954:

```
DAZN 329   NFL 52   NationalLeagueTV 14   RallyTv 12   NHL 10   YESMSG 8
FIBA 6   KAYO 5   CollegeSports 3   MONUMENTAL 3   MLB 2   LAKINGS 2
FIFA_PLUS 1   and eight per-club NBA codes — CLENBA, INDNBA, ORLNBA and so on
```

499 are unset, so over half of all landing pages do not name one at all.

The catch is that this is **not the offers service's vocabulary**. There it is
`RallyTV`; here `RallyTv`. There MSG has no group at all and answers 400; here
it is `YESMSG`. Two services, two spellings of the same idea, and a product
group means a different thing to each — so a single field in this tool cannot
address both without a mapping.

`brand` is a separate axis above it: `dazn` on all 954, `kayo` on 6.

**User status — no.** `LPRootConfig` carries nine fields and not one of them
is about who is looking: `brand`, `displayName`, `isDevModeEnabled`,
`prductGroup`, `environment`, `pages`, `includedCountries`,
`excludedCountries`, `components`.

Nor is it hiding in the slugs. Of 802 distinct page slugs, eight mention
anything like a user state, and they are campaigns rather than states —
`nhlfreemium` and `premiumupgrade`, pages in the same sense `boxing` is a page.
There is no logged-out page and no logged-in one.

Which fits what the offers service showed: the fields that depend on a person —
`Purchasable`, `PurchaseDenyReasons`, `FreeTrialIneligibilityReason` — live
there and need an authenticated user. A landing page is drawn before anybody is
known.

The nearest thing to an audience on the config is `environment`, and it answers
a different question: who is allowed to see this page, not who is reading it.

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

## How the two compare

Read across eight markets' `welcome` pages on 18 Sep 2026, against a palette of
21 blocks.

**Four of the seventeen are not this tool's to build.** The hero — `Banners`
and `BoxedHeroBanners` — is authored in the hero studio. `ContentTiers` and
`SubscriptionsRail` come from the acquisition flow, along with our Bundles and
Choose the plan, which no welcome page draws anyway. All are drawn here and none
is edited here.

The tables below count them, because they are on the page. The honest reading
leaves them out: **thirteen components in scope, eleven of them ours**, and six
of the eight markets complete.

| | | | |
| --- | --- | --- | --- |
| GB 8 of 8 | CA 8 of 8 | JP 9 of 9 | DE 9 of 9 |
| IT 6 of 6 | FR 5 of 5 | US 5 of 6 | ES 7 of 8 |

US is short `ZipCodeBreather`, the announcement inviting somebody to set their
zone. ES is short `StickyPpvHeader`. There is nothing else.

### At the block level, we are all but complete

Seventeen component types in production. We have sixteen.

| Production component | Markets drawing it | Ours |
| --- | --- | --- |
| `FAQs` | all eight | ✔ |
| `Footer` | all eight | ✔ under the palette |
| `FreemiumBanner` | CA DE ES FR GB JP US | ✔ |
| `ContentTiers` | CA DE ES FR IT JP | ✔ |
| `SpotlightRail` | CA ES GB IT JP US | ✔ |
| `SubscriptionsRail` | CA DE FR GB JP US | ✔ |
| `SupportedDevices` | CA DE GB IT US | ✔ |
| `Banners` | FR GB IT US | ✔ the Hero banner tab |
| `BoxedHeroBanners` | CA DE ES JP | ✔ the Hero banner tab |
| `CompetitionCarousel` | DE ES FR JP | **no** |
| `IntroductionBanner` | DE FR IT JP | ✔ |
| `SectionFeatures` | CA ES JP | ✔ |
| `ComingUpRail` | DE | ✔ |
| `StandardRail` | JP | ✔ |
| `StandardRailV2` | DE | ✔ the same rail, later renderer |
| `ZipCodeBreather` | US | **no** |
| `StickyPpvHeader` | ES | **no** |

`StickyPpvHeader` is not what its name says. Spain's is a bar pinned to the top
carrying one line — an offer of help to subscribe, with a phone number — a
badge, and one primary button reading "Ya soy cliente" that goes to the auth
chapter at `/account/content/dazn/signup?signin=true`. The entry is filed as
`ES || Need help to subscribe || STICKY`.

There is no picture on it at all: no `backgroundImage`, `showPrice` false, and
the group's `showGradient` and `videoAlignment` are inherited rather than used.
So the name says where it sits — stuck to the top — and nothing about what it
holds, which is a component named for its first use and then reused.

Which comes out, market by market:

| | | | | |
| --- | --- | --- | --- | --- |
| GB 11 of 11 | US 9 of 9 | CA 12 of 12 | JP 12 of 12 | DE 12 of 12 |
| ES 9 of 10 | IT 8 of 8 | FR 8 of 8 | | |

### The zip journey is one thing, and it is not on the page

Three of our blocks — `ZipCodeAutoFill`, `ZipCodeCheck` and Outside the area —
are one journey in production, and it is spread across more than one page.

The welcome page carries only the invitation, and it is not ours.
`ZipCodeBreather` on the US page is filed as
`RSN Starlink || Announcement Breather`: a picture, a line about watching your
regional sports networks, an offer to set your zone in two steps, and a button.
No input anywhere on it. We do not draw that component, and the name was ours
for a while on the strength of the word "ZipCode" alone.

What we draw is the two steps that follow, both on the RSN slugs.
`ZipCodeCheck` asks — "See what's live in your area", with a line about
entering a code to see which teams you have access to. `ZipCodeAutoFill`
confirms — "Check everything looks right", a line about using the home ZIP code
to work out which local teams and games you can watch, and a golden Sign up.
Our own heading, note and button are a paraphrase of that one, close enough
that the two read as the same screen written twice.

What a code buys is a **zone**, and the teams are tagged by it. The list comes
from its own query rather than from the page config:

```
GET …/entries?content_type=CommonGroup&locale=en-US&include=10
      &fields.tags[in]=rsn_lp_teams&fields.env[in]=Live
```

One group, `LP || RSN || ALL TEAMS`, holding 18 `CommonKeyValue` entries:

| Field | What it holds |
| --- | --- |
| `key` | a slug — `new-york-knicks` |
| `value` | the full name — "New York Knicks" |
| `secondaryValue` | the short one — "Knicks" |
| `keyImage` | the crest |
| `localZoneTags` | which zones this team belongs to |
| `showMoreInfoIcon` `postIconImage` `postIconKey` | trimmings |

There are 26 zone tags across the 18 teams — `msg_1` through `msg_10`,
`yes_ya`, `yes_nt`, `orl_mg`, and `all` for a team every zone gets. A team
carries several.

So **What's live is this list filtered to the zone a code resolved to**, and
**Outside the area is the same question answered with no zone**. Neither is a
missing component. Neither is a landing page component either: they are states
downstream of a button the page does carry.

And our teams block is modelled on this list more closely than on the Spanish
carousel it is now named after. Its `value` and `secondaryValue` are our city
over our name — "New York Knicks" is what `competitionArt` is keyed by, and
"Knicks" is what the tile prints — and `keyImage` is the crest that key finds.
What ours adds is a colour per tile; what theirs adds is the zone tags. Worth
knowing before anybody makes the block competitions in fact as well as in name.

### Our blocks are modelled on the MSG+/YES page, not the welcome page

Chasing one title — "See what's live in your area" — found it on a component
type none of the eight welcome pages draws, and pulled the rest of our
"missing" blocks out with it.

That title belongs to **`ZipCodeCheck`**, which lives on its own slugs:
`zipcode` (root config `RSN || Only ZipCode`, US, Live) and `msgplusyes`
(`US || MSGPlusYes Page`, US, Live). A third copy, filed
`US || Welcome || Zip code checks`, is linked by no root config at all — an
entry somebody made and nothing draws.

`?page=msgplusyes` gives thirteen components, four of which appear on no
welcome page:

| Component | Its title | Ours |
| --- | --- | --- |
| `ZipCodeCheck` | "See what's live in your area" | What's live |
| `ZipCodeAutoFill` | "Check everything looks right" | the postcode confirm |
| `TeamsRail` | "Your New York sports, one home" | the teams block |
| `SubscriptionProviders` | "Connect your TV subscription" | TV providers |

Which reframes the palette. It was not built against a generic welcome page at
all — it was built against this one, the RSN page, and that is why so much of it
had no counterpart in the eight markets read first.

**`TeamsRail` is the true counterpart of our teams block**, and the evidence is
better than anything the Spanish carousel offered. Seven `LPContentItem`
entries, each with `preTitle` and `title` — which is our city over our name —
a `backgroundImage`, and `localZoneTags`, the same zone tagging the RSN team
list uses. Its heading even reads the way ours does. `CompetitionCarousel` was
adopted on the job the row does; `TeamsRail` matches the row, its fields and its
contents.

### Outside the area is an error, not a component

There is no production component for it, and the reason is worth knowing: the
out-of-area answer is a **state of an input**.

Two `LPInputField` entries exist in the whole space, both inside
`RegionalBlacklistTeams` — the blackout-restrictions block. Each carries
`label`, `placeholder`, `startIcon`, `errorIcon`, `inputVariant`,
`shouldShowInputField`, and an `errorLabel` saying, in substance, that the code
typed is either invalid or has nothing associated with it.

So the live shape is: a component asks, its input holds the message for a code
that fails, and the failure is shown in place. Ours draws that failure as a card
of its own with a heading, a notice and a way out. That is a design decision
rather than a missing block, and it is the third piece of the zip journey to
come out this way — `ZipCodeCheck` asks and `ZipCodeAutoFill` confirms, both
real components; the refusal is a string.

`RegionalBlacklistTeams` is worth a note of its own. It is not our Outside the
area: it is a blackout checker, MLB and MSG, asking for a code to say what is
restricted where. Nothing here draws it.

### Every component type in the space

3,146 `LPContentGroup` entries carry 70 distinct `componentType` values. The
ones any of this matters to, by how many entries use them:

```
925 Banners          499 ContentTiers      178 SpotlightRail    163 ExperienceFeature
123 BoxedHeroBanners 116 FAQs              107 FreemiumBanner   107 TermsAndConditions
 96 StandardRail      81 SubscriptionsRail  73 SectionFeatures   67 SupportedDevices
 65 ComingUpRail      64 CompetitionCarousel 63 Footer           46 IntroductionBanner
 37 ArticlesRail      23 TeamsRail          23 ShowsRail         21 Features
 20 RedeemPage        16 StickyPpvHeader    15 PlansHeroBanner   14 PlayersRail
 14 PromoBanner       13 AnnouncementBanner 13 DeviceGraphic     12 LPScheduleCarousel
```

and a long tail of ones and twos — `Breather`, `StickyHeader`, `Countdown`,
`SubscriptionComparison`, `ZipCodeBreather`, `ZipCodeAutoFill`, `ZipCodeCheck`,
`RegionalBlacklistTeams`, `Map`, `AboutUs`, `LiveChats` and thirty more.

Two things to take from it. The welcome pages show a fraction of what exists —
this palette's counterparts are spread across campaign, RSN and B2B pages. And
the tail is where the specific things live: our three zip components are 3, 3
and 4 entries each, against 925 `Banners`.

### The places block is ShowcaseSquareRail

Searched by its heading rather than guessed: `ShowcaseSquareRail` has two
entries in the space and one of them is titled the same as our block's, with
six cards where ours has its places. Its cards are `LPShowcaseCard` —
`label`, `backgroundImage`, `showGradient`, `textvariant` — which is a picture
with a word over it, and ours as well. The other is a set of nations.

Both are World Cup 26 content, which is where our block's own copy comes from —
its overline, its heading and the line under it are that entry's word for word.

**No tabs on it.** The group carries nothing tab-shaped, and nothing filters the
row: all six cards are scrolled through. What each card has instead is a
`label` — a country, drawn as a pill on the card rather than as a control over
it, and empty on the sibling entry. So our tabs are ours, sitting on top of a
component that has none.

### Two of ours are designs production has not built

**Match list** and **Feature cards** turn up nothing. Their headings, their
counts, their distinctive phrases: no `LPContentGroup` and no `LPContentItem`
carries them. The nearest to the match list is a `PromoBanner` about the World
Cup that mentions the same number of matches, and the nearest to the feature
cards is a run of boxing bundles that share a couple of words.

Which is a reasonable place for a design tool to be: both came from Figma, and
a component nobody has built yet has nothing to be matched against. Worth
keeping apart from the blocks that do have a counterpart, because the two look
identical from inside the palette.

### Our two zip answers share a heading

Not a production question, an ours question, and it is why the area block is
hard to place. `ZipCodeCheck` and Outside the area ship with the *same* title.
The live one's is the production string, word for word. The area block then
carries it again over a line about entering a code, a notice refusing a
particular code, and a way out.

So the block reads as a question in its heading and an answer in its body. The
live page does not do this: it asks once, and the refusal is the input's
`errorLabel`. Whatever is decided about that, the two blocks should not open
with the same sentence.

### Four of ours have no production name at all

`Outside the area`, `Text block`, `Match list`, `Feature cards`. Bundles and
Choose the plan had none either, and no longer need one: they belong to the
acquisition flow rather than to a landing page.

And the four are not one kind of thing. `Match list` and `Feature cards` are
designs production has not built. `Outside the area` is not a component
anywhere — the live page shows a refusal as an input's `errorLabel`. Only
`Text block` is unexamined.

Three others looked that way from the welcome pages and were not: the blocks now
called `ZipCodeCheck`, `TeamsRail` and `SubscriptionProviders` are drawn on the
RSN slugs instead.

Not the same as "not in production". Only the `welcome` slug was read, and the
CMS holds hundreds of others — `boxing`, `ppv-bundle`, `nfl`, `msgplus`,
`sports`, a long tail of campaign pages. Several of these are RSN or PPV
components and would be expected to sit on those. Establishing that is a matter
of reading another slug, which the route already takes as `?page=`.

### The gap is not blocks. It is fields

A count of names cannot see this, and the fold in the panel reports 12 of 12
for a market whose page we could not reproduce. What is thin, and where:

**Everywhere a picture appears.** `AdaptiveImage` carries `default`, `web`,
`tablet`, `mobile` and `livingRoom`. We carry one image and let the page scale
it. Every crop somebody art-directed is lost on the way in and invented on the
way out.

**Everywhere a button appears.** `navigationType`, `navigationChapterName`,
`navigationLink`, `scrollAction`, `entitlementSetId`, `buttonTrackingId`,
`freeTrialLabel`, `mobileButtonLabel` — against our one string of label text.
We hold what a button says and nothing about where it goes.

**Anywhere a price is quoted.** `showPrice` with a `billingPeriod` and an
`entitlementSetId`, and an `offerLabel` written around a `{price}` placeholder
filled in against the offers service. Nothing here binds a price to an
entitlement. This is the single largest capability we lack, and it turns up on
`ContentTiers`, `FreemiumBanner` and `IntroductionBanner` alike.

**Per component**, the ones established so far:

| Block | Short by |
| --- | --- |
| `ContentTiers` | 44 fields on `en-GB`'s tier items against our heading and a line; the rest lives in the Subscription screen |
| `FreemiumBanner` | `showBadge` and its text, a `features` list, `showHighlightedBorder` |
| `IntroductionBanner` | not full-bleed, does not rotate (`carouselInterval`), no price |
| `CompetitionCarousel` | a circle against our rounded square, a sentence against our city over a name, `isHighlighted` against our colour — and ours is keyed by team |
| `SupportedDevices` | 16 entries against our thirteen on-and-off toggles |
| the rails | `railId` **and** `railParams` against our one Rail ID string |

**And the two models target differently.** Theirs is three lists on an entry —
`pages`, `includedCountries`, `environment` — intersected. Ours is a base with
market layers over it. Ours can say "Spain differs from the base in one field";
theirs cannot. Theirs can say "this entry is for these four countries and this
audience"; ours cannot. They do not round-trip.

### So where the work is

Not in building blocks. Sixteen of seventeen exist, and the seventeenth is one
market's PPV bar. The work is in what a block can hold: a picture per
breakpoint, a button that knows its destination, and a price that comes from
the offer rather than from typing.

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

**The second `SubscriptionsRail`** is used as a distinct band rather than as a
duplicate of the first, which our copies are.

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
