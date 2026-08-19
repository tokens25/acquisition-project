import { useRef } from 'react'
import './editor.css'
import type { AddOnType, Device } from '../components/acquisition'
import { logoCatalog, type LogoRef } from './content'
import { CheckField, FieldGroup, SelectField, TextArea, TextField } from './Field'
import type { CardContentStore } from './useCardContent'

const DEVICES: { value: Device; label: string }[] = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'xl', label: 'Extra big' },
]

const ADDON_TYPES: { value: AddOnType; label: string }[] = [
  { value: 'included', label: 'Included in plan' },
  { value: 'one-time-payment', label: 'One time payment' },
  { value: 'discount-code', label: 'Discount code' },
]

/**
 * The content form. One input per `AcquisitionCard` prop — editing any field
 * re-renders the live card beside it immediately.
 */
export function CardEditor({ store }: { store: CardContentStore }) {
  const { content, update, updateSection, reset, exportJson, importJson, importError } = store
  const fileInput = useRef<HTMLInputElement>(null)

  const toggleLogo = (id: string) => {
    const has = content.logos.items.some((l) => l.id === id)
    const items: LogoRef[] = has
      ? content.logos.items.filter((l) => l.id !== id)
      : [...content.logos.items, { id, alt: logoCatalog[id].alt }]
    updateSection('logos', { items })
  }

  const setFeature = (index: number, value: string) => {
    const features = [...content.features]
    features[index] = value
    update({ features })
  }

  return (
    <form className="ed" onSubmit={(e) => e.preventDefault()}>
      <div className="ed__bar">
        <button type="button" className="ed__btn" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" className="ed__btn" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        <button type="button" className="ed__btn ed__btn--quiet" onClick={reset}>
          Reset
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importJson(file)
            e.target.value = ''
          }}
        />
      </div>
      {importError && <p className="ed__error">Import failed: {importError}</p>}
      <p className="ed__saved">Saved to this browser as you type.</p>

      <FieldGroup title="Content">
        <TextField label="Plan title" value={content.title} onChange={(v) => update({ title: v })} />
        <TextArea
          label="Description"
          value={content.description}
          onChange={(v) => update({ description: v })}
        />
        <TextField
          label="“More” label"
          value={content.moreLabel}
          onChange={(v) => update({ moreLabel: v })}
        />
      </FieldGroup>

      <FieldGroup title="Pricing">
        <TextField
          label="Caption"
          value={content.pricing.caption}
          onChange={(v) => updateSection('pricing', { caption: v })}
        />
        <TextField
          label="Price"
          value={content.pricing.price}
          onChange={(v) => updateSection('pricing', { price: v })}
        />
        <TextField
          label="Crossed-out price"
          hint="Leave empty to hide it."
          value={content.pricing.crossedPrice}
          onChange={(v) => updateSection('pricing', { crossedPrice: v })}
        />
        <TextField
          label="Billing period"
          value={content.pricing.installment}
          onChange={(v) => updateSection('pricing', { installment: v })}
        />
        <TextField
          label="Small print"
          hint="Leave empty to hide it."
          value={content.pricing.extraInfo}
          onChange={(v) => updateSection('pricing', { extraInfo: v })}
        />
      </FieldGroup>

      <FieldGroup title="Call to action">
        <TextField
          label="CTA label"
          value={content.ctaLabel}
          onChange={(v) => update({ ctaLabel: v })}
        />
        <CheckField
          label="Show savings eyebrow"
          checked={content.discount}
          onChange={(v) => update({ discount: v })}
        />
        <TextField
          label="Savings copy"
          value={content.discountLabel}
          onChange={(v) => update({ discountLabel: v })}
        />
      </FieldGroup>

      <FieldGroup title="Competition logos">
        <div className="ed-logos">
          {Object.entries(logoCatalog).map(([id, logo]) => {
            const on = content.logos.items.some((l) => l.id === id)
            return (
              <button
                key={id}
                type="button"
                className="ed-logo"
                data-on={on || undefined}
                onClick={() => toggleLogo(id)}
                title={logo.alt}
                aria-pressed={on}
              >
                <img src={logo.src} alt={logo.alt} />
              </button>
            )
          })}
        </div>
        <SelectField
          label="Rows"
          value={content.logos.rows}
          options={[
            { value: 'one', label: 'One row' },
            { value: 'two', label: 'Two rows' },
          ]}
          onChange={(v) => updateSection('logos', { rows: v })}
        />
        <TextField
          label="Total competitions"
          hint='Drives the trailing "+N" tile. Empty uses the number of logos selected.'
          value={content.logos.total}
          onChange={(v) => updateSection('logos', { total: v })}
        />
      </FieldGroup>

      <FieldGroup title="Add-on">
        <CheckField
          label="Show add-on"
          checked={content.addOn.enabled}
          onChange={(v) => updateSection('addOn', { enabled: v })}
        />
        <SelectField
          label="Type"
          value={content.addOn.type}
          options={ADDON_TYPES}
          onChange={(v) => updateSection('addOn', { type: v })}
        />
        <TextField
          label="Title"
          value={content.addOn.title}
          onChange={(v) => updateSection('addOn', { title: v })}
        />
        <TextField
          label="Subtitle"
          value={content.addOn.subtitle}
          onChange={(v) => updateSection('addOn', { subtitle: v })}
        />
        <TextField
          label="Image URL"
          hint="Empty uses the bundled World Cup thumbnail."
          value={content.addOn.imageSrc}
          onChange={(v) => updateSection('addOn', { imageSrc: v, imageId: v ? '' : 'world-cup' })}
        />
        {content.addOn.type === 'included' && (
          <TextField
            label="Included in plan"
            value={content.addOn.planName}
            onChange={(v) => updateSection('addOn', { planName: v })}
          />
        )}
        {content.addOn.type === 'one-time-payment' && (
          <TextField
            label="One-off price"
            value={content.addOn.price}
            onChange={(v) => updateSection('addOn', { price: v })}
          />
        )}
        {content.addOn.type === 'discount-code' && (
          <TextField
            label="Discount code copy"
            value={content.addOn.codeLabel}
            onChange={(v) => updateSection('addOn', { codeLabel: v })}
          />
        )}
      </FieldGroup>

      <FieldGroup title="Features">
        {content.features.map((feature, i) => (
          <div className="ed-row" key={i}>
            <TextField
              label={`Feature ${i + 1}`}
              value={feature}
              onChange={(v) => setFeature(i, v)}
            />
            <button
              type="button"
              className="ed__btn ed__btn--quiet ed__btn--icon"
              onClick={() => update({ features: content.features.filter((_, j) => j !== i) })}
              aria-label={`Remove feature ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ed__btn"
          onClick={() => update({ features: [...content.features, 'New feature'] })}
        >
          Add feature
        </button>
      </FieldGroup>

      <FieldGroup title="Display">
        <CheckField
          label="Ultimate treatment"
          hint="Gold border, gold gradient title and gold CTA."
          checked={content.ultimate}
          onChange={(v) => update({ ultimate: v })}
        />
        <TextField
          label="Corner eyebrow"
          hint="Leave empty for no eyebrow."
          value={content.eyebrow}
          onChange={(v) => update({ eyebrow: v })}
        />
        <TextField
          label="Footer link label"
          hint="Leave empty to drop the footer."
          value={content.footerLabel}
          onChange={(v) => update({ footerLabel: v })}
        />
        <SelectField
          label="Device"
          value={content.device}
          options={DEVICES}
          onChange={(v) => update({ device: v })}
        />
      </FieldGroup>
    </form>
  )
}
