// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=1-25486
// source=src/components/acquisition/PlanCta.tsx
// component=PlanCta
import figma from 'figma'

const instance = figma.selectedInstance

const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
})
const ultimate = instance.getBoolean('Ultimate')
// The Figma variant name is spelled "Ture" — map both so either publishes.
const discount = instance.getEnum('Discount', {
  Ture: true,
  True: true,
  False: false,
})

export default {
  example: figma.code`<PlanCta
  label={\`Get \${plan.name}\`}${ultimate ? '\n  ultimate' : ''}${discount ? '\n  discount' : ''}
  device="${device}"
/>`,
  imports: ['import { PlanCta } from "./components/acquisition"'],
  id: 'acquisition-plan-cta',
  metadata: { nestable: true },
}
