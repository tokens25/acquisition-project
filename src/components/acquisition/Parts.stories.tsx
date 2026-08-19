import type { Meta, StoryObj } from '@storybook/react-vite'
import { logoCatalog } from '../../card/assets'
import { defaultSet } from '../../rules/defaults'
import { AddOn } from './AddOn'
import { CardHeader } from './CardHeader'
import { LogoTiles } from './LogoTiles'
import { PlanCta } from './PlanCta'
import { Pricing } from './Pricing'
import addOnImage from '../../assets/addon-world-cup-2026.png'

/**
 * The small components an `AcquisitionCard` is assembled from. These take
 * already-decided values — the rules that produce them live in `src/rules`.
 */
const meta = {
  title: 'Acquisition/Parts',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 295, fontFamily: 'var(--font-family)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

const logos = Object.values(logoCatalog)

export const Header: StoryObj = {
  render: () => (
    <CardHeader
      title="Ultimate"
      description={defaultSet.cards[0].description}
      descriptionLines={2}
      ultimate
      onMore={() => {}}
    />
  ),
}

export const PriceBlock: StoryObj = {
  render: () => (
    <Pricing
      caption="Starts at"
      price="€25.99"
      crossedPrice="€34.99"
      extraInfo="For the first 3 months, then €34.99/month"
    />
  ),
}

export const Cta: StoryObj = {
  render: () => (
    <>
      <PlanCta label="Get Ultimate" ultimate discount discountLabel="Save up to €108 /year" />
      <PlanCta label="Get Standard" discount discountLabel="Save up to €60 /year" />
      <PlanCta label="Get Ultimate" ultimate />
      <PlanCta label="Get Flex" />
    </>
  ),
}

/** One row with overflow, then two rows — both decided by the rules layer. */
export const Logos: StoryObj = {
  render: () => (
    <>
      <LogoTiles logos={logos.slice(0, 4)} rows={1} overflowCount={5} />
      <LogoTiles logos={logos} rows={2} overflowCount={5} />
    </>
  ),
}

export const AddOns: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <AddOn imageSrc={addOnImage} title="FIFA World Cup 2026" subtitle="Covering all 104 matches" type="included" planName="Ultimate" />
      <AddOn imageSrc={addOnImage} title="FIFA World Cup 2026" subtitle="Covering all 104 matches" type="one-time-payment" price="19" />
      <AddOn imageSrc={addOnImage} title="FIFA World Cup 2026" subtitle="Covering all 104 matches" type="discount-code" codeLabel="SUMMER25 applied -15% OFF" />
    </div>
  ),
}
