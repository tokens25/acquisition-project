import { CardSetView } from '../card/CardSetView'
import { PageSectionView, SubscriptionTabs } from '../components/flow/FlowScreens'
import type { CardSet, Context } from '../rules/content'
import { landingText } from '../rules/landing'
import { copyOf, type PageSection } from '../rules/sections'
import { tabsOf } from '../rules/tabs'
import type { LandingScreen } from '../rules/flow'
import './component-peek.css'

/**
 * The component itself, beside the row that names it.
 *
 * The row's tile says what shape a block is; this says what it actually looks
 * like. It is the real thing rather than a picture of one — the same view the
 * page draws, at the page's own width, scaled down — so it is never out of
 * date: the market's own words, the picture somebody uploaded this minute, the
 * lot.
 *
 * A picture rather than a screenshot for a reason found by measuring. A section
 * is 375 wide, so fitting one into the row's own 40px tile is a nine-fold
 * reduction: body text lands at a pixel and a half and every block resolves to
 * the same grey smudge. At this size a line of body text is about seven pixels
 * — not read, but seen, which is what somebody looking for a block needs.
 *
 * Only the hovered one is ever built, so this costs one section rather than
 * twelve.
 */

/** The picker as the page draws it: the tabs, and the cards under them. */
function PlanPicker({ set, context }: { set: CardSet; context: Context }) {
  const tabs = tabsOf(set)
  const tab = tabs.some((t) => t.id === context.tab) ? (context.tab as string) : (tabs[0]?.id ?? '')
  return (
    <>
      <div className="fl-page__plans-tabs">
        <SubscriptionTabs tabs={tabs} tab={tab} />
      </div>
      <CardSetView set={set} context={context} tab={tab} />
    </>
  )
}

/** What the page is drawn at, and what this is drawn at. */
const PAGE_WIDTH = 375
const PEEK_WIDTH = 208

export function ComponentPeek({
  section,
  content,
  set,
  context,
  /** Where the row is on screen, so this can sit against it. */
  anchor,
}: {
  section: PageSection
  content: LandingScreen
  /** The plan picker is the Subscription screen's, so it comes from the set. */
  set: CardSet
  context: Context
  anchor: DOMRect
}) {
  const scale = PEEK_WIDTH / PAGE_WIDTH

  /*
   * Held against its row, and inside the window.
   *
   * Its own height decides how far it can be let down the screen, and that
   * depends on the block — so it is measured once it exists and written
   * straight to the element. Through state it would be a second render for
   * every row the pointer crosses, to move something by a few pixels.
   */
  const place = (el: HTMLElement | null) => {
    if (!el) return
    const height = el.getBoundingClientRect().height
    const lowest = window.innerHeight - 16 - height
    el.style.insetBlockStart = `${Math.max(16, Math.min(anchor.top - 8, lowest))}px`
  }

  return (
    <aside
      className="cpeek"
      ref={place}
      style={{ insetInlineStart: anchor.right + 12, insetBlockStart: anchor.top - 8 }}
      aria-hidden="true"
    >
      {/* Inert as well as hidden: it is a picture of the page, and everything
          the page draws as a field or a button is one here too — none of which
          should be reachable, focusable or nameable from a preview. */}
      <div className="cpeek__frame" inert>
        <div
          className="cpeek__page fl fl-page"
          data-device="mobile"
          style={{ inlineSize: PAGE_WIDTH, transform: `scale(${scale})` }}
        >
          <PageSectionView
            section={section}
            content={content}
            text={copyOf(landingText(content), content, section)}
          >
            {/* The plan picker is not the page's own — it is the Subscription
                screen's tabs and cards, handed in the way the page hands them.
                Without them the block draws nothing at all, which is what the
                preview was showing. */}
            {section.type === 'plans' && <PlanPicker set={set} context={context} />}
          </PageSectionView>
        </div>
      </div>
    </aside>
  )
}
