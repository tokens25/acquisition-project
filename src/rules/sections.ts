import type { LandingScreen } from './flow'

/**
 * The landing page as a list of components rather than a fixed run of
 * sections.
 *
 * The page was ten blocks in the order they were written, and a market could
 * change their words but not which of them it showed or in what order. This
 * makes each block a thing on a list: it can move, it can be switched off, and
 * it can be copied so the page carries two of it.
 *
 * The list is content like everything else, so it forks per market — a market
 * that hides the schedule hides it for itself and for nobody else.
 *
 * A page that has never been arranged has no list at all, which is what keeps
 * every page published before today rendering exactly as it did: the shipped
 * order below stands in, every block on, one of each.
 */

export type SectionType =
  | 'zip'
  | 'schedule'
  | 'plans'
  | 'teams'
  | 'area'
  | 'multiview'
  | 'providers'
  | 'devices'
  | 'faq'
  | 'imageCta'
  | 'features'
  | 'supported'

export interface PageSection {
  /**
   * Which instance this is.
   *
   * The first of a type is named after the type, and that is not a
   * convenience: it is how a page written before this existed is recognised,
   * and how that instance keeps writing the fields it always wrote.
   */
  id: string
  type: SectionType
  /** Drawn, or kept in the list and not drawn. */
  on: boolean
}

/**
 * Every kind of block the page can draw.
 *
 * Longer than the shipped page: a kind can exist for the palette to offer
 * without the page having one — node 747:46379 is drawn nowhere in
 * 708:173735, and is added to a page by whoever wants it.
 */
export const SECTION_TYPES: SectionType[] = [
  'zip',
  'schedule',
  'plans',
  'teams',
  'area',
  'multiview',
  'providers',
  'devices',
  'faq',
  'imageCta',
  'features',
  'supported',
]

/** The page as it ships, in the order node 708:173735 has it. */
export const SHIPPED_ORDER: SectionType[] = [
  'zip',
  'schedule',
  'plans',
  'teams',
  'area',
  'multiview',
  'providers',
  'devices',
  'faq',
]

/** What each block is called, in the words the page uses for it. */
export const SECTION_LABEL: Record<SectionType, string> = {
  zip: 'Postcode',
  schedule: 'Games schedule',
  plans: 'Choose the plan',
  teams: 'Meet the teams',
  area: 'Outside the area',
  /* Named for what it is rather than what it happens to be about: a still,
     a line about it, and a way in — node 708:174095. */
  multiview: 'Article CTA',
  providers: 'TV providers',
  /* The type keeps its name because saved pages are arranged by it; what it
     is called is "Text block", which is what the design calls the component
     and what it now is — words, and nothing device-shaped about it. */
  devices: 'Text block',
  faq: 'FAQs',
  imageCta: 'Image CTA',
  features: 'Features list',
  supported: 'Supported devices',
}

/** The list this page is arranged into, or the one it has always had. */
export function sectionsOf(content: LandingScreen): PageSection[] {
  const saved = content.sections
  if (saved && saved.length > 0) {
    /*
     * A page arranged before a kind was retired still has it on the list.
     * Nothing draws it and nothing can name it, so it goes here rather than
     * leaving a nameless card in the panel and a hole in the page.
     */
    return saved.filter((s) => SECTION_TYPES.includes(s.type))
  }
  return SHIPPED_ORDER.map((type) => ({ id: type, type, on: true }))
}

/** Whether this instance is the original — the one that owns the page's own fields. */
export const isFirst = (section: PageSection) => section.id === section.type

/**
 * What one instance says.
 *
 * The original reads the page's own fields, which is where its words have
 * always been. A copy reads those too, and then its own on top: a duplicate
 * starts as the thing it was copied from and diverges as it is edited.
 */
export function copyOf<T extends Record<string, unknown>>(
  text: T,
  content: LandingScreen,
  section: PageSection,
): T {
  const own = content.sectionCopy?.[section.id]
  return own ? { ...text, ...own } : text
}

/** An id nothing else on the page is using. */
function freeId(list: PageSection[], type: SectionType): string {
  let n = 2
  while (list.some((s) => s.id === `${type}-${n}`)) n += 1
  return `${type}-${n}`
}

/** The list with one instance moved by a step, or unchanged at either end. */
export function withMoved(list: PageSection[], id: string, delta: number): PageSection[] {
  const from = list.findIndex((s) => s.id === id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= list.length) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** The list with one instance dropped before or after another. */
export function withDropped(
  list: PageSection[],
  id: string,
  onto: string,
  after: boolean,
): PageSection[] {
  if (id === onto) return list
  const from = list.findIndex((s) => s.id === id)
  if (from < 0) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  const target = next.findIndex((s) => s.id === onto)
  if (target < 0) return list
  next.splice(after ? target + 1 : target, 0, moved)
  return next
}

export function withToggled(list: PageSection[], id: string, on: boolean): PageSection[] {
  return list.map((s) => (s.id === id ? { ...s, on } : s))
}

/**
 * The list with a copy of one instance under it, and the id it was given.
 *
 * The copy is a new instance of the same type, on whether or not the thing it
 * came from is: copying something to leave it hidden is not what anybody
 * means by it.
 */
export function withDuplicated(
  list: PageSection[],
  id: string,
): { list: PageSection[]; id: string } {
  const at = list.findIndex((s) => s.id === id)
  if (at < 0) return { list, id }
  const source = list[at]
  const made: PageSection = { id: freeId(list, source.type), type: source.type, on: true }
  const next = [...list]
  next.splice(at + 1, 0, made)
  return { list: next, id: made.id }
}

/**
 * The list with one more block of a type, at the end.
 *
 * A type that is not on the page takes the plain id again, which is how a
 * block that was deleted comes back to the words it always had: those live in
 * the page's own fields, and the plain id is what reads them.
 */
export function withAdded(list: PageSection[], type: SectionType): PageSection[] {
  const taken = list.some((s) => s.id === type)
  return [...list, { id: taken ? freeId(list, type) : type, type, on: true }]
}

/**
 * The list without one instance.
 *
 * Any of them, including a type's original: what it said is in the page's own
 * fields and stays there, so adding that type back brings its words with it.
 */
export function withRemoved(list: PageSection[], id: string): PageSection[] {
  return list.filter((s) => s.id !== id)
}
