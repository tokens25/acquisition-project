// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=28-41885
// source=src/components/acquisition/AddOn.tsx
// component=AddOn
import figma from 'figma'

const instance = figma.selectedInstance

const type = instance.getEnum('Type', {
  Included: 'included',
  'One time payment': 'one-time-payment',
  'Discount code': 'discount-code',
})
const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
})

export default {
  example: figma.code`<AddOn
  type="${type}"
  imageSrc={addOn.image}
  title={addOn.title}
  subtitle={addOn.subtitle}
  device="${device}"
/>`,
  imports: ['import { AddOn } from "./components/acquisition"'],
  id: 'acquisition-add-on',
  metadata: { nestable: true },
}
