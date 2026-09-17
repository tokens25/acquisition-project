import type { LandingScreen } from './flow'

import courtsideArt from '../assets/landing/heroes/courtside.jpg'
import daznGoArt from '../assets/landing/heroes/dazn-go.jpg'
import msgArt from '../assets/landing/heroes/msg.jpg'
import wardleyArt from '../assets/landing/heroes/wardley-dubois.jpg'
import wc26Art from '../assets/landing/heroes/wc26.jpg'

/**
 * The heroes a page can open with.
 *
 * A hero is authored in the hero studio rather than here, so what this tool
 * offers is a choice among the ones that exist — not a blank set of fields and
 * a hope. Picking one writes its words, its picture and its settings into the
 * page, and from that moment they are the page's own: editable here, and free
 * to diverge from what the studio holds.
 *
 * That divergence is the thing to keep honest. Each page remembers which hero
 * it started from, so the panel can say both which one it was and whether it
 * still matches — see `heroPreset` on the landing screen and `matches` below.
 *
 * Stored as content rather than as pictures on purpose. A preset that is data
 * can be drawn by the page's own hero at any size, so the gallery's thumbnails
 * are the real thing rather than an export of it: never stale, in the market's
 * own words, and needing nothing re-exported when the hero design moves.
 */
/**
 * Where the hero editor lives.
 *
 * Empty until somebody gives us the address, and the gallery says so rather
 * than offering a way out that goes nowhere. One string to fill in when it
 * arrives, and every card's Edit starts working.
 */
export const HERO_APP = ''

export interface HeroPreset {
  id: string
  /** What it is called, which is the name the studio knows it by. */
  name: string
  /** Where it is sold — a market code, or `*` for the ones that run anywhere. */
  market: string
  /** What it is about, in the words somebody would search for. */
  sport: string
  /** One line on what it is for, under the name. */
  note: string
  /** Everything it writes into the page. */
  patch: Partial<LandingScreen>
}

/**
 * The five in the design's own Heroes section (node 1008:44202), by the names
 * it gives them.
 *
 * Their pictures came out of the same file: each hero's artwork is the source
 * image behind its own frame, exported at 1920 wide rather than re-drawn.
 *
 * All five carry one, including the one whose art the page already ships. A
 * preset with no picture would leave whatever the page was showing, so its card
 * in the gallery would draw the last hero's artwork under this hero's name —
 * true to what picking it does, and unreadable as an offer.
 */
export const HEROES: HeroPreset[] = [
  {
    id: 'msg',
    name: 'MSG+',
    market: 'US',
    sport: 'Ice hockey and basketball',
    note: 'The New York teams, sold as one pass.',
    patch: {
      heroImage: msgArt,
      title: 'MSG+ on DAZN',
      body: 'Stream MSG and YES only on DAZN and watch every local Knicks, Yankees, Nets, Rangers, Devils, Islanders and Sabres game live or on demand. ',
      cta: 'Sign up',
      altCta: 'Sign in with your TV provider',
      footnote: 'Nationally broadcast games will not be available on DAZN',
      heroLabelEnabled: false,
      heroWash: 'standard',
      heroPriceEnabled: false,
      heroCtaGold: false,
    },
  },
  {
    /* Named PT when it was written, and pages saved since hold that word as
       their `heroPreset`. An id is data and a name is a label, so the label is
       what the rename moves. */
    id: 'pt',
    name: 'DAZN GO',
    market: 'ES',
    sport: 'Football',
    note: 'A league season, opened on the fixtures.',
    patch: {
      heroImage: daznGoArt,
      title: 'Every matchday, live on DAZN',
      body: 'Every game of the season, live and on demand, wherever you are.',
      cta: 'Subscribe now',
      altCta: 'Sign in',
      footnote: 'New customers only. Terms apply.',
      heroLabelEnabled: true,
      heroLabel: 'Football',
      heroLabelVariant: 'standard',
      heroWash: 'heavy',
      heroPriceEnabled: true,
      heroPricePrefix: 'From',
      heroPriceValue: '9.99',
      heroPriceSuffix: '/ month',
      heroCtaGold: false,
    },
  },
  {
    id: 'courtside',
    name: 'Courtside 1891',
    market: '*',
    sport: 'Basketball',
    note: 'The basketball pass, sold on the competition.',
    patch: {
      heroImage: courtsideArt,
      title: 'Every basket. Every nation. Courtside.',
      body: 'The best of European basketball, live on DAZN all season.',
      cta: 'Get started',
      altCta: 'Sign in',
      footnote: 'Cancel any time.',
      heroLabelEnabled: true,
      heroLabel: 'Courtside 1891',
      heroLabelVariant: 'gold',
      heroWash: 'standard',
      heroPriceEnabled: false,
      heroCtaGold: true,
    },
  },
  {
    id: 'wc26',
    name: 'World Cup 26',
    market: '*',
    sport: 'Football',
    note: 'A tournament, sold on the event rather than the season.',
    patch: {
      heroImage: wc26Art,
      title: 'FIFA World Cup Live only on DAZN',
      body: 'Every match of the tournament, free to watch on DAZN.',
      cta: 'Watch for free',
      altCta: 'Sign in',
      footnote: 'Free with a DAZN account.',
      heroLabelEnabled: true,
      heroLabel: 'FIFA World Cup 26',
      heroLabelVariant: 'gold',
      heroWash: 'light',
      heroPriceEnabled: false,
      heroCtaGold: true,
    },
  },
  {
    id: 'wardley-dubois',
    name: 'Wardley vs. Dubois',
    market: 'GB',
    sport: 'Boxing',
    note: 'One night, sold on the fight.',
    patch: {
      heroImage: wardleyArt,
      title: 'Wardley vs. Dubois',
      body: 'Live from Wembley. Only on DAZN.',
      cta: 'Buy now',
      altCta: 'Sign in',
      footnote: 'Pay-per-view. Terms apply.',
      heroLabelEnabled: true,
      heroLabel: 'Live',
      heroLabelVariant: 'standard',
      heroWash: 'heavy',
      heroPriceEnabled: true,
      heroPricePrefix: '',
      heroPriceValue: '24.99',
      heroPriceSuffix: '',
      heroCtaGold: false,
    },
  },
]

export const heroById = (id?: string) => HEROES.find((h) => h.id === id)

/** The ones a market would be offered, its own first and the ones that run anywhere after. */
export function heroesFor(market: string): HeroPreset[] {
  const mine = HEROES.filter((h) => h.market === market)
  const rest = HEROES.filter((h) => h.market !== market)
  return [...mine, ...rest]
}

/**
 * Whether the page still says what the hero it came from says.
 *
 * Only the fields the preset itself writes are compared: a hero that never
 * carried a price has nothing to say about the price somebody added, and
 * counting that as a change would mean every page drifted the moment it was
 * touched anywhere.
 */
export function matches(preset: HeroPreset, content: LandingScreen): boolean {
  return Object.entries(preset.patch).every(
    ([key, value]) => content[key as keyof LandingScreen] === value,
  )
}
