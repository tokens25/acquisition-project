# Naming — how to point at any part of the tool

A shared vocabulary. Say the **Name** and I know exactly what you mean; the
**Code** column is where it lives, so nothing gets misidentified.

Names are lower case in prose. "Make the **step tile** taller" is unambiguous;
"make the tile taller" is not, because there are three kinds.

---

## 0 · Routes

| Name | URL | What it is |
| --- | --- | --- |
| **index** | `/` | The front door — two links, nothing else |
| **demo 1** | `/demo` | The two-stage interface. Default subject of any request |
| **demo 2** | `/demo2` | The first iteration, kept for comparison |

Unqualified requests mean **demo 1**. Say "in demo 2" if you mean the old one.

---

## 1 · Shell — the frame everything sits in

| Name | Code | What it is |
| --- | --- | --- |
| **top bar** | `.demo__top` | The full-width row across the top. Never scrolls |
| **brand strip** | `.demo__brand` | Left half of the top bar: mark, title, beta chip, collapse control |
| **mark** | `.demo__mark` | The DAZN logo |
| **product title** | `.demo__title` | "Acquisition model" |
| **beta chip** | `.demo__beta` | The outlined BETA label |
| **collapse control** | `.demo__collapse` | The panel open/close button at the strip's right edge |
| **status bar** | `.demo__statusbar` | Right half of the top bar: gate on the left, actions on the right |
| **publish gate** | `.demo__gate` | "Publish ready — 36 contexts checked" |
| **action buttons** | `.demo__actions` | The button group at the far right |
| **body** | `.demo__body` | Everything below the top bar |
| **rail** | `.demo__rail` | The sliding track that holds the panel. What animates on collapse |
| **panel** | `.demo__panel` | The 360px left column. Scrolls independently |
| **preview pane** | `.demo__preview` | The right column. Scrolls independently |

## 2 · Action buttons

Named individually — they differ by stage.

| Name | Where | Does |
| --- | --- | --- |
| **preview button** | stage 1 | Hides the panel, gives the width to the preview |
| **export button** | stage 1 | Downloads the content as JSON |
| **settings button** | both | Disabled — no settings screen exists |
| **save button** | stage 2 | Publishes to the shared copy |
| **exit button** | stage 2 | Leaves edit mode |

---

## 3 · Panel, stage one

The panel before you open a step. Top to bottom:

| Name | Code | What it is |
| --- | --- | --- |
| **upload button** | `.demo__upload` | "Upload Spreadsheet or JSON" |
| **assistant** | `.as` | The whole assistant block |
| **assistant prompts** | `.as__empty button` | The three suggestion chips |
| **assistant input** | `.as__input` | The ask box |
| **proposal card** | `.as__proposal` | A returned set of changes, with its apply button |
| **context fields** | `.demo__fields` | The five dropdowns as a group |
| **user flow** | `.uf` | The step list with its heading |
| **flow row** | `.uf__row` | One step in that list |
| **flow dot** | `.uf__dot` | The status circle |
| **flow edit button** | `.uf__edit` | The pencil |
| **reset progress** | `.demo__reset` | The link at the foot |

### The five context fields

Name them by their label: **market**, **storefront**, **user status**,
**entry point**, **which one**.

---

## 4 · Panel, stage two

The panel once a step is open.

| Name | Code | What it is |
| --- | --- | --- |
| **breadcrumb** | `.demo__back` | The back chevron and journey — step line |
| **scope line** | `.demo__scope` | "IE · direct · Monthly Flex" |
| **field group** | `.demo__group` | One titled section |
| **group title** | `.demo__group-title` | Its heading |
| **feature row** | `.demo__feature` | One feature picker, plus its line when custom |

### The field groups

Name them by their title: **tiers**, **header**, **pricing**, **add-on**,
**competitions**, **features**.

**Tier pills** are the row inside the tiers group.

---

## 5 · Preview — journey overview

What the preview pane shows in stage one.

| Name | Code | What it is |
| --- | --- | --- |
| **frames row** | `.jf__row` | The horizontally scrolling row of everything |
| **row caption** | `.jf__caption` | "16 screens across 9 steps", the drag hint, the reordered chip |
| **step group** | `.jf__step` | One step and all its screens. What you drag |
| **step label** | `.jf__step-name` | Its name, state count and skip tag |
| **step tile** | `.jf__tile` | One screen |
| **tile number** | `.jf__num` | Its position in the flow |
| **thumbnail** | `.jf__thumb` | The rendered screen inside a tile |
| **frame name** | `.jf__frame` | The Figma frame, on tiles with no component |
| **state label** | `.jf__state` | "default", "alternate plan selected" |
| **skip tag** | `.jf__tag` | "seeded" / "not here" |
| **reordered chip** | `.jf__reordered` | Shown when the order differs from Figma |

## 6 · Preview — step view

What the preview pane shows in stage two.

| Name | Code | What it is |
| --- | --- | --- |
| **step meta** | `.jy__meta` | "step 2 of 9 · entered from…" |
| **viewport** | `.jy__viewport` | The screen the cards render inside. A phone on mobile |
| **stub** | `.jy__stub` | What a step with no component shows |

---

## 7 · The card

Top to bottom. These are the DS component names, so they match Figma.

| Name | Code | Figma |
| --- | --- | --- |
| **card** | `.acq-card` | AcquisitionCard |
| **badge** | `.acq-card__eyebrow` | Label/badge/Left — "BEST EXPERIENCE" |
| **card header** | `.acq-card-header` | CardHeader — plan name and description |
| **plan name** | `.acq-card-header__title` | |
| **description** | `.acq-card-header__description` | Including its "… more" |
| **card divider** | `.acq-card__divider` | Divider |
| **pricing** | `.acq-pricing` | Pricing — "Starts at", price, struck price, explainer |
| **plan CTA** | `.acq-plan-cta` | CTA 1 — the savings ribbon and the Get button together |
| **savings ribbon** | `.acq-plan-cta__eyebrow` | "Save up to €108 / year" |
| **logo tiles** | `.acq-logo-tiles` | Subscription Plan Logo Tile |
| **overflow tile** | `.acq-logo-tiles__tile--overflow` | The "+5" |
| **add-on panel** | `.acq-addon` | AddOn/Panel |
| **features list** | `.acq-features` | FeaturesList |
| **feature row** | `.acq-feature` | One line and its icon |
| **card footer** | `.acq-card__footer` | Button/CTA — "All features & content" |
| **card set** | `.acq-set` | The row of cards |

> **feature row** appears twice — in the panel and on the card. Say **panel
> feature row** or **card feature row** if it is not obvious from context.

---

## 8 · Design-system components

Shared, used in several places. Changing one changes everywhere.

| Name | Code | Notes |
| --- | --- | --- |
| **text field** | `TextField` / `.dz-field` | DS Form/TextField, floating label |
| **select field** | `SelectField` / `.dz-field--select` | Same shell, chevron, native select |
| **field label** | `.dz-field__label` | Floats on fill |
| **help text** | `.dz-field__help` | Below a field |
| **button** | `Button` / `.dazn-btn` | Appearances: primary, secondary, subscribe, tertiary |
| **icon** | `Icon` / `.dazn-icon` | Renders a DS SVG with currentColor |

---

## 9 · Concepts, not elements

Words for things with no single element.

| Name | Means |
| --- | --- |
| **context** | Market × storefront × cadence — what the editor is scoped to |
| **base** | The market-independent content, before differences |
| **override** | One market's difference from the base |
| **journey** | An ordered list of steps, chosen by user status and entry point |
| **step** | One screen of a journey. May have several states |
| **state** | One drawing of a step — "default", "alternate plan selected" |
| **seeded** | A step skipped because the entry already knows its answer |
| **offer** | A price for one plan at one cadence in one market |
| **cadence** | How you pay — Monthly Flex, Instalments Annual, Annual Upfront |
| **tier / plan** | Interchangeable. "Plan" in UI copy, "tier" in the data |
| **catalogue** | The reusable lists: features, logos, add-ons, icons |
| **publish gate** | The check across every context that blocks publishing |

---

## How to phrase a request

Good — resolves to one thing:

> Make the **step label** bold.
> The **savings ribbon** should sit above the **plan CTA**, not inside it.
> **Storefront** needs a help text.
> In **demo 2**, the **publish gate** is the wrong green.

Ambiguous — I will ask:

> Make the title bigger. *(product title, plan name, group title, step label?)*
> The button is too small. *(there are nine)*
> Fix the spacing in the panel. *(which group?)*

If a name for something is missing here, say what it does and where it is and
I will name it, add it to this table, and use that name from then on.
