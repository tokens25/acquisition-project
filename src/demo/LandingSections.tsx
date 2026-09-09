import { useState } from 'react'

import { FieldGroup } from './FieldGroup'
import { TextField } from '../components/TextField'
import { Toggle } from '../components/Toggle'
import { ToggleField } from '../components/ToggleField'
import {
  blankFeature,
  blankLink,
  blankProvider,
  blankQuestion,
  featuresOf,
  landingText,
  linksOf,
  providersOf,
  questionsOf,
} from '../rules/landing'
import { resolveFlow, writeFlow } from '../rules/layers'
import {
  SECTION_LABEL,
  SECTION_TYPES,
  isFirst,
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
import type { LandingScreen } from '../rules/flow'
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
export function LandingSections({ store, scope }: { store: CardSetStore; scope: Selector }) {
  const { set, updateSet } = store
  const l = resolveFlow(set).landing
  const list = sectionsOf(l)

  /** Writes the arrangement itself — order, on and off, what exists. */
  const arrange = (next: PageSection[]) =>
    updateSet(writeFlow(set, scope, 'landing', { sections: next }))

  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null)

  return (
    <>
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
              type="button"
              className="demo__feature-remove"
              title={`Remove ${link.label || 'this link'}`}
              onClick={() => write({ footerLinks: links.filter((_, j) => j !== i) })}
            >
              Remove
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
 * A kind can be added more than once. The second is a new block with its own
 * words, exactly as duplicating gives you.
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
              onClick={() => {
                onAdd(type)
                setOpen(false)
              }}
            >
              {SECTION_LABEL[type]}
              {!missing.includes(type) && <span className="ls-add__again">another</span>}
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
  onOver: (after: boolean) => void
  onLeave: () => void
  onDrop: (id: string, after: boolean) => void
  onNudge: (delta: number) => void
  onToggle: (on: boolean) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const { set, updateSet } = store
  const l = resolveFlow(set).landing
  const own = l.sectionCopy?.[section.id]
  /** This instance's content: the page's, and its own on top of it. */
  const inst: LandingScreen = own ? { ...l, ...own } : l
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
      <FieldGroup
        title={
          <span className="ls-card__name">
            <span className="ls-card__grip" aria-hidden="true" />
            {label}
            {!isFirst(section) && <span className="ls-card__copy">copy</span>}
          </span>
        }
        aside={<Toggle active={section.on} onChange={onToggle} label={`Show ${label}`} />}
        defaultOpen={false}
      >
        {/* The same card the panel wraps a tab or a benefit in, so a component
            reads as one thing rather than a run of loose fields. */}
        <div className="demo__feature">
          <SectionFields section={section} t={t} inst={inst} write={write} keyOf={key} />
        </div>
      </FieldGroup>
      {/* Outside the fold, where Remove tabs sits under the tabs: what you do
          to a component is available whether or not you are looking inside it. */}
      <div className="ls-card__foot">
        <button
          type="button"
          className="demo__feature-remove"
          title={`Add another ${label}`}
          onClick={onDuplicate}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="demo__feature-remove"
          title={
            isFirst(section)
              ? `Take ${label} off the page — its words stay, and Add a component brings it back`
              : 'Delete this copy'
          }
          onClick={onRemove}
        >
          Delete
        </button>
      </div>
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
          <TextField label="Field" value={t.zipLabel} pipelineKey={key('landing.zipLabel')} onChange={(v) => write({ zipLabel: v })} />
          <TextField label="Code shown" value={t.zipValue} pipelineKey={key('landing.zipValue')} onChange={(v) => write({ zipValue: v })} />
          <TextField label="Button" value={t.zipCta} pipelineKey={key('landing.zipCta')} onChange={(v) => write({ zipCta: v })} />
        </>
      )

    case 'schedule':
      return (
        <>

              <TextField label="Heading" value={t.scheduleHeading} pipelineKey={key('landing.scheduleHeading')} onChange={(v) => write({ scheduleHeading: v })} rows={2} helpText="The fixtures under it are what DAZN is showing, not something written here." />
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
                      type="button"
                      className="demo__feature-remove"
                      onClick={() => write({ providers: all.filter((_, j) => j !== i) })}
                    >
                      Remove
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
                  type="button"
                  className="demo__feature-remove"
                  onClick={() => write({ features: all.filter((_, j) => j !== i) })}
                >
                  Remove
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
                      type="button"
                      className="demo__feature-remove"
                      onClick={() => write({ faqs: all.filter((_, j) => j !== i) })}
                    >
                      Remove
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
