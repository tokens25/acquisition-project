import { AcquisitionCard, Feature, FeaturesList } from '../components/acquisition'
import downloadIcon from '../assets/icons/actions-download.svg?raw'
import hdrIcon from '../assets/icons/features-hdr.svg?raw'
import devicesIcon from '../assets/icons/action-device-switch.svg?raw'
import multiCamIcon from '../assets/icons/actions-multi-cam.svg?raw'
import multiviewIcon from '../assets/icons/features-multiview.svg?raw'
import type { AuthoredCard, Device } from '../rules/content'
import { deriveCard } from '../rules/derive'
import { imageCatalog, resolveLogo } from './assets'

const featureIcons = [multiviewIcon, multiCamIcon, hdrIcon, devicesIcon, downloadIcon]

export interface RuledCardProps {
  card: AuthoredCard
  locale: string
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
export function RuledCard({ card, locale, device, descriptionLines, onMore }: RuledCardProps) {
  const d = deriveCard(card, locale)

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
              price: String(card.addOn.price.amount),
              codeLabel: `${card.addOn.code} applied -${card.addOn.discountPercent}% OFF`,
            }
          : undefined
      }
      features={
        <FeaturesList device={device}>
          {card.features.map((text, i) => (
            <Feature key={`${text}-${i}`} icon={featureIcons[i % featureIcons.length]} device={device}>
              {text}
            </Feature>
          ))}
        </FeaturesList>
      }
      footerLabel={d.footerLabel}
    />
  )
}
