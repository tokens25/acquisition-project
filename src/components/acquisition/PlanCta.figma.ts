// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%93%8D-DAZN-Lab?node-id=520-108928
// source=src/components/acquisition/PlanCta.tsx
// component=PlanCta
import figma from 'figma'

const instance = figma.selectedInstance

const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
})
const highlighted = instance.getBoolean('Highlighted')
// The Figma variant name is spelled "Ture" — map both so either publishes.
const discount = instance.getEnum('Discount', {
  Ture: true,
  True: true,
  False: false,
})

export default {
  example: figma.code`<PlanCta
  label={\`Get \${plan.name}\`}${highlighted ? '\n  highlighted' : ''}${discount ? '\n  discount' : ''}
  device="${device}"
/>`,
  imports: ['import { PlanCta } from "./components/acquisition"'],
  id: 'acquisition-plan-cta',
  metadata: { nestable: true },
}
