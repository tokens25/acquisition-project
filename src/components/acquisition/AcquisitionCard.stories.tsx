import type { Meta, StoryObj } from '@storybook/react-vite'
import { CardSetView } from '../../card/CardSetView'
import { RuledCard } from '../../card/RuledCard'
import { defaultSet } from '../../rules/defaults'

/**
 * The card as the product renders it — through the rules layer, never with
 * hand-set props. Switch `ultimate` or `discount` and several outputs move
 * together, because that is what the rules say they do.
 */
const meta = {
  title: 'Acquisition/AcquisitionCard',
  component: RuledCard,
  parameters: { layout: 'centered' },
  args: {
    card: defaultSet.cards[0],
    market: defaultSet.markets[0],
    device: 'desktop' as const,
    descriptionLines: 2 as const,
  },
} satisfies Meta<typeof RuledCard>

export default meta
type Story = StoryObj<typeof meta>

/** Ultimate + Discount — gold stroke, badge, gold CTA, savings strip. */
export const UltimateDiscounted: Story = { args: {} }

/** Standard + Discount — same content rules, no gold treatment. */
export const StandardDiscounted: Story = {
  args: { card: { ...defaultSet.cards[0], ultimate: false, planName: 'Standard' } },
}

/** No discount — no caption, no struck price, no explainer, plain CTA area. */
export const FullPrice: Story = {
  args: { card: { ...defaultSet.cards[2], planName: 'Flex' } },
}

/** Two rows of tiles, because no add-on is present (§5). */
export const TwoLogoRows: Story = {
  args: { card: { ...defaultSet.cards[2], logoTotal: 14 } },
}

/** The compact type scale below the desktop breakpoint. */
export const Mobile: Story = {
  args: { device: 'mobile' as const },
}

/** A whole set — S-2 and S-3 resolve across the cards, not per card. */
export const WholeSet: StoryObj = {
  render: () => <CardSetView set={defaultSet} />,
  parameters: { layout: 'padded' },
}

/** Germany — the same base card, resolved through its market overrides. */
export const GermanMarket: StoryObj = {
  render: () => <CardSetView set={defaultSet} context={{ market: 'DE' }} />,
  parameters: { layout: 'padded' },
}

/** Germany during the World Cup campaign — two overrides stacked. */
export const GermanCampaign: StoryObj = {
  render: () => <CardSetView set={defaultSet} context={{ market: 'DE', campaign: 'wc26' }} />,
  parameters: { layout: 'padded' },
}
