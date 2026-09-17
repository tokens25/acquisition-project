import { useState } from 'react'

import { LandingFlowScreen } from '../components/flow/FlowScreens'
import type { CardSetStore } from '../editor/useCardSet'
import { resolveFlow } from '../rules/layers'
import { marketOf } from '../rules/content'
import { HERO_APP, HEROES, heroesFor, type HeroPreset } from '../rules/heroes'
import './hero-picker.css'

/**
 * The heroes there are, and the way into the one you want to work on.
 *
 * Heroes are authored in the hero editor, which is a tool of its own. This
 * shows what it holds: each card draws the real hero rather than a picture of
 * one — the same `LandingFlowScreen` the page draws, at the page's own width,
 * shrunk — so a thumbnail is never out of date, it is in this market's money,
 * and nothing needs re-exporting when a hero design moves.
 *
 * Nothing here edits a hero. Opening one hands over to the editor that owns
 * it, and says so before it goes: a click that takes the ground out from under
 * somebody is a click that should have warned them.
 *
 * The market's own heroes come first. The situation at the top of the panel
 * already knows which market this is, and a gallery that ignored it would be
 * asking a question the panel had answered two fields earlier.
 */
/**
 * What the page is drawn at before it is shrunk.
 *
 * How far it is shrunk is the stylesheet's, not this file's: the card is as
 * wide as the panel makes it, so a number written here would be right at one
 * panel width and leave a bare strip down the side at every other.
 */
const PAGE_WIDTH = 375

export function HeroPicker({ store }: { store: CardSetStore }) {
  const { set } = store
  const market = store.context.market
  const list = heroesFor(market)
  /** The one being handed over to the editor, while the warning stands. */
  const [leaving, setLeaving] = useState<HeroPreset | null>(null)

  return (
    <div className="hp">
      <div className="hp__head">
        <span className="hp__title">Heroes</span>
        <span className="hp__count">{HEROES.length} in the editor</span>
      </div>

      <div className="hp__list">
        {list.map((preset) => (
          <div className="hp__card" key={preset.id} data-mine={preset.market === market || undefined}>
            <button
              type="button"
              className="hp__open"
              title={`Open ${preset.name} in the hero editor`}
              onClick={() => setLeaving(preset)}
            >
              {/* The real hero, drawn at the page's width and shrunk — not an
                  export of one. Inert and hidden: it is a picture here. */}
              <span className="hp__shot" aria-hidden="true">
                <span className="hp__page" style={{ inlineSize: PAGE_WIDTH }} inert>
                  {/* No phone bar on a card: the hat belongs to the screen the
                      hero is drawn on, and this is a picture of the hero. */}
                  <LandingFlowScreen
                    content={{ ...resolveFlow(set).landing, ...preset.patch }}
                    market={marketOf(set)}
                    hat={false}
                  />
                </span>
              </span>
              <span className="hp__words">
                <span className="hp__name">{preset.name}</span>
                <span className="hp__facts">
                  {preset.market === '*' ? 'Every market' : preset.market}
                  <span className="hp__dot" aria-hidden="true" />
                  {preset.sport}
                </span>
                <span className="hp__note">{preset.note}</span>
              </span>
            </button>
            {/* Beside the card rather than inside it: a button inside a button
                is not a thing a browser will draw. It shows on hover, and on
                keyboard focus as well — a control that only the pointer can
                find is a control half the people here cannot reach. */}
            <button
              type="button"
              className="hp__edit"
              title={`Open ${preset.name} in the hero editor`}
              onClick={() => setLeaving(preset)}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {leaving && (
        <div className="hp-go" role="dialog" aria-modal="true" aria-label="Leaving for the hero editor">
          <div className="hp-go__box">
            <p className="hp-go__title">You will be redirected to Hero editor</p>
            <p className="hp-go__note">
              {leaving.name} is authored there. This page stays as it is.
            </p>
            {/* Said rather than hidden. The address is not set yet, and a button
                that looks ready and does nothing is worse than one that says
                why it cannot go. */}
            {HERO_APP === '' && (
              <p className="hp-go__pending">The hero editor's address has not been set yet.</p>
            )}
            <div className="hp-go__acts">
              <button type="button" className="hp-go__cancel" onClick={() => setLeaving(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="hp-go__on"
                disabled={HERO_APP === ''}
                onClick={() => {
                  window.open(HERO_APP, '_blank', 'noopener')
                  setLeaving(null)
                }}
              >
                Open Hero editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { PAGE_WIDTH }
