// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=1-64394
// source=src/components/acquisition/Features.tsx
// component=FeaturesList
import figma from 'figma'

const instance = figma.selectedInstance

const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
})

export default {
  example: figma.code`<PlanFeatures features={plan.features} device="${device}" />`,
  imports: ['import { PlanFeatures } from "./components/acquisition"'],
  id: 'acquisition-features-list',
  metadata: { nestable: true },
}
