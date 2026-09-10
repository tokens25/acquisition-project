import closeIcon from '../assets/icons/action-close-md.svg?raw'
import { StepPreview } from '../card/StepPreview'
import { clickedAway } from '../components/dismiss'
import { Icon } from '../components/Icon'
import type { CardSetStore } from '../editor/useCardSet'
import type { CardSet } from '../rules/content'
import type { Step } from '../rules/journey'
import { useDialog } from '../account/useDialog'
import { EditPanel } from './EditPanel'
import './subscription-sheet.css'

/**
 * The Subscription screen, edited without leaving the page that draws it.
 *
 * The landing page shows the plan picker but does not own it: the tabs and the
 * cards belong to the Subscription screen, and its own editor is the only
 * honest place to change them. Opening that editor used to mean going to the
 * flow — which is the whole page, the journey around it, and a way back to
 * find. This is the same editor and the same preview in a window over the
 * page, so the picker being edited is a scroll away rather than a route away.
 *
 * What it leaves out is everything that belongs to the tool rather than to the
 * screen: the tool's own top bar, the step's heading and its place in the
 * journey, the screen's title field, and the phone chrome the title draws.
 * None of that is what somebody came here to change, and all of it says "you
 * are somewhere else now" — which is the thing this exists to avoid.
 */
export function SubscriptionSheet({
  open,
  store,
  step,
  set,
  onClose,
}: {
  open: boolean
  store: CardSetStore
  /** The Subscription step, which the page that opens this is not on. */
  step: Step
  /** The market's own words, as the page beside it reads them. */
  set: CardSet
  onClose: () => void
}) {
  const ref = useDialog(open)

  return (
    <dialog
      ref={ref}
      className="sub-sheet"
      onClose={onClose}
      onClick={(e) => clickedAway(e) && onClose()}
      aria-labelledby="sub-sheet-title"
    >
      <div className="sub-sheet__sheet">
        <header className="sub-sheet__head">
          {/* Named for what it does rather than for what it is: it is opened
              from a button that says this, and a window that renames itself on
              the way in reads as a different place. */}
          <h2 id="sub-sheet-title" className="sub-sheet__title">
            Edit subscription
          </h2>
          <button
            type="button"
            className="coach-goal__close"
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <Icon svg={closeIcon} size={24} />
          </button>
        </header>

        <div className="sub-sheet__body">
          <div className="sub-sheet__panel">
            {/* Not the screen's title: that is the one field here that edits
                the chrome rather than the plans, and the chrome is not drawn
                in this window. */}
            <EditPanel store={store} screen={false} />
          </div>
          <div className="sub-sheet__preview">
            <StepPreview
              journey={store.journey}
              /* No journey to place it in from here — this is one screen, and
                 the page it was opened from is the one somebody is on. */
              meta={false}
              /* Pointed at the Subscription step rather than at whichever the
                 set remembers, which on the landing page is the landing page. */
              set={set.stepId === step.id ? set : { ...set, stepId: step.id }}
              context={store.context}
              onTab={(tab) => store.setContext({ ...store.context, tab })}
            />
          </div>
        </div>
      </div>
    </dialog>
  )
}
