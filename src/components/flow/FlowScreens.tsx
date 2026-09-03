import './flow.css'

import sparkle from '../../assets/flow/subscription-sparkle.gif'
import { useFlowInput } from './live'
import { cadenceSavings } from '../../rules/cadence'
import { chosenMethod, linesOf, methodsOf } from '../../rules/checkout'
import { styleOf } from '../../rules/tabs'
import { landingText, providersOf, questionsOf } from '../../rules/landing'
import { consentsOf } from '../../rules/consents'

import { Fragment } from 'react'
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
import providerAltice from '../../assets/landing/provider-altice.png'
import providerAstound from '../../assets/landing/provider-astound.png'
import providerBreezeline from '../../assets/landing/provider-breezeline.png'
import providerDirectv from '../../assets/landing/provider-directv.png'
import providerFios from '../../assets/landing/provider-fios.png'
import providerFubo from '../../assets/landing/provider-fubo.png'
import providerOptimum from '../../assets/landing/provider-optimum.png'
import providerOptimumTv from '../../assets/landing/provider-optimum-tv.png'
import providerSpectrum from '../../assets/landing/provider-spectrum.svg'
import providerXfinity from '../../assets/landing/provider-xfinity.png'
import heroArt from '../../assets/landing/hero.jpg'
import daznLogo from '../../assets/landing/logo-dazn.svg'
import actionEdit from '../../assets/landing/action-edit.svg'
import schedP0 from '../../assets/landing/schedule/p0.png'
import schedP1 from '../../assets/landing/schedule/p1.png'
import schedP2 from '../../assets/landing/schedule/p2.png'
import schedP3 from '../../assets/landing/schedule/p3.png'
import schedP4 from '../../assets/landing/schedule/p4.png'
import schedP5 from '../../assets/landing/schedule/p5.png'
import schedP6 from '../../assets/landing/schedule/p6.png'
import icPlay from '../../assets/landing/schedule/ic-play.svg'
import icReminder from '../../assets/landing/schedule/ic-reminder.svg'
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
function FlowHeader({ title }: { title: string }) {
  return (
    <header className="fl__header">
      <span className="fl__back">
        <Icon svg={iconArtwork['chevron-left']} size={16} />
      </span>
      <h2 className="fl__title">{title}</h2>
      <Mark svg={daznRubik} size={28} className="fl__brand" />
    </header>
  )
}

function Screen({
  title,
  flush,
  children,
}: {
  title: string
  /**
   * Drops the body's side padding, for a screen whose content runs to the
   * edge. Subscription's card row does: the design lets the next card be cut
   * by the screen rather than by a margin, which is what says there is one.
   */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <div className="fl">
      <FlowHeader title={title} />
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
  return (
    <div className="fl fl-landing">
      {/* The glow behind the picture: a 100px blur over a gradient that runs
          from nothing through gold to a trace of green. It stops 96 short of
          the bottom, so it lifts the picture without touching the page under
          it. */}
      <span className="fl-landing__glow" aria-hidden="true" />
      <div className="fl-landing__hero">
        <span className="fl-landing__art" aria-hidden="true">
          <img src={heroArt} alt="" />
          {/* Four stops, not a fade: clear at a fifth of the way down, half
              dark at the middle, and solid by seven tenths, which is what puts
              the copy on a ground rather than on the picture. */}
          <span className="fl-landing__wash" />
        </span>

        <div className="fl-landing__slot">
          <div className="fl-landing__content">
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
                  <button type="button" className="fl-landing__button">
                    {text.cta}
                  </button>
                  <button
                    type="button"
                    className="fl-landing__button"
                    data-appearance="soft"
                  >
                    {text.altCta}
                  </button>
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
          <span className="fl-landing__nav-cta" data-appearance="neutral">
            {text.navSignUp}
          </span>
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

export function ReadyFlowScreen({ content }: { content: ReadyScreen }) {
  const middle = Math.floor(content.logos.length / 2)
  return (
    <Screen title={content.navTitle}>
      <div className="fl-ready">
        <div className="fl-ready__content">
          <div className="fl-ready__logos">
            {content.logos.map((id, i) => (
              <span className="fl-ready__logo" key={id} data-lead={i === middle ? '' : undefined}>
                <img src={logoArtwork[id]} alt="" />
              </span>
            ))}
          </div>
          <h3 className="fl-ready__title">{content.title}</h3>
          <p className="fl-ready__body">{content.body}</p>
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

/* ── The landing page below the hero ─────────────────────────
   Figma: 🚀 Acquisition for ai → "MSG+ - Landing page - Mobile", node
   708:173735 — 375 wide and 7412 tall. The hero above is the whole of what
   a tile and the walkthrough show; this is the rest of the page, which the
   edit view scrolls. */

const providerArt: Record<string, string> = {
  Spectrum: providerSpectrum,
  DIRECTV: providerDirectv,
  fios: providerFios,
  'optimum.': providerOptimum,
  'optimum.tv': providerOptimumTv,
  fubo: providerFubo,
  xfinity: providerXfinity,
  altice: providerAltice,
  Astound: providerAstound,
  breezeline: providerBreezeline,
}

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

      {/* node 708:173789. Its own spacing rather than the page's: 42 above,
          24 below, and 22 between the heading and the row. */}
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
          <button type="button" className="fl-page__zip-cta">
            {text.zipCta}
          </button>
        </div>
      </section>

      <ScheduleSection heading={text.scheduleHeading} />

      {children && <section className="fl-page__plans">{children}</section>}

      <section className="fl-page__teams">
        <p className="fl-page__eyebrow">{text.teamsEyebrow}</p>
        <h2 className="fl-page__title">{text.teamsTitle}</h2>
        <p className="fl-page__body">{text.teamsBody}</p>
        <p className="fl-page__note">{text.teamsNote}</p>
        <Cta>{text.teamsCta}</Cta>
      </section>

      <section className="fl-page__multiview">
        <p className="fl-page__eyebrow">
          {text.multiviewEyebrow}
          {text.multiviewBadge && (
            <span className="fl-page__badge">{text.multiviewBadge}</span>
          )}
        </p>
        <h2 className="fl-page__title">{text.multiviewTitle}</h2>
        <p className="fl-page__body">{text.multiviewBody}</p>
        <Cta>{text.multiviewCta}</Cta>
      </section>

      <section className="fl-page__providers">
        <h2 className="fl-page__title" data-centre="">
          {text.providersTitle}
        </h2>
        <p className="fl-page__body" data-centre="">
          {text.providersBody}{' '}
          {text.providersHighlight && (
            <span className="fl-page__gold">{text.providersHighlight}</span>
          )}
        </p>
        <div className="fl-page__provider-grid">
          {providersOf(content).map((provider) => (
            <span className="fl-page__provider" key={provider.id}>
              {providerArt[provider.name] ? (
                <img src={providerArt[provider.name]} alt={provider.name} />
              ) : (
                provider.name
              )}
            </span>
          ))}
        </div>
        <p className="fl-page__note" data-centre="">
          {text.providersNote}
        </p>
        <Cta appearance="outline">{text.providersCta}</Cta>
      </section>

      <section className="fl-page__devices">
        <h2 className="fl-page__title">
          {text.devicesTitle}
          {text.devicesTitleTwo && (
            <>
              <br />
              {text.devicesTitleTwo}
            </>
          )}
        </h2>
        <p className="fl-page__body">{text.devicesBody}</p>
        <p className="fl-page__note">{text.devicesNote}</p>
      </section>

      <section className="fl-page__free">
        <h2 className="fl-page__title" data-centre="">
          {text.freeTitle}
        </h2>
        <p className="fl-page__body" data-centre="">
          {text.freeBody}
        </p>
        <Cta>{text.freeCta}</Cta>
      </section>

      <section className="fl-page__faq">
        <h2 className="fl-page__title">{text.faqTitle}</h2>
        <ul className="fl-page__questions">
          {questionsOf(content).map((one) => (
            <li className="fl-page__question" key={one.id}>
              {one.question}
              <Icon svg={iconArtwork['chevron-right']} size={24} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
