// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%93%8D-DAZN-Lab?node-id=520-108989
// source=src/components/acquisition/LogoTiles.tsx
// component=LogoTiles
import figma from 'figma'

const instance = figma.selectedInstance

// Rows is how many rows, and nothing else. Whether the last slot is a badge
// or a "+N" is the tile's own variant — `.LogoTile` Type — which the code
// models as `overflowCount` above zero.
const rows = instance.getEnum('Rows', { One: 1, Two: 2 })

export default {
  example: figma.code`<LogoTiles logos={plan.logos} rows={${rows}} overflowCount={plan.hiddenCount} />`,
  imports: ['import { LogoTiles } from "./components/acquisition"'],
  id: 'acquisition-logo-tiles',
  metadata: { nestable: true },
}
