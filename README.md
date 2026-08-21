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

A draft of the sign-up journey rules — steps with selectors, and the open
questions the Figma file cannot answer — is in **[JOURNEY-RULES.md](JOURNEY-RULES.md)**.

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

## Shared content

Content lives in `public/content/card-set.json`, committed to this repository.
Everyone who opens the app fetches that file, so a PM and a product owner see
the same thing without passing a file between them.

Local edits are never overwritten by it. When the two differ the local copy
stays on screen and the app offers the choice.

**Publishing without any setup** — Export JSON from the editor, replace
`public/content/card-set.json`, commit. The deploy makes it the shared copy.

**Publishing from the app** — set `GITHUB_TOKEN` on the Vercel project (a token
with `contents:write` on this repo) and a **Publish** button appears, which
commits the file for you. Optional overrides: `GITHUB_REPO` (`owner/name`),
`GITHUB_BRANCH`, `CONTENT_PATH`.

A publish sends the file's sha along with it, so if someone else published
first the write is refused rather than silently overwriting their work.

`scripts/seed-content-file.sh` regenerates the file from the shipped defaults.
It discards whatever is published, so it is for a fresh start only.

## Content assistant

`/api/assistant` proxies the Anthropic Messages API so the key stays on the
server. Set `ANTHROPIC_API_KEY` on the Vercel project and the panel appears;
without it the panel says so rather than looking broken. `ANTHROPIC_MODEL`
overrides the default.

The model is given the current content and the rules that govern it — the
two-line description budget, one Ultimate per set, features as catalogue ids,
prices as commercial facts it must not invent. It answers with prose, a
proposal, or both.

**It cannot change anything.** A proposal comes back as a list of specific
edits, shown against what is there now, and applying it is a separate click.
Applied changes go through the same store methods the form uses, so a
market-scoped edit becomes an override exactly as a typed one would — and the
publish gate then checks it across every market.

**It sends content to Anthropic.** Every request includes the current content
set. That is a data-sharing decision for the team to make deliberately, not a
technical detail: don't set the key until someone has agreed to it.
