/**
 * The landing page's own pictures.
 *
 * Apart from the screens that draw them because the panel needs them too: it
 * shows what a picture is now before offering to replace it, and a panel that
 * had to import the screens to find that out would be a panel that reaches
 * into the wrong place.
 */
import featureDownloads from '../../assets/landing/features/downloads.png'
import featurePortability from '../../assets/landing/features/portability.png'
import featureOriginal from '../../assets/landing/features/original.png'
import featureHighlights from '../../assets/landing/features/highlights.png'
import iconDownloads from '../../assets/landing/features/icon-downloads.svg?raw'
import iconPortability from '../../assets/landing/features/icon-portability.svg?raw'
import iconOriginal from '../../assets/landing/features/icon-original.svg?raw'
import iconHighlights from '../../assets/landing/features/icon-highlights.svg?raw'
import imageCtaArt from '../../assets/landing/image-cta.png'
import articleShot from '../../assets/landing/article/shot.jpg'
import teamKnicks from '../../assets/landing/teams/knicks.png'
import teamRangers from '../../assets/landing/teams/rangers.png'
import teamIslanders from '../../assets/landing/teams/islanders.png'
import flagMex from '../../assets/landing/flags/mex.png'
import flagRsa from '../../assets/landing/flags/rsa.png'
import flagKor from '../../assets/landing/flags/kor.png'
import flagCan from '../../assets/landing/flags/can.png'

export { imageCtaArt, articleShot }

/**
 * A team's tile, by the name it is written with.
 *
 * Same idea as `featureArt` below: what somebody types picks the artwork, so
 * the crest and the colour are not a second thing to choose. A name with no
 * entry draws the tile's own template, which is what the design leaves
 * standing for a team it has not filled in.
 *
 * Here rather than in the screens because the panel needs it too — it shows
 * the logo a team has before offering to replace it.
 */
export const teamArt: Record<string, { ground: string; art: string; width: number; city: string }> = {
  'New York Knicks': { ground: '#1b418b', art: teamKnicks, width: 98, city: 'New York' },
  'New York Rangers': { ground: '#e51937', art: teamRangers, width: 83, city: 'New York' },
  'New York Islanders': { ground: '#003087', art: teamIslanders, width: 83, city: 'New York' },
}

/**
 * A side's flag, by the code it is written with.
 *
 * The same idea as the crests above: what somebody types picks the artwork,
 * so a match is one thing to fill in rather than two. A code with no entry
 * draws the empty box — which is what the design draws for DEN/MNE and
 * ITA/NIR, sides that are two countries at once and have no one flag.
 *
 * Here rather than in the screens because the panel needs it too: it shows
 * the flag a side has before offering to replace it.
 */
export const flagArt: Record<string, string> = {
  MEX: flagMex,
  RSA: flagRsa,
  KOR: flagKor,
  CAN: flagCan,
}

/** The flag a code brings, however it was typed. */
export const flagFor = (code: string) => flagArt[code.trim().toUpperCase()]

/**
 * A feature's icon and picture, and how the design lays that picture out.
 *
 * Keyed by the tag, which is the row's own label: the tag picks the artwork
 * the way a provider's name picks its logo. Every picture sits in a 130 box;
 * what differs is the height it is drawn at, where the top of it sits, and how
 * much of a larger photograph the design shows — read off node 852:58100 row
 * by row rather than averaged into one treatment.
 */
export interface FeatureArt {
  icon: string
  photo: string
  /** The picture's height inside the 130 box, and its offset from the top. */
  h: number
  top: number
  /** The part of the photograph the design shows. */
  imgH: string
  imgTop: string
}

export const featureArt: Record<string, FeatureArt> = {
  Downloads: {
    icon: iconDownloads,
    photo: featureDownloads,
    h: 83,
    top: 0,
    imgH: '108.11%',
    imgTop: '-9.48%',
  },
  Portability: {
    icon: iconPortability,
    photo: featurePortability,
    h: 83,
    top: 0,
    imgH: '108.11%',
    imgTop: '-9.48%',
  },
  'Original content': {
    icon: iconOriginal,
    photo: featureOriginal,
    h: 81,
    top: 2,
    imgH: '110.78%',
    imgTop: '-12.18%',
  },
  Highlights: {
    icon: iconHighlights,
    photo: featureHighlights,
    h: 87,
    top: -4,
    imgH: '103.14%',
    imgTop: '-4.45%',
  },
}
