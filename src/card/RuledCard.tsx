import { AcquisitionCard, Feature, FeaturesList } from '../components/acquisition'
import type { AuthoredCard, Device, MarketConfig } from '../rules/content'
import { deriveCard } from '../rules/derive'
import { formatMoney } from '../rules/money'
import { findFeature } from '../rules/features'
import { iconCatalog, imageCatalog, resolveLogo } from './assets'

export interface RuledCardProps {
  /** Already resolved for the context — base plus any market/campaign patches. */
  card: AuthoredCard
  market: MarketConfig
  device: Device
  /** Shared across the set by S-2. */
  descriptionLines: 1 | 2
  onMore?: () => void
}

/**
 * Applies the card rules, then renders the design-system component.
 *
 * Nothing here is a choice — every prop below is either authored content or a
 * value `deriveCard` produced. That is what makes the invalid states
 * unreachable: a badge cannot appear without a gold stroke, and a struck price
 * cannot differ from standardPrice, because neither is passed independently.
 */
export function RuledCard({ card, market, device, descriptionLines, onMore }: RuledCardProps) {
  const d = deriveCard(card, market)

  const resolved = card.logos
    .map(resolveLogo)
    .filter((l): l is { src: string; alt: string } => l !== null)
    .slice(0, d.visibleLogoCount)

  const addOnImage = imageCatalog[card.addOn.imageId] ?? card.addOn.imageSrc

  return (
    <AcquisitionCard
      device={device}
      ultimate={card.ultimate}
      eyebrow={d.badgeText ?? undefined}
      title={d.headerText}
      description={card.description}
      descriptionLines={descriptionLines}
      onMore={onMore}
      pricing={{
        caption: d.priceCaption ?? '',
        price: d.primaryPrice,
        crossedPrice: d.struckPrice ?? undefined,
        installment: card.installment,
        extraInfo: d.explainer ?? undefined,
      }}
      ctaLabel={d.ctaLabel}
      discount={card.discount}
      discountLabel={d.savingsLabel ?? undefined}
      logos={
        resolved.length || d.overflowCount
          ? { logos: resolved, rows: d.logoRows, overflowCount: d.overflowCount }
          : undefined
      }
      addOn={
        card.addOn.enabled && addOnImage
          ? {
              type: card.addOn.type,
              imageSrc: addOnImage,
              title: card.addOn.title,
              subtitle: card.addOn.subtitle,
              planName: card.planName,
              price: formatMoney(card.addOn.price, market.locale, market.currency),
              codeLabel: `${card.addOn.code} applied -${card.addOn.discountPercent}% OFF`,
            }
          : undefined
      }
      features={
        <FeaturesList device={device}>
          {card.features.map((f, i) => {
            const def = findFeature(f.featureId)
            // Custom lines carry their own icon; catalogue lines never do.
            const icon = iconCatalog[def?.icon ?? f.iconId ?? 'check']
            return (
              <Feature key={`${f.featureId}-${i}`} icon={icon} device={device}>
                {f.label ?? def?.defaultLabel ?? ''}
              </Feature>
            )
          })}
        </FeaturesList>
      }
      footerLabel={d.footerLabel}
    />
  )
}
