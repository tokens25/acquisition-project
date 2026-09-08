import './studio.css'

import { useState } from 'react'
import { Field, CharacterCounter, LimitMessage, WithInsetCounter } from './Field'
import { SegmentedControl } from './SegmentedControl'
import { StudioToggle } from './StudioToggle'
import { TextArea, TextInput } from './TextInput'
import { checkCopy, type CopyLimit } from './copy'

/**
 * The ported controls, on one page, at /controls.
 *
 * A place to look at them working before any of them is wired into the tool —
 * the studio they came from is a Next app that will not run on this machine,
 * so this is how they can be seen at all. Nothing else imports this; deleting
 * the file and its route removes it without trace.
 */

const TITLE: CopyLimit = { soft: 40, hard: 60 }
const BODY: CopyLimit = { soft: 120, hard: 180 }

export function Gallery() {
  const [title, setTitle] = useState('Watch every match live')
  const [body, setBody] = useState(
    'Stream MSG and YES only on DAZN and watch every local Knicks, Yankees, Nets, Rangers, Devils, Islanders and Sabres game live or on demand.',
  )
  const [mode, setMode] = useState<'market' | 'dev'>('market')
  const [tab, setTab] = useState<'standard' | 'ultimate' | 'partner'>('standard')
  const [highlight, setHighlight] = useState(true)
  const [discount, setDiscount] = useState(false)

  const titleCheck = checkCopy(title, TITLE)
  const bodyCheck = checkCopy(body, BODY)

  return (
    <main className="st-gallery">
      <h1 className="st-gallery__head">Studio controls</h1>
      <p className="st-gallery__note">
        Ported from Project A. Denser than the design system’s own fields — meant for a panel of
        many controls, not for a form a customer fills in.
      </p>

      <section className="st-gallery__group">
        <h2 className="st-gallery__title">Field, input and counter</h2>
        <Field
          label="Heading"
          htmlFor="g-title"
          hint="Counted against a comfortable length, then a hard one."
          aside={<CharacterCounter check={titleCheck} />}
        >
          <TextInput
            id="g-title"
            value={title}
            status={titleCheck.status}
            maxLength={TITLE.hard}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <LimitMessage value={title} limit={TITLE} />

        <Field label="Under the heading" htmlFor="g-body" hint="The box grows to its text.">
          <WithInsetCounter check={bodyCheck}>
            <TextArea
              id="g-body"
              value={body}
              status={bodyCheck.status}
              onChange={(e) => setBody(e.target.value)}
            />
          </WithInsetCounter>
        </Field>
        <LimitMessage value={body} limit={BODY} />
      </section>

      <section className="st-gallery__group">
        <h2 className="st-gallery__title">Segmented control</h2>
        <SegmentedControl
          ariaLabel="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'market', label: 'Market' },
            { value: 'dev', label: 'Dev' },
          ]}
        />
        {/* Small, full width, and one option that cannot be picked. */}
        <SegmentedControl
          ariaLabel="Tab"
          size="sm"
          fullWidth
          value={tab}
          onChange={setTab}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'ultimate', label: 'Ultimate' },
            { value: 'partner', label: 'Partner', disabled: true },
          ]}
        />
      </section>

      <section className="st-gallery__group">
        <h2 className="st-gallery__title">Switch</h2>
        <StudioToggle
          id="g-highlight"
          checked={highlight}
          onChange={setHighlight}
          label="Highlighted tier"
          description="Draws the plan card in the brand gradient."
        />
        <StudioToggle
          id="g-discount"
          checked={discount}
          onChange={setDiscount}
          label="Apply discount"
        />
        <StudioToggle checked={false} onChange={() => {}} label="Not available here" disabled />
      </section>
    </main>
  )
}
