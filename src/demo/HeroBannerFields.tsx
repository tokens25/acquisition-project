import { useRef } from 'react'

import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import { ToggleField } from '../components/ToggleField'
import { FieldGroup } from './FieldGroup'
import { heroOf } from '../rules/landing'
import { HERO_LIMITS } from '../rules/flow'
import type { HeroLabelVariant, HeroLogoSize, LandingScreen } from '../rules/flow'
import { resolveFlow, writeFlow } from '../rules/layers'
import type { CardSetStore } from '../editor/useCardSet'
import type { Selector } from '../rules/layers'

/**
 * The hero banner's controls, as the hero banner tool has them.
 *
 * The two projects do not share a stack — that one is Next and Tailwind with
 * its own store, this one is Vite and plain CSS with a layered card set — so
 * nothing could be copied across. What is carried over verbatim is the part
 * that matters: which controls exist, in which order, under which headings,
 * with which words, and the character budgets each field is held to.
 *
 * Its left rail reads Creative, then Copy, then CTA, then Logo. So does this.
 *
 * Three of its fields are deliberately not repeated here. The heading, the
 * line under it and the gold button are the landing page's `title`, `body`
 * and `cta`, and this panel writes those same fields rather than keeping a
 * second copy: a panel and a preview disagreeing about one string is the
 * failure that having one source of truth prevents.
 *
 * Two things the hero tool has are not here at all, and they are absences
 * rather than oversights. Its AI copy menu and regenerate button run a
 * generate-then-review loop through an API route, which is a system and not a
 * control. And its price, eyebrow, helper and logo are drawn by its own
 * canvas; this page's hero does not draw them yet, so those fields are
 * authored and stored here and the note under each one says so instead of a
 * preview quietly ignoring what somebody typed.
 */
export function HeroBannerFields({
  store,
  scope,
}: {
  store: CardSetStore
  scope: Selector
}) {
  const { set, updateSet } = store
  const flow = resolveFlow(set)
  const l = flow.landing
  const hero = heroOf(l)
  const file = useRef<HTMLInputElement>(null)

  /** Writes one hero field to the chosen scope, and nothing else. */
  const patch = (next: Partial<LandingScreen>) =>
    updateSet(writeFlow(set, scope, 'landing', next))

  /**
   * How much of a field's budget is used, in the hero tool's own terms: within
   * the recommended length, past it, or past the point it stops fitting.
   */
  const counter = (value: string, limit: { soft: number; hard: number }) => {
    const n = value.length
    const state = n > limit.hard ? 'over' : n > limit.soft ? 'tight' : 'fine'
    return (
      <span className="hb-count" data-state={state}>
        {n}/{limit.soft}
      </span>
    )
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const read = new FileReader()
    read.onload = () => patch({ heroImage: String(read.result ?? '') })
    read.readAsDataURL(f)
    // Cleared so choosing the same file twice still fires a change.
    e.target.value = ''
  }

  return (
    <>
      <FieldGroup title="Picture">
        <div className="hb-image">
          {hero.image ? (
            <>
              <img className="hb-image__shot" src={hero.image} alt="" />
              <div className="hb-image__acts">
                <button type="button" className="hb-image__act" onClick={() => file.current?.click()}>
                  Replace
                </button>
                <button
                  type="button"
                  className="hb-image__act"
                  onClick={() => patch({ heroImage: '' })}
                >
                  Remove
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="hb-image__drop" onClick={() => file.current?.click()}>
              <span className="hb-image__plus" aria-hidden="true">
                +
              </span>
              Upload an image
              <small>The shipped picture is used until you do.</small>
            </button>
          )}
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hb-image__file"
            onChange={pick}
            aria-label="Upload an image"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Copy">
        <ToggleField
          label="Label (eyebrow)"
          checked={hero.labelEnabled}
          onChange={(v) => patch({ heroLabelEnabled: v })}
          hint="The small line above the heading."
        />
        {hero.labelEnabled && (
          <>
            <SelectField<HeroLabelVariant>
              label="Kind of label"
              value={hero.labelVariant}
              options={[
                { value: 'standard', label: 'Date' },
                { value: 'gold', label: 'Date, gold' },
                { value: 'discount', label: 'Offer, free text' },
              ]}
              onChange={(v) => patch({ heroLabelVariant: v })}
              helpText={
                hero.labelVariant === 'discount'
                  ? 'Free text, such as LIMITED-TIME OFFER.'
                  : 'A date, such as 19 JUL 2026. Keep it on one line.'
              }
            />
            <TextField
              label="Label"
              value={hero.label}
              pipelineKey={'landing.heroLabel'}
              onChange={(v) => patch({ heroLabel: v })}
              trailing={counter(hero.label, HERO_LIMITS.label)}
              helpText={HERO_LIMITS.label.note}
            />
          </>
        )}

        <TextField
          label="Heading"
          value={l.title}
          pipelineKey={'landing.title'}
          onChange={(v) => patch({ title: v })}
          trailing={counter(l.title, HERO_LIMITS.title)}
          helpText={HERO_LIMITS.title.note}
        />
        <TextField
          label="Under the heading"
          value={l.body}
          pipelineKey={'landing.body'}
          onChange={(v) => patch({ body: v })}
          rows={2}
          trailing={counter(l.body, HERO_LIMITS.body)}
          helpText={HERO_LIMITS.body.note}
        />
      </FieldGroup>

      <FieldGroup title="CTA">
        <TextField
          label="CTA text"
          value={l.cta}
          pipelineKey={'landing.cta'}
          onChange={(v) => patch({ cta: v })}
          trailing={counter(l.cta, HERO_LIMITS.cta)}
          helpText={HERO_LIMITS.cta.note}
        />
        <TextField
          label="Second button"
          value={l.altCta}
          pipelineKey={'landing.altCta'}
          onChange={(v) => patch({ altCta: v })}
        />
        <ToggleField
          label="Helper text"
          checked={hero.helperEnabled}
          onChange={(v) => patch({ heroHelperEnabled: v })}
          hint="Fine print under the buttons."
        />
        {hero.helperEnabled && (
          <TextField
            label="Helper text"
            value={hero.helper}
            pipelineKey={'landing.heroHelper'}
            onChange={(v) => patch({ heroHelper: v })}
            rows={2}
            trailing={counter(hero.helper, HERO_LIMITS.helper)}
            helpText={`${HERO_LIMITS.helper.note} This page's hero does not draw it yet.`}
          />
        )}
      </FieldGroup>

      <FieldGroup title="Price" defaultOpen={false}>
        <ToggleField
          label="Price block"
          checked={hero.priceEnabled}
          onChange={(v) => patch({ heroPriceEnabled: v })}
          hint="Written in four parts, the way the hero tool writes it."
        />
        {hero.priceEnabled && (
          <>
            <TextField
              label="Prefix"
              value={hero.pricePrefix}
              pipelineKey={'landing.heroPricePrefix'}
              onChange={(v) => patch({ heroPricePrefix: v })}
              helpText="Such as From."
            />
            <TextField
              label="Price"
              value={hero.priceValue}
              pipelineKey={'landing.heroPriceValue'}
              onChange={(v) => patch({ heroPriceValue: v })}
            />
            <TextField
              label="Suffix"
              value={hero.priceSuffix}
              pipelineKey={'landing.heroPriceSuffix'}
              onChange={(v) => patch({ heroPriceSuffix: v })}
              helpText="Such as / month."
            />
            <TextField
              label="Old price"
              value={hero.priceOld}
              pipelineKey={'landing.heroPriceOld'}
              onChange={(v) => patch({ heroPriceOld: v })}
              helpText="Shown struck through, for a discount. This page's hero does not draw the price yet."
            />
          </>
        )}
      </FieldGroup>

      <FieldGroup title="Logo" defaultOpen={false}>
        <ToggleField
          label="Logo"
          checked={hero.logoEnabled}
          onChange={(v) => patch({ heroLogoEnabled: v })}
          hint="The DAZN mark over the picture. This page's hero draws its own, so this does not change it yet."
        />
        {hero.logoEnabled && (
          <SelectField<HeroLogoSize>
            label="Logo size"
            value={hero.logoSize}
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
            onChange={(v) => patch({ heroLogoSize: v })}
          />
        )}
      </FieldGroup>
    </>
  )
}
