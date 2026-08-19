import type { Meta, StoryObj } from '@storybook/react-vite'
import { featureCopy, planDescription, teamLogos, worldCupAddOn } from '../../data/plans'
import { AddOn } from './AddOn'
import { CardHeader } from './CardHeader'
import { LogoTiles } from './LogoTiles'
import { PlanCta } from './PlanCta'
import { PlanFeatures } from './PlanFeatures'
import { Pricing } from './Pricing'

/**
 * The small components an `AcquisitionCard` is assembled from. Each one is
 * independently usable and carries the same `device` variant as the card.
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

export const Header: StoryObj = {
  render: () => (
    <CardHeader title="{PlanTitle}" description={planDescription} ultimate onMore={() => {}} />
  ),
}

export const PriceBlock: StoryObj = {
  render: () => (
    <Pricing
      price="€25.99"
      crossedPrice="€34.99"
      extraInfo="For the first 3 months, then €34.99/month"
    />
  ),
}

export const Cta: StoryObj = {
  render: () => (
    <>
      <PlanCta label="Get {planName}" ultimate discount />
      <PlanCta label="Get {planName}" discount />
      <PlanCta label="Get {planName}" ultimate />
      <PlanCta label="Get {planName}" />
    </>
  ),
}

export const Logos: StoryObj = {
  render: () => (
    <>
      <LogoTiles logos={teamLogos} rows="one" total={9} />
      <LogoTiles logos={teamLogos} rows="two" total={14} />
    </>
  ),
}

export const AddOns: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <AddOn {...worldCupAddOn} type="included" planName="Ultimate" />
      <AddOn {...worldCupAddOn} type="one-time-payment" price="€19.00" />
      <AddOn {...worldCupAddOn} type="discount-code" codeLabel="{CODE} applied -15% OFF" />
    </div>
  ),
}

export const Features: StoryObj = {
  render: () => <PlanFeatures features={featureCopy} />,
}
