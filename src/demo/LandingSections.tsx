import { useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'

import { CardSetView } from '../card/CardSetView'
import { BundleCards, FightPlanCards } from '../components/flow/FlowScreens'
import { SubscriptionTabs } from '../components/flow/FlowScreens'
import { tabsOf } from '../rules/tabs'
import { ComponentPeek } from './ComponentPeek'
import { FieldGroup } from './FieldGroup'
import { ChevronIcon, CopyIcon, TrashIcon } from './pipeline/icons'
import { ImagePicker } from './ImagePicker'
import { articleShot, DEVICES, featureArt, flagFor, imageCtaArt, teamArt } from '../components/flow/landingArt'
import { artAt, SPOTLIGHT_ART, SUB_ART } from '../components/flow/newArt'
import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import {
  badgesOf,
  blankBadge,
  blankCard,
  blankFeature,
  blankMatch,
  blankTab,
  blankTeam,
  blankLink,
  blankQuestion,
  blankSubTile,
  bundlesOf,
  cardsOf,
  cityTabsOf,
  cityTilesOf,
  devicesOffOf,
  featuresOf,
  matchesOf,
  planCardsOf,
  landingText,
  linksOf,
  questionsOf,
  blankTile,
  railIdOf,
  scheduleRailIdOf,
  carouselRailIdOf,
  carouselServiceOf,
  showsRailIdOf,
  railSizeOf,
  spotlightRailIdOf,
  subTilesOf,
  teamsOf,
} from '../rules/landing'
import { resolveFlow, writeFlow } from '../rules/layers'
import {
  SECTION_BARS,
  SECTION_CONTENTS,
  SECTION_LABEL,
  cardFor,
  isCard,
  SECTION_TYPES,
  isFirst,
  isOnceOnly,
  sectionsOf,
  withAdded,
  withDropped,
  withDuplicated,
  withMoved,
  withRemoved,
  withToggled,
  type PageSection,
  type SectionType,
} from '../rules/sections'
import type { LandingScreen, LandingTeam, RailSize } from '../rules/flow'
import type { CardSetStore } from '../editor/useCardSet'
import { useLive } from '../editor/liveLandingContext'
import { LivePageChip } from './LivePageChip'
import type { Selector } from '../rules/layers'

/**
 * What this market's live page is made of, beside what this one is.
 *
 * Read-only, and shut until somebody opens it. It answers one question the
 * panel could not answer before — does the page we are drawing look anything
 * like the page that is up — and answers it in production's own words, which
 * since the blocks were renamed are mostly our words too.
 *
 * A component we have is one whose production name is a name in our palette.
 * That is nearly the whole test: the rename made the two vocabularies the same
 * where they overlap, so a match is a real match rather than a table somebody
 * has to keep in step. What the palette does not cover is named below.
 *
 * Nothing here changes the page. Adopting the live arrangement is a decision,
 * not something that happens while you are reading.
 */

/**
 * Where a component lives when the name is not the one in the palette.
 *
 * The live page names a component twice while a renderer is being rolled out:
 * Germany draws `StandardRailV2` where Japan draws `StandardRail`. A later
 * renderer of a component is that component, and calling it missing says we
 * lack a block we are looking at.
 *
 * The hero and the footer are not here. They are not cards at all — `isCard`
 * leaves them out of the list and out of both counts — because a page that
 * holds every component a market draws would otherwise still read as two
 * short, every time, for a reason no amount of building could close.
 */
const BESIDE_THE_PALETTE: Record<string, string> = {
  StandardRailV2: 'StandardRail — the same rail, a later renderer',
}

function LivePage({ market }: { market: string | undefined }) {
  const { state, page, error, elsewhere, reload } = useLive()
  if (state === 'off') return null

  /* The cards, which is what the palette can answer for. */
  const cards = page?.components.filter((c) => isCard(c.type)) ?? []
  const mine = cards.filter((c) => cardFor(c.type)).length
  /* Named at the foot rather than dropped silently: a page does draw them,
     and a list that skipped them without saying so would be a different page
     from the one that is up. */
  const elsewhereOnPage = page?.components.filter((c) => !isCard(c.type)).map((c) => c.type) ?? []

  return (
    <details className="ls-live" data-state={state}>
      <summary className="ls-live__head">
        {state === 'loading' && `Reading ${market}'s live page…`}
        {/* The slug where it is not the welcome one, because which page is
            being compared against is the thing you would otherwise have to
            guess at. */}
        {state === 'ready' &&
          page &&
          `${market} live${page.page === 'welcome' ? '' : ` · ${page.page}`} — ${cards.length} components, ${mine} we have`}
        {state === 'none' &&
          (elsewhere.length
            ? `${market} draws no welcome page for this product — ${elsewhere.length} others`
            : `${market} draws no live welcome page`)}
        {state === 'error' && `${market}'s live page could not be read`}
      </summary>

      {state === 'error' && <p className="ls-live__note">{error}</p>}
      {/* A product with no page under this slug is the ordinary case — MSG+
          has no welcome page, it has an RSN one — so say which pages it does
          draw rather than stopping at the no. */}
      {state === 'none' &&
        elsewhere.map((one) => (
          <div className="ls-live__row" key={one.pages[0] ?? one.displayName}>
            <span className="ls-live__name">{one.pages[0] ?? '—'}</span>
            <span className="ls-live__note">{one.displayName ?? ''}</span>
          </div>
        ))}
      {state === 'ready' && page && (
        <>
          {cards.map((c) => (
            <div className="ls-live__row" key={c.at} data-have={cardFor(c.type) ? true : undefined}>
              {/* Where the match is not a palette block, say where it is
                  instead — otherwise it reads as a match nobody can find. */}
              <span className="ls-live__name" title={BESIDE_THE_PALETTE[c.type]}>
                {c.type}
              </span>
              {/* Which rail it is served, where it is served one at all — the
                  id our own Rail ID fields stand in for. */}
              <span className="ls-live__note">
                {c.railId ? `rail ${c.railId.slice(0, 8)}` : `${c.entries.length} entries`}
              </span>
            </div>
          ))}
          {elsewhereOnPage.length > 0 && (
            <p className="ls-live__note">
              Also {elsewhereOnPage.join(', ')} — the hero is its own tab and the footer sits under
              the palette, so neither is counted here.
            </p>
          )}
          <p className="ls-live__note">
            {page.config.displayName ?? page.page} · {page.locale} · {page.env}
            {page.cached && ' · cached'}
          </p>
        </>
      )}
      <button type="button" className="ls-live__act" onClick={reload}>
        Read it again
      </button>
    </details>
  )
}

/**
 * The landing page as the list of components it draws.
 *
 * Each block of the page is a card here, in the order the page has them. A
 * card can be dragged to another place in the run, switched off without losing
 * what it says, or copied — after which the copy is its own block with its own
 * words, and editing one leaves the other alone.
 *
 * The first instance of a type writes the page's own fields, which is where
 * its words have always been, so nothing published moves. Every copy after it
 * keeps its words under its own id, and carries no pipeline key: dev has one
 * string per field of the page, and a second Postcode does not have a second
 * name for the same string yet.
 */
export function LandingSections({
  store,
  scope,
}: {
  store: CardSetStore
  scope: Selector
}) {
  const { set, updateSet } = store
  const l = resolveFlow(set).landing
  const list = sectionsOf(l)

  /** Writes the arrangement itself — order, on and off, what exists. */
  const arrange = (next: PageSection[]) =>
    updateSet(writeFlow(set, scope, 'landing', { sections: next }))

  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)
  /*
   * Which row the pointer is on, and where that row is.
   *
   * Held for the list rather than by each row, because only one of them is
   * ever previewed — the picture beside the panel costs one section, not
   * twelve. Dropped while a drag is happening: a preview following the pointer
   * through a reorder is in the way of the thing being reordered.
   */
  const [peek, setPeek] = useState<{ id: string; at: DOMRect } | null>(null)
  const shown = !dragging && peek ? list.find((s) => s.id === peek.id) : undefined

  const drawn = list.filter((section) => section.on).length

  return (
    <>
      {/* What the list is, how much of it the page draws, and when the live
          page it was opened on was last read. The count is the one fact the
          rows cannot say between them — nine names is obvious, nine names of
          which six are on is not — and the time is the one the list cannot say
          about itself. */}
      <div className="ls-head">
        <span className="ls-head__title">Components</span>
        <span className="ls-head__count">
          {drawn} on the page
          <LivePageChip />
        </span>
      </div>
      <LivePage market={store.context.market} />
      {list.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          store={store}
          scope={scope}
         
          dragging={dragging}
          over={over}
          onDragStart={() => setDragging(section.id)}
          onDragEnd={() => {
            setDragging(null)
            setOver(null)
          }}
          onPeek={(at) => setPeek(at ? { id: section.id, at } : null)}
          onOver={(after) => setOver({ id: section.id, after })}
          onLeave={() => setOver((o) => (o?.id === section.id ? null : o))}
          onDrop={(id, after) => {
            arrange(withDropped(list, id, section.id, after))
            setDragging(null)
            setOver(null)
          }}
          onNudge={(delta) => arrange(withMoved(list, section.id, delta))}
          onToggle={(on) => arrange(withToggled(list, section.id, on))}
          onDuplicate={() => arrange(withDuplicated(list, section.id).list)}
          onRemove={() => arrange(withRemoved(list, section.id))}
        />
      ))}
      {shown && peek && (
        <ComponentPeek
          section={shown}
          content={l}
          set={set}
          context={store.context}
          anchor={peek.at}
        />
      )}
      <AddSection
        onAdd={(type) => arrange(withAdded(list, type))}
        missing={SECTION_TYPES.filter((type) => !list.some((s) => s.type === type))}
      />
      <FooterFields store={store} scope={scope} />
    </>
  )
}

/**
 * The footer's words.
 *
 * Below the palette and outside the run of cards, because the footer is not
 * one of them: it does not move, it cannot be switched off, and there is
 * nothing to duplicate. What it does have is its words, and they can be added
 * to and taken away.
 */
function FooterFields({ store, scope }: { store: CardSetStore; scope: Selector }) {
  const { set, updateSet } = store
  const l = resolveFlow(set).landing
  const links = linksOf(l)
  const write = (next: Partial<LandingScreen>) =>
    updateSet(writeFlow(set, scope, 'landing', next))

  return (
    <FieldGroup title="Footer" defaultOpen={false}>
        {/* A link is one thing: what it says, whether it starts a line, and
            the way to be rid of it — in the card the panel wraps a tab or a
            question in, with Remove where Remove always sits. */}
        {links.map((link, i) => (
          <div className="demo__feature" key={link.id}>
            <TextField
              label={`Link ${i + 1}`}
              value={link.label}
              pipelineKey={`landing.footerLinks[${i}].label`}
              onChange={(v) =>
                write({ footerLinks: links.map((one, j) => (j === i ? { ...one, label: v } : one)) })
              }
            />
            {i > 0 && (
              <ToggleField
                label="New line"
                checked={link.breaks ?? false}
                onChange={(v) =>
                  write({
                    footerLinks: links.map((one, j) => (j === i ? { ...one, breaks: v } : one)),
                  })
                }
              />
            )}
            <button
              data-icon="trash"
              aria-label="Remove"
              type="button"
              className="demo__feature-remove"
              title={`Remove ${link.label || 'this link'}`}
              onClick={() => write({ footerLinks: links.filter((_, j) => j !== i) })}
            >
              <TrashIcon size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ed-add"
          onClick={() => write({ footerLinks: [...links, blankLink(links)] })}
        >
          Add a link
        </button>
      <TextField
        label="Mark"
        value={l.footerMark ?? ''}
        pipelineKey={'landing.footerMark'}
        onChange={(v) => write({ footerMark: v })}
        helpText="The name under the links, with its trailing letters. Empty draws none."
      />
    </FieldGroup>
  )
}

/**
 * What else the page could have on it.
 *
 * The dashed row is the one the panel already uses for adding a provider or a
 * question. What it opens is every kind of block the page knows how to draw,
 * with the ones the page is not currently showing first — after a block is
 * deleted, putting it back is the likeliest reason anybody opens this.
 *
 * Most kinds can be added more than once — the second is a new block with its
 * own words, exactly as duplicating gives you. The few the page can only carry
 * one of are offered until it has one and then held, rather than taken off the
 * list: a name that disappears reads as a thing that no longer exists.
 */
function AddSection({
  onAdd,
  missing,
}: {
  onAdd: (type: SectionType) => void
  missing: SectionType[]
}) {
  const [open, setOpen] = useState(false)
  const rest = SECTION_TYPES.filter((type) => !missing.includes(type))
  /* On the page already, and of a kind the page can only have one of. */
  const spent = rest.filter(isOnceOnly)

  return (
    <div className="ls-add">
      <button type="button" className="ed-add" onClick={() => setOpen((v) => !v)}>
        {open ? 'Never mind' : 'Add a component'}
      </button>
      {open && (
        <div className="ls-add__list">
          {[...missing, ...rest].map((type) => (
            <button
              key={type}
              type="button"
              className="ls-add__option"
              data-missing={missing.includes(type) || undefined}
              disabled={spent.includes(type)}
              title={
                spent.includes(type)
                  ? `The page has its ${SECTION_LABEL[type]}, and can only have one`
                  : undefined
              }
              onClick={() => {
                onAdd(type)
                setOpen(false)
              }}
            >
              {SECTION_LABEL[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionCard({
  section,
  store,
  scope,
  dragging,
  over,
  onDragStart,
  onDragEnd,
  onPeek,
  onOver,
  onLeave,
  onDrop,
  onNudge,
  onToggle,
  onDuplicate,
  onRemove,
}: {
  section: PageSection
  store: CardSetStore
  scope: Selector
  dragging: string | null
  over: { id: string; after: boolean } | null
  onDragStart: () => void
  onDragEnd: () => void
  /** Hovered, with the row's own box — or left. */
  onPeek: (at: DOMRect | null) => void
  onOver: (after: boolean) => void
  onLeave: () => void
  onDrop: (id: string, after: boolean) => void
  onNudge: (delta: number) => void
  onToggle: (on: boolean) => void
  onDuplicate: () => void
  onRemove: () => void
  /** Only the plans card has one — see LandingSections. */
}) {
  const { set, updateSet } = store
  const l = resolveFlow(set).landing
  const own = l.sectionCopy?.[section.id]
  /** This instance's content: the page's, and its own on top of it. */
  const inst: LandingScreen = own ? { ...l, ...own } : l
  /* The picker as the page draws it, for the thumbnail at the foot of the
     plans fold. Its tabs are the Subscription screen's, so a tab renamed
     there is renamed here. */
  const planTabs = tabsOf(set)
  const planTab = planTabs.some((t) => t.id === store.context.tab)
    ? (store.context.tab as string)
    : (planTabs[0]?.id ?? '')
  const t = landingText(inst)

  /**
   * Writes one field of this instance.
   *
   * The original edits the page; a copy edits only itself, under its own id,
   * so the two say different things from the moment either is touched.
   */
  const write = (next: Partial<LandingScreen>) =>
    updateSet(
      writeFlow(
        set,
        scope,
        'landing',
        isFirst(section)
          ? next
          : { sectionCopy: { ...(l.sectionCopy ?? {}), [section.id]: { ...own, ...next } } },
      ),
    )

  /** Dev's name for a string, which only the page's own fields have. */
  const key = (k: string) => (isFirst(section) ? k : undefined)

  const label = SECTION_LABEL[section.type]
  /* A kind the page can only carry one of — so there is nothing to copy. */
  const once = isOnceOnly(section.type)

  return (
    <div
      className="ls-card"
      data-off={!section.on || undefined}
      data-dragging={dragging === section.id || undefined}
      data-drop={over?.id === section.id ? (over.after ? 'after' : 'before') : undefined}
      draggable
      tabIndex={0}
      onDragStart={(e) => {
        onDragStart()
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', section.id)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (!dragging || dragging === section.id) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        // Which half of the card the pointer is over says which side it lands
        // on, so the same gesture reads as above or below.
        const box = e.currentTarget.getBoundingClientRect()
        onOver(e.clientY > box.top + box.height / 2)
      }}
      onDragLeave={onLeave}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain') || dragging
        if (id) onDrop(id, over?.after ?? false)
      }}
      onKeyDown={(e) => {
        // The same alt + arrows the journey row uses, for anyone not dragging.
        if (!e.altKey) return
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          onNudge(-1)
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          onNudge(1)
        }
      }}
    >
      {/* The row, and the fold under it. What a component is made of is on
          the row itself — its shape, its fields, what can be done to it — so
          the list can be read without opening anything. */}
      <FieldGroup
        defaultOpen={false}
        head={({ open, toggle, id }) => (
          <div
            className="ls-row"
            onMouseEnter={(e) => onPeek(e.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => onPeek(null)}
            /* The whole row opens it, not only its name. The row lights up
               under the pointer, and a thing that lights up and does nothing is
               a thing that looks broken — everything between the grip and the
               chevron was arrow-and-nothing. The controls inside it keep their
               own clicks: a press that lands on one of them is that one's. */
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return
              toggle()
            }}
          >
            <span className="ls-row__grip" aria-hidden="true" />

            {/* The block's proportions rather than a picture of it: a wide bar
                is a full-width thing, a short one a heading or a button. */}
            <span className="ls-row__tile" data-off={!section.on || undefined} aria-hidden="true">
              {SECTION_BARS[section.type].map((width, i) => (
                <span key={i} className="ls-row__bar" data-lead={i === 0 || undefined} style={{ inlineSize: `${width}%` }} />
              ))}
            </span>

            <span className="ls-row__text">
              <span className="ls-row__line">
                <button
                  type="button"
                  className="ls-row__name"
                  data-off={!section.on || undefined}
                  aria-expanded={open}
                  aria-controls={id}
                  onClick={toggle}
                >
                  {label}
                </button>
                {once && <span className="ls-row__once">one only</span>}
                {!isFirst(section) && <span className="ls-card__copy">copy</span>}
              </span>
              <span className="ls-row__made">{SECTION_CONTENTS[section.type]}</span>

              {/* Arriving with the pointer, so the resting list is names and
                  nothing else. On focus as well, or tabbing into a row would
                  reach two words nobody can see. */}
              <span className="ls-row__acts">
                <button
                  data-icon="copy"
                  aria-label="Duplicate"
                  type="button"
                  className="ls-row__act"
                  disabled={once}
                  title={once ? `The page can only have one ${label}` : `Add another ${label}`}
                  onClick={onDuplicate}
                >
                  <CopyIcon size={14} />
                </button>
                <button
                  data-icon="trash"
                  aria-label="Delete"
                  type="button"
                  className="ls-row__act"
                  data-destructive=""
                  title={
                    isFirst(section)
                      ? `Take ${label} off the page — its words stay, and Add a component brings it back`
                      : 'Delete this copy'
                  }
                  onClick={onRemove}
                >
                  <TrashIcon size={14} />
                </button>
              </span>
            </span>

            <button
              type="button"
              className="ls-row__dot"
              role="switch"
              aria-checked={section.on}
              title={section.on ? `Stop drawing ${label}` : `Draw ${label}`}
              onClick={() => onToggle(!section.on)}
            >
              <span className="ls-row__dot-mark" aria-hidden="true" />
            </button>

            {/* A second way to the same fold, for the pointer. The name is the
                one in the tab order; two controls saying the same thing would
                be two stops for one action. */}
            <span
              className="ls-row__chev"
              data-open={open || undefined}
              aria-hidden="true"
              onClick={toggle}
            >
              <ChevronIcon size={14} />
            </span>
          </div>
        )}
      >
        {/* The same card the panel wraps a tab or a benefit in, so a component
            reads as one thing rather than a run of loose fields. */}
        <div className="demo__feature">
          <SectionFields section={section} t={t} inst={inst} write={write} keyOf={key} />
        </div>
        {/* Under the fields rather than beside them, because it is where the
            rest of this component is edited rather than a thing done to it:
            what the page owns is the heading above the picker, and everything
            below it belongs to the Subscription screen. */}
        {/* The picker itself rather than a button naming it: what the page
            owns here is the heading, and everything under it is the
            Subscription screen's. A drawing of that screen says which plans
            and which tabs far faster than words would, and it is the real
            thing — rename a tab there and it changes here.

            A picture and not a control. It is here to say what the page sells,
            and the plans are edited where the plans live. */}
        {section.type === 'plans' && (
          <span className="ls-shot" aria-hidden="true">
            <span className="ls-shot__frame">
            <span
              className="ls-shot__page"
              /* Laid out wide enough for the whole set to stand side by side
                 rather than at the phone's width, where the third card is off
                 the edge of a row that scrolls. The stylesheet shrinks it to
                 the panel by this same number. */
              style={{ inlineSize: PICKER_WIDTH, '--ls-shot-w': `${PICKER_WIDTH}px` } as CSSProperties}
              inert
            >
              <div className="fl-page__plans-tabs">
                <SubscriptionTabs tabs={planTabs} tab={planTab} />
              </div>
              <CardSetView set={set} context={store.context} tab={planTab} />
            </span>
            </span>
          </span>
        )}
      </FieldGroup>
    </div>
  )
}

/**
 * The fields of one block, as the panel has always had them.
 *
 * Moved here from the long run in FlowPanel rather than rewritten: the same
 * labels, the same order, the same help text. What changed is where they write
 * — this instance rather than the page — and that a copy has no pipeline key.
 */
/**
 * What the plan picker is laid out at inside its thumbnail.
 *
 * The width three cards and their gaps actually take — measured, not guessed.
 * At the phone's 375 the set is a row that scrolls and the third card is off
 * the edge, which is the page's behaviour and the wrong thing for a picture
 * of what the page sells.
 */
const PICKER_WIDTH = 888

/**
 * What the fight plan's cards are laid out at inside their thumbnail.
 *
 * Two cards side by side rather than the page's one above the other: stacked,
 * a thumbnail of them is the top of the first card and nothing else.
 */
const PLAN_WIDTH = 760

/**
 * What the bundles are laid out at inside their thumbnail.
 *
 * Two cards at 280 with a 16 gutter between them and 16 either side, which is
 * the row's own arithmetic rather than a number that looked about right. At
 * the phone's width the row scrolls and the second bundle is off the edge —
 * the page's behaviour, and the wrong thing for a picture of the set.
 */
const BUNDLE_WIDTH = 608

/**
 * Dragging one thing in a list past the others.
 *
 * A hook rather than a second copy of the handlers: the teams and the
 * spotlight's games are dragged the same way, and two copies of "which half
 * of the row did the pointer land on" is two chances to answer it
 * differently. It hands back the props a row needs and keeps the two pieces
 * of state — what is being carried, and where it would land — to itself.
 */
function useRowDrag<T extends { id: string }>(list: T[], settle: (next: T[]) => void) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)

  const rowProps = (id: string) => ({
    'data-dragging': dragging === id || undefined,
    'data-drop': over?.id === id ? (over.after ? 'after' : 'before') : undefined,
    draggable: true,
    /* Every one of these stops where it is. A list like this sits inside a
       component row that is itself draggable, so without that a thing picked
       up here is a whole block picked up there — the outer row overwrites the
       id being carried and moves the component instead. */
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation()
      setDragging(id)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    },
    onDragEnd: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation()
      setDragging(null)
      setOver(null)
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!dragging || dragging === id) return
      e.stopPropagation()
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      // Which half of the row the pointer is over says which side it lands on,
      // so one gesture reads as above or below.
      const box = e.currentTarget.getBoundingClientRect()
      setOver({ id, after: e.clientY > box.top + box.height / 2 })
    },
    onDragLeave: () => setOver(null),
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const carried = e.dataTransfer.getData('text/plain') || dragging
      if (carried) settle(withDropped(list, carried, id, over?.after ?? false))
      setDragging(null)
      setOver(null)
    },
  })

  return rowProps
}

/**
 * The teams on the rail: what each is called, its logo, and what order.
 *
 * Its own component because dragging is state, and the fields below are a
 * switch that returns markup. What it drags is the list itself — the same
 * gesture and the same drop rule the page's components use, through the same
 * helper, so the two cannot come to disagree about what "after" means.
 */
function TeamRows({
  teams,
  write,
  keyOf: key,
}: {
  teams: LandingTeam[]
  write: (next: Partial<LandingScreen>) => void
  keyOf: (k: string) => string | undefined
}) {
  const rowProps = useRowDrag(teams, (next) => write({ teams: next }))

  const edit = (i: number, next: Partial<LandingTeam>) =>
    write({ teams: teams.map((one, j) => (j === i ? { ...one, ...next } : one)) })

  return (
    <>
      {teams.map((team, i) => {
        /* The two lines together are what the artwork is keyed by, the same
           way the rail reads them. */
        const art = teamArt[[team.city, team.name].map((one) => (one ?? '').trim()).filter(Boolean).join(' ')]
        return (
        <div
          className="demo__feature"
          /* One line rather than a stack: a logo, a name and a colour are
             three small things about one team, and stacked they read as three
             questions. */
          data-row=""
          key={team.id}
          {...rowProps(team.id)}
        >
          {/* The whole row drags; this is what says so. */}
          <span className="demo__grip" aria-hidden="true" />
          {/* 100 square: what is being chosen is a crest, not a still, and a
              crest at the width of the panel is a crest the size of a poster.
              It opens on whatever the tile is drawing now — the logo somebody
              uploaded, or the one the name brings — so replacing a picture
              starts from the picture being replaced. */}
          <span className="demo__team-side">
            {/* 100 square: what is being chosen is a crest, not a still, and a
                crest at the width of the panel is a crest the size of a
                poster. It opens on whatever the tile is drawing now, so
                replacing a picture starts from the picture being replaced. */}
            <ImagePicker
              aspect="1 / 1"
              width={100}
              src={team.logo}
              shipped={art?.art}
              label="Logo"
              onPick={(url) => edit(i, { logo: url })}
              onRemove={() => edit(i, { logo: '' })}
            />
            <TextField
              label="Over the name"
              value={team.city ?? ''}
              pipelineKey={key(`landing.teams[${i}].city`)}
              onChange={(v) => edit(i, { city: v })}
            />
            <TextField
              label="Name"
              value={team.name}
              pipelineKey={key(`landing.teams[${i}].name`)}
              onChange={(v) => edit(i, { name: v })}
            />
          </span>
          {/* Opens on the colour the tile is wearing — the one chosen, or the
              one the two lines bring — so a shipped team keeps its club's own
              until somebody moves it. */}
          <label className="demo__swatch">
            <input
              type="color"
              value={team.ground || art?.ground || '#101112'}
              onChange={(e) => edit(i, { ground: e.target.value })}
              aria-label={`What is behind ${team.name || 'this team'}`}
            />
            <span className="demo__swatch-name">Ground</span>
          </label>
          <button
            data-icon="trash"
            aria-label="Remove"
            type="button"
            className="demo__feature-remove"
            data-destructive=""
            onClick={() => write({ teams: teams.filter((_, j) => j !== i) })}
          >
            <TrashIcon size={14} />
          </button>
        </div>
        )
      })}
    </>
  )
}

function SectionFields({
  section,
  t,
  inst,
  write,
  keyOf: key,
}: {
  section: PageSection
  t: ReturnType<typeof landingText>
  inst: LandingScreen
  write: (next: Partial<LandingScreen>) => void
  keyOf: (k: string) => string | undefined
}) {
  switch (section.type) {
    case 'zip':
      return (
        <>
          <TextField label="Heading" value={t.zipHeading} pipelineKey={key('landing.zipHeading')} onChange={(v) => write({ zipHeading: v })} />
          <TextField label="Under the heading" value={t.zipNote} pipelineKey={key('landing.zipNote')} onChange={(v) => write({ zipNote: v })} rows={2} />
          <TextField label="Button" value={t.zipCta} pipelineKey={key('landing.zipCta')} onChange={(v) => write({ zipCta: v })} />
        </>
      )

    case 'schedule':
      return (
        <>
              <TextField label="Heading" value={t.scheduleHeading} pipelineKey={key('landing.scheduleHeading')} onChange={(v) => write({ scheduleHeading: v })} rows={2} helpText="The design breaks this line itself — a new line here is the break." />
              <TextField label="Under the heading" value={t.scheduleSubheading} pipelineKey={key('landing.scheduleSubheading')} onChange={(v) => write({ scheduleSubheading: v })} rows={2} helpText="Empty draws none." />
              {/* Which rail, not what is in it: the stamp, the teams and the
                  competition come from whatever serves it. What is drawn
                  against an id here is a placeholder standing in for that. */}
              <TextField
                label="Rail ID"
                value={scheduleRailIdOf(inst)}
                pipelineKey={key('landing.scheduleRailId')}
                onChange={(v) => write({ scheduleRailId: v })}
                helpText="The rail's id in whatever serves the schedule. It decides what is in the row and in what order."
              />
        </>
      )

    case 'plans':
      return (
        <>

              <TextField label="Heading" value={t.plansTitle} pipelineKey={key('landing.plansTitle')} onChange={(v) => write({ plansTitle: v })} rows={2} helpText="The design breaks this line itself — a new line here is the break." />
              <TextField label="Under the heading" value={t.plansBody} pipelineKey={key('landing.plansBody')} onChange={(v) => write({ plansBody: v })} rows={2} />
        </>
      )

    case 'teams':
      return (
        <>

              <TextField label="Over the heading" value={t.teamsEyebrow} pipelineKey={key('landing.teamsEyebrow')} onChange={(v) => write({ teamsEyebrow: v })} />
              <TextField label="Heading" value={t.teamsTitle} pipelineKey={key('landing.teamsTitle')} onChange={(v) => write({ teamsTitle: v })} />
              <TextField label="Under the heading" value={t.teamsBody} pipelineKey={key('landing.teamsBody')} onChange={(v) => write({ teamsBody: v })} rows={2} />
          <TeamRows teams={teamsOf(inst)} write={write} keyOf={key} />
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ teams: [...teamsOf(inst), blankTeam(teamsOf(inst))] })}
          >
            Add a team
          </button>
        </>
      )

    case 'area':
      return (
        <>

              <TextField label="Heading" value={t.areaTitle} pipelineKey={key('landing.areaTitle')} onChange={(v) => write({ areaTitle: v })} />
              <TextField label="Under the heading" value={t.areaBody} pipelineKey={key('landing.areaBody')} onChange={(v) => write({ areaBody: v })} rows={2} />
              <TextField label="Notice" value={t.areaNotice} pipelineKey={key('landing.areaNotice')} onChange={(v) => write({ areaNotice: v })} rows={2} />
              <TextField label="Under the notice" value={t.areaNote} pipelineKey={key('landing.areaNote')} onChange={(v) => write({ areaNote: v })} rows={4} />
              <TextField label="Button" value={t.areaCta} pipelineKey={key('landing.areaCta')} onChange={(v) => write({ areaCta: v })} />
        </>
      )

    case 'multiview':
      return (
        <>
          <ImagePicker
            // The still's own 1369 by 770.
            aspect="1369 / 770"
            src={inst.multiviewImage}
            shipped={articleShot}
            off={inst.multiviewImageOff}
            onPick={(url) => write({ multiviewImage: url, multiviewImageOff: false })}
            onRemove={() => write({ multiviewImage: '', multiviewImageOff: true })}
            onShipped={() => write({ multiviewImage: '', multiviewImageOff: false })}
          />

              <TextField label="Over the heading" value={t.multiviewEyebrow} pipelineKey={key('landing.multiviewEyebrow')} onChange={(v) => write({ multiviewEyebrow: v })} />
              <TextField label="Pill" value={t.multiviewBadge} pipelineKey={key('landing.multiviewBadge')} onChange={(v) => write({ multiviewBadge: v })} helpText="Empty draws none." />
              <TextField label="Heading" value={t.multiviewTitle} pipelineKey={key('landing.multiviewTitle')} onChange={(v) => write({ multiviewTitle: v })} rows={2} />
              <TextField label="Under the heading" value={t.multiviewBody} pipelineKey={key('landing.multiviewBody')} onChange={(v) => write({ multiviewBody: v })} rows={3} />
              <TextField label="Button" value={t.multiviewCta} pipelineKey={key('landing.multiviewCta')} onChange={(v) => write({ multiviewCta: v })} />
        </>
      )

    case 'providers':
      return (
        <>

              <TextField label="Heading" value={t.providersTitle} pipelineKey={key('landing.providersTitle')} onChange={(v) => write({ providersTitle: v })} rows={2} helpText="The design breaks this line itself — a new line here is the break." />
              <TextField label="Under the heading" value={t.providersBody} pipelineKey={key('landing.providersBody')} onChange={(v) => write({ providersBody: v })} rows={3} />
              <TextField label="The gold half" value={t.providersHighlight} pipelineKey={key('landing.providersHighlight')} onChange={(v) => write({ providersHighlight: v })} helpText="Follows the sentence above, in gold." />
              {/* Which providers, and what each is called, is not written here:
                  the grid is who DAZN has deals with, and a page that listed
                  them would be a second list going out of step with the first. */}
              <TextField label="Under the grid" value={t.providersNote} pipelineKey={key('landing.providersNote')} onChange={(v) => write({ providersNote: v })} rows={2} />
              <TextField label="Button" value={t.providersCta} pipelineKey={key('landing.providersCta')} onChange={(v) => write({ providersCta: v })} />
        </>
      )

    case 'devices':
      return (
        <>

              <TextField label="Heading" value={t.devicesTitle} pipelineKey={key('landing.devicesTitle')} onChange={(v) => write({ devicesTitle: v })} />
              <TextField label="Second line" value={t.devicesTitleTwo} pipelineKey={key('landing.devicesTitleTwo')} onChange={(v) => write({ devicesTitleTwo: v })} helpText="Its own line, in the brand gradient." />
              <TextField label="Under the heading" value={t.devicesBody} pipelineKey={key('landing.devicesBody')} onChange={(v) => write({ devicesBody: v })} rows={4} />
        </>
      )

    case 'supported':
      return (
        <>
          <TextField
            label="Heading"
            value={t.supportedTitle}
            pipelineKey={key('landing.supportedTitle')}
            onChange={(v) => write({ supportedTitle: v })}
          />
          {/* Every logo the wall knows, each on or off. Names rather than the
              artwork: a column of thirteen logos is a wall of its own, and
              what is being answered here is whether this market supports the
              thing, which is a word. The wall closes the gap itself. */}
          <div className="demo__feature">
            {DEVICES.map((device) => {
              const off = devicesOffOf(inst)
              return (
                <ToggleField
                  key={device.name}
                  label={device.name}
                  checked={!off.includes(device.name)}
                  onChange={(on) =>
                    write({
                      supportedOff: on
                        ? off.filter((name) => name !== device.name)
                        : [...off, device.name],
                    })
                  }
                />
              )
            })}
          </div>
          <TextField
            label="Under the logos"
            value={t.supportedNote}
            pipelineKey={key('landing.supportedNote')}
            onChange={(v) => write({ supportedNote: v })}
            rows={2}
          />
          <TextField
            label="The words that link"
            value={t.supportedLink}
            pipelineKey={key('landing.supportedLink')}
            onChange={(v) => write({ supportedLink: v })}
            helpText="Follows the line above, in blue. Empty draws none."
          />
        </>
      )

    case 'rail':
      return (
        <>
          <TextField
            label="Title"
            value={t.railTitle}
            pipelineKey={key('landing.railTitle')}
            onChange={(v) => write({ railTitle: v })}
            helpText="Over the row. Empty draws none."
          />
          {/* Named for what each holds rather than for its measurements: the
              size is the choice of what this rail is for, and nobody reaches
              for "322 by 120". */}
          <SelectField
            label="Tiles"
            value={railSizeOf(inst)}
            options={[
              { value: 'fixture', label: 'Games — 16:9, words underneath' },
              { value: 'story', label: 'Stories — tall, words underneath' },
              { value: 'wide', label: 'Promotions — wide and short, words over' },
              { value: 'square', label: 'Places — square, words over' },
            ]}
            onChange={(v) => write({ railSize: v as RailSize })}
            helpText="What kind of thing the row is showing. It sets the shape of every tile."
          />
          {/* Which rail, not what is in it: the pictures, the names and the
              order come from whatever serves it. What is drawn against an id
              here is a placeholder standing in for that. */}
          <TextField
            label="Rail ID"
            value={railIdOf(inst)}
            pipelineKey={key('landing.railId')}
            onChange={(v) => write({ railId: v })}
            helpText="The rail's id in whatever serves it. It decides what is in the row and in what order."
          />
        </>
      )

    case 'subRail':
      return (
        <>
          <TextField
            label="Heading"
            value={t.subRailTitle}
            pipelineKey={key('landing.subRailTitle')}
            onChange={(v) => write({ subRailTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.subRailBody}
            pipelineKey={key('landing.subRailBody')}
            onChange={(v) => write({ subRailBody: v })}
            rows={2}
          />
          {subTilesOf(inst).map((tile, i) => {
            const all = subTilesOf(inst)
            const edit = (next: Partial<typeof tile>) =>
              write({ subRailTiles: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={tile.id}>
                {/* At the tile's own 2 by 3 and small: the whole tile is the
                    picture, so a picker on the page's ratio would be a picker
                    the size of the panel. It opens on whatever the tile is
                    drawing now — the picture somebody chose, or the one its
                    place in the rail ships with — so replacing one starts
                    from the picture being replaced. */}
                <ImagePicker
                  aspect="2 / 3"
                  width={96}
                  src={tile.background}
                  shipped={artAt(SUB_ART, i)}
                  label="Background"
                  aria={`Background — subscription ${i + 1}`}
                  onPick={(url) => edit({ background: url })}
                  onRemove={() => edit({ background: '' })}
                />
                <TextField
                  label={`Subscription ${i + 1}`}
                  value={tile.line}
                  pipelineKey={key(`landing.subRailTiles[${i}].line`)}
                  onChange={(v) => edit({ line: v })}
                  rows={2}
                  helpText="The line under the logo, which is what the tile says it sells."
                />
                <TextField
                  label="Button"
                  value={tile.cta}
                  pipelineKey={key(`landing.subRailTiles[${i}].cta`)}
                  onChange={(v) => edit({ cta: v })}
                />
                {/* Absent means drawn, so the switch reads the tile that way
                    too: only an explicit no turns it off. */}
                <ToggleField
                  label="DAZN logo"
                  checked={tile.logo !== false}
                  onChange={(on) => edit({ logo: on })}
                  hint="Over the line at the foot of the tile."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ subRailTiles: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() =>
              write({ subRailTiles: [...subTilesOf(inst), blankSubTile(subTilesOf(inst))] })
            }
          >
            Add a subscription
          </button>
        </>
      )

    case 'ppv':
      return (
        <>
          <TextField
            label="Badge"
            value={t.ppvBadge}
            pipelineKey={key('landing.ppvBadge')}
            onChange={(v) => write({ ppvBadge: v })}
            helpText="Set in capitals by the design. Empty draws none."
          />
          <TextField
            label="Line"
            value={t.ppvLine}
            pipelineKey={key('landing.ppvLine')}
            onChange={(v) => write({ ppvLine: v })}
            rows={2}
          />
          <TextField
            label="Button"
            value={t.ppvCta}
            pipelineKey={key('landing.ppvCta')}
            onChange={(v) => write({ ppvCta: v })}
            helpText="Empty draws none."
          />
        </>
      )

    case 'zone':
      return (
        <>
          <ImagePicker
            aspect="16 / 9"
            src={inst.zoneImage}
            label="Picture"
            onPick={(url) => write({ zoneImage: url })}
            onRemove={() => write({ zoneImage: '' })}
          />
          <TextField
            label="Heading"
            value={t.zoneTitle}
            pipelineKey={key('landing.zoneTitle')}
            onChange={(v) => write({ zoneTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.zoneBody}
            pipelineKey={key('landing.zoneBody')}
            onChange={(v) => write({ zoneBody: v })}
            rows={3}
          />
          <TextField
            label="Button"
            value={t.zoneCta}
            pipelineKey={key('landing.zoneCta')}
            onChange={(v) => write({ zoneCta: v })}
            helpText="It hands over to the step that asks for the code. There is no input on this block."
          />
        </>
      )

    case 'schedCarousel':
      return (
        <>
          <TextField
            label="Over the heading"
            value={t.carouselLabel}
            pipelineKey={key('landing.carouselLabel')}
            onChange={(v) => write({ carouselLabel: v })}
            helpText="Set in capitals by the design. Empty draws none."
          />
          <TextField
            label="Heading"
            value={t.carouselTitle}
            pipelineKey={key('landing.carouselTitle')}
            onChange={(v) => write({ carouselTitle: v })}
            rows={2}
          />
          {/* The two dates are the only part of this a person can see: they
              decide which days the row runs between. */}
          <TextField
            label="From"
            value={t.carouselFrom}
            pipelineKey={key('landing.carouselFrom')}
            onChange={(v) => write({ carouselFrom: v })}
            helpText="A date, as 2026-09-18. Eight days at most are drawn."
          />
          <TextField
            label="To"
            value={t.carouselTo}
            pipelineKey={key('landing.carouselTo')}
            onChange={(v) => write({ carouselTo: v })}
            helpText="A date the row runs up to."
          />
          {/* Served twice over, and neither address is drawn. */}
          <TextField
            label="Rail ID"
            value={carouselRailIdOf(inst)}
            pipelineKey={key('landing.carouselRailId')}
            onChange={(v) => write({ carouselRailId: v })}
            helpText="The rail's id, for the row itself."
          />
          <TextField
            label="Service ID"
            value={carouselServiceOf(inst)}
            pipelineKey={key('landing.carouselService')}
            onChange={(v) => write({ carouselService: v })}
            helpText="Which sports-data service answers with the matches."
          />
        </>
      )

    case 'shows':
      return (
        <>
          <TextField
            label="Heading"
            value={t.showsTitle}
            pipelineKey={key('landing.showsTitle')}
            onChange={(v) => write({ showsTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.showsBody}
            pipelineKey={key('landing.showsBody')}
            onChange={(v) => write({ showsBody: v })}
            rows={2}
            helpText="Empty draws none."
          />
          {/* Which rail, not what is in it: the shows, their pictures and their
              order come from whatever serves it. What is drawn against an id
              here is a placeholder standing in for that. */}
          <TextField
            label="Rail ID"
            value={showsRailIdOf(inst)}
            pipelineKey={key('landing.showsRailId')}
            onChange={(v) => write({ showsRailId: v })}
            helpText="The rail's id in whatever serves the shows."
          />
          <TextField
            label="Button"
            value={t.showsCta}
            pipelineKey={key('landing.showsCta')}
            onChange={(v) => write({ showsCta: v })}
            helpText="Under the rail. Empty draws none — the other served rails have none at all."
          />
        </>
      )

    case 'experience':
      return (
        <>
          <ImagePicker
            // 16 by 9, which is the frame the live one's video opens on.
            aspect="16 / 9"
            src={inst.expImage}
            label="Picture"
            onPick={(url) => write({ expImage: url })}
            onRemove={() => write({ expImage: '' })}
          />
          {/* Named for what it does rather than for the word the live page
              uses: left and right are what a wide screen makes of it, and this
              page is drawn at a phone's width. */}
          <SelectField
            label="Where the picture sits"
            value={inst.expSide ?? 'right'}
            options={[
              { value: 'left', label: 'Above the words' },
              { value: 'right', label: 'Under the words' },
            ]}
            onChange={(v) => write({ expSide: v === 'left' ? 'left' : 'right' })}
            helpText="The live page alternates this down a run of them."
          />
          <TextField
            label="Over the heading"
            value={t.expOverline}
            pipelineKey={key('landing.expOverline')}
            onChange={(v) => write({ expOverline: v })}
            helpText="Set in capitals by the design. Empty draws none."
          />
          <TextField
            label="Heading"
            value={t.expTitle}
            pipelineKey={key('landing.expTitle')}
            onChange={(v) => write({ expTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.expBody}
            pipelineKey={key('landing.expBody')}
            onChange={(v) => write({ expBody: v })}
            rows={3}
          />
          <TextField
            label="Button"
            value={t.expCta}
            pipelineKey={key('landing.expCta')}
            onChange={(v) => write({ expCta: v })}
            helpText="Empty draws none."
          />
        </>
      )

    case 'badges':
      return (
        <>
          <TextField
            label="Heading"
            value={t.badgesTitle}
            pipelineKey={key('landing.badgesTitle')}
            onChange={(v) => write({ badgesTitle: v })}
            rows={2}
          />
          {badgesOf(inst).map((badge, i) => {
            const all = badgesOf(inst)
            const edit = (next: Partial<typeof badge>) =>
              write({ badges: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" data-row="" key={badge.id}>
                {/* Round on the page, so round here: what is being chosen is a
                    badge, and a square picker would show a crop the page does
                    not draw. */}
                <ImagePicker
                  aspect="1 / 1"
                  width={72}
                  src={badge.image}
                  label="Badge"
                  aria={`Badge ${i + 1}`}
                  onPick={(url) => edit({ image: url })}
                  onRemove={() => edit({ image: '' })}
                />
                <span className="demo__team-side">
                  <TextField
                    label={`Badge ${i + 1}`}
                    value={badge.line}
                    pipelineKey={key(`landing.badges[${i}].line`)}
                    onChange={(v) => edit({ line: v })}
                    rows={2}
                    helpText="The line under it. Empty draws none, which is what Japan's row does."
                  />
                </span>
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ badges: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ badges: [...badgesOf(inst), blankBadge(badgesOf(inst))] })}
          >
            Add a badge
          </button>
        </>
      )

    case 'bundles':
      return (
        <>
          <TextField
            label="Heading"
            value={t.bundlesTitle}
            pipelineKey={key('landing.bundlesTitle')}
            onChange={(v) => write({ bundlesTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.bundlesBody}
            pipelineKey={key('landing.bundlesBody')}
            onChange={(v) => write({ bundlesBody: v })}
            rows={2}
          />
          {/* The bundles as they are, rather than fields for them. What the
              page owns here is the two lines over the set; a bundle, its
              nights and what it costs belong to whatever sells it, and a run
              of fields here would be a second answer going out of step with
              the first. */}
          <span className="ls-shot" aria-hidden="true">
            <span className="ls-shot__frame" data-bundle="">
              <span
                className="ls-shot__page"
                style={{ inlineSize: BUNDLE_WIDTH, '--ls-shot-w': `${BUNDLE_WIDTH}px` } as CSSProperties}
                inert
              >
                <BundleCards bundles={bundlesOf(inst)} />
              </span>
            </span>
          </span>
        </>
      )

    case 'matchList':
      return (
        <>
          <TextField
            label="Over the heading"
            value={t.matchEyebrow}
            pipelineKey={key('landing.matchEyebrow')}
            onChange={(v) => write({ matchEyebrow: v })}
            helpText="Set in capitals by the design. Empty draws none."
          />
          <TextField
            label="Heading"
            value={t.matchTitle}
            pipelineKey={key('landing.matchTitle')}
            onChange={(v) => write({ matchTitle: v })}
            rows={2}
          />
          <TextField
            label="Button"
            value={t.matchCta}
            pipelineKey={key('landing.matchCta')}
            onChange={(v) => write({ matchCta: v })}
            helpText="Empty draws none."
          />
          {matchesOf(inst).map((match, i) => {
            const all = matchesOf(inst)
            const edit = (next: Partial<typeof match>) =>
              write({ matchGames: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={match.id}>
                <TextField
                  label={`Match ${i + 1} — day`}
                  value={match.day}
                  pipelineKey={key(`landing.matchGames[${i}].day`)}
                  onChange={(v) => edit({ day: v })}
                  helpText="The heading it falls under. Matches sharing a day are drawn under one."
                />
                {/* A flag and three letters are one fact about one side, and
                    stacked they read as two. The flag goes first, which is the
                    order the card draws the home side in. */}
                <div className="demo__match-side">
                  <ImagePicker
                    width={72}
                    src={match.homeFlag}
                    shipped={flagFor(match.home)}
                    label="Flag"
                    aria={`Home flag — match ${i + 1}`}
                    onPick={(url) => edit({ homeFlag: url })}
                    onRemove={() => edit({ homeFlag: '' })}
                  />
                  <TextField
                    label="Home"
                    value={match.home}
                    pipelineKey={key(`landing.matchGames[${i}].home`)}
                    onChange={(v) => edit({ home: v })}
                  />
                </div>
                <TextField
                  label="Kick-off"
                  value={match.time}
                  pipelineKey={key(`landing.matchGames[${i}].time`)}
                  onChange={(v) => edit({ time: v })}
                />
                <div className="demo__match-side">
                  <ImagePicker
                    width={72}
                    src={match.awayFlag}
                    shipped={flagFor(match.away)}
                    label="Flag"
                    aria={`Away flag — match ${i + 1}`}
                    onPick={(url) => edit({ awayFlag: url })}
                    onRemove={() => edit({ awayFlag: '' })}
                  />
                  <TextField
                    label="Away"
                    value={match.away}
                    pipelineKey={key(`landing.matchGames[${i}].away`)}
                    onChange={(v) => edit({ away: v })}
                  />
                </div>
                <TextField
                  label="Under the rule"
                  value={match.note}
                  pipelineKey={key(`landing.matchGames[${i}].note`)}
                  onChange={(v) => edit({ note: v })}
                  rows={2}
                  helpText="Stage, group, stadium and city."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ matchGames: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ matchGames: [...matchesOf(inst), blankMatch(matchesOf(inst))] })}
          >
            Add a match
          </button>
        </>
      )

    case 'cardStack':
      return (
        <>
          {cardsOf(inst).map((card, i) => {
            const all = cardsOf(inst)
            const edit = (next: Partial<typeof card>) =>
              write({ featureCards: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={card.id}>
                <TextField
                  label={`Card ${i + 1} — number`}
                  value={card.stat}
                  pipelineKey={key(`landing.featureCards[${i}].stat`)}
                  onChange={(v) => edit({ stat: v })}
                  helpText="The big gold line, as in 12+. Empty makes it a card of words."
                />
                <TextField
                  label="Heading"
                  value={card.title}
                  pipelineKey={key(`landing.featureCards[${i}].title`)}
                  onChange={(v) => edit({ title: v })}
                  rows={2}
                  helpText="A new line is a second line — HDR over Dolby Atmos, not a wrap."
                />
                <TextField
                  label="Under the heading"
                  value={card.body}
                  pipelineKey={key(`landing.featureCards[${i}].body`)}
                  onChange={(v) => edit({ body: v })}
                  rows={3}
                />
                <TextField
                  label="Button"
                  value={card.cta}
                  pipelineKey={key(`landing.featureCards[${i}].cta`)}
                  onChange={(v) => edit({ cta: v })}
                  helpText="Gold, at the foot. Empty draws none."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ featureCards: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ featureCards: [...cardsOf(inst), blankCard(cardsOf(inst))] })}
          >
            Add a card
          </button>
        </>
      )

    case 'cities':
      return (
        <>
          <TextField
            label="Over the heading"
            value={t.citiesEyebrow}
            pipelineKey={key('landing.citiesEyebrow')}
            onChange={(v) => write({ citiesEyebrow: v })}
            helpText="Set in capitals by the design. Empty draws none."
          />
          <TextField
            label="Heading"
            value={t.citiesTitle}
            pipelineKey={key('landing.citiesTitle')}
            onChange={(v) => write({ citiesTitle: v })}
          />
          <TextField
            label="Under the heading"
            value={t.citiesBody}
            pipelineKey={key('landing.citiesBody')}
            onChange={(v) => write({ citiesBody: v })}
            rows={3}
          />
          {cityTabsOf(inst).map((tab, i) => {
            const all = cityTabsOf(inst)
            return (
              <div className="demo__feature" key={tab.id}>
                <TextField
                  label={`Tab ${i + 1}`}
                  value={tab.label}
                  pipelineKey={key(`landing.cityTabs[${i}].label`)}
                  onChange={(v) =>
                    write({ cityTabs: all.map((one, j) => (j === i ? { ...one, label: v } : one)) })
                  }
                  helpText={i === 0 ? 'The first is the one drawn as chosen.' : undefined}
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ cityTabs: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ cityTabs: [...cityTabsOf(inst), blankTab(cityTabsOf(inst))] })}
          >
            Add a tab
          </button>
          {cityTilesOf(inst).map((tile, i) => {
            const all = cityTilesOf(inst)
            const edit = (next: Partial<typeof tile>) =>
              write({ cityTiles: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={tile.id}>
                <TextField
                  label={`Place ${i + 1}`}
                  value={tile.title}
                  pipelineKey={key(`landing.cityTiles[${i}].title`)}
                  onChange={(v) => edit({ title: v })}
                />
                <TextField
                  label="Under it"
                  value={tile.meta}
                  pipelineKey={key(`landing.cityTiles[${i}].meta`)}
                  onChange={(v) => edit({ meta: v })}
                  helpText="City and capacity, as the design has it."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ cityTiles: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ cityTiles: [...cityTilesOf(inst), blankTile(cityTilesOf(inst))] })}
          >
            Add a place
          </button>
        </>
      )

    case 'live':
      return (
        <>
          <TextField
            label="Heading"
            value={t.liveTitle}
            pipelineKey={key('landing.liveTitle')}
            onChange={(v) => write({ liveTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.liveBody}
            pipelineKey={key('landing.liveBody')}
            onChange={(v) => write({ liveBody: v })}
            rows={2}
          />
          <TextField
            label="Button"
            value={t.liveCta}
            pipelineKey={key('landing.liveCta')}
            onChange={(v) => write({ liveCta: v })}
            helpText="Empty draws none."
          />
        </>
      )

    case 'spotlight':
      return (
        <>
          {/* The picture behind the top of it. 3:5, which is the shape the
              spotlight draws it in. */}
          <ImagePicker
            aspect="3 / 5"
            width={120}
            src={inst.spotlightImage}
            shipped={SPOTLIGHT_ART}
            label="Picture"
            onPick={(url) => write({ spotlightImage: url })}
            onRemove={() => write({ spotlightImage: '' })}
          />
          <TextField
            label="Label"
            value={t.spotlightLabel}
            pipelineKey={key('landing.spotlightLabel')}
            onChange={(v) => write({ spotlightLabel: v })}
            helpText="The gold chip over the heading. Empty draws none."
          />
          <TextField
            label="Heading"
            value={t.spotlightTitle}
            pipelineKey={key('landing.spotlightTitle')}
            onChange={(v) => write({ spotlightTitle: v })}
            rows={2}
          />
          <TextField
            label="Under the heading"
            value={t.spotlightBody}
            pipelineKey={key('landing.spotlightBody')}
            onChange={(v) => write({ spotlightBody: v })}
            rows={3}
          />
          {/* Which rail, not what is in it. The same as the schedule: the
              rail decides what is on and in what order, and a page listing
              the games would be a second answer going stale. */}
          <TextField
            label="Rail ID"
            value={spotlightRailIdOf(inst)}
            pipelineKey={key('landing.spotlightRailId')}
            onChange={(v) => write({ spotlightRailId: v })}
            helpText="The rail's id in whatever serves it. It decides which games are in the row."
          />
        </>
      )

    case 'fightPlan':
      return (
        <>
          <TextField
            label="Heading"
            value={t.planPickTitle}
            pipelineKey={key('landing.planPickTitle')}
            onChange={(v) => write({ planPickTitle: v })}
            rows={2}
          />
          {/* The cards as they are, rather than fields for them. What the page
              owns here is the heading; a plan and what it costs belong to
              whatever sells it, and a set of fields here would be a second
              answer going out of step with the first. */}
          <span className="ls-shot" aria-hidden="true">
            <span className="ls-shot__frame" data-plan="">
              <span
                className="ls-shot__page"
                style={{ inlineSize: PLAN_WIDTH, '--ls-shot-w': `${PLAN_WIDTH}px` } as CSSProperties}
                inert
              >
                <FightPlanCards cards={planCardsOf(inst)} />
              </span>
            </span>
          </span>
        </>
      )

    case 'features':
      return (
        <>
          <TextField label="Over the heading" value={t.featuresEyebrow} pipelineKey={key('landing.featuresEyebrow')} onChange={(v) => write({ featuresEyebrow: v })} />
          <TextField label="Heading" value={t.featuresTitle} pipelineKey={key('landing.featuresTitle')} onChange={(v) => write({ featuresTitle: v })} rows={2} />
          {featuresOf(inst).map((feature, i) => {
            const all = featuresOf(inst)
            const edit = (next: Partial<typeof feature>) =>
              write({ features: all.map((f, j) => (j === i ? { ...f, ...next } : f)) })
            return (
              <div className="demo__feature" key={feature.id}>
                {/* The tag brings a picture with it; this is where a row gets
                    one of its own, or none.

                    At the 130 by 83 the row draws it, which is small enough
                    that the picture is the control: hovering says Replace and
                    the corner takes it off, rather than two words sitting
                    under every picture in the list. */}
                <ImagePicker
                  aspect="130 / 83"
                  width={130}
                  src={feature.image}
                  shipped={featureArt[feature.tag]?.photo}
                  off={feature.imageOff}
                  label="Picture"
                  aria={`Picture — feature ${i + 1}`}
                  onPick={(url) => edit({ image: url, imageOff: false })}
                  onRemove={() => edit({ image: '', imageOff: true })}
                  onShipped={() => edit({ image: '', imageOff: false })}
                />
                <TextField
                  label={`Tag ${i + 1}`}
                  value={feature.tag}
                  pipelineKey={key(`landing.features[${i}].tag`)}
                  onChange={(v) => edit({ tag: v })}
                  helpText="The tag picks the icon and the picture. One with neither shows its words alone."
                />
                <TextField
                  label="Heading"
                  value={feature.title}
                  pipelineKey={key(`landing.features[${i}].title`)}
                  onChange={(v) => edit({ title: v })}
                  rows={2}
                />
                <TextField
                  label="Under the heading"
                  value={feature.body}
                  pipelineKey={key(`landing.features[${i}].body`)}
                  onChange={(v) => edit({ body: v })}
                  rows={3}
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  onClick={() => write({ features: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ features: [...featuresOf(inst), blankFeature(featuresOf(inst))] })}
          >
            Add a feature
          </button>
          <TextField label="Button" value={t.featuresCta} pipelineKey={key('landing.featuresCta')} onChange={(v) => write({ featuresCta: v })} />
        </>
      )

    case 'imageCta':
      return (
        <>
          <ImagePicker
            // The card is taller than it is wide — node 747:46379 is 343 by 447.
            aspect="343 / 447"
            src={inst.imageCtaImage}
            shipped={imageCtaArt}
            off={inst.imageCtaImageOff}
            onPick={(url) => write({ imageCtaImage: url, imageCtaImageOff: false })}
            onRemove={() => write({ imageCtaImage: '', imageCtaImageOff: true })}
            onShipped={() => write({ imageCtaImage: '', imageCtaImageOff: false })}
          />
          <TextField label="Heading" value={t.imageCtaTitle} pipelineKey={key('landing.imageCtaTitle')} onChange={(v) => write({ imageCtaTitle: v })} rows={2} />
          <TextField label="Under the heading" value={t.imageCtaBody} pipelineKey={key('landing.imageCtaBody')} onChange={(v) => write({ imageCtaBody: v })} rows={3} />
          <TextField label="Button" value={t.imageCtaCta} pipelineKey={key('landing.imageCtaCta')} onChange={(v) => write({ imageCtaCta: v })} />
        </>
      )

    case 'faq':
      return (
        <>

              <TextField label="Heading" value={t.faqTitle} pipelineKey={key('landing.faqTitle')} onChange={(v) => write({ faqTitle: v })} />
              {questionsOf(inst).map((one, i) => {
                const all = questionsOf(inst)
                return (
                  <div className="demo__feature" key={one.id}>
                    <TextField
                      label={`Question ${i + 1}`}
                      value={one.question}
                      pipelineKey={key(`landing.faqs[${i}].question`)}
                      onChange={(v) =>
                        write({
                          faqs: all.map((q, j) => (j === i ? { ...q, question: v } : q)),
                        })
                      }
                      rows={2}
                    />
                    <TextField
                      label="Answer"
                      value={one.answer ?? ''}
                      pipelineKey={key(`landing.faqs[${i}].answer`)}
                      onChange={(v) =>
                        write({
                          faqs: all.map((q, j) => (j === i ? { ...q, answer: v } : q)),
                        })
                      }
                      rows={4}
                      helpText="What opening the question shows. Empty leaves it shut."
                    />
                    <button
                      data-icon="trash"
                      aria-label="Remove"
                      type="button"
                      className="demo__feature-remove"
                      onClick={() => write({ faqs: all.filter((_, j) => j !== i) })}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                className="ed-add"
                onClick={() =>
                  write({ faqs: [...questionsOf(inst), blankQuestion(questionsOf(inst))] })
                }
              >
                Add a question
              </button>
        </>
      )
  }
}
