import { useState } from 'react'
import type { CSSProperties } from 'react'

import { CardSetView } from '../card/CardSetView'
import { SubscriptionTabs } from '../components/flow/FlowScreens'
import { tabsOf } from '../rules/tabs'
import { ComponentPeek } from './ComponentPeek'
import { FieldGroup } from './FieldGroup'
import { ChevronIcon, CopyIcon, TrashIcon } from './pipeline/icons'
import { ImagePicker } from './ImagePicker'
import { articleShot, featureArt, imageCtaArt, teamArt } from '../components/flow/landingArt'
import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import {
  blankBundle,
  blankCard,
  blankFeature,
  blankFight,
  blankMatch,
  blankTab,
  blankPerk,
  blankPlanCard,
  blankPlanFight,
  blankTeam,
  blankTeamRow,
  blankLink,
  blankProvider,
  blankQuestion,
  blankSubTile,
  blankTile,
  bundlesOf,
  cardsOf,
  cityTabsOf,
  cityTilesOf,
  dayTilesOf,
  featuresOf,
  liveTeamsOf,
  matchesOf,
  planCardsOf,
  landingText,
  linksOf,
  providersOf,
  questionsOf,
  railIdOf,
  railSizeOf,
  spotlightTilesOf,
  subTilesOf,
  teamsOf,
  tilesOf,
} from '../rules/landing'
import { resolveFlow, writeFlow } from '../rules/layers'
import {
  SECTION_BARS,
  SECTION_CONTENTS,
  SECTION_LABEL,
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
import type { Selector } from '../rules/layers'

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
      {/* What the list is, and how much of it the page draws. The count is the
          one fact the rows cannot say between them: nine names is obvious, nine
          names of which six are on is not. */}
      <div className="ls-head">
        <span className="ls-head__title">Components</span>
        <span className="ls-head__count">
          {drawn} on the page
        </span>
      </div>
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
  const [dragging, setDragging] = useState<string | null>(null)
  /** Which row the pointer is over, and which side of it it would land. */
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)

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
          data-dragging={dragging === team.id || undefined}
          data-drop={over?.id === team.id ? (over.after ? 'after' : 'before') : undefined}
          draggable
          /* Every one of these stops where it is. The component this list
             belongs to is itself a draggable row, so without that a team
             picked up here is a whole block picked up there — the outer row
             overwrites the id being carried and moves the component instead. */
          onDragStart={(e) => {
            e.stopPropagation()
            setDragging(team.id)
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', team.id)
          }}
          onDragEnd={(e) => {
            e.stopPropagation()
            setDragging(null)
            setOver(null)
          }}
          onDragOver={(e) => {
            if (!dragging || dragging === team.id) return
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            // Which half of the row the pointer is over says which side it
            // lands on, so one gesture reads as above or below.
            const box = e.currentTarget.getBoundingClientRect()
            setOver({ id: team.id, after: e.clientY > box.top + box.height / 2 })
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const id = e.dataTransfer.getData('text/plain') || dragging
            if (id) write({ teams: withDropped(teams, id, team.id, over?.after ?? false) })
            setDragging(null)
            setOver(null)
          }}
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
                value={railIdOf(inst)}
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
              <TextField label="Field label" value={t.areaFieldLabel} pipelineKey={key('landing.areaFieldLabel')} onChange={(v) => write({ areaFieldLabel: v })} />
              <TextField label="Code shown" value={t.areaFieldValue} pipelineKey={key('landing.areaFieldValue')} onChange={(v) => write({ areaFieldValue: v })} />
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
              {providersOf(inst).map((provider, i) => {
                const all = providersOf(inst)
                return (
                  <div className="demo__feature" key={provider.id}>
                    <TextField
                      label={`Provider ${i + 1}`}
                      value={provider.name}
                      pipelineKey={key(`landing.providers[${i}].name`)}
                      onChange={(v) =>
                        write({
                          providers: all.map((p, j) => (j === i ? { ...p, name: v } : p)),
                        })
                      }
                      helpText="The name picks the logo. One with no logo shows its name."
                    />
                    <button
                      data-icon="trash"
                      aria-label="Remove"
                      type="button"
                      className="demo__feature-remove"
                      onClick={() => write({ providers: all.filter((_, j) => j !== i) })}
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
                  write({ providers: [...providersOf(inst), blankProvider(providersOf(inst))] })
                }
              >
                Add a provider
              </button>
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
            helpText="The logos under it are the ones DAZN supports, and are not written here."
          />
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
          {tilesOf(inst).map((tile, i) => {
            const all = tilesOf(inst)
            const edit = (next: Partial<typeof tile>) =>
              write({ railTiles: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={tile.id}>
                <TextField
                  label={`Tile ${i + 1}`}
                  value={tile.title}
                  pipelineKey={key(`landing.railTiles[${i}].title`)}
                  onChange={(v) => edit({ title: v })}
                  rows={2}
                />
                <TextField
                  label="Under it"
                  value={tile.meta}
                  pipelineKey={key(`landing.railTiles[${i}].meta`)}
                  onChange={(v) => edit({ meta: v })}
                  helpText="The quieter line — a competition, a place, a date. Empty draws none."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ railTiles: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ railTiles: [...tilesOf(inst), blankTile(tilesOf(inst))] })}
          >
            Add a tile
          </button>
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
          {bundlesOf(inst).map((bundle, i) => {
            const all = bundlesOf(inst)
            const edit = (next: Partial<typeof bundle>) =>
              write({ bundles: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={bundle.id}>
                <TextField
                  label={`Bundle ${i + 1}`}
                  value={bundle.name}
                  pipelineKey={key(`landing.bundles[${i}].name`)}
                  onChange={(v) => edit({ name: v })}
                />
                <TextField
                  label="Under the name"
                  value={bundle.note}
                  pipelineKey={key(`landing.bundles[${i}].note`)}
                  onChange={(v) => edit({ note: v })}
                  rows={2}
                />
                <TextField
                  label="Price"
                  value={bundle.price}
                  pipelineKey={key(`landing.bundles[${i}].price`)}
                  onChange={(v) => edit({ price: v })}
                />
                <TextField
                  label="Was"
                  value={bundle.was}
                  pipelineKey={key(`landing.bundles[${i}].was`)}
                  onChange={(v) => edit({ was: v })}
                  helpText="Struck through beside the price. Empty draws neither this nor the saving."
                />
                <TextField
                  label="Saving"
                  value={bundle.save}
                  pipelineKey={key(`landing.bundles[${i}].save`)}
                  onChange={(v) => edit({ save: v })}
                />
                <TextField
                  label="What kind of bundle"
                  value={bundle.term}
                  pipelineKey={key(`landing.bundles[${i}].term`)}
                  onChange={(v) => edit({ term: v })}
                  helpText={'Under the price — "2-fight bundle".'}
                />
                <TextField
                  label="Corner label"
                  value={bundle.badge}
                  pipelineKey={key(`landing.bundles[${i}].badge`)}
                  onChange={(v) => edit({ badge: v })}
                  helpText="Marks this one out, in gold. Empty draws none."
                />
                {bundle.fights.map((fight, f) => (
                  <div className="demo__feature" key={fight.id}>
                    <TextField
                      label={`Night ${f + 1}`}
                      value={fight.name}
                      pipelineKey={key(`landing.bundles[${i}].fights[${f}].name`)}
                      onChange={(v) =>
                        edit({
                          fights: bundle.fights.map((one, j) => (j === f ? { ...one, name: v } : one)),
                        })
                      }
                    />
                    <TextField
                      label="When"
                      value={fight.when}
                      pipelineKey={key(`landing.bundles[${i}].fights[${f}].when`)}
                      onChange={(v) =>
                        edit({
                          fights: bundle.fights.map((one, j) => (j === f ? { ...one, when: v } : one)),
                        })
                      }
                    />
                    <button
                      data-icon="trash"
                      aria-label="Remove"
                      type="button"
                      className="demo__feature-remove"
                      data-destructive=""
                      onClick={() => edit({ fights: bundle.fights.filter((_, j) => j !== f) })}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="ed-add"
                  onClick={() => edit({ fights: [...bundle.fights, blankFight(bundle.fights)] })}
                >
                  Add a night
                </button>
                <TextField
                  label="Button"
                  value={bundle.cta}
                  pipelineKey={key(`landing.bundles[${i}].cta`)}
                  onChange={(v) => edit({ cta: v })}
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ bundles: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ bundles: [...bundlesOf(inst), blankBundle(bundlesOf(inst))] })}
          >
            Add a bundle
          </button>
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
                <TextField
                  label="Home"
                  value={match.home}
                  pipelineKey={key(`landing.matchGames[${i}].home`)}
                  onChange={(v) => edit({ home: v })}
                />
                <TextField
                  label="Kick-off"
                  value={match.time}
                  pipelineKey={key(`landing.matchGames[${i}].time`)}
                  onChange={(v) => edit({ time: v })}
                />
                <TextField
                  label="Away"
                  value={match.away}
                  pipelineKey={key(`landing.matchGames[${i}].away`)}
                  onChange={(v) => edit({ away: v })}
                />
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

    case 'dayRail':
      return (
        <>
          <TextField
            label="Over the date"
            value={t.dayLabel}
            pipelineKey={key('landing.dayLabel')}
            onChange={(v) => write({ dayLabel: v })}
            helpText='In gold, in capitals — "Today".'
          />
          <TextField
            label="Date"
            value={t.dayDate}
            pipelineKey={key('landing.dayDate')}
            onChange={(v) => write({ dayDate: v })}
          />
          <TextField
            label="Month"
            value={t.dayMonth}
            pipelineKey={key('landing.dayMonth')}
            onChange={(v) => write({ dayMonth: v })}
          />
          {dayTilesOf(inst).map((tile, i) => {
            const all = dayTilesOf(inst)
            const edit = (next: Partial<typeof tile>) =>
              write({ dayTiles: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={tile.id}>
                <TextField
                  label={`Game ${i + 1}`}
                  value={tile.title}
                  pipelineKey={key(`landing.dayTiles[${i}].title`)}
                  onChange={(v) => edit({ title: v })}
                  rows={2}
                />
                <TextField
                  label="Under it"
                  value={tile.meta}
                  pipelineKey={key(`landing.dayTiles[${i}].meta`)}
                  onChange={(v) => edit({ meta: v })}
                  helpText="The competition it belongs to. Empty draws none."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ dayTiles: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ dayTiles: [...dayTilesOf(inst), blankTile(dayTilesOf(inst))] })}
          >
            Add a game
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
            label="Field"
            value={t.liveFieldLabel}
            pipelineKey={key('landing.liveFieldLabel')}
            onChange={(v) => write({ liveFieldLabel: v })}
          />
          <TextField
            label="Code shown"
            value={t.liveFieldValue}
            pipelineKey={key('landing.liveFieldValue')}
            onChange={(v) => write({ liveFieldValue: v })}
          />
          {liveTeamsOf(inst).map((team, i) => {
            const all = liveTeamsOf(inst)
            const edit = (next: Partial<typeof team>) =>
              write({ liveTeams: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={team.id}>
                <TextField
                  label={`Team ${i + 1}`}
                  value={team.name}
                  pipelineKey={key(`landing.liveTeams[${i}].name`)}
                  onChange={(v) => edit({ name: v })}
                  helpText="The name picks the crest. One with no crest shows its words alone."
                />
                <TextField
                  label="Competition"
                  value={team.league}
                  pipelineKey={key(`landing.liveTeams[${i}].league`)}
                  onChange={(v) => edit({ league: v })}
                  helpText="At the right of the row. Empty draws none."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ liveTeams: all.filter((_, j) => j !== i) })}
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
              write({ liveTeams: [...liveTeamsOf(inst), blankTeamRow(liveTeamsOf(inst))] })
            }
          >
            Add a team
          </button>
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
            helpText="The picture is the page's own hero artwork — change it in the Hero banner tab."
          />
          {spotlightTilesOf(inst).map((tile, i) => {
            const all = spotlightTilesOf(inst)
            const edit = (next: Partial<typeof tile>) =>
              write({ spotlightTiles: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={tile.id}>
                <TextField
                  label={`Game ${i + 1}`}
                  value={tile.title}
                  pipelineKey={key(`landing.spotlightTiles[${i}].title`)}
                  onChange={(v) => edit({ title: v })}
                />
                <TextField
                  label="Under it"
                  value={tile.meta}
                  pipelineKey={key(`landing.spotlightTiles[${i}].meta`)}
                  onChange={(v) => edit({ meta: v })}
                  helpText="The competition. Empty draws none."
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ spotlightTiles: all.filter((_, j) => j !== i) })}
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
              write({ spotlightTiles: [...spotlightTilesOf(inst), blankTile(spotlightTilesOf(inst))] })
            }
          >
            Add a game
          </button>
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
          {planCardsOf(inst).map((card, i) => {
            const all = planCardsOf(inst)
            const edit = (next: Partial<typeof card>) =>
              write({ planCards: all.map((one, j) => (j === i ? { ...one, ...next } : one)) })
            return (
              <div className="demo__feature" key={card.id}>
                <TextField
                  label={`Plan ${i + 1}`}
                  value={card.name}
                  pipelineKey={key(`landing.planCards[${i}].name`)}
                  onChange={(v) => edit({ name: v })}
                />
                {/* The four offers the design draws are this line and the
                    prices below it: no offer, a free trial, a discount, a
                    month free. Nothing else about the card changes. */}
                <TextField
                  label="Under the name"
                  value={card.note}
                  pipelineKey={key(`landing.planCards[${i}].note`)}
                  onChange={(v) => edit({ note: v })}
                  rows={2}
                  helpText="How it is billed, or the offer on it — a free trial, a first month free."
                />
                <TextField
                  label="Price"
                  value={card.price}
                  pipelineKey={key(`landing.planCards[${i}].price`)}
                  onChange={(v) => edit({ price: v })}
                  helpText="Empty on a card that leads with the fight's own price."
                />
                <TextField
                  label="After the price"
                  value={card.priceUnit}
                  pipelineKey={key(`landing.planCards[${i}].priceUnit`)}
                  onChange={(v) => edit({ priceUnit: v })}
                />
                <TextField
                  label="Boxed message"
                  value={card.notice}
                  pipelineKey={key(`landing.planCards[${i}].notice`)}
                  onChange={(v) => edit({ notice: v })}
                  rows={2}
                  helpText="Under the price, with an i. Empty draws none."
                />
                <TextField
                  label="Bundle name"
                  value={card.offerName}
                  pipelineKey={key(`landing.planCards[${i}].offerName`)}
                  onChange={(v) => edit({ offerName: v })}
                  helpText="Fills to sell the fights below as one bundle. Empty sells them singly."
                />
                {card.offerName.trim() !== '' && (
                  <>
                    <TextField
                      label="Bundle price"
                      value={card.offerPrice}
                      pipelineKey={key(`landing.planCards[${i}].offerPrice`)}
                      onChange={(v) => edit({ offerPrice: v })}
                    />
                    <TextField
                      label="Bundle was"
                      value={card.offerWas}
                      pipelineKey={key(`landing.planCards[${i}].offerWas`)}
                      onChange={(v) => edit({ offerWas: v })}
                    />
                    <TextField
                      label="After the bundle price"
                      value={card.offerUnit}
                      pipelineKey={key(`landing.planCards[${i}].offerUnit`)}
                      onChange={(v) => edit({ offerUnit: v })}
                    />
                    <TextField
                      label="Bundle saving"
                      value={card.offerSave}
                      pipelineKey={key(`landing.planCards[${i}].offerSave`)}
                      onChange={(v) => edit({ offerSave: v })}
                    />
                  </>
                )}
                {card.fights.map((fight, f) => {
                  const fit = (next: Partial<typeof fight>) =>
                    edit({ fights: card.fights.map((one, j) => (j === f ? { ...one, ...next } : one)) })
                  return (
                    <div className="demo__feature" key={fight.id}>
                      <TextField
                        label={`Fight ${f + 1}`}
                        value={fight.name}
                        pipelineKey={key(`landing.planCards[${i}].fights[${f}].name`)}
                        onChange={(v) => fit({ name: v })}
                      />
                      <TextField
                        label="When"
                        value={fight.when}
                        pipelineKey={key(`landing.planCards[${i}].fights[${f}].when`)}
                        onChange={(v) => fit({ when: v })}
                      />
                      <TextField
                        label="Price"
                        value={fight.price}
                        pipelineKey={key(`landing.planCards[${i}].fights[${f}].price`)}
                        onChange={(v) => fit({ price: v })}
                        helpText="Empty where the bundle above prices it."
                      />
                      <TextField
                        label="Was"
                        value={fight.was}
                        pipelineKey={key(`landing.planCards[${i}].fights[${f}].was`)}
                        onChange={(v) => fit({ was: v })}
                      />
                      <TextField
                        label="Saving"
                        value={fight.save}
                        pipelineKey={key(`landing.planCards[${i}].fights[${f}].save`)}
                        onChange={(v) => fit({ save: v })}
                      />
                      <button
                        data-icon="trash"
                        aria-label="Remove"
                        type="button"
                        className="demo__feature-remove"
                        data-destructive=""
                        onClick={() => edit({ fights: card.fights.filter((_, j) => j !== f) })}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  )
                })}
                <button
                  type="button"
                  className="ed-add"
                  onClick={() => edit({ fights: [...card.fights, blankPlanFight(card.fights)] })}
                >
                  Add a fight
                </button>
                <TextField
                  label="Over the posters"
                  value={card.postersLine}
                  pipelineKey={key(`landing.planCards[${i}].postersLine`)}
                  onChange={(v) => edit({ postersLine: v })}
                  rows={2}
                  helpText="Fills on a card selling a whole year. Empty draws neither it nor the posters."
                />
                {card.posters.map((poster, q) => (
                  <div className="demo__feature" key={poster.id}>
                    <TextField
                      label={`Poster ${q + 1}`}
                      value={poster.when}
                      pipelineKey={key(`landing.planCards[${i}].posters[${q}].when`)}
                      onChange={(v) =>
                        edit({
                          posters: card.posters.map((one, j) => (j === q ? { ...one, when: v } : one)),
                        })
                      }
                      helpText="The date across the foot of the artwork."
                    />
                    <button
                      data-icon="trash"
                      aria-label="Remove"
                      type="button"
                      className="demo__feature-remove"
                      data-destructive=""
                      onClick={() => edit({ posters: card.posters.filter((_, j) => j !== q) })}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="ed-add"
                  onClick={() =>
                    edit({ posters: [...card.posters, { id: `po-${card.posters.length + 1}`, when: '' }] })
                  }
                >
                  Add a poster
                </button>
                {card.perks.map((perk, k) => (
                  <div className="demo__feature" key={perk.id}>
                    <TextField
                      label={`Line ${k + 1}`}
                      value={perk.text}
                      pipelineKey={key(`landing.planCards[${i}].perks[${k}].text`)}
                      onChange={(v) =>
                        edit({ perks: card.perks.map((one, j) => (j === k ? { ...one, text: v } : one)) })
                      }
                    />
                    <ToggleField
                      label="A note rather than a tick"
                      checked={perk.info}
                      onChange={(v) =>
                        edit({ perks: card.perks.map((one, j) => (j === k ? { ...one, info: v } : one)) })
                      }
                      hint="Drawn with an i, and quieter: something to know, not something you get."
                    />
                    <button
                      data-icon="trash"
                      aria-label="Remove"
                      type="button"
                      className="demo__feature-remove"
                      data-destructive=""
                      onClick={() => edit({ perks: card.perks.filter((_, j) => j !== k) })}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="ed-add"
                  onClick={() => edit({ perks: [...card.perks, blankPerk(card.perks)] })}
                >
                  Add a line
                </button>
                <ToggleField
                  label="The year's card"
                  checked={card.gold}
                  onChange={(v) => edit({ gold: v })}
                  hint="Gold outline and a gold name."
                />
                <ToggleField
                  label="Chosen"
                  checked={card.chosen}
                  onChange={(v) =>
                    write({
                      /* One filled radio: choosing this one unchooses the rest,
                         because a picker showing two choices has made none. */
                      planCards: all.map((one, j) => ({ ...one, chosen: v && j === i })),
                    })
                  }
                />
                <button
                  data-icon="trash"
                  aria-label="Remove"
                  type="button"
                  className="demo__feature-remove"
                  data-destructive=""
                  onClick={() => write({ planCards: all.filter((_, j) => j !== i) })}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ed-add"
            onClick={() => write({ planCards: [...planCardsOf(inst), blankPlanCard(planCardsOf(inst))] })}
          >
            Add a plan
          </button>
          <TextField
            label="The way to the rest"
            value={t.planPickMore}
            pipelineKey={key('landing.planPickMore')}
            onChange={(v) => write({ planPickMore: v })}
            helpText="Under the cards, with a chevron. Empty draws none."
          />
          <TextField
            label="Button"
            value={t.planPickCta}
            pipelineKey={key('landing.planPickCta')}
            onChange={(v) => write({ planPickCta: v })}
          />
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
                    one of its own, or none. */}
                <ImagePicker
                  // 130 by 83, as the row draws it.
                  aspect="130 / 83"
                  src={feature.image}
                  shipped={featureArt[feature.tag]?.photo}
                  off={feature.imageOff}
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
