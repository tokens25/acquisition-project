# Rules & logic

The card is governed by an agreed spec — *"Acquisition Card — Rules & Logic"* —
encoded as **data** in [`src/rules`](src/rules) rather than kept as a document.
A document can't stop someone publishing two Ultimate cards. A rule file can.

| File | Role |
| --- | --- |
| [`content.ts`](src/rules/content.ts) | Authored values only. If something can be computed, it is deliberately absent |
| [`derive.ts`](src/rules/derive.ts) | Everything else: switch outputs, Plan Name substitution, price explainer, savings delta, logo rows and overflow |
| [`validate.ts`](src/rules/validate.ts) | Rules that can block a publish, including the set-level S-1 |
| [`spec.ts`](src/rules/spec.ts) | The authored / derived / static table, plus the Figma properties the mapping deliberately drops |

One source, three uses: the spec decides which inputs the editor offers, the
derivations decide what renders, and the validators decide whether publishing is
allowed.

## Why invalid states are unreachable

`Ultimate` and `Discount` are **switches**, each driving several outputs that
must move together (§3). Those outputs are computed, never passed, so a gold
stroke with a white CTA — or a badge without a stroke — cannot be expressed by
the API at all.

The same applies to content (§7). The CTA label, `"Included in X"`, the struck
price, the price explainer, the savings figure, the `"+N"` tile and the logo row
count are all derived, so none of them can contradict the value sitting beside
them.

`"… more"` is a runtime overflow measurement taken after layout, never authored,
so a description can never ship pre-truncated.

## Show-properties are outputs, not inputs

Figma exposes `Show Crossed price`, `Show Extra info`, `Show bg layer`,
`Show Label/Eyebrow` and `Rows` because a designer toggles them by hand. They are
results of the switches, and they never reach the editor. An independently
settable strikethrough is how a card ends up striking a price identical to the
one beside it.

Figma also exposes **five** text slots for **two** values — three plan-name
slots and two description slots — which are responsive presentations of one
value each. The mapping collapses them, with size handled by CSS. Generating the
form straight from Figma's properties would ask an editor to type the plan name
three times.

## Set-level rules

S-1, S-2 and S-3 cannot be evaluated by a card looking at itself, so the set is
a first-class thing ([`CardSetView`](src/card/CardSetView.tsx)):

- **S-1** — at most one Ultimate card per set. A second one blocks publishing.
- **S-2** — one card wrapping to two lines pulls the whole set to two, capped
  there. Measured once across the set and shared down.
- **S-3** — every card renders at the tallest card's height.

## Prices are numbers

A plain amount in major units, e.g. `25.99` — not `"€25.99"`.

The savings amount is a computed delta and the explainer repeats
`standardPrice`; both are impossible from a formatted string. So is rendering
the same authored value as `25,99 €` in Germany and `£25.99` in the UK.

Currency is not authored either — see **Currency belongs to the market** below.

## Where the boundary sits

`src/components/acquisition` is presentation only: every value arrives already
decided. The rules live above it in `src/rules`, applied by
[`RuledCard`](src/card/RuledCard.tsx).

That split follows the spec's own framing — several rules depend on the other
cards in the set, and none of them belong to a single card.

## Market and campaign overrides

A card is authored once. Markets and campaigns carry **sparse patches** applied
in order of specificity, so you write a default and a dozen deltas rather than
one record per permutation.

```
base                  →  €25.99 / €34.99, 3 months
{ market: DE }        →  standardPrice 39.99, introPrice 29.99
{ campaign: wc26 }    →  introMonths 6
{ market: DE, wc26 }  →  introPrice 24.99
```

Resolution ([`resolve.ts`](src/rules/resolve.ts)) collects every override whose
selector matches, sorts by **specificity** — the number of constraints — then by
an explicit `priority`, then declaration order, and merges in that sequence.
The last two make the outcome deterministic: two equally specific overrides must
never depend on which happened to be evaluated first.

Omitted keys are wildcards, so `{ campaign: 'wc26' }` applies in every market.
A market with no override of its own inherits the base entirely — Italy renders
the base values in Italian formatting, with nothing authored for it.

### Currency belongs to the market

Not to the card. `MarketConfig` carries `locale` and `currency`, so a card
cannot hold a currency that contradicts the market rendering it, and the same
authored `29.99` renders as `29,99 €` in Germany and `£29.99` in the UK.

### Editing follows the context

Pick a market and the form edits **that market's difference from the base**;
pick "Base — all markets" and it edits the base. Only changed fields are stored,
and the panel lists exactly which ones differ here.

### Validation covers every context, not the visible one

[`validateAll`](src/rules/validate.ts) resolves and checks all markets × campaigns
— 8 contexts in the default set. A break in one market's override blocks the
whole publish and names the failing contexts, because a market override can flip
a switch and trip a set-level rule that the market on screen never shows.

That is the coverage half of review: machines check the matrix, people review
what changed.

## What isn't encoded yet

- The "All features & content" modal (§6) — three triggers, one entry state.
- Copy-length validation against the real rendered width, which is what would
  catch German feature rows truncating in a `nowrap` column.
- Platform and user state as context dimensions; only market and campaign exist.
- Publishing itself — content lives in `localStorage` and exports as JSON;
  writing it to git is the next step.
