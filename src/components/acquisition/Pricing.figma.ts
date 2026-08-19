// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=13-40201
// source=src/components/acquisition/Pricing.tsx
// component=Pricing
import figma from 'figma'

const instance = figma.selectedInstance

const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
  'Extra Big': 'xl',
})
const price = instance.getString('price')
const crossedPrice = instance.getString('crossedPrice')
const installment = instance.getString('installment')
const showCrossedPrice = instance.getBoolean('showCrossedPrice')
const showExtraInfo = instance.getBoolean('showExtraInfo')

export default {
  example: figma.code`<Pricing
  price="${price}"${showCrossedPrice ? figma.code`
  crossedPrice="${crossedPrice}"` : ''}
  installment="${installment}"${showExtraInfo ? '\n  extraInfo={plan.priceFootnote}' : ''}
  device="${device}"
/>`,
  imports: ['import { Pricing } from "./components/acquisition"'],
  id: 'acquisition-pricing',
  metadata: { nestable: true },
}
