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
  descriptionLines: 1 | 2
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
}

/**
 * Applies the rules, then renders the design-system component.
 *
 * Nothing here is a choice: every prop is authored content or a value
 * `deriveCard` produced. A missing catalogue reference renders a placeholder
 * so the layout matches what will land — and blocks publish elsewhere.
 */
/** The icon a feature row draws, under the set's house style. */
function featureIcon(mode: CardSet['featureIcons'], iconId: string): string | undefined {
  if (mode === 'hidden') return undefined
  // The plain DS checkmark, not the circled one — this mode is a tick per
  // line, not a badge per line.
  if (mode === 'check') return iconArtwork.checkmark
  return iconArtwork[iconId] ?? iconArtwork.check
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
}: RuledCardProps) {
  const d = deriveCard(set, tier, offer, market, context)

  const logos = d.logos.map((l) => ({
    src: logoArtwork[l.id] ?? '',
    alt: l.altText,
    missing: l.state === 'missing' || !logoArtwork[l.id],
  }))

  // Title, description and CTA are the card's own; the competitions are the
  // full list rather than the ten the tile fits, which is what the dialog is for.
  const openDetails = onOpenDetails && !detailsBlocked
    ? () =>
        onOpenDetails({
          title: d.headerText,
          description: tier.description,
          ctaLabel: d.ctaLabel,
          ultimate: tier.ultimate,
          competitions: d.allLogos.map((l) => ({
            id: l.id,
            name: l.name,
            blurb: l.blurb,
            src: logoArtwork[l.id] ?? '',
            alt: l.altText,
          })),
          features: d.features.map((f) => ({
            id: f.id,
            icon: featureIcon(set.featureIcons, f.iconId),
            text: f.text,
          })),
        })
    : undefined

  return (
    <AcquisitionCard
      device={device}
      ultimate={tier.ultimate}
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
      }}
      ctaLabel={d.ctaLabel}
      discount={offer.discount}
      discountLabel={d.savingsLabel ?? undefined}
      logos={
        logos.length || d.overflowCount
          ? { logos, rows: d.logoRows, overflowCount: d.overflowCount }
          : undefined
      }
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
        <FeaturesList device={device}>
          {d.features.map((f) => (
            <Feature key={f.id} icon={featureIcon(set.featureIcons, f.iconId)} device={device}>
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
