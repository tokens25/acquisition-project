import { AcquisitionCard, Feature, FeaturesList } from '../components/acquisition'
import type { PlanDetailsProps } from '../components/acquisition'
import type { CadenceOffer, CardSet, Context, Device, MarketConfig, Tier } from '../rules/content'
import { deriveCard } from '../rules/derive'
import { iconArtwork, imageArtwork, logoArtwork } from './assets'

export interface RuledCardProps {
  set: CardSet
  /** Already resolved for the context — base plus any market patches. */
  tier: Tier
  /** The offer that prices this tier at the selected cadence. */
  offer: CadenceOffer
  market: MarketConfig
  context: Context
  device: Device
  /** Shared across the set by S-2. */
  descriptionLines: 0 | 1 | 2
  /**
   * Asks for the "All features & content" dialog, handing over everything it
   * shows. Built here because this is where the card is derived — a dialog that
   * re-derived would be a second chance to disagree with the tile.
   */
  onOpenDetails?: (details: Omit<PlanDetailsProps, 'onClose'>) => void
  /**
   * The dialog opens over this card, so it can only open while the whole card
   * is on screen. Separate from having no handler at all, which means the card
   * is a picture and should not offer the control in the first place.
   */
  detailsBlocked?: boolean
  /** Set by the row, not the card: does any card beside this one save money? */
  reserveDiscount?: boolean
  /** And does any of them explain its price? */
  reserveExtraInfo?: boolean
  /** A card beside this one says "Starts at", so this one keeps its line. */
  reserveCaption?: boolean
  /** The longest benefit list in the row; shorter lists keep the room. */
  reserveFeatures?: number

  selected?: boolean
  onSelect?: () => void
}

/**
 * Applies the rules, then renders the design-system component.
 *
 * Nothing here is a choice: every prop is authored content or a value
 * `deriveCard` produced. A missing catalogue reference renders a placeholder
 * so the layout matches what will land — and blocks publish elsewhere.
 */
/** The icon a feature row draws, under the set's house style. */
function featureIcon(
  mode: CardSet['featureIcons'],
  feature: { iconId: string; icon: string | null },
): string | undefined {
  if (mode === 'hidden') return undefined
  // The plain DS checkmark, not the circled one — this mode is a tick per
  // line, not a badge per line. A tick per line is the house style asserting
  // itself over every glyph, uploaded ones included.
  if (mode === 'check') return iconArtwork.checkmark
  return feature.icon ?? iconArtwork[feature.iconId] ?? iconArtwork.check
}

export function RuledCard({

  set,
  tier,
  offer,
  market,
  context,
  device,
  descriptionLines,
  onOpenDetails,
  detailsBlocked = false,
  reserveDiscount = false,
  reserveExtraInfo = false,
  reserveCaption = false,
  reserveFeatures,
  selected,
  onSelect,
}: RuledCardProps) {
  const d = deriveCard(set, tier, offer, market, context)

  // An uploaded badge wins over the shipped one, and counts as artwork: a
  // competition the catalogue has no bytes for is no longer missing once
  // somebody has supplied them.
  const badge = (l: { id: string; image: string | null }) => l.image || logoArtwork[l.id] || ''
  const logos = d.logos.map((l) => ({
    src: badge(l),
    alt: l.altText,
    missing: l.state === 'missing' || !badge(l),
  }))

  // Title, description and CTA are the card's own; the competitions are the
  // full list rather than the ten the tile fits, which is what the dialog is for.
  const openDetails = onOpenDetails && !detailsBlocked
    ? () =>
        onOpenDetails({
          title: d.headerText,
          description: tier.description,
          ctaLabel: d.ctaLabel,
          highlighted: tier.highlighted,
          competitions: d.allLogos.map((l) => ({
            id: l.id,
            name: l.name,
            blurb: l.blurb,
            src: badge(l),
            alt: l.altText,
          })),
          features: d.allFeatures.map((f) => ({
            id: f.id,
            icon: featureIcon(set.featureIcons, f),
            text: f.text,
          })),
        })
    : undefined

  return (
    <AcquisitionCard
      device={device}
      tierId={tier.id}
      highlighted={tier.highlighted}
      eyebrow={d.badgeText ?? undefined}
      title={d.headerText}
      description={tier.description}
      descriptionLines={descriptionLines}
      onMore={openDetails}
      pricing={{
        caption: d.priceCaption ?? '',
        price: d.primaryPrice,
        crossedPrice: d.struckPrice ?? undefined,
        installment: d.priceUnit,
        extraInfo: d.explainer ?? undefined,
        reserveExtraInfo,
        reserveCaption,
      }}
      ctaLabel={d.ctaLabel}
      discount={offer.discount}
      discountLabel={d.savingsLabel ?? undefined}
      reserveDiscount={reserveDiscount}
      selected={selected}
      onSelect={onSelect}
      logos={
        logos.length || d.overflowCount
          ? { logos, rows: d.logoRows, overflowCount: d.overflowCount }
          : undefined
      }
      // Add-ons are bought after the plan, from My Account or an upsell, not
      // from this picker — so the card does not advertise them. The data
      // stays on the offer for the screens that do.
      facts={undefined}
      addOn={
        d.addOn
          ? {
              type: d.addOn.variant,
              imageSrc: imageArtwork[d.addOn.imageId] ?? '',
              title: d.addOn.title,
              subtitle: d.addOn.subtitle,
              planName: tier.planName,
              price: d.addOn.price ?? undefined,
              codeLabel: d.addOn.codeLabel ?? undefined,
            }
          : undefined
      }
      features={
        <FeaturesList device={device} reserveRows={reserveFeatures}>
          {d.features.map((f) => (
            <Feature
              key={f.id}
              icon={featureIcon(set.featureIcons, f)}
              onInfo={openDetails}
              device={device}
            >
              {f.text}
            </Feature>
          ))}
        </FeaturesList>
      }
      footerLabel={d.footerLabel}
      onFooterClick={openDetails}
      footerDisabled={detailsBlocked}
    />
  )
}
