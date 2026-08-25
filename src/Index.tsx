import './index-page.css'

import daznLogo from './assets/brand/logo-dazn.svg?raw'
import { Icon } from './components/Icon'

/**
 * The front door.
 *
 * Two iterations of the same tool, kept side by side rather than one replacing
 * the other — the point of a second route was always that the new one can be
 * argued with before it wins. Each link says what it is, not only which number
 * it was given.
 */
const DEMOS = [
  {
    href: '/demo',
    number: 'Demo 1',
    name: 'Two-stage interface',
    blurb:
      'Situation first — market, storefront, who the user is and where they arrived — then one step of the journey at a time. Built from the DS components.',
    points: ['Journey chosen by describing it', 'Every screen of the flow', 'DS fields and controls'],
  },
  {
    href: '/demo2',
    number: 'Demo 2',
    name: 'First iteration',
    blurb:
      'The original single form: every field on one surface, with the card set beside it. The version the rules and the publish gate were built against.',
    points: ['One form, all fields', 'Journey picked by name', 'Where the rules were proven'],
  },
]

export function Index() {
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
          Two iterations of the content editor. Both read the same content and enforce the same
          rules; they differ in how much they ask of you at once.
        </p>

        <ul className="idx__list">
          {DEMOS.map((demo) => (
            <li key={demo.href}>
              <a className="idx__card" href={demo.href}>
                <span className="idx__number">{demo.number}</span>
                <span className="idx__name">{demo.name}</span>
                <span className="idx__blurb">{demo.blurb}</span>
                <ul className="idx__points">
                  {demo.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
