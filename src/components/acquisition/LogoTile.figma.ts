// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%93%8D-DAZN-Lab?node-id=520-108980
// source=src/components/acquisition/LogoTiles.tsx
// component=LogoTile
import figma from 'figma'

const instance = figma.selectedInstance

// Logo or "+x" — one slot, two things it can hold. Device is the size, which
// the row above sets for every slot at once, so it is not mapped here.
const type = instance.getEnum('Type', {
  Logo: 'logo',
  '+x': 'count',
})

export default {
  example:
    type === 'logo'
      ? figma.code`<LogoTile logo={competition} />`
      : figma.code`<LogoTile count={plan.hiddenCount} />`,
  imports: ['import { LogoTile } from "./components/acquisition"'],
  id: 'acquisition-logo-tile',
  metadata: { nestable: true },
}
