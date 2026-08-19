// url=https://www.figma.com/design/xJRgzIz9zjvRKTMIqnifEy/%F0%9F%9A%80-Acquisition-for-ai?node-id=1-67967
// source=src/components/acquisition/LogoTiles.tsx
// component=LogoTiles
import figma from 'figma'

const instance = figma.selectedInstance

// "Two +x" is the two-row layout with the trailing overflow tile, which the
// code models with `total` rather than a third layout.
const rows = instance.getEnum('Rows', {
  One: 'one',
  Two: 'two',
  'Two +x': 'two',
})

export default {
  example: figma.code`<LogoTiles logos={plan.logos} rows="${rows}" total={plan.competitionCount} />`,
  imports: ['import { LogoTiles } from "./components/acquisition"'],
  id: 'acquisition-logo-tiles',
  metadata: { nestable: true },
}
