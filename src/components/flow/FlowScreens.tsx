import './flow.css'

import sparkle from '../../assets/flow/subscription-sparkle.gif'
import { useFlowInput } from './live'
import { cadenceSavings } from '../../rules/cadence'
import { chosenMethod, linesOf, methodsOf } from '../../rules/checkout'
import { styleOf } from '../../rules/tabs'
import { useImageRatio } from './useImageRatio'
import type { HeroBanner } from '../../rules/landing'
import {
  bundlesOf,
  cardsOf,
  cityTabsOf,
  cityTilesOf,
  featuresOf,
  matchesOf,
  heroOf,
  landingText,
  linksOf,
  planCardsOf,
  providersOf,
  questionsOf,
  railSizeOf,
  subTilesOf,
  teamsOf,
  tilesOf,
} from '../../rules/landing'
import { consentsOf } from '../../rules/consents'
import { articleShot, featureArt, flagFor, imageCtaArt, teamArt } from './landingArt'
import {
  FIGHT_ART,
  GAME_ART,
  PLACE_ART,
  PLAN_FIGHT_ART,
  POSTER_ART,
  PROMO_ART,
  SPOTLIGHT_ART,
  SPOT_ART,
  STORY_ART,
  SUB_ART,
  artAt,
} from './newArt'
import { copyOf, sectionsOf, type PageSection } from '../../rules/sections'

import { Fragment, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import actionsInfo from '../../assets/flow/actions-info.svg?raw'
import badgeCheck from '../../assets/flow/badge-check.svg?raw'
import cadenceRadioOff from '../../assets/flow/cadence-radio-off.svg?raw'
import cadenceRadioOn from '../../assets/flow/cadence-radio-on.svg?raw'
import icInfoFill from '../../assets/flow/ic-info-fill.svg?raw'
import daznRubik from '../../assets/flow/logo-dazn-rubik.svg?raw'
import navSchedule from '../../assets/flow/nav-schedule.svg?raw'
import radioIdle from '../../assets/flow/radio-idle.svg?raw'
import radioSelected from '../../assets/flow/radio-selected.svg?raw'
import socialApple from '../../assets/flow/social-apple.svg?raw'
import socialFacebook from '../../assets/flow/social-facebook.svg?raw'
import socialGoogle from '../../assets/flow/social-google.svg?raw'
import payGpayMark from '../../assets/flow/pay-gpay-mark.svg'
import payGpayType from '../../assets/flow/pay-gpay-type.svg'
import payMastercard from '../../assets/flow/pay-mastercard.svg'
import payPaypal from '../../assets/flow/pay-paypal.png'
import payVisa from '../../assets/flow/pay-visa.svg'
import providerSpectrum from '../../assets/landing/providers/spectrum.png'
import providerOptimum from '../../assets/landing/providers/optimum.png'
import providerOptimumTv from '../../assets/landing/providers/optimum-tv.png'
import providerFios from '../../assets/landing/providers/fios.png'
import providerDirectv from '../../assets/landing/providers/directv.png'
import providerDirectvStream from '../../assets/landing/providers/directv-stream.png'
import providerFubo from '../../assets/landing/providers/fubo.png'
import providerAstound from '../../assets/landing/providers/astound.png'
import providerXfinity from '../../assets/landing/providers/xfinity.png'
import providerBreezeline from '../../assets/landing/providers/breezeline.png'
import providerMidHudson from '../../assets/landing/providers/mid-hudson.png'
import heroArt from '../../assets/landing/hero.jpg'
import daznLogo from '../../assets/landing/logo-dazn.svg'
import actionLocation from '../../assets/landing/action-location.svg'
import statusMini from '../../assets/landing/status-mini.svg'
import articleIcon from '../../assets/landing/article/icon-multiview.svg?raw'
import deviceRule from '../../assets/landing/devices/rule.svg'
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
import schedP0 from '../../assets/landing/schedule/p0.png'
import schedP1 from '../../assets/landing/schedule/p1.png'
import schedP2 from '../../assets/landing/schedule/p2.png'
import schedP3 from '../../assets/landing/schedule/p3.png'
import schedP4 from '../../assets/landing/schedule/p4.png'
import schedP5 from '../../assets/landing/schedule/p5.png'
import schedP6 from '../../assets/landing/schedule/p6.png'
import icPlay from '../../assets/landing/schedule/ic-play.svg'
import icReminder from '../../assets/landing/schedule/ic-reminder.svg'
import teamPlaceholder from '../../assets/landing/teams/tile-placeholder.png'
import readyKnicks from '../../assets/flow/ready/knicks.png'
import readyRangers from '../../assets/flow/ready/rangers.png'
import readyIslanders from '../../assets/flow/ready/islanders.png'
import readyDevils from '../../assets/flow/ready/devils.png'
import readySabres from '../../assets/flow/ready/sabres.png'
import checkCircleFilled from '../../assets/flow/ready/check-circle-filled.svg'
import { iconArtwork, logoArtwork } from '../../card/assets'
import { Icon } from '../Icon'
import type { Device, MarketConfig, PlanTab } from '../../rules/content'
import type {
  LandingBundle,
  LandingCard,
  LandingMatch,
  LandingTab,
  LandingTeam,
  LandingPlanCard,
  LandingSubTile,
  LandingTile,
  RailSize,
} from '../../rules/flow'
import { statedMoney } from '../../rules/money'
import type {
  AccountScreen,
  LandingScreen,
  AuthScreen,
  CadenceScreen,
  CheckoutScreen,
  PayMarks,
  ReadyScreen,
  ZipScreen,
} from '../../rules/flow'

/**
 * The screens between the plan picker and the app.
 * Figma: 🚀 Acquisition for ai → "Flow" (node 583:23442).
 *
 * Each renders what sits between the phone's status bar and the browser's URL
 * bar — the header and the body — because those two are the device's, not the
 * product's, and the journey frame draws them around whatever goes here. Same
 * division the plans preview already follows.
 *
 * Presentation only. Every string arrives from `rules/flow`, so a screen has
 * nothing to say that a person has not written.
 */

/** A raw SVG at a size the DS `Icon` does not offer. */
function Mark({ svg, size, className }: { svg: string; size: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: 'grid', placeItems: 'center', inlineSize: size, blockSize: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/**
 * `.header-mobile` — the bar under the status bar.
 *
 * Its gold rule is the journey's progress and is drawn on every screen in the
 * section, so it belongs here rather than to any one of them.
 */
function FlowHeader({ title, mark }: { title: string; mark?: string }) {
  return (
    <header className="fl__header" data-status={mark ? '' : undefined}>
      <span className="fl__back">
        <Icon svg={iconArtwork['chevron-left']} size={16} />
      </span>
      {mark && (
        <span className="fl__mark" aria-hidden="true">
          <img src={mark} alt="" />
        </span>
      )}
      <h2 className="fl__title">{title}</h2>
      <Mark svg={daznRubik} size={28} className="fl__brand" />
    </header>
  )
}

function Screen({
  title,
  mark,
  name,
  flush,
  children,
}: {
  title: string
  /** Which screen this is, for the few rules that belong to one of them. */
  name?: string
  /** A glyph before the title, where the screen states a result. */
  mark?: string
  /**
   * Drops the body's side padding, for a screen whose content runs to the
   * edge. Subscription's card row does: the design lets the next card be cut
   * by the screen rather than by a margin, which is what says there is one.
   */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <div className="fl" data-screen={name}>
      <FlowHeader title={title} mark={mark} />
      <div className="fl__body" data-flush={flush ? '' : undefined}>
        {children}
      </div>
    </div>
  )
}

/**
 * "Choose your subscription" — node 671:25098.
 *
 * The cards are the live set, handed in as children the way the Figma
 * component takes a slot: what belongs to this screen is the chrome the design
 * draws around them, which is the header and the segmented control.
 *
 * Standard and Ultimate are the step's two states rather than a setting on one
 * screen — the section draws them as two frames — so choosing a tab moves to
 * that frame rather than changing this one.
 */
export function SubscriptionFlowScreen({
  title,
  tabs,
  tab,
  onTab,
  children,
}: {
  title: string
  tabs: PlanTab[]
  tab: string
  onTab?: (tab: string) => void
  /**
   * The cards. Left out where they are drawn beside the screen rather than in
   * it — the edit view puts them outside so the screen's edge does not fall
   * across one of them.
   */
  children?: ReactNode
}) {
  return (
    <Screen title={title} flush>
      <SubscriptionTabs tabs={tabs} tab={tab} onTab={onTab} />
      {children && <div className="fl-sub__cards">{children}</div>}
    </Screen>
  )
}

/**
 * The segmented control over the plan picker.
 *
 * Its own component because two places draw it: the phone, where it sits under
 * the header, and the edit screen, where it sits over the cards being edited.
 * Renaming a tab or adding one has to show in both, and one control is how
 * that stays true.
 */
export function SubscriptionTabs({
  tabs,
  tab,
  onTab,
}: {
  tabs: PlanTab[]
  tab: string
  onTab?: (tab: string) => void
}) {
  // No tabs is a plan picker with nothing dividing it, which is a picker with
  // no control over it rather than an empty control.
  if (!tabs.length) return null
  return (
    <div className="fl-sub__control">
      <div className="fl-sub__tabs">
        {tabs.map((one) => {
          const Tag = onTab ? 'button' : 'span'
          return (
          <Tag
            key={one.id}
            type={onTab ? 'button' : undefined}
            className="fl-sub__tab"
            data-style={styleOf(one)}
            data-on={tab === one.id || undefined}
            aria-pressed={onTab ? tab === one.id : undefined}
            onClick={onTab ? () => onTab(one.id) : undefined}
          >
            {styleOf(one) === 'celebratory' && (
              <>
                <span className="fl-sub__bolt" aria-hidden="true" />
                {/* Sparkle 440X200 — the animation the design runs behind this
                    tab. Its box is the tab, and the frame crops the picture
                    rather than fitting it, so the offsets are the design's
                    percentages of that box rather than a fit that looks close.
                    Inside the tab and not the control, because the celebrated
                    tab is not always the one on the right. */}
                <span className="fl-sub__sparkle" aria-hidden="true">
                  <img src={sparkle} alt="" />
                </span>
              </>
            )}
            {one.name}
          </Tag>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Form/TextField. Empty puts the label where the value would sit.
 *
 * Drawn as text where the screen is a picture, and as a real text box where
 * the screen is being used. Both states look the same: the label sits over
 * what was typed once there is something, and stands in its place while there
 * is not — which is the placeholder's job in the box and the label's in the
 * drawing.
 */
function Field({
  label,
  value,
  leading,
  trailing,
  secret,
}: {
  label: string
  value?: string
  leading?: string
  trailing?: string
  /** Masks what is typed. The drawing carries bullets; the box carries a type. */
  secret?: boolean
}) {
  const live = useFlowInput()
  const key = live ? `${live.scope}::${label}` : ''
  // What the panel wrote is what the field opens on; typing replaces it.
  const text = (live ? (live.get(key) ?? value) : value) ?? ''

  const body = live ? (
    <span className="fl__field-body">
      {text ? <span className="fl__field-label">{label}</span> : null}
      <input
        className="fl__field-input"
        type={secret ? 'password' : 'text'}
        value={text}
        placeholder={label}
        aria-label={label}
        // A name is not a misspelling, and the squiggle under one is the
        // browser's rather than anything the design draws.
        spellCheck={false}
        onChange={(event) => live.set(key, event.target.value)}
      />
    </span>
  ) : (
    <span className="fl__field-body">
      <span className="fl__field-label">{label}</span>
      {value ? <span className="fl__field-value">{value}</span> : null}
    </span>
  )
  return (
    <div className="fl__field" data-empty={text ? undefined : ''}>
      {leading || trailing ? (
        <span className="fl__field-row">
          {leading && <Icon svg={leading} size={20} className="fl__field-icon" />}
          {body}
          {trailing && <Icon svg={trailing} size={24} className="fl__field-icon" />}
        </span>
      ) : (
        body
      )}
    </div>
  )
}

function Cta({
  children,
  appearance,
  quiet,
}: {
  children: ReactNode
  appearance?: 'tertiary' | 'outline' | 'pressed' | 'subscribe'
  quiet?: boolean
}) {
  return (
    <span className="fl__cta" data-appearance={appearance} data-quiet={quiet ? '' : undefined}>
      {children}
    </span>
  )
}

/* ── Landing ───────────────────────────────────────────────── */

/**
 * The entry point, and the only screen with no back arrow.
 *
 * Its bar carries the brand and two buttons instead of a title, and the hero
 * runs under everything with three gradients over it — the copy sits on the
 * picture rather than under it, which is why the frame is one layered box
 * instead of a header over a body.
 */
/**
 * The site's own navigation, on the screens wide enough to carry it.
 *
 * Chrome rather than content: the page arrives inside this, the panel does not
 * write it, and it says the same thing in every market the tool draws. Named
 * here rather than in the content so nothing goes looking for a field to edit
 * them with.
 */
const WEB_LINKS = ['Home', 'All sports', 'Schedule', 'Betting', 'News']

/**
 * What it costs, between the words and the button.
 *
 * The hero tool's own lockup, and its order: the prefix, the price, the old
 * price struck through *after* it — which is what makes it read as now-against-
 * was rather than as two prices — and then the unit. Baseline-aligned, because
 * the price is set larger than the three parts around it and they have to sit
 * on its line rather than in the middle of it.
 *
 * Switched on with nothing typed, it draws the tool's own placeholder at half
 * strength: turning it on should show where the price lands, and an empty
 * space shows nothing. Dimmed and hidden from anything reading the page aloud,
 * so it is never mistaken for a price somebody meant.
 *
 * What is authored is the amount. The sign, the separators and where the sign
 * goes are the market's, which is why the same 9.99 reads £9.99 in the UK and
 * 9,99 € in Germany, and why changing the market at the top of the panel
 * changes it here.
 */
function HeroPrice({ hero, market }: { hero: HeroBanner; market?: MarketConfig }) {
  const money = (n: string) => statedMoney(n, market?.locale, market?.currency)
  const empty = hero.priceValue.trim() === ''
  const prefix = hero.pricePrefix.trim() || (empty ? 'From' : '')
  const value = money(hero.priceValue) || (empty ? money('9.99') || '£9.99' : '')
  const suffix = hero.priceSuffix.trim() || (empty ? '/ month' : '')
  // Never invented: a discount is a thing somebody states, not a placeholder.
  const was = money(hero.priceOld)
  return (
    <p
      className="fl-landing__price"
      data-empty={empty || undefined}
      aria-hidden={empty || undefined}
    >
      {prefix && <span className="fl-landing__price-part">{prefix}</span>}
      <span className="fl-landing__price-value">{value}</span>
      {was && <span className="fl-landing__price-was">{was}</span>}
      {suffix && <span className="fl-landing__price-part">{suffix}</span>}
    </p>
  )
}

/**
 * The phone's own hat: the notch, and the bar either side of it — node
 * 708:173737.
 *
 * It belongs to the phone rather than to the page, which is why it is drawn
 * by whoever draws the phone rather than by the page inside it. Held there it
 * is outside the scroll altogether: it does not move when the page moves, and
 * it does not move when the page overscrolls and bounces either — which is
 * what a real one does, and what one held inside the scroll cannot do.
 *
 * The notch is the black one a phone cuts out of its own screen — flush with
 * the top edge, a little under half the width across, rounded where it meets
 * the picture. It is not in the status bar node, which is the time and the
 * signals; it is what makes those two read as a phone.
 */
export function PhoneHat() {
  return (
    <div className="fl-landing__status" aria-hidden="true">
      <span className="fl-landing__notch" />
      <span className="fl-landing__time">9:41</span>
      <img className="fl-landing__signals" src={statusMini} alt="" />
    </div>
  )
}

/**
 * The hero — node 708:173738, "hero-container".
 *
 * 660 tall, and everything in it is laid from the bottom up: the copy sits on
 * the picture rather than under it, and the top bar floats over the whole thing
 * rather than taking a row of its own. The design stacks three pictures to make
 * its own; the artwork here is the one supplied, so it is one, cropped by the
 * frame the same way.
 */
export function LandingFlowScreen({
  content,
  overArt,
  hat = true,
  market,
  device = 'mobile',
}: {
  content: LandingScreen
  /** Laid over the picture itself — the framing handle, when one is offered. */
  overArt?: ReactNode
  /** Whose money the price is in. Without one it is drawn as written. */
  market?: MarketConfig
  /**
   * What it is being drawn on.
   *
   * The same content and the same fields, laid out for the screen it is being
   * looked at on: a phone stacks it and centres it under a status bar, a
   * desktop stands the words in a column down the left of the picture under a
   * web header. Everything editable is the same on both.
   */
  device?: Device
  /**
   * Whether the hero draws the phone's bar over its own top.
   *
   * On its own — a tile, the walkthrough — the hero is the whole screen and
   * carries it. Inside the page the page draws it instead, held at the top of
   * the scroll rather than at the top of the hero, so it stays where a phone's
   * would while the page runs under it.
   */
  hat?: boolean
}) {
  const text = landingText(content)
  // What the Hero banner tab controls: an uploaded picture standing in for
  // the shipped one, and the eyebrow over the heading.
  const hero = heroOf(content)
  const picture = hero.image || heroArt
  // The picture is placed rather than fitted, so its own shape is part of
  // where it goes. Until it is known the frame's shape stands in, which draws
  // it exactly filling — the same thing `cover` would have done.
  const ratio = useImageRatio(picture)
  return (
    <div className="fl fl-landing" data-device={device}>
      {/* The glow behind the picture: a 100px blur over a gradient that runs
          from nothing through gold to a trace of green. It stops 96 short of
          the bottom, so it lifts the picture without touching the page under
          it. */}
      <span className="fl-landing__glow" aria-hidden="true" />
      <div className="fl-landing__hero">
        {/* Everything the framing decides, handed to the sheet as four
            numbers: the picture's shape, how big it is drawn against the size
            that fills the frame, and where it sits. The sheet does the
            arithmetic in the frame's own units, so it holds at whatever size
            the hero happens to be drawn — a tile, a phone, the popup. */}
        <span
          className="fl-landing__art"
          aria-hidden="true"
          data-fit={ratio ? undefined : ''}
          style={
            {
              '--hero-ratio': ratio,
              '--hero-zoom': hero.zoom / 100,
              '--hero-x': hero.focalX,
              '--hero-y': hero.focalY,
            } as CSSProperties
          }
        >
          <img src={picture} alt="" />
          {/* Four stops, not a fade: clear at a fifth of the way down, half
              dark at the middle, and solid by seven tenths, which is what puts
              the copy on a ground rather than on the picture. */}
          <span className="fl-landing__wash" data-strength={hero.wash} />
          {overArt}
        </span>

        <div className="fl-landing__slot">
          <div className="fl-landing__content">
            {hero.labelEnabled && hero.label && (
              <span className="fl-landing__eyebrow" data-variant={hero.labelVariant}>
                {hero.label}
              </span>
            )}
            <p className="fl-landing__title">{text.title}</p>
            <div className="fl-landing__body-wrap">
              <p className="fl-landing__body">{text.body}</p>
            </div>
            {hero.priceEnabled && <HeroPrice hero={hero} market={market} />}
            {/* The footnote is laid over the buttons rather than after them —
                the design puts both in one grid cell and drops the note 132
                from the top, so the group keeps its height whether or not
                there is a note to draw. */}
            <div className="fl-landing__buttons">
              <div className="fl-landing__button-stack">
                <div className="fl-landing__button-group">
                  <span className="fl-landing__button" role="button" data-gold={hero.ctaGold || undefined}>
                    {text.cta}
                  </span>
                  {(content.altCtaEnabled ?? true) && (
                    <span className="fl-landing__button" role="button" data-appearance="soft">
                      {text.altCta}
                    </span>
                  )}
                </div>
                {hero.helperEnabled && (
                  <p className="fl-landing__footnote">{text.footnote}</p>
                )}
              </div>
            </div>
            {/* Which of the banners in the rotation this is. Three, because
                three is what the design draws; nothing here rotates, so the
                first is always the one showing. */}
            {device !== 'mobile' && (
              <span className="fl-landing__dots" aria-hidden="true">
                <i data-on="" />
                <i />
                <i />
              </span>
            )}
          </div>
        </div>
        {/* The way to the next banner, either side of the picture. Drawn
            because the design draws them; there is one banner here, so they
            are chrome rather than controls. */}
        {device !== 'mobile' && (
          <>
            <span className="fl-landing__step" data-side="back" aria-hidden="true">
              <Icon svg={iconArtwork['chevron-left']} size={16} />
            </span>
            <span className="fl-landing__step" data-side="on" aria-hidden="true">
              <Icon svg={iconArtwork['chevron-right']} size={16} />
            </span>
          </>
        )}
      </div>

      {/* A phone's bar, on a phone. A desktop has a browser around it rather
          than a status bar over it, and nothing here draws the browser. */}
      {hat && device === 'mobile' && <PhoneHat />}

      <header className="fl-landing__nav">
        <span className="fl-landing__logo">
          <img src={daznLogo} alt="" />
        </span>
        {/* The site's own navigation, which only a wide screen has room for.
            Static, like the phone's bar and the screen headers are: it is the
            chrome the page arrives in rather than anything the page says, and
            nothing in the panel writes it. */}
        {device !== 'mobile' && (
          <nav className="fl-landing__links" aria-hidden="true">
            {WEB_LINKS.map((link, i) => (
              <span key={link} className="fl-landing__link" data-on={i === 0 || undefined}>
                {link}
              </span>
            ))}
          </nav>
        )}
        <span className="fl-landing__nav-ctas">
          {device !== 'mobile' && (
            <span className="fl-landing__search" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="7" />
                <path d="m16 16 5 5" />
              </svg>
            </span>
          )}
          <span className="fl-landing__nav-cta">{text.navExplore}</span>
          {(content.navSignUpEnabled ?? true) && (
            <span className="fl-landing__nav-cta" data-appearance="neutral">
              {text.navSignUp}
            </span>
          )}
        </span>
      </header>
    </div>
  )
}

/* ── Cadence ───────────────────────────────────────────────── */

export function CadenceFlowScreen({
  content,
  selected,
}: {
  content: CadenceScreen
  /**
   * What the person walking the prototype picked, when there is one.
   *
   * Absent everywhere else, which leaves the authored choice showing — a tile
   * draws the screen as the panel wrote it, and nobody is choosing anything
   * in a picture.
   */
  selected?: string
}) {
  const chosen = selected ?? content.selected
  // Worked out from the cards themselves, so it cannot disagree with them.
  const savings = cadenceSavings(content)
  return (
    <Screen title={content.navTitle}>
      <div className="fl-cadence">
        <div className="fl-cadence__options" role="radiogroup" aria-label={content.navTitle}>
          {content.options.map((option) => {
            const on = option.id === chosen
            return (
              <div
                className="fl-cadence__option"
                key={option.id}
                data-on={on || undefined}
                // The ribbon is what marks an option as the one being pushed,
                // and it is the same option that takes the gold when chosen.
                // One signal rather than two that could disagree.
                data-promoted={option.badge ? '' : undefined}
                // The prototype reads clicks off the screen rather than the
                // screen calling back, the way it does with the tabs and the
                // back chevron. This is what tells it which row was hit.
                data-option={option.id}
                role="radio"
                aria-checked={on}
              >
                <Mark
                  svg={on ? cadenceRadioOn : cadenceRadioOff}
                  size={24}
                  className="fl-cadence__radio"
                />
                <div className="fl-cadence__text">
                  <p className="fl-cadence__name">{option.title}</p>
                  <p className="fl-cadence__note">{option.note}</p>
                  <p className="fl-cadence__price">
                    <span className="fl-cadence__amount">{option.price}</span>
                    <span className="fl-cadence__unit">/{option.unit}</span>
                    {savings[option.id] && (
                      <span className="fl-cadence__saving">
                        <Mark svg={iconArtwork.discount} size={16} />
                        {savings[option.id]}
                      </span>
                    )}
                  </p>
                </div>
                {option.badge && (
                  <span className="fl-cadence__badge">
                    <Mark svg={badgeCheck} size={16} />
                    {option.badge}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <Cta>{content.cta}</Cta>
      </div>
      <p className="fl-cadence__footnote">
        <Mark svg={actionsInfo} size={16} />
        {content.footnote}
      </p>
    </Screen>
  )
}

/* ── Login ─────────────────────────────────────────────────── */

const PROVIDER_MARKS = {
  apple: socialApple,
  google: socialGoogle,
  facebook: socialFacebook,
}

export function AuthFlowScreen({ content }: { content: AuthScreen }) {
  return (
    <Screen title={content.navTitle}>
      <div className="fl-auth">
        <Mark svg={daznRubik} size={40} className="fl-auth__mark" />
        <div className="fl-auth__title">
          <h3 className="fl-auth__heading">{content.title}</h3>
          <p className="fl-auth__sub">{content.subtitle}</p>
        </div>
        <div className="fl-auth__notice">
          <p className="fl-auth__notice-title">
            <Mark svg={icInfoFill} size={20} />
            {content.noticeTitle}
          </p>
          <p className="fl-auth__notice-body">{content.noticeBody}</p>
        </div>
        <div className="fl-auth__form">
          <Field label={content.emailLabel} value={content.emailValue} />
          <Cta>{content.cta}</Cta>
          <span className="fl__divider">{content.dividerLabel}</span>
          <div className="fl-auth__providers">
            {content.providers.map((p) => (
              <span className="fl-auth__provider" key={p.id}>
                <Mark svg={PROVIDER_MARKS[p.id]} size={24} />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  )
}

/* ── Account setup ─────────────────────────────────────────── */

export function AccountFlowScreen({
  content,
  state,
}: {
  content: AccountScreen
  /** empty · filled · confirmed — the three the design draws. */
  state: 'empty' | 'filled' | 'confirmed'
}) {
  const filled = state !== 'empty'
  return (
    <Screen title={content.navTitle}>
      <div className="fl-account">
        <div className="fl-account__fields">
          <div className="fl-account__block">
            <p className="fl-account__heading">{content.nameHeading}</p>
            <div className="fl__group">
              <Field
                label={content.firstNameLabel}
                value={filled ? content.firstNameValue : undefined}
              />
              <Field
                label={content.lastNameLabel}
                value={filled ? content.lastNameValue : undefined}
              />
            </div>
          </div>

          <div className="fl-account__block">
            <p className="fl-account__heading">{content.emailHeading}</p>
            <Field label={content.emailLabel} value={filled ? content.emailValue : undefined} />
          </div>

          <div className="fl-account__block">
            <p className="fl-account__heading">{content.passwordHeading}</p>
            <Field
              label={content.passwordLabel}
              value={filled ? '•'.repeat(content.passwordValue.length) : undefined}
              trailing={iconArtwork.preview}
              secret
            />
            {/* The checklist appears once there is a password to check. */}
            {filled && (
              <ul className="fl-account__rules">
                <li className="fl-account__rules-title">{content.rulesTitle}</li>
                {content.rules.map((rule) => (
                  <li className="fl-account__rule" key={rule} data-met="">
                    <Icon svg={iconArtwork.checkmark} size={16} />
                    {rule}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="fl-account__block">
            <p className="fl-account__heading">{content.notifyHeading}</p>
            {consentsOf(content).map((consent) => (
              <div key={consent.id}>
                <div className="fl-account__consent">
                  <p className="fl-account__consent-body">{consent.body}</p>
                  {/* The switch draws where it starts. A consent that is on by
                      default is a different thing being asked from one that is
                      off, and the screen has to show which. */}
                  <span className="fl-account__switch" data-on={consent.on || undefined}>
                    <span className="fl-account__knob" />
                  </span>
                </div>
                {consent.note && <p className="fl-account__note">{consent.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {state === 'confirmed' ? (
          <Cta appearance="pressed">{content.workingCta}</Cta>
        ) : (
          <Cta>{content.cta}</Cta>
        )}
      </div>
    </Screen>
  )
}

/* ── ZIP ───────────────────────────────────────────────────── */

export function ZipFlowScreen({
  content,
  state,
  logos,
}: {
  content: ZipScreen
  /** default · edit · edit results — the three the design draws. */
  state: 'default' | 'edit' | 'edit results'
  /** Catalogue ids for the teams the ZIP resolves to. */
  logos: string[]
}) {
  return (
    <Screen title={content.navTitle}>
      <div className="fl-zip">
        <div className="fl-zip__intro">
          <h3 className="fl-zip__heading">{content.heading}</h3>
          <p className="fl-zip__body">{content.body}</p>
        </div>
        {/* No leading mark. The design puts a location pin here, and it is
            not in our icon set — it lives inside the DS TextField rather than
            as its own export, so there is nothing to download. Left out rather
            than filled with the nearest glyph we happen to have. */}
        <Field
          label={content.fieldLabel}
          value={content.fieldValue}
          trailing={iconArtwork.close}
        />
        {state === 'edit results' && (
          <div className="fl-zip__results">
            <p className="fl-zip__results-label">{content.resultsLabel}</p>
            <div className="fl-zip__grid">
              {logos.map((id) => (
                <span className="fl-zip__logo" key={id}>
                  <img src={logoArtwork[id]} alt="" />
                </span>
              ))}
            </div>
          </div>
        )}
        <Cta>{content.cta}</Cta>
        <span className="fl__divider">{content.dividerLabel}</span>
        <Cta appearance="tertiary">{content.altCta}</Cta>
      </div>
    </Screen>
  )
}

/* ── Checkout ──────────────────────────────────────────────── */

export function CheckoutFlowScreen({
  content,
  state,
}: {
  content: CheckoutScreen
  /** empty · filled · payment process · payment verified. */
  state: 'empty' | 'filled' | 'payment process' | 'payment verified'
}) {
  const filled = state !== 'empty'
  const methods = methodsOf(content)
  const chosen = chosenMethod(content)
  return (
    <Screen title={content.navTitle}>
      <div className="fl-checkout">
        <p className="fl-checkout__note">{content.note}</p>

        <div className="fl-checkout__summary">
          <div className="fl-checkout__summary-head">
            <p className="fl-checkout__summary-title">{content.summaryTitle}</p>
            <span className="fl-checkout__change">{content.changeCta}</span>
          </div>
          {linesOf(content).map((line) => (
            <div
              className="fl-checkout__line"
              key={line.id}
              data-schedule={line.schedule ? '' : undefined}
              data-offer={line.offer ? '' : undefined}
            >
              <p className="fl-checkout__line-label">
                {line.schedule && <Mark svg={navSchedule} size={16} />}
                {line.label}
              </p>
              <p className="fl-checkout__line-value">
                {line.value}
                {line.unit && <span className="fl-checkout__line-unit">/{line.unit}</span>}
              </p>
            </div>
          ))}
          <p className="fl-checkout__renewal">{content.renewalNote}</p>
        </div>

        <div className="fl-checkout__methods">
          {methods.map((method, i) => {
            const on = method.id === chosen
            // The form belongs to the option it is filling in, so it draws
            // under that one rather than always under the first.
            const form = on && method.card
            const last = i === methods.length - 1
            return (
              <Fragment key={method.id}>
                {last && methods.length > 1 && <div className="fl-checkout__spacer" />}
                <div className="fl-checkout__method" data-tall={!last && !form ? '' : undefined}>
                  <p className="fl-checkout__method-name">
                    <Mark svg={on ? radioSelected : radioIdle} size={24} />
                    {method.label}
                  </p>
                  <span className="fl-checkout__marks">
                    {PAY_MARKS[method.marks].map((src) => (
                      <img src={src} alt="" key={src} />
                    ))}
                    {method.overflow && (
                      <span className="fl-checkout__overflow">{method.overflow}</span>
                    )}
                  </span>
                </div>
                {form && <CardForm content={content} filled={filled} state={state} />}
              </Fragment>
            )
          })}
        </div>

        <div className="fl-checkout__promo">
          <Icon svg={iconArtwork.gift} size={24} />
          <p className="fl-checkout__promo-label">{content.promoLabel}</p>
          <Icon svg={iconArtwork['chevron-right']} size={24} />
        </div>
      </div>
    </Screen>
  )
}

/** The artwork each set of marks draws, in order. */
const PAY_MARKS: Record<PayMarks, string[]> = {
  cards: [payVisa, payMastercard],
  gpay: [payGpayMark, payGpayType],
  paypal: [payPaypal],
  none: [],
}

/** The card fields, which open under whichever option is being paid by card. */
function CardForm({
  content,
  filled,
  state,
}: {
  content: CheckoutScreen
  filled: boolean
  state: 'empty' | 'filled' | 'payment process' | 'payment verified'
}) {
  return (
          <div className="fl-checkout__details">
            <Field
              label={content.cardNumberLabel}
              value={filled ? '4242 4242 4242 4242' : undefined}
              trailing={iconArtwork.edit}
            />
            <div className="fl-checkout__pair">
              <Field label={content.expiryLabel} value={filled ? '04/28' : undefined} />
              <Field
                label={content.cvcLabel}
                value={filled ? '123' : undefined}
                trailing={iconArtwork.check}
              />
            </div>
            <Field label={content.nameOnCardLabel} value={filled ? 'John Doe' : undefined} />
            <p className="fl-checkout__legal">{content.legal}</p>
            {/* Live once the card is filled; before that it is the disabled
                white button the design draws. */}
            {state === 'payment process' ? (
              <Cta appearance="pressed">{content.payCta}</Cta>
            ) : (
              <Cta quiet={!filled}>{content.payCta}</Cta>
            )}
            <Cta appearance="tertiary">
              <Icon svg={iconArtwork.settings} size={20} />
              {content.secureCta}
            </Cta>
          </div>
  )
}

/* ── Confirmation ──────────────────────────────────────────── */

/**
 * The circles on the confirmation screen — node 549:86715.
 *
 * Each team's own ground with its crest sized inside it, rather than one
 * treatment repeated: the design gives every circle a different colour and
 * every crest a different box, because a crest that fills its circle is a
 * different picture from one that sits in it.
 */
const READY_CRESTS: Record<
  string,
  { ground: string; art: string; width: number; height: number }
> = {
  knicks: { ground: '#1b418b', art: readyKnicks, width: 48.222, height: 40.185 },
  rangers: { ground: '#c8102e', art: readyRangers, width: 37.333, height: 40.444 },
  islanders: { ground: '#fc4c02', art: readyIslanders, width: 61.534, height: 59.611 },
  devils: { ground: '#202020', art: readyDevils, width: 38.538, height: 37.333 },
  sabres: { ground: '#00468c', art: readySabres, width: 44.761, height: 45.111 },
}

export function ReadyFlowScreen({ content }: { content: ReadyScreen }) {
  const middle = Math.floor(content.logos.length / 2)
  return (
    <Screen title={content.navTitle} mark={checkCircleFilled} name="ready">
      <div className="fl-ready">
        <div className="fl-ready__content">
          {/* The row spreads across the 343 and fades out at both ends — the
              design masks it rather than cropping it, so the outer circles go
              quiet instead of stopping. */}
          <div className="fl-ready__logos">
            {content.logos.map((id, i) => {
              const crest = READY_CRESTS[id]
              return (
                <span
                  className="fl-ready__logo"
                  key={id}
                  data-lead={i === middle ? '' : undefined}
                  style={crest ? { background: crest.ground } : undefined}
                >
                  <img
                    src={crest?.art ?? logoArtwork[id]}
                    alt=""
                    style={
                      crest
                        ? { inlineSize: `${crest.width}px`, blockSize: `${crest.height}px` }
                        : undefined
                    }
                  />
                </span>
              )
            })}
          </div>
          <div className="fl-ready__words">
            <h3 className="fl-ready__title">{content.title}</h3>
            <p className="fl-ready__body">{content.body}</p>
          </div>
        </div>
        <div className="fl-ready__ctas">
          <Cta>{content.cta}</Cta>
          <Cta appearance="tertiary">{content.altCta}</Cta>
        </div>
      </div>
    </Screen>
  )
}


/* ── Live and upcoming games — node 731:27543 ────────────────
   Which games are on the schedule is a market's choice; what they say is not.
   A market writes down the ids it wants and the schedule supplies the rest —
   the stamp, the teams, the competition, how far a part-watched game has run.

   There is nothing here to fetch that from, so every id is drawn against a
   placeholder: the same id always draws the same card, so the page reads as a
   real schedule rather than as one fixture three times, and none of it
   pretends to be a real kickoff. */

/** One fixture's picture layers, timestamp, and what sits over them. */
const FIXTURES = [
  {
    id: 'knicks-spurs',
    art: [schedP0, schedP1, schedP2],
    stamp: '14 SEP 19:00',
    remind: true,
    title: 'Knicks vs. Spurs ',
    subtitle: 'NBA',
  },
  {
    id: 'sabres-penguins',
    art: [schedP0, schedP3, schedP4, schedP5, schedP6],
    stamp: '14 SEP 19:00',
    remind: true,
    title: 'Sabres vs. Penguins',
    subtitle: 'NHL',
  },
  { id: 'live', art: [schedP0], stamp: 'LIVE', title: 'Title', subtitle: 'Subtitle', label: 'Label' },
  {
    id: 'live-tv',
    art: [schedP0],
    stamp: 'LIVE TV',
    title: 'Title',
    subtitle: 'Subtitle',
    label: 'Label',
    /* The one part-watched: the time left, and how far the scrub has run. */
    left: '1 hr 21 min left',
    scrub: 190,
  },
] as const

/**
 * The placeholder a game is drawn against.
 *
 * By its place in the list rather than by its id. There is nothing here to
 * fetch a fixture from, so an id cannot be translated into a real one — and
 * pretending otherwise by hashing it only meant two ids could land on the same
 * card and a schedule could draw the same game twice. Dealt out in order, four
 * games are four different cards, which is what a schedule looks like.
 */
function fixtureFor(at: number) {
  return FIXTURES[at % FIXTURES.length]
}

function ScheduleSection({
  heading,
  subheading,
}: {
  heading: string
  subheading: string
}) {
  return (
    <section className="fl-page__schedule">
      {/* The heading's own band, which fades to the page colour at both ends. */}
      <div className="fl-page__schedule-head">
        <p className="fl-page__schedule-title">{heading}</p>
        {subheading.trim() !== '' && <p className="fl-page__schedule-sub">{subheading}</p>}
      </div>
      <div className="fl-page__schedule-row">
        {/* What a rail holds is the rail's, not the page's: the page names
            which rail and the rail answers with its games. These are the
            placeholders standing in for that answer. */}
        {FIXTURES.map((fixture) => (
          <article className="fl-fixture" key={fixture.id}>
            <div className="fl-fixture__preview">
              <span className="fl-fixture__art" aria-hidden="true">
                {fixture.art.map((src, i) => (
                  <img src={src} alt="" key={i} />
                ))}
              </span>
              <span className="fl-fixture__stamp">{fixture.stamp}</span>
              {'remind' in fixture && fixture.remind && (
                <span className="fl-fixture__remind" aria-hidden="true">
                  <img src={icReminder} alt="" />
                </span>
              )}
              {'left' in fixture && fixture.left && (
                <span className="fl-fixture__playback">
                  <span className="fl-fixture__time">
                    <img className="fl-fixture__play" src={icPlay} alt="" />
                    {fixture.left}
                  </span>
                  <span className="fl-fixture__scrub-track">
                    <span
                      className="fl-fixture__scrub"
                      style={{ inlineSize: `${fixture.scrub}px` }}
                    />
                  </span>
                </span>
              )}
            </div>
            <div className="fl-fixture__text">
              <p className="fl-fixture__title">{fixture.title}</p>
              <p className="fl-fixture__subtitle">{fixture.subtitle}</p>
              {'label' in fixture && fixture.label && (
                <span className="fl-fixture__label">{fixture.label}</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}


/* ── Meet the teams — node 708:173983 ────────────────────────
   A rail of eight: the three the design fills in, and the five it leaves as
   the tile's own template. Which teams a market shows is not written here —
   the design draws these, so these are what is drawn. */

function TeamsRail({
  eyebrow,
  title,
  body,
  teams,
}: {
  eyebrow: string
  title: string
  body: string
  teams: LandingTeam[]
}) {
  return (
    <section className="fl-page__teams">
      <div className="fl-page__teams-head">
        <p className="fl-page__teams-eyebrow">{eyebrow}</p>
        <p className="fl-page__teams-title">{title}</p>
        <p className="fl-page__teams-body">{body}</p>
      </div>
      <div className="fl-page__teams-rail">
        {teams
          /* A team with no name yet draws nothing rather than an empty tile:
             the field is there to be typed into, and the design's own empty
             tile is the template below. */
          .filter((team) => team.name.trim() !== '' || (team.city ?? '').trim() !== '')
          .map((team) => {
            /* The two lines together are the name the artwork is keyed by, so
               "New York" over "Knicks" finds the same tile the one-line name
               used to. */
            const full = [team.city, team.name].map((one) => (one ?? '').trim()).filter(Boolean).join(' ')
            const art = teamArt[full]
            return (
              <div className="fl-team" key={team.id}>
                <div
                  className="fl-team__tile"
                  /* What was chosen, then what the name brings, then nothing —
                     which is the page's own black, and is what a tile with no
                     colour anywhere has always been. */
                  style={team.ground || art ? { background: team.ground || art?.ground } : undefined}
                >
                  {/* A logo somebody chose fills the tile — there is no design
                      saying how to crop one, so it is shown whole. The name's
                      own is laid out the way the design lays that team out. */}
                  {team.logo ? (
                    <img className="fl-team__own" src={team.logo} alt="" />
                  ) : art ? (
                    <img
                      className="fl-team__art"
                      src={art.art}
                      alt=""
                      style={{ inlineSize: `${art.width}px` }}
                    />
                  ) : (
                    <img className="fl-team__plate" src={teamPlaceholder} alt="" />
                  )}
                  {/* 54 of gradient at 60%, from nothing to the page colour —
                      what the name is read against. */}
                  <span className="fl-team__wash" aria-hidden="true" />
                  <span className="fl-team__content">
                    {(team.city ?? '').trim() !== '' && (
                      <span className="fl-team__city">{team.city}</span>
                    )}
                    <span className="fl-team__name">{team.name}</span>
                  </span>
                </div>
              </div>
            )
          })}
      </div>
    </section>
  )
}

/* ── The landing page below the hero ─────────────────────────
   Figma: 🚀 Acquisition for ai → "MSG+ - Landing page - Mobile", node
   708:173735 — 375 wide and 7412 tall. The hero above is the whole of what
   a tile and the walkthrough show; this is the rest of the page, which the
   edit view scrolls. */

/**
 * A provider's logo, and the box the design gives it — node 734:27154.
 *
 * Every tile is the same 165 by 72; what differs is the picture inside it,
 * which the design sizes per provider rather than fitting to a common height.
 * Some are drawn from a larger picture, so the box clips and the picture is
 * laid inside it at the offsets the design uses. A name with no entry falls
 * back to the name itself, which is what an unknown provider has always done.
 */
interface ProviderArt {
  src: string
  /** The picture's box inside the tile. */
  w: number
  h: number
  /** Fills its box rather than fitting inside it. */
  cover?: boolean
  /** Drawn from a larger picture: the part of it the design shows. */
  crop?: { top: string; left?: string; inlineSize?: string; blockSize: string }
}

const providerArt: Record<string, ProviderArt> = {
  Spectrum: { src: providerSpectrum, w: 119, h: 46 },
  'optimum.': { src: providerOptimum, w: 120, h: 42 },
  'optimum.tv': {
    src: providerOptimumTv,
    w: 135,
    h: 53,
    crop: { blockSize: '128.57%', top: '-14.29%' },
  },
  fios: { src: providerFios, w: 75, h: 39, cover: true },
  DIRECTV: { src: providerDirectv, w: 99, h: 38 },
  'DIRECTV stream': { src: providerDirectvStream, w: 97, h: 38 },
  fubo: { src: providerFubo, w: 80, h: 31, crop: { blockSize: '85.71%', top: '7.14%' } },
  Astound: { src: providerAstound, w: 112, h: 43 },
  xfinity: { src: providerXfinity, w: 94, h: 37 },
  breezeline: {
    src: providerBreezeline,
    w: 131,
    h: 51,
    crop: { blockSize: '212.14%', top: '-56.07%', left: '-23.33%', inlineSize: '146.67%' },
  },
  'Mid-Hudson Fiber': {
    src: providerMidHudson,
    w: 140,
    h: 20,
    crop: { blockSize: '70.75%', top: '14.62%' },
  },
}

/**
 * The questions at the foot of the page — node 747:46377.
 *
 * A card each on the container-3 surface rather than the ruled list this used
 * to be: 16 of padding, an 8 radius, 12 between them, the question in 16 bold
 * and the chevron 24 at its right.
 *
 * A question with an answer written for it opens onto that answer, and the
 * chevron turns to say so. One with nothing to say does not open at all —
 * the design gives the questions and leaves the answers to whoever writes
 * them, and a row that opens onto nothing is worse than a row that does not.
 */
function FaqSection({ content, title }: { content: LandingScreen; title: string }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section className="fl-page__faq">
      <p className="fl-faq__title">{title}</p>
      <div className="fl-faq__list">
        {questionsOf(content).map((one) => {
          const answer = (one.answer ?? '').trim()
          const isOpen = open === one.id
          return (
            <span
              className="fl-faq__card"
              key={one.id}
              role={answer ? 'button' : undefined}
              tabIndex={answer ? 0 : undefined}
              aria-expanded={answer ? isOpen : undefined}
              data-open={isOpen || undefined}
              onClick={() => answer && setOpen(isOpen ? null : one.id)}
            >
              <span className="fl-faq__row">
                <span className="fl-faq__question">{one.question}</span>
                <Icon svg={iconArtwork['chevron-right']} size={24} />
              </span>
              {answer && isOpen && <span className="fl-faq__answer">{answer}</span>}
            </span>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The wall of device logos — node 853:58657.
 *
 * Four rows of three and a last row of one, each logo 40 tall and its own
 * width. The widths are the design's to a tenth of a pixel: they are what
 * space the row, since the three sit apart rather than in columns.
 */
const DEVICE_ROWS: { src: string; name: string; w: number }[][] = [
  [
    { src: deviceRoku, name: 'Roku', w: 69.6 },
    { src: deviceFireTv, name: 'Amazon Fire TV', w: 124.8 },
    { src: deviceGooglePlay, name: 'Google Play', w: 108.8 },
  ],
  [
    { src: deviceSamsung, name: 'Samsung', w: 111.2 },
    { src: deviceAppleTv, name: 'Apple TV', w: 56.8 },
    { src: devicePanasonic, name: 'Panasonic', w: 105.6 },
  ],
  [
    { src: deviceChromecast, name: 'Chromecast', w: 123.2 },
    { src: deviceSony, name: 'Sony', w: 95.2 },
    { src: deviceLg, name: 'LG', w: 57.6 },
  ],
  [
    { src: deviceAppStore, name: 'App Store', w: 101.6 },
    { src: devicePlaystation, name: 'PlayStation 5', w: 104.8 },
    { src: deviceXbox, name: 'Xbox', w: 81.6 },
  ],
  [{ src: deviceAndroidTv, name: 'Android TV', w: 126.4 }],
]


/**
 * The whole landing page, hero included.
 *
 * The sections a market writes: the postcode prompt, the teams, Multiview,
 * the TV providers, the devices, the free games and the questions. What is
 * drawn between them on the real page — the schedule, the scores, the news,
 * the fan chat — is DAZN showing what it is showing, not copy anybody here
 * writes, so it is not drawn at all rather than drawn as invented content.
 *
 * The plan picker sits in the middle of the design. It is not rebuilt here:
 * the cards and their tabs are the ones the plans step already edits, handed
 * in as children the way the design hands them to a slot.
 */
export function LandingPageScreen({
  content,
  children,
  overArt,
  market,
  device = 'mobile',
}: {
  content: LandingScreen
  /** The plan picker, where the page puts it. */
  children?: ReactNode
  /** Handed to the hero, to lay over its picture. */
  overArt?: ReactNode
  /** Handed to the hero, for its price. */
  market?: MarketConfig
  /** Handed to the hero, which is the part that is laid out differently. */
  device?: Device
}) {
  const text = landingText(content)
  return (
    <div className="fl fl-page" data-device={device}>
      {/* No hat here. Whatever draws the phone draws that — the preview's own
          frame, the popup's — so the page is only ever the page, and the bar
          is never drawn twice over one screen. */}
      <LandingFlowScreen
        content={content}
        overArt={overArt}
        hat={false}
        market={market}
        device={device}
      />
      {sectionsOf(content)
        .filter((section) => section.on)
        .map((section) => (
          <PageSectionView
            key={section.id}
            section={section}
            content={content}
            text={copyOf(text, content, section)}
          >
            {children}
          </PageSectionView>
        ))}
      {/* Under every section and outside the list: the footer is not a
          component. It does not move, it cannot be switched off, and there is
          nothing to arrange about it — node 741:29473. */}
      <footer className="fl-foot">
        <div className="fl-foot__links">
          {linksOf(content)
            .filter((link) => link.label.trim() !== '')
            .map((link, i) => (
              <Fragment key={link.id}>
                {/* Nothing to look at: a full-width item with no height, which
                    is what pushes the next word onto a line of its own. */}
                {link.breaks && i > 0 && <span className="fl-foot__break" aria-hidden="true" />}
                <span className="fl-foot__link">{link.label}</span>
              </Fragment>
            ))}
        </div>
        {text.footerMark && (
          <p className="fl-foot__mark">
            {text.footerMark}
            <span className="fl-foot__tm">TM</span>
          </p>
        )}
      </footer>
    </div>
  )
}

/**
 * One block of the page, drawn from what that instance says.
 *
 * Every block was written straight into the page in the order the design has
 * them. They are a list now — the page can be arranged, blocks switched off,
 * blocks copied — so each one has to be able to draw itself from an instance
 * rather than from its place in a run of JSX. The markup inside each case is
 * the markup that was there, down to the comments explaining the design.
 */
export function PageSectionView({
  section,
  content: page,
  text,
  children,
}: {
  section: PageSection
  content: LandingScreen
  text: ReturnType<typeof landingText>
  children?: ReactNode
}) {
  /*
   * What THIS instance says, rather than what the page says.
   *
   * A copy keeps its own words under its own id, and `text` already arrives
   * resolved that way. Everything that is not a string did not: the lists and
   * the choices were read straight off the page, so two rails on one page drew
   * the same tiles however differently they were written. Resolved once here,
   * so every case below reads the instance and none of them has to remember to.
   */
  const own = page.sectionCopy?.[section.id]
  const content = own ? { ...page, ...own } : page

  switch (section.type) {
    /* node 708:173789. Its own spacing rather than the page's: 42 above,
       24 below, and 22 between the heading and the row. */
    case 'zip':
      return (
        <section className="fl-page__zip">
          <div className="fl-page__zip-copy">
            <p className="fl-page__zip-heading">{text.zipHeading}</p>
            <p className="fl-page__zip-note">{text.zipNote}</p>
          </div>
          <div className="fl-page__zip-row">
            {/* The field holds 209 and the button takes what is left. Empty,
                because the code it used to show was authored: this is the box
                somebody types their own into, not a code we chose for them. */}
            <span className="fl-page__zip-field" />
            <span className="fl-page__zip-cta" role="button">
              {text.zipCta}
            </span>
          </div>
        </section>
      )

    case 'schedule':
      return (
        <ScheduleSection
          heading={text.scheduleHeading}
          subheading={text.scheduleSubheading}
        />
      )

    /* node 708:173855 — the heading and the picker are one section, 32
       apart, with the section's own 56 above and 40 below. */
    case 'plans':
      return children ? (
        <section className="fl-page__plans">
          <div className="fl-page__plans-head">
            <p className="fl-page__plans-title">{text.plansTitle}</p>
            <p className="fl-page__plans-body">{text.plansBody}</p>
          </div>
          {children}
        </section>
      ) : null

    case 'teams':
      return (
        <TeamsRail
          eyebrow={text.teamsEyebrow}
          title={text.teamsTitle}
          body={text.teamsBody}
          teams={teamsOf(content)}
        />
      )

    /* The answer to a postcode outside the region: what was typed, what is
       not available there, and the plans that are.

       Node 738:42451 — the card the design calls .payment_card, rebuilt from
       it rather than from a picture of it. Four things stacked 20 apart: the
       words, the field, the message, the button. */
    case 'area':
      return (
        <section className="fl-page__area">
          <div className="fl-area">
            <div className="fl-area__copy">
              <p className="fl-area__title">{text.areaTitle}</p>
              <p className="fl-area__body">{text.areaBody}</p>
            </div>
            {/* Form/TextField at 56, its label floating over the value the way
                every other field in the system floats one. */}
            <div className="fl-area__field">
              <span className="fl-area__pin" aria-hidden="true">
                <img src={actionLocation} alt="" />
              </span>
              {/* Empty. What stood here was a label and a code nobody typed,
                  and this is the box somebody types their own into. */}
              <span className="fl-area__entry" />
              <span className="fl-area__clear" aria-hidden="true">
                <Icon svg={iconArtwork.close} size={24} />
              </span>
            </div>
            {/* The message is its own box on the container-2 surface, not two
                loose paragraphs: mark and headline on one row, and the reason
                indented 28 under it, clear of the mark. */}
            <div className="fl-area__notice">
              <p className="fl-area__notice-line">
                <Mark svg={icInfoFill} size={20} />
                <span>{text.areaNotice}</span>
              </p>
              <p className="fl-area__note">{text.areaNote}</p>
            </div>
            <span className="fl-area__cta" role="button">
              {text.areaCta}
            </span>
          </div>
        </section>
      )

    /* Node 708:174095 — the still, then who it is for, what it is, and the
       way in. A card of its own on the soft surface inside a 2px border. */
    case 'multiview':
      return (
        <section className="fl-page__multiview">
          <div className="fl-art">
            {!content.multiviewImageOff && (
              <img className="fl-art__shot" src={content.multiviewImage || articleShot} alt="" />
            )}
            <div className="fl-art__words">
              <p className="fl-art__prefix">
                <Mark svg={articleIcon} size={24} />
                <span className="fl-art__kind">{text.multiviewEyebrow}</span>
                {text.multiviewBadge && (
                  <span className="fl-art__tab">
                    <span className="fl-art__badge">{text.multiviewBadge}</span>
                  </span>
                )}
              </p>
              <p className="fl-art__title">{text.multiviewTitle}</p>
              <p className="fl-art__body">{text.multiviewBody}</p>
              <span className="fl-art__cta" role="button">
                {text.multiviewCta}
              </span>
            </div>
          </div>
        </section>
      )

    /* Node 734:27154 — the words, the tiles in two columns 12 apart, the line
       about the rest of them, and the way in. Everything 24 apart. */
    case 'providers':
      return (
        <section className="fl-page__providers">
          <div className="fl-provider__copy">
            <h2 className="fl-provider__title">{text.providersTitle}</h2>
            <p className="fl-provider__body">
              {text.providersBody}
              {text.providersHighlight && (
                <>
                  {/* Its own line in the design, not the tail of the sentence
                      above it. */}
                  <br />
                  <span className="fl-page__gold">{text.providersHighlight}</span>
                </>
              )}
            </p>
          </div>
          <div className="fl-provider__grid">
            {/* A provider with no name yet draws nothing rather than an empty
                tile: the field is there to be typed into, and the design has
                no blank in the grid. */}
            {providersOf(content)
              .filter((provider) => provider.name.trim() !== '')
              .map((provider) => {
                const art = providerArt[provider.name]
                return (
                  <span className="fl-provider" key={provider.id}>
                    {art ? (
                      <span
                        className="fl-provider__art"
                        data-clip={art.crop ? '' : undefined}
                        style={{ inlineSize: art.w, blockSize: art.h }}
                      >
                        <img
                          src={art.src}
                          alt={provider.name}
                          data-fit={art.cover ? 'cover' : undefined}
                          style={
                            art.crop && {
                              insetBlockStart: art.crop.top,
                              insetInlineStart: art.crop.left ?? 0,
                              inlineSize: art.crop.inlineSize ?? '100%',
                              blockSize: art.crop.blockSize,
                            }
                          }
                        />
                      </span>
                    ) : (
                      provider.name
                    )}
                  </span>
                )
              })}
          </div>
          <p className="fl-provider__note">{text.providersNote}</p>
          <span className="fl-provider__cta" role="button">
            {text.providersCta}
          </span>
        </section>
      )

    /* Node 734:41541 — .Section_Text_Block. Two paragraphs 8 apart and
       centred: a heading whose second line takes the brand gradient, and the
       words under it. Nothing else; the row of device logos the section used
       to promise is not in the design. */
    case 'devices':
      return (
        <section className="fl-page__devices">
          <p className="fl-text__title">
            {text.devicesTitle}
            {text.devicesTitleTwo && (
              <>
                <br />
                <span className="fl-text__gold">{text.devicesTitleTwo}</span>
              </>
            )}
          </p>
          <p className="fl-text__body">{text.devicesBody}</p>
        </section>
      )

    /* Node 853:58657 — a heading between two rules, and the logos under it:
       four rows of three spaced apart, and one on its own at the end. */
    case 'supported':
      return (
        <section className="fl-page__supported">
          <p className="fl-dev__heading">
            <img className="fl-dev__rule" src={deviceRule} alt="" />
            <span>{text.supportedTitle}</span>
            <img className="fl-dev__rule" src={deviceRule} alt="" />
          </p>
          <div className="fl-dev__body">
          <div className="fl-dev__wall">
            {DEVICE_ROWS.map((row) => (
              <div className="fl-dev__row" key={row.map((d) => d.name).join()} data-one={row.length === 1 || undefined}>
                {row.map((device) => (
                  <img
                    className="fl-dev__logo"
                    key={device.name}
                    src={device.src}
                    alt={device.name}
                    style={{ inlineSize: device.w }}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="fl-dev__note">
            {text.supportedNote}
            {text.supportedLink && (
              <>
                {/* Its own line, as the design sets it — the text block is two
                    lines of 21 whatever the width would allow. */}
                <br />
                <span className="fl-dev__link">{text.supportedLink}</span>
              </>
            )}
          </p>
          </div>
        </section>
      )

    /* Node 852:58100 — the words, then a row per feature with a hairline
       between them, then the way in. Each row is a 130 picture, a tag, a
       heading and a line. */
    case 'features':
      return (
        <section className="fl-page__features">
          <div className="fl-feat__copy">
            <p className="fl-feat__eyebrow">{text.featuresEyebrow}</p>
            <p className="fl-feat__title">{text.featuresTitle}</p>
          </div>
          <div className="fl-feat__list">
            {featuresOf(content).map((feature) => {
              const art = featureArt[feature.tag]
              return (
                <div className="fl-feat__row" key={feature.id}>
                  <span className="fl-feat__shot">
                    {/* A picture somebody chose fills the square, because there
                        is no design telling us how to crop it. The tag's own
                        is laid out the way that row is drawn. */}
                    {!feature.imageOff && feature.image ? (
                      <span className="fl-feat__frame" data-own="">
                        <img src={feature.image} alt="" />
                      </span>
                    ) : (
                      !feature.imageOff &&
                      art && (
                        <span
                          className="fl-feat__frame"
                          style={{ blockSize: art.h, insetBlockStart: art.top }}
                        >
                          <img
                            src={art.photo}
                            alt=""
                            style={{ blockSize: art.imgH, insetBlockStart: art.imgTop }}
                          />
                        </span>
                      )
                    )}
                  </span>
                  <div className="fl-feat__words">
                    {feature.tag && (
                      <span className="fl-feat__tag">
                        {art && <Mark svg={art.icon} size={20} />}
                        {feature.tag}
                      </span>
                    )}
                    <span className="fl-feat__text">
                      <p className="fl-feat__name">{feature.title}</p>
                      <p className="fl-feat__body">{feature.body}</p>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <span className="fl-feat__cta" role="button">
            {text.featuresCta}
          </span>
        </section>
      )

    /* Node 747:46379 — a picture 343 by 447 with the words and the button
       laid over the foot of it, inside a 2px border on a 12 radius. */
    case 'imageCta':
      return (
        <section className="fl-page__image-cta">
          <div className="fl-imgcta">
            {!content.imageCtaImageOff && (
              <img
                className="fl-imgcta__art"
                src={content.imageCtaImage || imageCtaArt}
                alt=""
              />
            )}
            <div className="fl-imgcta__foot">
              <div className="fl-imgcta__words">
                <p className="fl-imgcta__title">{text.imageCtaTitle}</p>
                <p className="fl-imgcta__body">{text.imageCtaBody}</p>
              </div>
              <span className="fl-imgcta__cta" role="button">
                {text.imageCtaCta}
              </span>
            </div>
          </div>
        </section>
      )

    case 'rail':
      return (
        <RailSection title={text.railTitle} size={railSizeOf(content)} tiles={tilesOf(content)} />
      )

    case 'subRail':
      return (
        <SubRailSection
          title={text.subRailTitle}
          body={text.subRailBody}
          tiles={subTilesOf(content)}
        />
      )

    case 'bundles':
      return (
        <BundlesSection
          title={text.bundlesTitle}
          body={text.bundlesBody}
          bundles={bundlesOf(content)}
        />
      )

    case 'matchList':
      return (
        <MatchListSection
          eyebrow={text.matchEyebrow}
          title={text.matchTitle}
          cta={text.matchCta}
          matches={matchesOf(content)}
        />
      )

    case 'cardStack':
      return <CardStackSection cards={cardsOf(content)} />

    case 'cities':
      return (
        <CitiesSection
          eyebrow={text.citiesEyebrow}
          title={text.citiesTitle}
          body={text.citiesBody}
          tabs={cityTabsOf(content)}
          tiles={cityTilesOf(content)}
        />
      )

    case 'live':
      return (
        <LiveSection
          title={text.liveTitle}
          body={text.liveBody}
          cta={text.liveCta}
        />
      )

    case 'spotlight':
      return (
        <SpotlightSection
          image={content.spotlightImage ?? ''}
          label={text.spotlightLabel}
          title={text.spotlightTitle}
          body={text.spotlightBody}
        />
      )

    case 'fightPlan':
      return (
        <FightPlanSection
          title={text.planPickTitle}
          more={text.planPickMore}
          cta={text.planPickCta}
          cards={planCardsOf(content)}
        />
      )

    case 'faq':
      return <FaqSection content={content} title={text.faqTitle} />
  }
}

/**
 * A rail: a title, and a row of tiles that runs off the edge of the screen.
 *
 * The four sizes are one component because they differ in the tile and in
 * nothing else — the title sits in the same place, the row scrolls the same
 * way, and the last tile is cut off by the same edge. What the size decides is
 * how wide a tile is, what shape its picture is, and whether the words sit
 * under the picture or over it.
 *
 * Off the right edge on purpose. A rail whose last tile ends inside the screen
 * is a row, and a row does not tell you to keep going.
 */
function RailSection({
  title,
  size,
  tiles,
}: {
  title: string
  size: RailSize
  tiles: LandingTile[]
}) {
  return (
    <section className="fl-rail" data-size={size}>
      {title.trim() !== '' && <p className="fl-rail__title">{title}</p>}
      <div className="fl-rail__row">
        {tiles.map((tile, at) => {
          /* Each rail has its own pictures out of its own frame in the file —
             a games rail draws games, a story rail draws films. */
          const art = size === 'story' ? STORY_ART : size === 'wide' ? PROMO_ART : GAME_ART
          return (
            <article className="fl-rail__tile" key={tile.id}>
              <span className="fl-rail__art" aria-hidden="true">
                <img src={artAt(art, at)} alt="" />
                {/* The date rides on the picture where the tile is big enough
                    to carry it, and the stylesheet hides it where it is not. */}
                <span className="fl-rail__stamp">{fixtureFor(at).stamp}</span>
              </span>
              <span className="fl-rail__words">
                <p className="fl-rail__name">{tile.title}</p>
                {tile.meta.trim() !== '' && <p className="fl-rail__meta">{tile.meta}</p>}
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The other subscriptions, offered beside this one — node 1084:55909.
 *
 * A rail like any other in how it scrolls, and not one in what it holds: each
 * tile is a thing to buy, so it carries its own way in rather than being a
 * link into a page that sells it. Which is why the button is on the tile and
 * there is none under the heading.
 */
function SubRailSection({
  title,
  body,
  tiles,
}: {
  title: string
  body: string
  tiles: LandingSubTile[]
}) {
  return (
    <section className="fl-subrail">
      <div className="fl-subrail__head">
        {title.trim() !== '' && <p className="fl-subrail__title">{title}</p>}
        {body.trim() !== '' && <p className="fl-subrail__body">{body}</p>}
      </div>
      <div className="fl-subrail__row">
        {tiles.map((tile, at) => (
            <article className="fl-subtile" key={tile.id}>
              <span className="fl-subtile__art" aria-hidden="true">
                <img src={artAt(SUB_ART, at)} alt="" />
              </span>
              <span className="fl-subtile__wash" aria-hidden="true" />
              <span className="fl-subtile__foot">
                <img className="fl-subtile__logo" src={daznLogo} alt="" />
                <p className="fl-subtile__line">{tile.line}</p>
                <span className="fl-subtile__cta" role="button">
                  {tile.cta}
                </span>
              </span>
            </article>
        ))}
      </div>
    </section>
  )
}

/**
 * Bundles — nights sold together for less than the sum of them.
 *
 * Side by side and scrolling, because the offer is a comparison: what is in
 * each, and what each saves. A bundle with no saving to show draws neither the
 * old price nor the saving rather than an empty space where they would be —
 * some bundles are simply a convenient basket.
 */
function BundlesSection({
  title,
  body,
  bundles,
}: {
  title: string
  body: string
  bundles: LandingBundle[]
}) {
  return (
    <section className="fl-bundles">
      <div className="fl-bundles__head">
        {title.trim() !== '' && <p className="fl-bundles__title">{title}</p>}
        {body.trim() !== '' && <p className="fl-bundles__body">{body}</p>}
      </div>
      <div className="fl-bundles__row">
        {bundles.map((bundle) => (
          <article className="fl-bundle" key={bundle.id} data-best={bundle.badge.trim() ? '' : undefined}>
            {bundle.badge.trim() !== '' && <span className="fl-bundle__badge">{bundle.badge}</span>}
            <p className="fl-bundle__name">{bundle.name}</p>
            <p className="fl-bundle__note">{bundle.note}</p>
            <p className="fl-bundle__prices">
              <span className="fl-bundle__price">{bundle.price}</span>
              {bundle.was.trim() !== '' && <span className="fl-bundle__was">{bundle.was}</span>}
              {bundle.save.trim() !== '' && <span className="fl-bundle__save">{bundle.save}</span>}
            </p>
            <p className="fl-bundle__term">{bundle.term}</p>
            <div className="fl-bundle__fights">
              {bundle.fights.map((fight, at) => (
                  <div className="fl-bundle__fight" key={fight.id}>
                    <span className="fl-bundle__shot" aria-hidden="true">
                      <img src={artAt(FIGHT_ART, at)} alt="" />
                    </span>
                    <span className="fl-bundle__words">
                      <p className="fl-bundle__fight-name">{fight.name}</p>
                      <p className="fl-bundle__when">{fight.when}</p>
                    </span>
                  </div>
                ))}
            </div>
            <span className="fl-bundle__cta" role="button">
              {bundle.cta}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

/**
 * A day-by-day list of matches — node 1093:51934.
 *
 * The day is on the match rather than the list being a list of days, so the
 * headings are found rather than authored: a run of matches sharing a day is
 * drawn under one. Which means a day nobody has a match on stops existing on
 * its own, and moving a match to another day is editing one field.
 */
function MatchListSection({
  eyebrow,
  title,
  cta,
  matches,
}: {
  eyebrow: string
  title: string
  cta: string
  matches: LandingMatch[]
}) {
  return (
    <section className="fl-matches">
      <div className="fl-matches__head">
        {eyebrow.trim() !== '' && <p className="fl-matches__eyebrow">{eyebrow}</p>}
        {title.trim() !== '' && <p className="fl-matches__title">{title}</p>}
        {cta.trim() !== '' && (
          <span className="fl-matches__cta" role="button">
            {cta}
          </span>
        )}
      </div>
      <div className="fl-matches__list">
        {matches.map((match, at) => (
          <Fragment key={match.id}>
            {/* The heading, wherever the day changes — and at the top, so the
                first run has one as well. */}
            {match.day.trim() !== '' && match.day !== matches[at - 1]?.day && (
              <p className="fl-matches__day">{match.day}</p>
            )}
            <article className="fl-match">
              <div className="fl-match__teams">
                <span className="fl-match__team">
                  <span className="fl-match__code">{match.home}</span>
                  {/* The one that was chosen, else the one the code brings,
                      else the empty box — which is what the design draws for a
                      side that is two countries at once. */}
                  <span className="fl-match__crest" aria-hidden="true">
                    {(match.homeFlag || flagFor(match.home)) && (
                      <img src={match.homeFlag || flagFor(match.home)} alt="" />
                    )}
                  </span>
                </span>
                <span className="fl-match__time">{match.time}</span>
                <span className="fl-match__team" data-away="">
                  <span className="fl-match__crest" aria-hidden="true">
                    {(match.awayFlag || flagFor(match.away)) && (
                      <img src={match.awayFlag || flagFor(match.away)} alt="" />
                    )}
                  </span>
                  <span className="fl-match__code">{match.away}</span>
                </span>
              </div>
              {match.note.trim() !== '' && <p className="fl-match__note">{match.note}</p>}
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

/**
 * A stack of cards — node 1093:55225.
 *
 * Four shapes in the design and one here: a card with a number is a statistic,
 * one with a button is the lead, one with neither is a plain card. Read off
 * what the card carries rather than declared, so a card cannot say it is one
 * kind and be written as another.
 *
 * A title's own line breaks are kept: "HDR" over "Dolby Atmos" is two things
 * the subscription gives you, not a sentence that happens to wrap.
 */
function CardStackSection({ cards }: { cards: LandingCard[] }) {
  return (
    <section className="fl-cards">
      {cards.map((card) => (
        <article className="fl-card" key={card.id} data-stat={card.stat.trim() ? '' : undefined}>
          {card.stat.trim() !== '' && <p className="fl-card__stat">{card.stat}</p>}
          {card.title.trim() !== '' && (
            <p className="fl-card__title">
              {card.title.split('\n').map((line, i) => (
                <span className="fl-card__line" key={i}>
                  {line}
                </span>
              ))}
            </p>
          )}
          {card.body.trim() !== '' && (
            <p className="fl-card__body">
              {card.body.split('\n').map((line, i) => (
                <span className="fl-card__line" key={i}>
                  {line}
                </span>
              ))}
            </p>
          )}
          {card.cta.trim() !== '' && (
            <span className="fl-card__cta" role="button">
              {card.cta}
            </span>
          )}
        </article>
      ))}
    </section>
  )
}

/**
 * Places, with tabs over them — node 1093:55226.
 *
 * The tabs choose which set of places is shown, and choosing is a thing the
 * page does rather than a thing this tool does: the first is drawn as the one
 * chosen, because a preview has to show something and the first is what the
 * design shows.
 */
function CitiesSection({
  eyebrow,
  title,
  body,
  tabs,
  tiles,
}: {
  eyebrow: string
  title: string
  body: string
  tabs: LandingTab[]
  tiles: LandingTile[]
}) {
  return (
    <section className="fl-cities">
      <div className="fl-cities__head">
        {eyebrow.trim() !== '' && <p className="fl-cities__eyebrow">{eyebrow}</p>}
        {title.trim() !== '' && <p className="fl-cities__title">{title}</p>}
        {body.trim() !== '' && <p className="fl-cities__body">{body}</p>}
      </div>
      {tabs.length > 0 && (
        <div className="fl-cities__tabs">
          {tabs.map((tab, at) => (
            <span className="fl-cities__tab" key={tab.id} data-on={at === 0 ? '' : undefined}>
              {tab.label}
            </span>
          ))}
        </div>
      )}
      <div className="fl-cities__row">
        {tiles.map((tile, at) => (
            <article className="fl-city" key={tile.id}>
              <span className="fl-city__art" aria-hidden="true">
                <img src={artAt(PLACE_ART, at)} alt="" />
              </span>
              <span className="fl-city__wash" aria-hidden="true" />
              <span className="fl-city__words">
                <p className="fl-city__name">{tile.title}</p>
                {tile.meta.trim() !== '' && <p className="fl-city__meta">{tile.meta}</p>}
              </span>
            </article>
        ))}
      </div>
    </section>
  )
}

/**
 * A team's crest, by the name the row is written with.
 *
 * Same idea as `providerArt` above it: what somebody types picks the picture,
 * so nothing has to be chosen twice. A name with no crest draws no crest
 * rather than somebody else's badge.
 */
const LIVE_TEAMS = [
  { id: 'knicks', name: 'New York Knicks', league: 'NBA' },
  { id: 'islanders', name: 'New York Islanders', league: 'NHL' },
  { id: 'devils', name: 'New Jersey Devils', league: 'NHL' },
  { id: 'rangers', name: 'New York Rangers', league: 'NHL' },
] as const

const teamCrests: Record<string, string> = {
  'New York Knicks': logoArtwork.knicks,
  'New York Rangers': logoArtwork.rangers,
  'New York Islanders': logoArtwork.islanders,
  'New Jersey Devils': logoArtwork.devils,
  'Buffalo Sabres': logoArtwork.sabres,
  'New York Yankees': logoArtwork.yankees,
  'Brooklyn Nets': logoArtwork.nets,
}

/**
 * What a postcode turns out to reach — node 1084:56752.
 *
 * The same question the out-of-area block asks and the opposite answer:
 * there, what a code cannot watch; here, the teams it can. Which is why it is
 * a component of its own rather than a setting on that one — a page that
 * welcomes you and a page that turns you away are not one page with a switch.
 */
function LiveSection({
  title,
  body,
  cta,
}: {
  title: string
  body: string
  cta: string
}) {
  return (
    <section className="fl-live">
      <div className="fl-live__card">
        <div className="fl-live__copy">
          <p className="fl-live__title">{title}</p>
          <p className="fl-live__body">{body}</p>
        </div>
        <div className="fl-live__field">
          <span className="fl-live__pin" aria-hidden="true">
            <img src={actionLocation} alt="" />
          </span>
          {/* Empty. What stood here was a label and a code nobody typed,
              and this is where somebody types their own. */}
          <span className="fl-live__entry" />
          <span className="fl-live__clear" aria-hidden="true">
            <Icon svg={iconArtwork.close} size={24} />
          </span>
        </div>
        <div className="fl-live__teams">
          {/* A row with no name yet draws nothing: the field is there to be
              typed into, and the design has no blank in the list. */}
          {LIVE_TEAMS.map((team) => (
              <div className="fl-live__team" key={team.id}>
                <span className="fl-live__crest" aria-hidden="true">
                  {teamCrests[team.name] && <img src={teamCrests[team.name]} alt="" />}
                </span>
                <span className="fl-live__name">{team.name}</span>
                {team.league.trim() !== '' && (
                  <span className="fl-live__league">{team.league}</span>
                )}
              </div>
            ))}
        </div>
        {cta.trim() !== '' && (
          <span className="fl-live__cta" role="button">
            {cta}
          </span>
        )}
      </div>
    </section>
  )
}

/**
 * A spotlight — node 1084:56109.
 *
 * One thing, sold with a picture the width of the screen and then the games
 * that make it up. The picture is the page's own hero artwork rather than a
 * second upload: a spotlight is the page saying "this, above everything else",
 * and the page already has a picture of what that is.
 */
/**
 * The games a spotlight's rail is drawn with.
 *
 * Placeholders, the way the schedule's are: the page names a rail and the
 * rail answers with its fixtures, so there is nothing here to write down and
 * these stand in for the answer.
 */
const SPOT_FIXTURES = [
  { id: 'sassuolo-torino', title: 'Sassuolo vs. Torino', meta: 'Serie A' },
  { id: 'monza-lecce', title: 'Monza vs. Lecce', meta: 'Serie A' },
  { id: 'bologna-como', title: 'Bologna vs. Como', meta: 'Serie A' },
] as const

function SpotlightSection({
  image,
  label,
  title,
  body,
}: {
  image: string
  label: string
  title: string
  body: string
}) {
  return (
    <section className="fl-spot">
      <span className="fl-spot__art" aria-hidden="true">
        <img src={image || SPOTLIGHT_ART} alt="" />
        <span className="fl-spot__wash" />
      </span>
      <div className="fl-spot__copy">
        {label.trim() !== '' && <span className="fl-spot__label">{label}</span>}
        {title.trim() !== '' && <p className="fl-spot__title">{title}</p>}
        {body.trim() !== '' && <p className="fl-spot__body">{body}</p>}
      </div>
      <div className="fl-spot__row">
        {SPOT_FIXTURES.map((game, at) => (
          <article className="fl-spot__tile" key={game.id}>
            <span className="fl-spot__shot" aria-hidden="true">
              <img src={artAt(SPOT_ART, at)} alt="" />
              <span className="fl-spot__stamp">{fixtureFor(at).stamp}</span>
            </span>
            <p className="fl-spot__name">{game.title}</p>
            <p className="fl-spot__meta">{game.meta}</p>
          </article>
        ))}
      </div>
    </section>
  )
}


/**
 * The cards a fight can be bought on.
 *
 * Its own component because the panel draws them too: the plans fold shows
 * the set as it is rather than a set of fields for it, and a second drawing
 * of a card is a second card to keep in step.
 */
export function FightPlanCards({ cards }: { cards: LandingPlanCard[] }) {
  return (
    <div className="fl-plan__cards">
      {cards.map((card) => (
        <article className="fl-plan__card" key={card.id} data-gold={card.gold || undefined}>
          <div className="fl-plan__head">
            <p className="fl-plan__name">{card.name}</p>
            <span className="fl-plan__radio" data-on={card.chosen || undefined} aria-hidden="true" />
          </div>
          {card.note.trim() !== '' && <p className="fl-plan__note">{card.note}</p>}
          {card.price.trim() !== '' && (
            <p className="fl-plan__price">
              {card.price}
              {card.priceUnit.trim() !== '' && (
                <span className="fl-plan__unit">{card.priceUnit}</span>
              )}
            </p>
          )}
          {card.notice.trim() !== '' && (
            <p className="fl-plan__notice">
              <Mark svg={actionsInfo} size={16} />
              <span>{card.notice}</span>
            </p>
          )}

          {/* A bundle prices the fights under it together, so its name and
              price stand over them with the rule the design draws. */}
          {card.offerName.trim() !== '' && (
            <div className="fl-plan__offer">
              <p className="fl-plan__offer-name">{card.offerName}</p>
              <p className="fl-plan__offer-price">
                {card.offerPrice}
                {card.offerWas.trim() !== '' && (
                  <span className="fl-plan__was">{card.offerWas}</span>
                )}
                {card.offerUnit.trim() !== '' && (
                  <span className="fl-plan__unit">{card.offerUnit}</span>
                )}
                {card.offerSave.trim() !== '' && (
                  <span className="fl-plan__save">{card.offerSave}</span>
                )}
              </p>
            </div>
          )}

          {card.fights.map((fight, at) => (
            <div className="fl-plan__fight" key={fight.id}>
              <span className="fl-plan__shot" aria-hidden="true">
                <img src={artAt(PLAN_FIGHT_ART, at)} alt="" />
              </span>
              <span className="fl-plan__fight-words">
                <p className="fl-plan__fight-name">{fight.name}</p>
                <p className="fl-plan__when">{fight.when}</p>
                {fight.price.trim() !== '' && (
                  <p className="fl-plan__fight-price">
                    {fight.price}
                    {fight.was.trim() !== '' && <span className="fl-plan__was">{fight.was}</span>}
                    {fight.unit.trim() !== '' && (
                      <span className="fl-plan__unit">{fight.unit}</span>
                    )}
                  </p>
                )}
                {fight.save.trim() !== '' && (
                  <p className="fl-plan__fight-save">
                    <span className="fl-plan__save">{fight.save}</span>
                  </p>
                )}
              </span>
            </div>
          ))}

          {card.postersLine.trim() !== '' && (
            <p className="fl-plan__posters-line">{card.postersLine}</p>
          )}
          {card.posters.length > 0 && (
            <div className="fl-plan__posters">
              {card.posters.map((poster, at) => (
                <span className="fl-plan__poster" key={poster.id}>
                  <img src={artAt(POSTER_ART, at)} alt="" />
                  <span className="fl-plan__poster-when">{poster.when}</span>
                </span>
              ))}
            </div>
          )}

          {card.perks.length > 0 && (
            <div className="fl-plan__perks">
              {card.perks.map((perk) => (
                <p className="fl-plan__perk" key={perk.id} data-info={perk.info || undefined}>
                  <Mark svg={perk.info ? actionsInfo : iconArtwork.checkmark} size={16} />
                  <span>{perk.text}</span>
                </p>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

/**
 * Buying the fight — node 1102:53279.
 *
 * The design's Variation section draws this card eight times: with no offer,
 * with a free trial, with a discount, with a month free, and the same four
 * again selling a bundle rather than a single fight. They are one card with
 * different words in it, so that is what this is — every variation is reached
 * by writing, which is what a market would be doing anyway.
 *
 * What the card draws follows from what it carries. A bundle name turns the
 * fights into a bundle's contents priced together; posters turn it into a
 * year; a struck-through price brings the saving with it. Nothing declares
 * which of the eight it is, so nothing can declare the wrong one.
 */
function FightPlanSection({
  title,
  more,
  cta,
  cards,
}: {
  title: string
  more: string
  cta: string
  cards: LandingPlanCard[]
}) {
  return (
    <section className="fl-plan">
      {title.trim() !== '' && <p className="fl-plan__title">{title}</p>}
      <FightPlanCards cards={cards} />
      {more.trim() !== '' && (
        <span className="fl-plan__more" role="button">
          {more}
          <Icon svg={iconArtwork['chevron-right']} size={16} />
        </span>
      )}
      {cta.trim() !== '' && (
        <span className="fl-plan__cta" role="button">
          {cta}
        </span>
      )}
    </section>
  )
}
