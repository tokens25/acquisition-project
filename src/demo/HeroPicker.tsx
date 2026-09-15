import { LandingFlowScreen } from '../components/flow/FlowScreens'
import type { CardSetStore } from '../editor/useCardSet'
import type { Selector } from '../rules/layers'
import { resolveFlow, writeFlow } from '../rules/layers'
import { marketOf } from '../rules/content'
import { HEROES, heroesFor, type HeroPreset } from '../rules/heroes'
import './hero-picker.css'

/**
 * Choosing which hero the page opens with.
 *
 * Heroes are authored in the hero studio rather than here, so what this offers
 * is the ones that exist. Picking one writes its words, its settings and its
 * picture into the page — and from that moment they are the page's own, to be
 * edited in the fields this replaces.
 *
 * Each card draws the real hero rather than a picture of one: the same
 * `LandingFlowScreen` the page draws, at the page's own width, scaled down. So
 * a thumbnail is never out of date, it is in this market's money, and nothing
 * needs re-exporting when the hero design moves.
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

export function HeroPicker({
  store,
  scope,
  onPicked,
}: {
  store: CardSetStore
  scope: Selector
  /** Chosen — the fields take over from here. */
  onPicked: () => void
}) {
  const { set, updateSet } = store
  const market = store.context.market
  const list = heroesFor(market)

  const pick = (preset: HeroPreset) => {
    updateSet(writeFlow(set, scope, 'landing', { ...preset.patch, heroPreset: preset.id }))
    onPicked()
  }

  return (
    <div className="hp">
      <div className="hp__head">
        <span className="hp__title">Heroes</span>
        <span className="hp__count">
          {HEROES.length} to choose from
        </span>
      </div>

      <div className="hp__list">
        {list.map((preset) => (
          <button
            type="button"
            className="hp__card"
            key={preset.id}
            data-mine={preset.market === market || undefined}
            onClick={() => pick(preset)}
          >
            {/* The real hero, drawn at the page's width and shrunk — not an
                export of one. Inert and hidden: it is a picture here. */}
            <span className="hp__shot" aria-hidden="true">
              <span className="hp__page" style={{ inlineSize: PAGE_WIDTH }} inert>
                {/* No phone bar on a card: the hat belongs to the screen
                    the hero is drawn on, and this is a picture of the hero. */}
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
        ))}
      </div>
    </div>
  )
}

export { PAGE_WIDTH }
