import './flow.css'

import sparkle from '../../assets/flow/subscription-sparkle.gif'
import { useFlowInput } from './live'
import { cadenceSavings } from '../../rules/cadence'
import { chosenMethod, linesOf, methodsOf } from '../../rules/checkout'
import { styleOf } from '../../rules/tabs'
import {
  featuresOf,
  heroOf,
  landingText,
  linksOf,
  providersOf,
  questionsOf,
} from '../../rules/landing'
import { consentsOf } from '../../rules/consents'
import { articleShot, featureArt, imageCtaArt } from './landingArt'
import { copyOf, sectionsOf, type PageSection } from '../../rules/sections'

import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
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
import actionEdit from '../../assets/landing/action-edit.svg'
import actionLocation from '../../assets/landing/action-location.svg'
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
import teamKnicks from '../../assets/landing/teams/knicks.png'
import teamRangers from '../../assets/landing/teams/rangers.png'
import teamIslanders from '../../assets/landing/teams/islanders.png'
import teamPlaceholder from '../../assets/landing/teams/tile-placeholder.png'
import readyKnicks from '../../assets/flow/ready/knicks.png'
import readyRangers from '../../assets/flow/ready/rangers.png'
import readyIslanders from '../../assets/flow/ready/islanders.png'
import readyDevils from '../../assets/flow/ready/devils.png'
import readySabres from '../../assets/flow/ready/sabres.png'
import checkCircleFilled from '../../assets/flow/ready/check-circle-filled.svg'
import { iconArtwork, logoArtwork } from '../../card/assets'
import { Icon } from '../Icon'
import type { PlanTab } from '../../rules/content'
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
 * The hero — node 708:173738, "hero-container".
 *
 * 660 tall, and everything in it is laid from the bottom up: the copy sits on
 * the picture rather than under it, and the top bar floats over the whole thing
 * rather than taking a row of its own. The design stacks three pictures to make
 * its own; the artwork here is the one supplied, so it is one, cropped by the
 * frame the same way.
 */
export function LandingFlowScreen({ content }: { content: LandingScreen }) {
  const text = landingText(content)
  // What the Hero banner tab controls: an uploaded picture standing in for
  // the shipped one, and the eyebrow over the heading.
  const hero = heroOf(content)
  return (
    <div className="fl fl-landing">
      {/* The glow behind the picture: a 100px blur over a gradient that runs
          from nothing through gold to a trace of green. It stops 96 short of
          the bottom, so it lifts the picture without touching the page under
          it. */}
      <span className="fl-landing__glow" aria-hidden="true" />
      <div className="fl-landing__hero">
        <span className="fl-landing__art" aria-hidden="true">
          <img src={hero.image || heroArt} alt="" />
          {/* Four stops, not a fade: clear at a fifth of the way down, half
              dark at the middle, and solid by seven tenths, which is what puts
              the copy on a ground rather than on the picture. */}
          <span className="fl-landing__wash" />
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
                <p className="fl-landing__footnote">{text.footnote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="fl-landing__nav">
        <span className="fl-landing__logo">
          <img src={daznLogo} alt="" />
        </span>
        <span className="fl-landing__nav-ctas">
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
   The schedule DAZN is showing, not copy a market writes: the fixtures, their
   times and their scrub positions come from what is on air. It is drawn as the
   design draws it and there is nothing here to edit. */

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

function ScheduleSection({ heading }: { heading: string }) {
  return (
    <section className="fl-page__schedule">
      {/* The heading's own band, which fades to the page colour at both ends. */}
      <div className="fl-page__schedule-head">
        <p className="fl-page__schedule-title">{heading}</p>
      </div>
      <div className="fl-page__schedule-row">
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

const TEAMS = [
  { id: 'knicks', ground: '#1b418b', art: teamKnicks, width: 98, city: 'New York', name: 'Knicks' },
  { id: 'rangers', ground: '#e51937', art: teamRangers, width: 83, city: 'New York', name: 'Rangers' },
  { id: 'islanders', ground: '#003087', art: teamIslanders, width: 83, city: 'New York', name: 'Islanders' },
] as const

function TeamsRail({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <section className="fl-page__teams">
      <div className="fl-page__teams-head">
        <p className="fl-page__teams-eyebrow">{eyebrow}</p>
        <p className="fl-page__teams-title">{title}</p>
        <p className="fl-page__teams-body">{body}</p>
      </div>
      <div className="fl-page__teams-rail">
        {TEAMS.map((team) => (
          <div className="fl-team" key={team.id}>
            <div className="fl-team__tile" style={{ background: team.ground }}>
              <img
                className="fl-team__art"
                src={team.art}
                alt=""
                style={{ inlineSize: `${team.width}px` }}
              />
              {/* 54 of gradient at 60%, from nothing to the page colour — what
                  the name is read against. */}
              <span className="fl-team__wash" aria-hidden="true" />
              <span className="fl-team__content">
                <span className="fl-team__city">{team.city}</span>
                <span className="fl-team__name">{team.name}</span>
              </span>
            </div>
          </div>
        ))}
        {/* The tile's own template, which the design leaves standing five
            times over rather than filling in. */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="fl-team" key={`slot-${i}`}>
            <div className="fl-team__tile">
              <img className="fl-team__plate" src={teamPlaceholder} alt="" />
            </div>
            <p className="fl-team__label">Title</p>
          </div>
        ))}
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
}: {
  content: LandingScreen
  /** The plan picker, where the page puts it. */
  children?: ReactNode
}) {
  const text = landingText(content)
  return (
    <div className="fl fl-page">
      <LandingFlowScreen content={content} />
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
function PageSectionView({
  section,
  content,
  text,
  children,
}: {
  section: PageSection
  content: LandingScreen
  text: ReturnType<typeof landingText>
  children?: ReactNode
}) {
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
            {/* The field holds 209 and the button takes what is left. */}
            <span className="fl-page__zip-field">
              <span className="fl-page__zip-label">{text.zipLabel}</span>
              <span className="fl-page__zip-value">
                {text.zipValue}
                <img className="fl-page__zip-edit" src={actionEdit} alt="" />
              </span>
            </span>
            <span className="fl-page__zip-cta" role="button">
              {text.zipCta}
            </span>
          </div>
        </section>
      )

    case 'schedule':
      return <ScheduleSection heading={text.scheduleHeading} />

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
      return <TeamsRail eyebrow={text.teamsEyebrow} title={text.teamsTitle} body={text.teamsBody} />

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
              <span className="fl-area__entry">
                <span className="fl-area__label">{text.areaFieldLabel}</span>
                <span className="fl-area__value">{text.areaFieldValue}</span>
              </span>
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

    case 'faq':
      return <FaqSection content={content} title={text.faqTitle} />
  }
}
