import './index-page.css'
import './demo/demo.css'

import daznLogo from './assets/brand/logo-dazn.svg?raw'
import { Button } from './components/Button'
import { Icon } from './components/Icon'
import { DefaultPanel } from './demo/DefaultPanel'
import { useState } from 'react'
import { useCardSet } from './editor/useCardSet'
import { go } from './navigate'

/**
 * The front door: the situation, and a way in.
 *
 * It asks the same three questions the tool asks — the same fields, from the
 * same component, writing to the same content — rather than a copy of them
 * that could drift. Answering here and answering inside the tool are the same
 * act; Create only opens the door.
 *
 * Which is why nothing is carried across by hand. The answers are part of the
 * content, and the content is where the tool reads them from when it opens.
 */
export function Index() {
  const store = useCardSet()
  /**
   * Unanswered until the fields say otherwise. Starting at one rather than
   * zero so the way in is shut on the first paint, before anything has had a
   * chance to count the questions.
   */
  const [pending, setPending] = useState(1)

  return (
    <main className="idx">
      <header className="idx__head">
        <span className="idx__mark">
          <Icon svg={daznLogo} size={24} />
        </span>
        <h1 className="idx__title">Agentic acquisition</h1>
        <span className="idx__beta">BETA</span>
      </header>

      <div className="idx__body">
        <div className="idx__form">
          <div className="demo__fields">
            <DefaultPanel store={store} prompt onAsking={setPending} />
          </div>

          {/* Shut until every question on screen has an answer: the tool
              opens on a situation, and half a situation is not one. */}
          <Button
            appearance="primary"
            size="lg"
            block
            disabled={pending > 0}
            onClick={() => go('/demo')}
          >
            Create
          </Button>
        </div>
      </div>
    </main>
  )
}
