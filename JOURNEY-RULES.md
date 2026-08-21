# Sign-up journey — rules & logic (DRAFT)

Drafted from the Figma file
[`MSG+ Sign-up journeys`](https://www.figma.com/design/G636wazyXWJgDtBb0MWDza/-Copy-for-Alex---ai-project--MSG--Sign-up-journeys)
and the code in [`src/rules/journey.ts`](src/rules/journey.ts).

**Nothing here is agreed** except where marked. The card spec it mirrors states
*"every rule below was agreed explicitly"* — this document is a first pass for
you to accept, correct or throw out. Rules marked **?** are ones I could not
settle from the file alone.

## What is modelled

All five families are now built from the frames rather than summarised. Every
screen count below was reconciled against its Figma section, and is re-checked
on each dev boot — the model fails to start if it drifts from the file.

| Family | Section | Journeys | Screens | Shows the card? |
| --- | --- | --- | --- | --- |
| Landing page | `2350:75321` | 4 | 65 | yes |
| Logged out new users | `2362:179952` | 4 | 58 | yes |
| Logged in DAZN customer | `2362:250798` | 3 | 33 | yes |
| Migration | `2398:41587` | 4 | 36 | **no** |
| Adobe TVE | `2518:495931` | 4 | 34 | 1 of 4 |
| **Total** | | **19** | **226** | |

**7 of the 19 drawn journeys never render the Acquisition card.** Migration
moves an existing subscription and TVE takes entitlement from a TV provider —
neither is a purchase. That is worth knowing before anyone plans work in terms
of "the acquisition flow".

A twentieth journey, `movistar-partner`, is modelled but not in this file: it
belongs to a partner storefront, not to MSG+.

## The rules

Numbered in the order they were settled, not the order they appear.

| | | |
| --- | --- | --- |
| [J-1](#j-1--the-chosen-plan-carries-through-derived-not-re-authored) | The chosen plan carries through | derived, not re-authored |
| [J-2](#j-2--a-step-may-not-be-reordered-past-its-runtime-gate) | Runtime gates bound reordering | |
| [J-3](#j-3--regional-steps-follow-entitlement-not-language) | Regional steps follow entitlement | not language |
| [J-4](#j-4--price-is-shown-by-the-journey-owned-by-billing) | Price is shown by the journey | owned by billing |
| [J-5](#j-5--consent-is-a-market-rule-inside-a-step-not-a-step) | Consent lives inside a step | |
| [J-6](#j-6--the-entry-cta-seeds-the-journey) | The entry CTA seeds the journey | |
| [J-7](#j-7--interrupts-are-not-journeys) | Interrupts are not journeys | |
| [J-8](#j-8--step-order-belongs-to-the-journey-not-to-the-step) | Step order belongs to the journey | |
| [J-9](#j-9--identity-is-a-seed-and-absence-is-worth-recording) | Identity is a seed | absence is worth recording |
| [J-10](#j-10--migration-is-not-acquisition) | Migration is not acquisition | |
| [J-11](#j-11--entitlement-has-more-than-one-source) | Entitlement has more than one source | |
| [J-12](#j-12--the-model-may-run-ahead-of-the-file-but-must-say-so) | The model may run ahead of the file | but must say so |
| [J-13](#j-13--a-journey-runs-where-it-runs) | A journey runs where it runs | |

---

## 0 · Four journeys, one per entry CTA — ANSWERED

The section holds four sub-sections, all named
`New logged out user - Zip Code auto detected`. They are **four journeys**, each
starting from a different CTA on the landing page. The first frame of each
section is the landing page showing the section that CTA lives in.

| Section | Entry CTA | Landing section | `Plans` | `Zipcode` | Seeds |
| --- | --- | --- | --- | --- | --- |
| `2350:75322` | Sign up | Hero | 3 | 3 | — |
| `2350:80514` | Check Your Market | Market checker | 3 | 1 | `zip` |
| `2350:85706` | Get Ultimate | Features / Ultimate | 2 | 1 | `zip`, `tier` |
| `2350:90898` | Get MSG+ | Plans / pricing | 1 | 1 | `zip`, `plan` |

The differing frame counts are not prototype fidelity — they are **what the CTA
already knows**. Evidence from the landing frames' own text: `2350:80514` carries
*"You're covered in 10001"* and team names; `2350:85706` carries *"Get Ultimate"*
and *"Ultimate only"*; `2350:90898` carries *"Get MSG+"*, `Standard / Ultimate`
and `$29.99`.

### J-6 · The entry CTA seeds the journey

```
seeds = what the CTA already carries

zip    → the ZIP step is skipped, not removed — its value still flows on
tier   → the plans step narrows, it does not disappear
plan   → the plans step is skipped entirely
```

**A step disappears for two different reasons, and they must not be conflated.**

| Reason | Meaning | The value |
| --- | --- | --- |
| `not-applicable` | Never exists here — ZIP outside the US | absent downstream |
| `seeded` | Already captured by the entry | **still flows downstream** |

Drop a seeded step without carrying its value and the journey loses the plan the
user just chose. This is `knownAt()` in the code: what any step may treat as
inbound, whether seeded by the entry or captured earlier.

### Asked, narrowed, skipped

A third state sits between asked and skipped. *Get Ultimate* pre-selects the
tier but the plan is still chosen — so the step **narrows** rather than
vanishing, which is exactly why Figma draws two Plans frames there and not one.

**? Open question 1 (new).** Does *narrowed* mean the other tier is hidden, or
merely deselected? Hiding it removes an upsell path; deselecting keeps it. The
frames cannot tell me which.

---

## 1 · Steps versus states

The Figma line draws each interaction state as its own frame. Most are not
separate steps:

| Frames drawn | Actually |
| --- | --- |
| `Complete Account – Empty`, `– Filled`, `– Filled` | One step, three form states |
| `Checkout` × 4 | One step: summary → card entered → processing → paid |
| `Zipcode` × 1–3 | One step: empty → entered → teams resolved |
| `Plans` × 1–3 | One step, asked / narrowed / skipped by the entry seeds |

**Rule J-0 · A step's states are runtime, not authored.** Form validity, payment
progress and geo results are facts the product discovers. They must never be
authorable, or someone will publish a journey stuck in "processing".

**? Open question 2.** The third `Plans` frame in the longest section appears to
be `Choose how to pay` (billing cadence). I have drafted cadence as a **separate
step** because it asks a different question. If it is one screen with two
sections, fold it into `plans`.

## 2 · The journey

Each journey is an ordered list of steps with selectors, plus the seeds its
entry carries. Omitted selector keys are wildcards — the same model the card
overrides use.

| # | Step | Figma frame | Selector | Captures | Runtime gate |
| --- | --- | --- | --- | --- | --- |
| 10 | Landing | `MSG+ - Landing page - Mobile` | all | — | `auth.signedOut` |
| 20 | Choose your subscription | `Plans` | all | `plan` (narrowed by `tier`) | — |
| 30 | Choose how to pay | `Plans (payment-options)` | all | — | — |
| 40 | Log in or sign up | `Create` | all | — | `auth.signedOut` |
| 50 | Finish signing up | `Complete Account` | all | — | `form.valid` |
| 60 | Confirm your ZIP code | `Zipcode` | `market = US` | `zip` | `geo.zipKnown` |
| 70 | Checkout and payment | `Checkout` | all | — | — |
| 80 | Ready to watch | `Credit card - zip code verified` | all | — | `payment.succeeded` |
| 90 | Home | `mobile-hero-native` | all | — | — |

Resolved in the US: Hero 9 steps, Check Your Market 8, Get Ultimate 8 (with
`plans` narrowed), Get MSG+ 7. Outside the US every count drops by one, since
`zip` is not applicable. Those numbers match the frames drawn in Figma.

## 3 · Journey-level rules

These are the equivalent of the card's S-rules — a single step cannot evaluate
them alone.

### J-1 · The chosen plan carries through, derived not re-authored

```
plan = selection made at step 20

step 30  cadence options       → priced from plan
step 50  account confirmation  → "…for {plan}"
step 70  order summary         → plan name, price, term
step 80  ready state           → "You're ready to watch {plan}"
```

This is the card's *"one value, three surfaces"* at journey scale. Author the
plan name once; every later screen substitutes it. Get this wrong and someone
buys Ultimate and reads "Standard" at checkout.

### J-2 · A step may not be reordered past its runtime gate

```
auth      before  account
account   before  checkout
checkout  before  ready
zip       before  checkout        (US — it determines availability)
```

Order is configurable **within** these constraints, not across them. A CMS that
lets someone drag `ready` above `checkout` is a CMS that ships a broken funnel.

### J-3 · Regional steps follow entitlement, not language

`zip` exists because US regional blackouts and team availability depend on it —
not because the market speaks English. Selector is `market = US`, and it should
extend by *entitlement rule*, never by locale.

### J-4 · Price is shown by the journey, owned by billing

The plans step shows a price; the checkout step charges one. They must agree,
and the CMS must not be the thing that guarantees it. Copy and formatting are
authored; the amount resolves from the pricing service.

**? Open question 3.** The card model currently authors `standardPrice` and
`introPrice` as numbers. That is right for a prototype and wrong for production.
Where does the real number come from?

### J-5 · Consent is a market rule inside a step, not a step

The EU consent toggle sits on `Finish signing up`. It is a within-step
conditional, not a journey step, so it belongs to that screen's own rules.

**? Open question 4.** Are there markets where consent must be its own screen
for legal reasons? That would make it a step and change this rule.

### J-8 · Step order belongs to the journey, not to the step

Modelling "Logged out new users" (2362:179952) proved this. Starlink asks for
the ZIP **before** showing plans; the browse-hero and RSN-tile journeys ask for
it after the account is made. Same step, same screen, different position.

So a journey names its steps in order and `order` is assigned from position.
Reordering is moving an id in a list — never renumbering, which is the mistake
the feature list used to make.

This does not loosen J-2: a journey may order its steps freely, but not past a
runtime gate. Starlink can ask the ZIP early because nothing it needs is gated
on it; no journey can put Checkout before the account exists.

Two more findings from that section, both of which would have been invented
wrongly if guessed:

- **Paywall sits after Home**, not before it. Skipping payment still lands you
  on the product; the block happens on play.
- **The RSN-tile journey has two entry screens** — the landing page, then the
  catalogue grid the team tile is pressed from.

Screen counts reconcile against the section: 15 / 16 / 15 / 12, 58 total.

---

### J-9 · Identity is a seed, and absence is worth recording

"Logged in DAZN customer" (2362:250798) has no `Create` and no `Complete
Account` frame anywhere in it. Being signed in is not the anonymous flow with
different copy — two screens stop existing. The counts show it: 12, 12 and 9
against the anonymous 15–16.

So `auth` and `account` join `zip`, `tier` and `plan` as seeds. They are two
seeds rather than one because a TVE user is authenticated by their provider
without having completed a DAZN account.

Both steps stay in the journey's list, marked skipped, rather than being
deleted. The rendering is identical either way; what deleting loses is the
reason. The step picker shows them greyed and tagged — "Sign up · seeded" —
which answers "why is there no sign-up screen here" without opening Figma.

**The first two journeys have identical step lists.** They are drawn twice
because a free registered user and a paying subscriber see different prices and
different upgrade framing — a content difference, not a flow difference. That is
what market overrides already do for the card, and it is the same shape.

---

### J-10 · Migration is not acquisition

"Migration journeys" (2398:41587) contains no `Plans`, no `Zipcode`, no
`Create` and no `Checkout` frame — none, in any of the four. The Acquisition
card never renders in this family.

That is an absence, which is stronger evidence than a summary would be: nobody
had to decide these were confirmation flows, the frames simply do not contain a
purchase. What is being moved is an existing subscription, so the plan, the
tier and the ZIP arrive already settled — seeded by the migration itself.

**Three of the four begin in an email.** `Subscription start confirmation` is a
real entry surface, and it means the first thing a migrating subscriber reads is
content this tool cannot currently edit. If migration copy is ever in scope,
that email is where it starts, not a screen.

The fourth, `organic`, is the only one that signs in for real, and the only one
that ends at Home with no confirmation screen.

**? Open question 5.** Who owns the migration email today, and does it need to
carry the plan name — which would make it the first place a tier's content is
read, ahead of every screen.

---

### J-11 · Entitlement has more than one source

"Adobe TVE" (2518:495931) is the second family with no purchase in it. Three of
the four journeys contain no `Plans` and no `Checkout` frame: the user proves a
TV-provider subscription and the entitlement follows. The Acquisition card
renders in exactly one of the four.

Counting migration, **7 of the 19 drawn journeys never show the card at all.**
That is worth knowing before anyone plans work in terms of "the acquisition
flow" — most of the flows in this file are not one.

TVE is also what forced `auth` and `account` apart (J-9). A returning TVE user
is authenticated by their provider and already has an account; a new one
authenticates the same way but must still build one — which is why `Create` and
`Complete Account` appear in the two "new user" journeys and nowhere else in the
section.

**The counts are now checked, not remembered.** Each journey declares the number
of screens its Figma section draws, and the dev boot fails if the model no
longer matches. A step quietly dropped still renders a plausible journey, which
is the drift hardest to notice by looking.

That check immediately found one error — in the summary card on the TVE section,
which claims 8 screens for "Existing user with TVE". The section holds 7 screens
and one stray `<line>`. The model is right; the label is not.

---

### J-12 · The model may run ahead of the file, but must say so

`Migration — organic` now ends on a confirmation screen. The other three
migration journeys confirm before handing over to Home; organic dropped straight
to Home, which left a migrated subscriber with nothing telling them the move
worked.

Figma does not draw that screen. Rather than quietly adjusting the declared
count to match — which would turn `figmaScreens` from "what the section draws"
into "whatever we last agreed" — a step can be marked `proposed`.

A proposed step renders and is editable like any other, carries a dashed marker
in the picker so it never reads as final, and is excluded from the Figma
reconciliation. So the organic journey renders 9 screens, reconciles as 8, and
the check still passes for the right reason.

`proposedSteps()` lists everything currently ahead of the file — the delta to
hand back to design.

---

### J-13 · A journey runs where it runs






Not every journey exists everywhere. A partner storefront has its own flow, and
a market may have its own purchase path.

`Journey.when` selects on market and channel, the same way a step selector and a
card override already do. Omitted keys are wildcards, so a journey with no
`when` runs everywhere — which is the common case.

Prefer scoping by **channel**, not market. A storefront belongs to its countries
(`ChannelConfig.markets`), so a Movistar journey is Spanish by construction.
Saying `market: 'ES'` as well states the same fact twice, and the two can drift.
Reach for `market` only when a *direct* journey genuinely differs.

The pickers narrow to match, and a storefront that does not operate in the
selected market cannot be selected at all. That is deliberate: a PM reviewing
German content against a Movistar flow would see nothing wrong.

---

## 4 · Per-screen draft


Each screen gets the card's treatment: what is authored, what is derived, what is
static, and what is runtime.

### 10 · Landing

| | |
| --- | --- |
| **Authored** | Hero headline, subheading, CTA labels, legal footnote |
| **Derived** | Available teams from the ZIP, once entered |
| **Static** | "Sign in with TV provider" |
| **Runtime** | `auth.signedOut` — signed-in users skip to the product |

ZIP entry appears here **and** at step 60. **? Open question 5:** is step 60 a
confirmation of what was captured here, or a fallback when it wasn't? The
section name says *"Zip Code auto detected"*, which suggests geo-IP fills it and
step 60 confirms. If so, step 60's real selector is
`market = US AND geo.zipKnown`, and a separate journey exists for
`geo.zipUnknown`.

### 20 · Choose your subscription

The Acquisition card set — already specified in [RULES.md](RULES.md). The tabs
above it (`Standard` / `Ultimate`) are a filter over the set, not part of a card.

**? Open question 6.** Do the tabs change which cards render, or which plan is
pre-selected? That decides whether tab state is a set-level rule or a step-level one.

### 30 · Choose how to pay

| | |
| --- | --- |
| **Authored** | Option labels, the savings message |
| **Derived** | Annual total from the monthly price; the saving between cadences |
| **Static** | — |
| **Runtime** | — |

Same derivation discipline as the card: the annual figure is computed from the
monthly one, never typed, or the two will eventually disagree.

### 40 · Log in or sign up

| | |
| --- | --- |
| **Authored** | Heading, body copy |
| **Static** | Provider names |
| **Runtime** | Which providers are available per platform |

Owned by the auth team. This journey references it; it does not specify it.

### 50 · Finish signing up

| | |
| --- | --- |
| **Authored** | Field labels, consent copy, password requirements copy |
| **Derived** | Validation messages |
| **Static** | — |
| **Runtime** | `form.valid`, field-level validation, the three form states |

Consent visibility is a market rule (J-5).

### 60 · Confirm your ZIP code

| | |
| --- | --- |
| **Authored** | Heading, explanatory copy |
| **Derived** | The team badges the ZIP unlocked |
| **Runtime** | Geo lookup, ZIP validity, team resolution |

Selector `market = US`, subject to Open question 5.

### 70 · Checkout and payment

| | |
| --- | --- |
| **Authored** | Section headings, promo-code label |
| **Derived** | Order summary lines, totals, next payment date |
| **Static** | Terms and conditions link text |
| **Runtime** | Payment processing, card validation, decline handling |

**Owned by payments, not by this CMS.** The Figma component already exposes
optional rows as slots — `Table item 2`, `Table item 3`, `Promo` are drawn
hidden. Those are outputs of the order, exactly like the card's show-properties,
and must not become authorable toggles.

### 80 · Ready to watch

| | |
| --- | --- |
| **Authored** | Headline, body copy, CTA labels |
| **Derived** | Plan name (J-1), the teams unlocked |
| **Runtime** | `payment.succeeded` |

### 90 · Home

Outside the acquisition journey. Included in the Figma line for context; it
should probably not be a step at all.

**? Open question 7.** Where does the journey formally end — at `ready`, or at
first playback?

---

## 5 · Scope

**Answered — we own all nine.** My guess that ownership would cut the work from
nine screens to four was wrong. It doesn't; the work is nine.

Two consequences worth keeping in view:

- Owning the checkout **screen** is not the same as owning the card **fields**,
  which are normally the payment provider's embed. What is authorable there is
  the copy around the embed, not the embed.
- J-4 still stands. However much of the screen is ours, the amount shown must
  resolve from the pricing service, not from a copy tool.

---

## 6 · What the code does today

[`src/rules/journey.ts`](src/rules/journey.ts) implements the model:

- `Step` carries `order`, an optional `when` selector, its `states`, and the
  `requires` runtime conditions — the last as documentation, deliberately not
  evaluated, so the config/logic boundary stays visible.
- `resolveJourney(journey, context)` returns the ordered steps for a context.
- `excludedSteps` returns what was dropped and is shown in the preview.

Only `plans` renders a real component. The other eight are stubs carrying their
Figma frame, states and runtime gates, so the journey model is testable before
the components exist.

Verified: Ireland resolves 8 steps with *"Not in this context: Confirm your ZIP
code"*; the US resolves 9 and the card set simultaneously becomes `MSG+` at
`$29.99` through its market override. Step selection and content resolution use
the same context, and agree.

---

## 6b · The journey space

The landing-page CTAs are one axis among several. 📱 Mobile [Web] alone carries
**five journey families**; 💻 Desktop mirrors most of them; there are **seven
platform pages**.

| Family | Figma | User state | Variants |
| --- | --- | --- | --- |
| Landing page journeys | `2350:75321` | anonymous | 4 — the entry CTAs, modelled |
| Logged out new users | `2362:179952` | anonymous | 4 — browse hero, RSN tile, Starlink ×2 |
| Logged in DAZN customer | `2362:250798` | registered / paying / lower tier | 3 |
| Migration journeys | `2398:41587` | migrating | 4 — no payment method, CRM, TVE, organic |
| Adobe TVE | `2518:495931` | anonymous | 4 (5 on desktop) |

That is **19 journeys on one platform**, drawn again per platform — well over a
hundred flows in the file. Nobody builds a hundred flows. This is the argument
for configuration, in the design file's own hand.

### The real axes

Market and campaign are the *secondary* ones. The dominant axes are:

```
userState     anonymous · registered-free · paying-dazn · rsn-lower-tier · migrating
entrySurface  landing-cta · open-browse-hero · rsn-tile · msg-tile · tv-provider · crm-email · starlink
authPath      regular · tve-adobe · starlink
platform      mobile-web · tablet · desktop · tv-html5 · tv-android · tv-tvos · tv-roku
```

The good news: the **step vocabulary stays small**. Nearly every journey walks
the same steps — entry, plans, cadence, auth, account, zip, checkout, ready. What
differs is which are seeded away, which narrow, and which never applied. The
count multiplies; the components do not.

### J-7 · Interrupts are not journeys

Three sections hold loose frames with no sub-sections — **RSN Geolocation**,
**Streaming limit**, **New session blocking while travelling**. They are states
that can interrupt *any* journey, not steps within one.

Modelling them as journeys would be a category error and would multiply the
space again for nothing. They belong to a separate `Interrupt` type, keyed to
runtime conditions.

**? Open question 10.** Migration may not be a purchase journey at all — an
existing subscriber being moved is closer to a confirmation than a funnel. If
so it is a different journey *type*, not a variant, and it should not inherit
the plans or checkout steps.

**? Open question 11.** Do TV platforms change the steps, or only the layout?
ZIP entry on a remote and provider auth via a code are structurally different
interactions, which would make platform a step-level axis rather than a
styling one.

## 6c · Validation


### Where it predicted correctly

| Journey | Auth steps | Zip | Plans | Total |
| --- | --- | --- | --- | --- |
| Logged out — browse hero | `Create` + `Complete Account`×3 | 1 | **3** | 15 |
| Logged out — RSN tile | `Create` + `Complete Account`×3 | 1 | **2** | 16 |
| **Logged in — free registered** | **none** | 1 | **2** | 12 |
| **Logged in — paying DAZN** | **none** | 1 | **2** | 12 |
| **Logged in — RSN lower tier upgrade** | **none** | **none** | **1** | 9 |

Logged-in journeys drop `Create` and `Complete Account` **entirely** — auth is
seeded by the user state, exactly as J-6 predicts. The upgrade journey drops
auth, account *and* zip, and narrows plans to a single frame. Three independent
confirmations that frame counts encode what is already known.

### Three gaps the validation found

**1. A step my model doesn't have.** `Connect TV - dual screen` appears in the
RSN-tile and both logged-in journeys. It is a TV-pairing step, and it isn't in
the nine.

**2. Step order is per-journey, not universal.** Starlink runs
`Zipcode → Plans`, not `Plans → … → Zipcode`. So a journey is genuinely its own
ordered list; a shared list with selectors cannot express this. J-2's constraint
graph becomes load-bearing rather than theoretical.

**3. Entry frames vary, and one journey never reaches checkout.** Entries seen:
`Anonymous`, `Home of - MSG+`, `mobile-hero-native`, `Paywall`. And the second
Starlink journey ends at `Paywall` with **no Checkout at all** — either a
blocked path or an incomplete draft.

`mobile-hero-native` appears at both the start and the end of logged-in
journeys: the product is both where they come from and where they return.

**? Open question 12.** Is the second Starlink journey (no checkout, ends at
`Paywall`) a real blocked path, or an unfinished frame set?

## 7 · Decisions needed from you

**Answered so far**

| | | |
| --- | --- | --- |
| Q1 (original) | Four journeys, one per landing CTA | model rewritten |
| Q8 | **We own all nine screens** | no scope reduction — the work is nine, not four |
| Q9 | No more landing CTAs, but five journey families | space mapped |
| Q10 | Migration is *partly* purchase | varies per variant — needs splitting |
| Q11 | **Platform changes layout, not steps** | seven platform pages collapse to one model |

Q11 is the biggest simplification in this document: the drawn space drops from
well over a hundred flows to **nineteen**, with platform handled the way the
card already handles device.

**Still open**

1. Does *narrowed* hide the other tier, or merely deselect it?
2. Is `cadence` its own step or part of `plans`?
3. Where do real prices come from?
4. Does consent ever need its own screen?
5. Is the ZIP step a confirmation or a fallback — and is there a `geo.zipUnknown` journey?
6. Do the Standard/Ultimate tabs filter the set or preselect a card?
7. Does the journey end at `ready` or at first playback?
10b. **Which** migration variants are purchases? "Some of it" needs to become a list,
   because the purchase ones inherit plans and checkout and the rest do not.
12. Is the second Starlink journey (no checkout, ends at `Paywall`) a real blocked
   path, or an unfinished frame set?
13. **New.** `Connect TV — dual screen` isn't in the nine steps. Where does it belong,
   and which journeys require it?
