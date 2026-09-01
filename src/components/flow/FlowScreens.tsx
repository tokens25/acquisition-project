import './flow.css'

import type { ReactNode } from 'react'
import actionsInfo from '../../assets/flow/actions-info.svg?raw'
import badgeCheck from '../../assets/flow/badge-check.svg?raw'
import cadenceRadioOff from '../../assets/flow/cadence-radio-off.svg?raw'
import cadenceRadioOn from '../../assets/flow/cadence-radio-on.svg?raw'
import icInfoFill from '../../assets/flow/ic-info-fill.svg?raw'
import daznRubik from '../../assets/flow/logo-dazn-rubik.svg?raw'
import daznVector from '../../assets/flow/logo-dazn-vector.svg?raw'
import landingHero from '../../assets/flow/landing-hero.png'
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
import { iconArtwork, logoArtwork } from '../../card/assets'
import { Icon } from '../Icon'
import type {
  AccountScreen,
  LandingScreen,
  AuthScreen,
  CadenceScreen,
  CheckoutScreen,
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

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fl">
      <FlowHeader title={title} />
      <div className="fl__body">{children}</div>
    </div>
  )
}

/** Form/TextField at rest. Empty puts the label where the value would sit. */
function Field({
  label,
  value,
  leading,
  trailing,
}: {
  label: string
  value?: string
  leading?: string
  trailing?: string
}) {
  const body = (
    <span className="fl__field-body">
      <span className="fl__field-label">{label}</span>
      {value ? <span className="fl__field-value">{value}</span> : null}
    </span>
  )
  return (
    <div className="fl__field" data-empty={value ? undefined : ''}>
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
export function LandingFlowScreen({ content }: { content: LandingScreen }) {
  return (
    <div className="fl fl-landing">
      <img className="fl-landing__hero" src={landingHero} alt="" />
      <span className="fl-landing__wash" aria-hidden="true" />
      <header className="fl-landing__nav">
        <Mark svg={daznVector} size={32} />
        <span className="fl-landing__nav-ctas">
          <span className="fl-landing__nav-cta">{content.navExplore}</span>
          <span className="fl-landing__nav-cta" data-appearance="secondary">
            {content.navSignUp}
          </span>
        </span>
      </header>
      <div className="fl-landing__block">
        <div className="fl-landing__copy">
          <h3 className="fl-landing__title">{content.title}</h3>
          <p className="fl-landing__body">{content.body}</p>
        </div>
        <div className="fl-landing__ctas">
          <Cta appearance="subscribe">{content.cta}</Cta>
          <Cta>{content.altCta}</Cta>
        </div>
      </div>
    </div>
  )
}

/* ── Cadence ───────────────────────────────────────────────── */

export function CadenceFlowScreen({ content }: { content: CadenceScreen }) {
  return (
    <Screen title={content.navTitle}>
      <div className="fl-cadence">
        <div className="fl-cadence__options">
          {content.options.map((option) => {
            const on = option.id === content.selected
            return (
              <div className="fl-cadence__option" key={option.id} data-on={on || undefined}>
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
            <div className="fl-account__consent">
              <p className="fl-account__consent-body">{content.consentBody}</p>
              <span className="fl-account__switch">
                <span className="fl-account__knob" />
              </span>
            </div>
            <p className="fl-account__note">{content.consentNote}</p>
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
  return (
    <Screen title={content.navTitle}>
      <div className="fl-checkout">
        <p className="fl-checkout__note">{content.note}</p>

        <div className="fl-checkout__summary">
          <div className="fl-checkout__summary-head">
            <p className="fl-checkout__summary-title">{content.summaryTitle}</p>
            <span className="fl-checkout__change">{content.changeCta}</span>
          </div>
          {content.lines.map((line) => (
            <div
              className="fl-checkout__line"
              key={line.label}
              data-schedule={line.schedule ? '' : undefined}
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
          <div className="fl-checkout__method">
            <p className="fl-checkout__method-name">
              <Mark svg={radioSelected} size={24} />
              {content.cardsLabel}
            </p>
            <span className="fl-checkout__marks">
              <img src={payVisa} alt="" />
              <img src={payMastercard} alt="" />
              <span className="fl-checkout__overflow">{content.cardsOverflow}</span>
            </span>
          </div>

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

          <div className="fl-checkout__method" data-tall="">
            <p className="fl-checkout__method-name">
              <Mark svg={radioIdle} size={24} />
              {content.googlePayLabel}
            </p>
            <span className="fl-checkout__marks">
              <img src={payGpayMark} alt="" />
              <img src={payGpayType} alt="" />
            </span>
          </div>
          <div className="fl-checkout__spacer" />
          <div className="fl-checkout__method">
            <p className="fl-checkout__method-name">
              <Mark svg={radioIdle} size={24} />
              {content.paypalLabel}
            </p>
            <span className="fl-checkout__marks">
              <img src={payPaypal} alt="" />
            </span>
          </div>
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
