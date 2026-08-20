# Sign-up journey — rules & logic (DRAFT)

Drafted from Figma [`Landing page journeys`](https://www.figma.com/design/G636wazyXWJgDtBb0MWDza/-Copy-for-Alex---ai-project--MSG--Sign-up-journeys?node-id=2350-75321)
(node `2350:75321`) and the code in [`src/rules/journey.ts`](src/rules/journey.ts).

**Nothing here is agreed** except where marked. The card spec it mirrors states
*"every rule below was agreed explicitly"* — this document is a first pass for
you to accept, correct or throw out. Rules marked **?** are ones I could not
settle from the file alone.

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

Of the nine steps, acquisition plausibly owns **landing, plans, cadence and
ready** — four. `auth` belongs to identity; `account` is shared; `checkout` and
payment belong to billing with PCI constraints on the card fields; `home` is the
product.

**? Open question 8.** Which of these does your team actually own? Rebuilding
another team's screens in this tool would duplicate their product and their
rules. Confirming this before building components is the cheapest decision on
this list.

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

## 7 · Decisions needed from you

**Answered:** the four sections are four journeys, one per landing-page CTA.

1. Does *narrowed* hide the other tier, or merely deselect it?
2. Is `cadence` its own step or part of `plans`?
3. Where do real prices come from?
4. Does consent ever need its own screen?
5. Is the ZIP step a confirmation or a fallback — and is there a `geo.zipUnknown` journey?
6. Do the Standard/Ultimate tabs filter the set or preselect a card?
7. Does the journey end at `ready` or at first playback?
8. Which steps does your team own?
9. **New.** Are there other landing-page CTAs not drawn here? Each one is a journey,
   and the model only knows about the four in this file.
