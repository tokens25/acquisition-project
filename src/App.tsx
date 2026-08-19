import { useState } from 'react'
import './App.css'
import { AcquisitionCard, PlanFeatures, type Device } from './components/acquisition'
import {
  extendedTeamLogos,
  featureCopy,
  planDescription,
  teamLogos,
  worldCupAddOn,
} from './data/plans'
import { CardEditor } from './editor/CardEditor'
import { LiveCard } from './editor/LiveCard'
import { useCardContent } from './editor/useCardContent'

/**
 * Acquisition — the plan picker.
 *
 * The top section is an editor: every `AcquisitionCard` field as an input,
 * with the card rendering live beside it. Below sit the four Figma variants
 * as a fixed reference:
 *   1. Ultimate, discounted, with an included add-on
 *   2. Standard, discounted, with an included add-on
 *   3. Standard, full price, two rows of competitions
 *   4. Ultimate, full price, two rows of competitions
 */
export function App() {
  const [device, setDevice] = useState<Device>('desktop')
  const store = useCardContent()

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Choose your plan</h1>
        <p className="page__subtitle">
          Cancel anytime. Prices shown include VAT where applicable.
        </p>
      </header>

      <section className="page__section">
        <div className="page__section-head">
          <h2 className="page__section-title">Compose a card</h2>
        </div>
        <p className="page__section-note">
          Every field on the card, editable. Changes render immediately and are kept in this
          browser — use Export JSON to hand the content on.
        </p>
        <div className="page__editor">
          <CardEditor store={store} />
          <div className="page__preview">
            <LiveCard content={store.content} />
          </div>
        </div>
      </section>

      <section className="page__section">
        <div className="page__section-head">
          <h2 className="page__section-title">Figma variants</h2>
          <label className="page__control">
            Device
            <select value={device} onChange={(e) => setDevice(e.target.value as Device)}>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
              <option value="xl">Extra big</option>
            </select>
          </label>
        </div>
        <p className="page__section-note">
          The four variants exactly as designed — fixed content, for comparison.
        </p>

        <div className="page__plans">
          {/* Variant 1 — Ultimate, discounted, add-on included */}
          <AcquisitionCard
            device={device}
            ultimate
            eyebrow="Best experience"
            title="{PlanTitle}"
            description={planDescription}
            onMore={() => undefined}
            pricing={{
              price: '€25.99',
              crossedPrice: '€34.99',
              extraInfo: 'For the first 3 months, then €34.99/month',
            }}
            ctaLabel="Get {planName}"
            discount
            logos={{ logos: teamLogos, rows: 'one', total: 9 }}
            addOn={{ ...worldCupAddOn, type: 'included', planName: '{plan name}' }}
            features={<PlanFeatures features={featureCopy} device={device} />}
          />

          {/* Variant 2 — Standard, discounted, add-on included */}
          <AcquisitionCard
            device={device}
            title="{PlanTitle}"
            description={planDescription}
            onMore={() => undefined}
            pricing={{
              price: '€25.99',
              crossedPrice: '€34.99',
              extraInfo: 'For the first 3 months, then €34.99/month',
            }}
            ctaLabel="Get {planName}"
            discount
            logos={{ logos: teamLogos, rows: 'one', total: 9 }}
            addOn={{ ...worldCupAddOn, type: 'included', planName: '{plan name}' }}
            features={<PlanFeatures features={featureCopy} device={device} />}
          />

          {/* Variant 3 — Standard, full price, two rows of competitions */}
          <AcquisitionCard
            device={device}
            title="{PlanTitle}"
            description={planDescription}
            onMore={() => undefined}
            pricing={{ price: '€25.99' }}
            ctaLabel="Get {planName}"
            logos={{ logos: extendedTeamLogos, rows: 'two', total: 14 }}
            features={<PlanFeatures features={featureCopy} device={device} />}
          />

          {/* Variant 4 — Ultimate, full price, two rows of competitions */}
          <AcquisitionCard
            device={device}
            ultimate
            eyebrow="Best experience"
            title="{PlanTitle}"
            description={planDescription}
            onMore={() => undefined}
            pricing={{ price: '€25.99' }}
            ctaLabel="Get {planName}"
            logos={{ logos: extendedTeamLogos, rows: 'two', total: 14 }}
            features={<PlanFeatures features={featureCopy} device={device} />}
          />
        </div>
      </section>
    </main>
  )
}
