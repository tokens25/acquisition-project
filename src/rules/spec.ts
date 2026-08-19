/**
 * The field spec — which values an editor may author, and which are produced
 * for them. This is the machine-readable form of §7 "Authored vs derived".
 *
 * It drives the editor UI: only `authored` entries become inputs. `derived` and
 * `static` entries are shown read-only so an editor can see the consequence of
 * a switch without being able to contradict it.
 */

export type FieldSource = 'authored' | 'derived' | 'static'

export interface FieldSpec {
  key: string
  label: string
  source: FieldSource
  /** Where the value comes from, for the read-only rows. */
  note: string
}

export const CARD_FIELDS: FieldSpec[] = [
  { key: 'planName', label: 'Plan Name', source: 'authored', note: 'One value — header, "Get X", "Included in X"' },
  { key: 'description', label: 'Description', source: 'authored', note: 'Full text, never pre-truncated' },
  { key: 'features', label: 'Feature labels', source: 'authored', note: 'CMS order preserved' },
  { key: 'addOn.title', label: 'Add-on title / subtitle', source: 'authored', note: "The add-on's own name, unrelated to the plan" },
  { key: 'standardPrice', label: 'Standard price', source: 'authored', note: 'Number + currency, not a formatted string' },
  { key: 'introPrice', label: 'Intro price', source: 'authored', note: 'Primary price while Discount is on' },
  { key: 'logos', label: 'Competition logos', source: 'authored', note: 'CMS order, never sorted client-side' },
  { key: 'ultimate', label: 'Ultimate', source: 'authored', note: 'Switch — drives 4 outputs' },
  { key: 'discount', label: 'Discount', source: 'authored', note: 'Switch — drives 5 outputs' },

  { key: 'explainer', label: 'Price explainer', source: 'derived', note: 'Repeats standardPrice — one number, two positions' },
  { key: 'savingsLabel', label: 'Savings amount', source: 'derived', note: 'Computed delta' },
  { key: 'overflowLabel', label: '"+{n}"', source: 'derived', note: 'Count of hidden tiles' },
  { key: 'moreControl', label: '"… more"', source: 'derived', note: 'Runtime overflow measurement' },
  { key: 'ctaLabel', label: '"Get X"', source: 'derived', note: 'Plan Name substitution' },
  { key: 'addOnIncludedLabel', label: '"Included in X"', source: 'derived', note: 'Plan Name substitution' },
  { key: 'struckPrice', label: 'Struck price', source: 'derived', note: 'standardPrice, when Discount is on' },
  { key: 'logoRows', label: 'Logo rows', source: 'derived', note: '1 if add-on present, else 2' },

  { key: 'priceCaption', label: '"Starts at"', source: 'static', note: 'Shown when Discount = true' },
  { key: 'badge', label: '"BEST EXPERIENCE"', source: 'static', note: 'Badge, Ultimate only' },
  { key: 'footer', label: '"All features & content"', source: 'static', note: 'Footer, always present' },
]

/**
 * Figma exposes these, but they are outputs of the switches in §3 and must
 * never reach the CMS (§7, final paragraph).
 */
export const BLOCKED_FIGMA_PROPERTIES = [
  'Show Crossed price',
  'Show Extra info',
  'Show bg layer',
  'Show Label/Eyebrow',
  'Rows',
] as const

/**
 * Figma exposes five text slots for two values — three plan-name slots and two
 * description slots — which are responsive presentations, not separate content.
 * The mapping collapses them (§4, CardHeader).
 */
export const COLLAPSED_FIGMA_SLOTS: Record<string, string[]> = {
  planName: ['Plan Title#38:24', 'Plan Title mobile#38:29', 'Plan title extra big#42:62'],
  description: ['plan description#38:34', 'plan description mobile#38:39'],
}
