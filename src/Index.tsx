import './index-page.css'
import './demo/demo.css'

import daznLogo from './assets/brand/logo-dazn.svg?raw'
import { Button } from './components/Button'
import { Icon } from './components/Icon'
import { DefaultPanel } from './demo/DefaultPanel'
import { SelectField } from './components/SelectField'
import { useState } from 'react'
import { useCardSet } from './editor/useCardSet'
import { PRODUCTS, type Product } from './product'
import type { Job } from './progress/prepare'

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
export function Index({ onCreate }: { onCreate: (job: Job) => void }) {
  const store = useCardSet()
  /**
   * Unanswered until the fields say otherwise. Starting at one rather than
   * zero so the way in is shut on the first paint, before anything has had a
   * chance to count the questions.
   */
  const [pending, setPending] = useState(1)
  /**
   * Which of the two is being made, unanswered until it is picked.
   *
   * It sits above the situation because it changes what the situation is: a
   * landing page is where people arrive rather than somewhere they arrive
   * from, so the entry point stops being a question the moment it is chosen.
   */
  const [product, setProduct] = useState<Product | ''>('')

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
            <SelectField
              label="Product"
              helpText="What you are making. A landing page opens on its own; the flow opens on every step."
              value={product}
              options={[{ value: '' as const, label: 'Choose…' }, ...PRODUCTS]}
              onChange={(v) => v && setProduct(v as Product)}
            />
            <DefaultPanel
              store={store}
              prompt
              // Where they arrived from is a question about a flow. The landing
              // page is the arriving, so there is nothing to ask.
              entry={product !== 'landing'}
              onAsking={setPending}
            />
          </div>

          {/* Shut until every question on screen has an answer: the tool
              opens on a situation, and half a situation is not one. */}
          <Button
            appearance="primary"
            size="lg"
            block
            disabled={pending > 0 || !product}
            // The situation as it stands at the moment it was asked for,
            // which is what the wait is about and what the tool opens on.
            onClick={() =>
              product &&
              onCreate({ set: store.set, context: store.context, journey: store.journey, product })
            }
          >
            Create
          </Button>
        </div>
      </div>
    </main>
  )
}
