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

`{ amount, currency }`, not `"€25.99"`.

The savings amount is a computed delta and the explainer repeats
`standardPrice` — both impossible from a formatted string. So is rendering
`19,99 €` for `de-DE` off the same authored value.

## Where the boundary sits

`src/components/acquisition` is presentation only: every value arrives already
decided. The rules live above it in `src/rules`, applied by
[`RuledCard`](src/card/RuledCard.tsx).

That split follows the spec's own framing — several rules depend on the other
cards in the set, and none of them belong to a single card.

## What isn't encoded yet

- Market / campaign overrides. The set carries one `locale`; there is no
  base-plus-differences resolution yet.
- The "All features & content" modal (§6) — three triggers, one entry state.
- Copy-length validation against the real rendered width, which is what would
  catch German feature rows truncating.
