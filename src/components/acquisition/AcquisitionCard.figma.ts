// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%93%8D-DAZN-Lab?node-id=530-24501
// source=src/components/acquisition/AcquisitionCard.tsx
// component=AcquisitionCard
import figma from 'figma'

const instance = figma.selectedInstance

// The Figma variants differ by Highlighted (gold treatment) and whether the
// plan carries a discount / add-on, so they are read off the card's contents
// rather than off the `ID` variant name.
const showEyebrow = instance.getBoolean('Show Label/Eyebrow')

export default {
  example: figma.code`<AcquisitionCard${showEyebrow ? ' highlighted eyebrow="Best experience"' : ''}
  title={plan.title}
  description={plan.description}
  pricing={{ price: plan.price }}
  ctaLabel={\`Get \${plan.name}\`}
  logos={{ logos: plan.logos, rows: "one", total: plan.competitionCount }}
  features={<PlanFeatures features={plan.features} />}
/>`,
  imports: [
    'import { AcquisitionCard, PlanFeatures } from "./components/acquisition"',
  ],
  id: 'acquisition-card',
}
