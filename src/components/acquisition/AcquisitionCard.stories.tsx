import type { Meta, StoryObj } from '@storybook/react-vite'
import { featureCopy, planDescription, teamLogos, worldCupAddOn } from '../../data/plans'
import { AcquisitionCard } from './AcquisitionCard'
import { PlanFeatures } from './PlanFeatures'

const meta = {
  title: 'Acquisition/AcquisitionCard',
  component: AcquisitionCard,
  parameters: { layout: 'centered' },
  argTypes: {
    device: { control: 'inline-radio', options: ['mobile', 'desktop', 'xl'] },
  },
  args: {
    title: '{PlanTitle}',
    description: planDescription,
    ctaLabel: 'Get {planName}',
    device: 'desktop',
    pricing: { price: '€25.99' },
    features: <PlanFeatures features={featureCopy} />,
  },
} satisfies Meta<typeof AcquisitionCard>

export default meta
type Story = StoryObj<typeof meta>

/** Variant 1 — the flagship plan: gold edge, eyebrow, discount and add-on. */
export const UltimateDiscounted: Story = {
  args: {
    ultimate: true,
    eyebrow: 'Best experience',
    discount: true,
    pricing: {
      price: '€25.99',
      crossedPrice: '€34.99',
      extraInfo: 'For the first 3 months, then €34.99/month',
    },
    logos: { logos: teamLogos, rows: 'one', total: 9 },
    addOn: { ...worldCupAddOn, type: 'included' },
  },
}

/** Variant 2 — same content, standard treatment (white CTA, no gold edge). */
export const StandardDiscounted: Story = {
  args: {
    discount: true,
    pricing: {
      price: '€25.99',
      crossedPrice: '€34.99',
      extraInfo: 'For the first 3 months, then €34.99/month',
    },
    logos: { logos: teamLogos, rows: 'one', total: 9 },
    addOn: { ...worldCupAddOn, type: 'included' },
  },
}

/** Variant 3 — full price, no add-on, two rows of competitions. */
export const StandardFullPrice: Story = {
  args: { logos: { logos: teamLogos, rows: 'two', total: 14 } },
}

/** Variant 4 — Ultimate at full price. */
export const UltimateFullPrice: Story = {
  args: {
    ultimate: true,
    eyebrow: 'Best experience',
    logos: { logos: teamLogos, rows: 'two', total: 14 },
  },
}

/** The compact type scale used below the desktop breakpoint. */
export const Mobile: Story = {
  args: {
    device: 'mobile',
    ultimate: true,
    eyebrow: 'Best experience',
    discount: true,
    pricing: {
      price: '€25.99',
      crossedPrice: '€34.99',
      extraInfo: 'For the first 3 months, then €34.99/month',
    },
    logos: { logos: teamLogos, rows: 'one', total: 9 },
    addOn: { ...worldCupAddOn, type: 'included' },
    features: <PlanFeatures features={featureCopy} device="mobile" />,
  },
}
