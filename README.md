# Acquisition

The DAZN Acquisition plan picker, implemented from Figma
[🚀 Acquisition for ai → "Card for AI"](https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=59-2307).

React + Vite + TypeScript. Styling is plain CSS resolved entirely through the
DAZN foundation tokens in [`src/tokens/tokens.css`](src/tokens/tokens.css) —
no hardcoded colours, spacing or type sizes in component styles.

## Run it

```bash
npm install
npm run dev          # the plan picker at http://localhost:5173
npm run storybook    # the components in isolation at http://localhost:6007
npm run build        # type-check + production bundle
```

## What's in here

### The large component

[`AcquisitionCard`](src/components/acquisition/AcquisitionCard.tsx) is the plan
card users choose from. It composes every small component below and covers the
four Figma variants:

| Variant | Ultimate | Discount | Add-on | Competitions |
| --- | --- | --- | --- | --- |
| 1 | ✅ gold edge + eyebrow | ✅ | Included | one row |
| 2 | — | ✅ | Included | one row |
| 3 | — | — | — | two rows |
| 4 | ✅ gold edge + eyebrow | — | — | two rows |

### The small components

| Component | Figma | Variants |
| --- | --- | --- |
| [`CardHeader`](src/components/acquisition/CardHeader.tsx) | `CardHeader` | Device × Ultimate |
| [`Pricing`](src/components/acquisition/Pricing.tsx) | `Pricing` | Device |
| [`PlanCta`](src/components/acquisition/PlanCta.tsx) | `ButtonLabelEyebrow` | Ultimate × Discount × Device |
| [`LogoTiles`](src/components/acquisition/LogoTiles.tsx) | `Subscription Plan Logo Tile` | Rows = One \| Two \| Two +x |
| [`AddOn`](src/components/acquisition/AddOn.tsx) | `Add-On` | Type × Device |
| [`Feature` / `FeaturesList`](src/components/acquisition/Features.tsx) | `Feature`, `FeaturesList` | Device |

Supporting primitives — [`Button`](src/components/Button.tsx),
[`Toggle`](src/components/Toggle.tsx) and [`Icon`](src/components/Icon.tsx) —
live one level up in `src/components`.

The `device` prop carries the Figma `Device` variant (`mobile` · `desktop` ·
`xl`, the "Extra big" breakpoint) and is passed down from the card to every part.

## Rules & logic

The card is governed by an agreed spec, encoded as data in `src/rules` rather
than kept as a document -- switches are authored, everything else is derived,
and the set-level rules can block a publish. Markets and campaigns carry sparse
overrides resolved by specificity, and validation runs across every context.
See **[RULES.md](RULES.md)**.

## Editing content

The left pane is the authoring surface: only fields the spec marks as **authored**
appear as inputs. Derived and static values are listed read-only underneath, so
an editor can see what a switch produced without being able to contradict it.

The right pane renders the set through the same rules layer the product would,
with a publish gate that turns red when a rule fails.

- **Saves as you type** to `localStorage` under `acquisition-card-set`.
- **Export / Import JSON** moves a set between browsers or into the repo.
- **Reset** restores the default set.

Bundled artwork is stored **by id**, never by URL -- Vite fingerprints asset
URLs at build time, so saved content referencing a URL would break on the next
deploy. Imported content is merged over the defaults, so files saved by an
older version still load.

## Themes

The section is designed dark, and dark is the default. Component colours resolve
through tokens, so setting `data-theme="light"` on the root renders legibly (the
Storybook toolbar has a switch for it) — but Figma only specifies dark values for
this section, so light is a sensible fallback rather than a signed-off design.
The brand gold is fixed across themes, and so is the ink on it
(`--color-on-brand-gold`).

The demo app exposes only the `Device` control, matching the Figma variant axis.

## Code Connect

Each component ships a `*.figma.ts` template mapping it back to its Figma node.

```bash
npm run code-connect:check
npm run code-connect          # publish
```

## Assets

Fonts, icons and team badges are committed under `src/assets`. The badges and
the add-on thumbnail were exported from the Figma file; the icons come from the
DAZN icon set and paint with `currentColor`.
