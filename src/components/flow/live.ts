import { createContext, useContext } from 'react'

/**
 * Where what is typed into a screen is kept.
 *
 * The screens are drawn twice: at full size in the prototype, where they are
 * used, and inside the tiles of the frames row, where they are pictures of
 * what the panel wrote. Only the first can be typed into — a tile is itself a
 * button, and a text box cannot sit inside one — so the fields ask for this
 * rather than being told, and get nothing in a tile.
 *
 * The prototype holds the text rather than the field, because a field is
 * unmounted the moment you walk to the next screen and what someone typed
 * should still be there when they come back.
 */
export interface FlowInput {
  /** Which screen is asking, so one label on two screens is two fields. */
  scope: string
  get: (key: string) => string | undefined
  set: (key: string, value: string) => void
}

export const FlowInputContext = createContext<FlowInput | null>(null)

/** The store when a screen is being used, null when it is being looked at. */
export function useFlowInput() {
  return useContext(FlowInputContext)
}
