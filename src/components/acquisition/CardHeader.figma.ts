// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%93%8D-DAZN-Lab?node-id=520-108859
// source=src/components/acquisition/CardHeader.tsx
// component=CardHeader
import figma from 'figma'

const instance = figma.selectedInstance

const device = instance.getEnum('Device', {
  Mobile: 'mobile',
  Desktop: 'desktop',
  'Extra big': 'xl',
})
const highlighted = instance.getBoolean('Highlighted')

export default {
  example: figma.code`<CardHeader
  title={plan.title}
  description={plan.description}
  device="${device}"${highlighted ? '\n  highlighted' : ''}
/>`,
  imports: ['import { CardHeader } from "./components/acquisition"'],
  id: 'acquisition-card-header',
  metadata: { nestable: true },
}
