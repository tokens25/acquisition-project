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

export { imageCtaArt, articleShot }

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
