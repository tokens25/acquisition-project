import type { CardSet } from '../rules/content'
import { resolveFlow } from '../rules/layers'
import { defaultFlow } from '../rules/flow'
import type { Step } from '../rules/journey'
import {
  AccountFlowScreen,
  AuthFlowScreen,
  CadenceFlowScreen,
  CheckoutFlowScreen,
  LandingFlowScreen,
  ReadyFlowScreen,
  ZipFlowScreen,
} from '../components/flow/FlowScreens'

/**
 * Picks the screen a step draws, and hands it its copy.
 *
 * The one place that knows a renderer name maps to a component, so adding a
 * screen is adding a case here rather than a condition in three files. Copy
 * falls back to the shipped default per screen: content saved before a screen
 * existed has nothing to say about it, and an empty screen would look like a
 * bug rather than like an older save.
 */
export function FlowStep({
  step,
  state,
  set,
  chosen,
}: {
  step: Step
  /** Which of the step's states to draw. */
  state: string
  set: CardSet
  /**
   * Choices made while walking the prototype, for the screens that offer one.
   * Absent in the frames row, where a screen is a picture of what was written
   * rather than something being used.
   */
  chosen?: { cadence?: string }
}) {
  const flow = resolveFlow(set)

  switch (step.renderer) {
    case 'landing':
      return <LandingFlowScreen content={flow.landing ?? defaultFlow.landing} />
    case 'cadence':
      return (
        <CadenceFlowScreen
          content={flow.cadence ?? defaultFlow.cadence}
          selected={chosen?.cadence}
        />
      )
    case 'auth':
      return <AuthFlowScreen content={flow.auth ?? defaultFlow.auth} />
    case 'account':
      return (
        <AccountFlowScreen
          content={flow.account ?? defaultFlow.account}
          state={state as 'empty' | 'filled' | 'confirmed'}
        />
      )
    case 'zip':
      return (
        <ZipFlowScreen
          content={flow.zip ?? defaultFlow.zip}
          state={state as 'default' | 'edit' | 'edit results'}
          // The teams a ZIP resolves to are the ones the set already knows
          // about, so the screen cannot list a team the cards do not carry.
          logos={set.logoCatalog.slice(0, 5).map((l) => l.id)}
        />
      )
    case 'checkout':
      return (
        <CheckoutFlowScreen
          content={flow.checkout ?? defaultFlow.checkout}
          state={state as 'empty' | 'filled' | 'payment process' | 'payment verified'}
        />
      )
    case 'ready':
      return <ReadyFlowScreen content={flow.ready ?? defaultFlow.ready} />
    default:
      return null
  }
}
