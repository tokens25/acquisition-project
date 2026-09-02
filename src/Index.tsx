import './index-page.css'
import './demo/demo.css'

import daznLogo from './assets/brand/logo-dazn.svg?raw'
import { Button } from './components/Button'
import { Icon } from './components/Icon'
import { DefaultPanel } from './demo/DefaultPanel'
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

  return (
    <main className="idx">
      <header className="idx__head">
        <span className="idx__mark">
          <Icon svg={daznLogo} size={24} />
        </span>
        <h1 className="idx__title">Acquisition model</h1>
        <span className="idx__beta">BETA</span>
      </header>

      <div className="idx__body">
        <p className="idx__lede">
          Describe the situation you are writing content for. Where it is sold, who is buying, and
          where they arrived from — the three answers pick the journey you will be editing.
        </p>

        <div className="idx__form">
          <div className="demo__fields">
            <DefaultPanel store={store} />
          </div>

          <Button appearance="primary" size="lg" block onClick={() => go('/demo')}>
            Create
          </Button>
        </div>
      </div>
    </main>
  )
}
