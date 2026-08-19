// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=29-40476
// source=src/components/acquisition/CardHeader.tsx
// component=CardHeader
import figma from 'figma'

const instance = figma.selectedInstance

const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
  'Extra big': 'xl',
})
const ultimate = instance.getBoolean('Ultimate')

export default {
  example: figma.code`<CardHeader
  title={plan.title}
  description={plan.description}
  device="${device}"${ultimate ? '\n  ultimate' : ''}
/>`,
  imports: ['import { CardHeader } from "./components/acquisition"'],
  id: 'acquisition-card-header',
  metadata: { nestable: true },
}
