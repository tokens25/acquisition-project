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
import flagDen from '../../assets/landing/flags/den.svg'
import flagIta from '../../assets/landing/flags/ita.svg'
import deviceRoku from '../../assets/landing/devices/roku.svg'
import deviceFireTv from '../../assets/landing/devices/fire-tv.svg'
import deviceGooglePlay from '../../assets/landing/devices/google-play.svg'
import deviceSamsung from '../../assets/landing/devices/samsung.svg'
import deviceAppleTv from '../../assets/landing/devices/apple-tv.svg'
import devicePanasonic from '../../assets/landing/devices/panasonic.svg'
import deviceChromecast from '../../assets/landing/devices/chromecast.svg'
import deviceSony from '../../assets/landing/devices/sony.svg'
import deviceLg from '../../assets/landing/devices/lg.svg'
import deviceAppStore from '../../assets/landing/devices/app-store.svg'
import devicePlaystation from '../../assets/landing/devices/playstation.svg'
import deviceXbox from '../../assets/landing/devices/xbox.svg'
import deviceAndroidTv from '../../assets/landing/devices/android-tv.svg'

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
 * draws the empty box, which is what the design leaves standing for a side
 * it has not filled in.
 *
 * Here rather than in the screens because the panel needs it too: it shows
 * the flag a side has before offering to replace it.
 */
export const flagArt: Record<string, string> = {
  MEX: flagMex,
  RSA: flagRsa,
  KOR: flagKor,
  CAN: flagCan,
  DEN: flagDen,
  ITA: flagIta,
}

/**
 * The flag a code brings, however it was typed.
 *
 * A side that is still two teams is written with both — DEN/MNE, ITA/NIR —
 * and flies the first of them, which is the one the fixture is listed under.
 * Whole code first, so a code that ever has a slash in its own name is still
 * found before the halves are tried.
 */
export const flagFor = (code: string) => {
  const written = code.trim().toUpperCase()
  return flagArt[written] ?? flagArt[written.split('/')[0].trim()]
}

/**
 * The wall of device logos — node 853:58657.
 *
 * One list rather than the design's five rows, because three to a row is what
 * the design does with thirteen of them and the wall has to keep doing it with
 * fewer: a logo turned off should close the gap rather than leave one. Chunked
 * by three, the thirteen come out as the design's own 3, 3, 3, 3 and 1.
 *
 * Each logo is 32 tall and its own width. The widths are the design's to a
 * tenth of a pixel: they are what spaces the row, since the three sit apart
 * rather than in columns.
 *
 * Exported because the panel needs the names — it offers the wall a logo at a
 * time, and a second list of what is on the wall is a second list to keep in
 * step with this one.
 */
export const DEVICES: { src: string; name: string; w: number }[] = [
  { src: deviceRoku, name: 'Roku', w: 69.6 },
  { src: deviceFireTv, name: 'Amazon Fire TV', w: 124.8 },
  { src: deviceGooglePlay, name: 'Google Play', w: 108.8 },
  { src: deviceSamsung, name: 'Samsung', w: 111.2 },
  { src: deviceAppleTv, name: 'Apple TV', w: 56.8 },
  { src: devicePanasonic, name: 'Panasonic', w: 105.6 },
  { src: deviceChromecast, name: 'Chromecast', w: 123.2 },
  { src: deviceSony, name: 'Sony', w: 95.2 },
  { src: deviceLg, name: 'LG', w: 57.6 },
  { src: deviceAppStore, name: 'App Store', w: 101.6 },
  { src: devicePlaystation, name: 'PlayStation 5', w: 104.8 },
  { src: deviceXbox, name: 'Xbox', w: 81.6 },
  { src: deviceAndroidTv, name: 'Android TV', w: 126.4 },
]

/** The wall as it stands, three to a row, with the ones turned off left out. */
export function deviceRows(off: string[]) {
  const on = DEVICES.filter((device) => !off.includes(device.name))
  const rows: (typeof DEVICES)[] = []
  for (let at = 0; at < on.length; at += 3) rows.push(on.slice(at, at + 3))
  return rows
}

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
