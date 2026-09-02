import type { CoachReviewContext } from '../../brief'
import type { JourneySnapshot } from '../snapshot'
import type { Brain, Finding } from '../types'
import { choiceBrain } from './choice'
import { clarityBrain } from './clarity'
import { copyBrain } from './copy'
import { decisionBrain } from './decision'
import { goalBrain } from './goal'
import { journeyBrain } from './journey'
import { trustBrain } from './trust'

export type BrainFn = (s: JourneySnapshot, ctx: CoachReviewContext) => Finding[]

/** The specialists, in the order the brief lists them. */
export const BRAINS: { id: Brain; run: BrainFn }[] = [
  { id: 'decision', run: decisionBrain },
  { id: 'choice', run: choiceBrain },
  { id: 'clarity', run: clarityBrain },
  { id: 'trust', run: trustBrain },
  { id: 'journey', run: journeyBrain },
  { id: 'goal', run: goalBrain },
  { id: 'copy', run: copyBrain },
]
