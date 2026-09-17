/**
 * The artwork the new components ship with, taken out of the Figma file's own
 * frames rather than drawn again or borrowed from the schedule.
 *
 * Dealt out by position, the way `fixtureFor` deals the schedule's: there is
 * nothing here to fetch a real picture from, so what a tile shows is the
 * picture the design has in that place. Two tiles of the same kind get
 * different pictures, which is what a rail looks like; a rail longer than the
 * list starts round again.
 */

import placeOne from '../../assets/landing/places/p1.jpg'
import placeTwo from '../../assets/landing/places/p2.jpg'
import placeThree from '../../assets/landing/places/p3.jpg'
import placeFour from '../../assets/landing/places/p4.jpg'
import placeFive from '../../assets/landing/places/p5.jpg'

import subOne from '../../assets/landing/subs/s1.jpg'
import subTwo from '../../assets/landing/subs/s2.jpg'
import subThree from '../../assets/landing/subs/s3.jpg'

import fightOne from '../../assets/landing/bundle/f1.jpg'
import fightTwo from '../../assets/landing/bundle/f2.jpg'
import fightThree from '../../assets/landing/bundle/f3.jpg'
import fightFour from '../../assets/landing/bundle/f4.jpg'

import gameOne from '../../assets/landing/rails/game1.jpg'
import gameTwo from '../../assets/landing/rails/game2.jpg'
import storyOne from '../../assets/landing/rails/story1.jpg'
import storyTwo from '../../assets/landing/rails/story2.jpg'
import promoOne from '../../assets/landing/rails/promo1.jpg'
import promoTwo from '../../assets/landing/rails/promo2.jpg'

import spotlightArt from '../../assets/landing/spotlight/hero.jpg'
import spotOne from '../../assets/landing/spotlight/g1.jpg'
import spotTwo from '../../assets/landing/spotlight/g2.jpg'
import spotThree from '../../assets/landing/spotlight/g3.jpg'

/** The stadiums the places carousel is drawn with — node 1093:55236. */
export const PLACE_ART = [placeOne, placeTwo, placeThree, placeFour, placeFive]

/** The other subscriptions — node 1084:55909. */
export const SUB_ART = [subOne, subTwo, subThree]

/** The nights in a bundle — node 1093:55175. */
export const FIGHT_ART = [fightOne, fightTwo, fightThree, fightFour]

/** A games rail — node 1084:57405. */
export const GAME_ART = [gameOne, gameTwo]

/** A story rail — node 1084:57115. */
export const STORY_ART = [storyOne, storyTwo]

/** A promotions rail — node 1084:56990. */
export const PROMO_ART = [promoOne, promoTwo]

/** The spotlight's own picture, and the games under it — node 1084:56109. */
export const SPOTLIGHT_ART = spotlightArt
export const SPOT_ART = [spotOne, spotTwo, spotThree]

/** The one in a list that falls at this place, starting round again at the end. */
export const artAt = (list: string[], at: number) => list[at % list.length]

import planFightOne from '../../assets/landing/plan/fight1.jpg'
import planFightTwo from '../../assets/landing/plan/fight2.jpg'
import planFightThree from '../../assets/landing/plan/fight3.jpg'
import posterOne from '../../assets/landing/plan/poster1.jpg'
import posterTwo from '../../assets/landing/plan/poster2.jpg'
import posterThree from '../../assets/landing/plan/poster3.jpg'
import posterFour from '../../assets/landing/plan/poster4.jpg'

/** The fights a plan card lists — node 1102:53279. */
export const PLAN_FIGHT_ART = [planFightOne, planFightTwo, planFightThree]

/** The posters a yearly card shows its year with — node 1102:53279. */
export const POSTER_ART = [posterOne, posterTwo, posterThree, posterFour]
